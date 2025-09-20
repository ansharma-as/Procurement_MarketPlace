import { Router } from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deactivateUser,
  getUsersByOrganization,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('admin'), getUsers);
router.put('/:id', authorize('admin'), updateUser);
router.post('/:id/deactivate', authorize('admin'), deactivateUser);

// Routes accessible by users with appropriate permissions
router.get('/:id', getUser);
router.get('/organization/:organizationId', getUsersByOrganization);

export default router;