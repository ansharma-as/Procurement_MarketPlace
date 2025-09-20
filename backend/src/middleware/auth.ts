import type { Request, Response, NextFunction } from 'express';
import { User, Vendor, Organization } from '../models/index.js';
import { verifyAccessToken, getTokenFromRequest } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role?: string;
        organizationId?: string;
        userType: 'user' | 'vendor';
        userData?: any;
      };
    }
  }
}

export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    let entity;
    let entityData;

    if (decoded.userType === 'vendor') {
      // Authenticate vendor
      entity = await Vendor.findById(decoded.userId).select('-password');
      if (!entity || !entity.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token - vendor not found or inactive',
        });
      }
      entityData = entity;
    } else {
      // Authenticate user
      entity = await User.findById(decoded.userId)
        .populate('organization', 'name isActive isVerified')
        .select('-password');

      if (!entity || !entity.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token - user not found or inactive',
        });
      }

      // Check if user's organization is active
      if (!entity.organization || !(entity.organization as any).isActive) {
        return res.status(403).json({
          success: false,
          message: 'Organization account is inactive',
        });
      }
      entityData = entity;
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      ...(decoded.role && { role: decoded.role }),
      ...(decoded.organizationId && { organizationId: decoded.organizationId }),
      userType: decoded.userType,
      userData: entityData,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
});

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Handle vendor authorization
    if (req.user.userType === 'vendor') {
      if (!roles.includes('vendor')) {
        return res.status(403).json({
          success: false,
          message: 'Vendors not authorized for this action',
        });
      }
    } else {
      // Handle user authorization by role
      if (!req.user.role || !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }
    }

    next();
  };
};

export const requireVerifiedCompany = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const company = req.user.userData?.company;
  if (!company || !company.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Company verification required',
    });
  }

  next();
};

export const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!req.user.userData?.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
    });
  }

  next();
};

export const checkResourceOwnership = (resourceField: string = 'company') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admin can access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // For other roles, check if the resource belongs to their company
    const resourceCompanyId = req.body[resourceField] || req.params[resourceField] || req.query[resourceField];

    if (resourceCompanyId && resourceCompanyId !== req.user.organizationId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - resource belongs to another organization',
      });
    }

    next();
  };
};

export const optionalAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(); // Continue without authentication
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId)
      .populate('organization', 'name isActive isVerified')
      .select('-password');

    if (user && user.isActive && (user.organization as any)?.isActive) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        ...(decoded.role && { role: decoded.role }),
        ...(decoded.organizationId && { organizationId: decoded.organizationId }),
        userType: 'user',
        userData: user,
      };
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
  }

  next();
});