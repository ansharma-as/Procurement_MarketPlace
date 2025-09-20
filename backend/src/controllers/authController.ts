import type { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, Organization, Vendor } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateAccessToken, generateRefreshToken, setAuthCookies, clearAuthCookies, verifyRefreshToken } from '../utils/jwt.js';


// Create organization with admin user
export const createOrganization = asyncHandler(async (req: Request, res: Response) => {
  const { organization: orgData, admin: adminData } = req.body;

  // Check if admin email already exists
  const existingUser = await User.findOne({ email: adminData.email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Check if organization name already exists
  const existingOrg = await Organization.findOne({ name: orgData.name });
  if (existingOrg) {
    return res.status(400).json({
      success: false,
      message: 'Organization with this name already exists',
    });
  }

  try {
    // Step 1: Create organization with a temporary admin ID
    const tempAdminId = new mongoose.Types.ObjectId();
    const organization = await Organization.create({
      ...orgData,
      adminId: tempAdminId,
    });

    // Step 2: Create admin user with organization reference
    const adminUser = await User.create({
      ...adminData,
      role: 'admin',
      organization: organization._id,
      emailVerificationToken: crypto.randomBytes(32).toString('hex'),
    });

    // Step 3: Update organization with real admin ID
    organization.adminId = adminUser._id;
    await organization.save();

    // Remove password from response
    const userObj = adminUser.toObject();
    const { password: _, ...userResponse } = userObj;

    res.status(201).json({
      success: true,
      message: 'Organization and admin user created successfully. Please verify your email.',
      data: {
        organization,
        user: userResponse,
      },
    });
  } catch (error) {
    // If there's an error, we need to clean up any created documents
    // This is a best-effort cleanup since we don't have transactions
    try {
      await Organization.deleteOne({ name: orgData.name });
      await User.deleteOne({ email: adminData.email });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw error;
  }
});

// Register vendor
export const registerVendor = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone, specialization, location, portfolio, description, certifications } = req.body;

  // Check if vendor email already exists
  const existingVendor = await Vendor.findOne({ email });
  if (existingVendor) {
    return res.status(400).json({
      success: false,
      message: 'Vendor with this email already exists',
    });
  }

  // Create vendor
  const vendor = await Vendor.create({
    email,
    password,
    firstName,
    lastName,
    phone,
    specialization,
    location,
    portfolio,
    description,
    certifications,
    emailVerificationToken: crypto.randomBytes(32).toString('hex'),
  });

  // Remove password from response
  const vendorObj = vendor.toObject();
  const { password: _, ...vendorResponse } = vendorObj;

  res.status(201).json({
    success: true,
    message: 'Vendor registered successfully. Please verify your email.',
    data: {
      vendor: vendorResponse,
    },
  });
});

// Register new user within organization (managers/users)
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role, organization, manager, phone, department, permissions } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists',
    });
  }

  // Verify organization exists and is active
  const orgDoc = await Organization.findById(organization);
  if (!orgDoc || !orgDoc.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or inactive organization',
    });
  }

  // If role is manager or user, verify manager exists and belongs to same organization
  if ((role === 'manager' || role === 'user') && manager) {
    const managerDoc = await User.findOne({
      _id: manager,
      organization,
      role: { $in: ['admin', 'manager'] },
      isActive: true,
    });

    if (!managerDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manager or manager does not belong to the organization',
      });
    }
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role,
    organization,
    manager,
    phone,
    department,
    permissions,
    emailVerificationToken: crypto.randomBytes(32).toString('hex'),
  });

  // Remove password from response
  const userObj = user.toObject();
  const { password: _, ...userResponse } = userObj;

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your email.',
    data: {
      user: userResponse,
    },
  });
});

// Login user or vendor
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, userType } = req.body;

  console.log("reaching hereeee....")
  console.log({
    "email": email,
    "logging userType": userType}
  );

  console.log("usertype " , userType);

  try {
    console.log("strting")
    let authenticatedEntity;
    let entityType: 'user' | 'vendor';

    if (userType === 'vendor') {
      // Try to authenticate as vendor
      console.log("finding vendor")
      authenticatedEntity = await (Vendor as any).findByCredentials(email, password);
      console.log("vendor found")
      entityType = 'vendor';
    } else {
      // Try to authenticate as user
      console.log("finding user")
      authenticatedEntity = await (User as any).findByCredentials(email, password);
      // Populate organization information
      await authenticatedEntity.populate('organization', 'name industry isActive isVerified');
      entityType = 'user';
    }

    // Generate tokens
    const accessToken = generateAccessToken(authenticatedEntity, entityType);
    const refreshToken = generateRefreshToken(authenticatedEntity, entityType);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Update last login
    authenticatedEntity.lastLogin = new Date();
    await authenticatedEntity.save();

    // Remove sensitive data from response
    const entityResponse = authenticatedEntity.toObject();
    delete entityResponse.password;
    delete entityResponse.emailVerificationToken;
    delete entityResponse.passwordResetToken;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        [entityType]: entityResponse,
        userType: entityType,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

// Refresh access token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: clientRefreshToken } = req.body;
  const cookieRefreshToken = req.cookies?.refreshToken;

  const refreshTokenToUse = clientRefreshToken || cookieRefreshToken;

  if (!refreshTokenToUse) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required',
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshTokenToUse);
    let entity;
    let entityType = decoded.userType;

    if (entityType === 'vendor') {
      // Find vendor
      entity = await Vendor.findById(decoded.userId).select('-password');
      if (!entity || !entity.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token - vendor not found or inactive',
        });
      }
    } else {
      // Find user
      entity = await User.findById(decoded.userId)
        .populate('organization', 'name industry isActive isVerified')
        .select('-password');
      if (!entity || !entity.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token - user not found or inactive',
        });
      }
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(entity, entityType);
    const newRefreshToken = generateRefreshToken(entity, entityType);

    // Set new cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
});

// Logout user
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Clear auth cookies
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const { userType } = req.user!;
  let entity;
  let entityKey;

  if (userType === 'vendor') {
    entity = await Vendor.findById(req.user!.userId)
      .select('-password -emailVerificationToken -passwordResetToken');
    entityKey = 'vendor';
  } else {
    entity = await User.findById(req.user!.userId)
      .populate('organization', 'name industry isActive isVerified')
      .select('-password -emailVerificationToken -passwordResetToken');
    entityKey = 'user';
  }

  if (!entity) {
    return res.status(404).json({
      success: false,
      message: `${userType} not found`,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      [entityKey]: entity,
      userType,
    },
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, phone, department, avatar } = req.body;

  const user = await User.findById(req.user!.userId).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Update allowed fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  if (department !== undefined) user.department = department;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user,
    },
  });
});

// Change password
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user!.userId).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

// Forgot password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email, isActive: true });

  if (!user) {
    // Don't reveal whether email exists or not
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await user.save();

  // TODO: Send email with reset token
  // For now, just return the token in development
  if (process.env.NODE_ENV === 'development') {
    return res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      data: {
        resetToken, // Only in development
      },
    });
  }

  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
});

// Reset password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  // Hash the token to compare with stored hashed token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
    isActive: true,
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token',
    });
  }

  // Update password and clear reset token
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});

// Verify email
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token,
    isActive: true,
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification token',
    });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
  });
});

// Resend email verification
export const resendEmailVerification = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email is already verified',
    });
  }

  // Generate new verification token
  user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  await user.save();

  // TODO: Send verification email

  res.status(200).json({
    success: true,
    message: 'Verification email sent',
  });
});