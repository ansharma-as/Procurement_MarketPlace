import { Router } from 'express';
import {
  createMarketRequest,
  getMarketRequests,
  getMarketRequest,
  markInterest,
  updateMarketRequest,
  closeMarketRequest,
  awardMarketRequest,
} from '../controllers/marketRequestController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, validateParams, validateQuery } from '../utils/validation.js';
import {
  createMarketRequestSchema,
  updateMarketRequestSchema,
  mongoIdParamSchema,
  paginationSchema,
} from '../utils/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create market request (managers/admins only)
router.post('/', validate(createMarketRequestSchema), createMarketRequest);

// Get market requests (public for vendors, filtered for org users)
router.get('/', validateQuery(paginationSchema), getMarketRequests);

// Get single market request
router.get('/:id', validateParams(mongoIdParamSchema), getMarketRequest);

// Mark/unmark interest (vendors only)
router.patch('/:id/interest', validateParams(mongoIdParamSchema), markInterest);

// Update market request (creators only, open only)
router.put('/:id',
  validateParams(mongoIdParamSchema),
  validate(updateMarketRequestSchema),
  updateMarketRequest
);

// Close market request (creators only)
router.patch('/:id/close', validateParams(mongoIdParamSchema), closeMarketRequest);

// Award market request (creators only)
router.patch('/:id/award', validateParams(mongoIdParamSchema), awardMarketRequest);

export default router;