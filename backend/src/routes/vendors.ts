import { Router } from 'express';
import {
  getVendors,
  getVendor,
  updateVendor,
  getVendorDashboard,
  getVendorProposals,
} from '../controllers/vendorController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate, validateParams, validateQuery } from '../utils/validation.js';
import {
  updateVendorSchema,
  mongoIdParamSchema,
  paginationSchema,
} from '../utils/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all vendors (for organization users)
router.get('/', validateQuery(paginationSchema), getVendors);

// Get vendor dashboard (vendors only)
router.get('/dashboard', authorize('vendor'), getVendorDashboard);

// Get vendor's proposals (vendors only)
router.get('/proposals',
  authorize('vendor'),
  validateQuery(paginationSchema),
  getVendorProposals
);

// Get single vendor
router.get('/:id', validateParams(mongoIdParamSchema), getVendor);

// Update vendor profile (vendors only, own profile)
router.put('/:id',
  validateParams(mongoIdParamSchema),
  validate(updateVendorSchema),
  updateVendor
);

export default router;