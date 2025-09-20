import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { Response } from 'express';
import type { IUser } from '../models/User.js';
import type { IVendor } from '../models/Vendor.js';

interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  organizationId?: string;
  userType: 'user' | 'vendor';
}

export const generateAccessToken = (entity: IUser | IVendor, userType: 'user' | 'vendor' = 'user'): string => {
  const payload: JWTPayload = {
    userId: entity._id.toString(),
    email: entity.email,
    userType,
  };

  if (userType === 'user') {
    const user = entity as IUser;
    payload.role = user.role;
    payload.organizationId = user.organization.toString();
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.sign(payload, secret, {
    expiresIn,
    issuer: 'procurement-platform',
    audience: 'procurement-platform-users',
  } as SignOptions);
};

export const generateRefreshToken = (entity: IUser | IVendor, userType: 'user' | 'vendor' = 'user'): string => {
  const payload = {
    userId: entity._id.toString(),
    email: entity.email,
    userType,
  };

  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.sign(payload, refreshSecret, {
    expiresIn,
    issuer: 'procurement-platform',
    audience: 'procurement-platform-users',
  } as SignOptions);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'procurement-platform',
      audience: 'procurement-platform-users',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): { userId: string; email: string; userType: 'user' | 'vendor' } => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
      issuer: 'procurement-platform',
      audience: 'procurement-platform-users',
    }) as { userId: string; email: string; userType: 'user' | 'vendor' };
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  // Set access token cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Set refresh token cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

export const getTokenFromRequest = (req: any): string | null => {
  // First try to get token from Authorization header
  const headerToken = extractTokenFromHeader(req.headers.authorization);
  if (headerToken) {
    return headerToken;
  }

  // Then try to get token from cookies
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }

  return null;
};