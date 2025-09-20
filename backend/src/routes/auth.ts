import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendEmailVerification,
  createOrganization,
  registerVendor,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../utils/validation.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  createOrganizationSchema,
  createVendorSchema,
} from '../utils/validation.js';

const router = Router();

// Public routes
router.post('/organization/register', validate(createOrganizationSchema), createOrganization);
router.post('/vendor/register', validate(createVendorSchema), registerVendor);
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.use(authenticate); // All routes below this middleware require authentication

router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', validate(changePasswordSchema), changePassword);
router.post('/resend-verification', resendEmailVerification);

export default router;