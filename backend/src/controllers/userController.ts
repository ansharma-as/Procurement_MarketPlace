import type { Request, Response } from 'express';
import { User, Organization } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Get all users (admin only)
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    role,
    company,
    isActive,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  // Build filter
  const filter: any = {};

  if (role) filter.role = role;
  if (company) filter.organization = company;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  // Search functionality
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Sort options
  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  // Execute query
  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('organization', 'name industry')
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        current: pageNum,
        total: totalPages,
        count: users.length,
        totalCount: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    },
  });
});

// Get single user
export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .populate('organization', 'name industry address')
    .select('-password -emailVerificationToken -passwordResetToken');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

// Update user (admin only)
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, isActive, department, manager } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Validate manager if provided
  if (manager) {
    const managerUser = await User.findById(manager);
    if (!managerUser) {
      return res.status(400).json({
        success: false,
        message: 'Manager not found',
      });
    }
    // Ensure manager is from the same organization
    if (managerUser.organization.toString() !== user.organization.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Manager must be from the same organization',
      });
    }
    // Ensure manager has appropriate role
    if (!['admin', 'manager'].includes(managerUser.role)) {
      return res.status(400).json({
        success: false,
        message: 'Manager must have admin or manager role',
      });
    }
  }

  // Update allowed fields
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (department !== undefined) user.department = department;
  if (manager !== undefined) user.manager = manager;

  await user.save();

  // Remove sensitive data
  const updatedUser = await User.findById(id)
    .populate('organization', 'name industry')
    .populate('manager', 'firstName lastName email role')
    .select('-password -emailVerificationToken -passwordResetToken');

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: {
      user: updatedUser,
    },
  });
});

// Deactivate user
export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
  });
});

// Get users by organization
export const getUsersByOrganization = asyncHandler(async (req: Request, res: Response) => {
  const { organizationId } = req.params;

  // Check if user has access to this organization's users
  if (req.user!.role !== 'admin' && req.user!.organizationId !== organizationId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  const users = await User.find({ organization: organizationId, isActive: true })
    .select('-password -emailVerificationToken -passwordResetToken')
    .sort({ firstName: 1, lastName: 1 });

  res.status(200).json({
    success: true,
    data: {
      users,
    },
  });
});