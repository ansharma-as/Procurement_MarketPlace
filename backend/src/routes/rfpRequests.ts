import { Router } from 'express';
import {
  createRFPRequest,
  getRFPRequests,
  getRFPRequest,
  updateRFPRequest,
  reviewRFPRequest,
  deleteRFPRequest,
} from '../controllers/rfpRequestController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../utils/validation.js';
import {
  createRFPRequestSchema,
  reviewRFPRequestSchema,
} from '../utils/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create RFP request (users only)
router.post('/', validate(createRFPRequestSchema), createRFPRequest);

// Get RFP requests (with pagination and filtering)
router.get('/', getRFPRequests);

// Get single RFP request
router.get('/:id', getRFPRequest);

// Update RFP request (requester only, pending only)
router.put('/:id', updateRFPRequest);

// Review RFP request (managers/admins only)
router.patch('/:id/review',
  validate(reviewRFPRequestSchema),
  reviewRFPRequest
);

// Delete RFP request (requester only, pending only)
router.delete('/:id', deleteRFPRequest);

export default router;