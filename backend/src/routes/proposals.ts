import { Router } from 'express';
import {
  createProposal,
  getProposals,
  getProposal,
  updateProposal,
  submitProposal,
  withdrawProposal,
  evaluateProposal,
  acceptProposal,
  rejectProposal,
  deleteProposal,
} from '../controllers/proposalController.js';
import { authenticate } from '../middleware/auth.js';
import { validate, validateParams, validateQuery } from '../utils/validation.js';
import {
  createProposalSchema,
  updateProposalSchema,
  evaluateProposalSchema,
  acceptProposalSchema,
  rejectProposalSchema,
  mongoIdParamSchema,
  paginationSchema,
} from '../utils/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create proposal (vendors only)
router.post('/', validate(createProposalSchema), createProposal);

// Get proposals (filtered by user type)
router.get('/', validateQuery(paginationSchema), getProposals);

// Get single proposal
router.get('/:id', validateParams(mongoIdParamSchema), getProposal);

// Update proposal (vendors only, draft/submitted only)
router.put('/:id',
  validateParams(mongoIdParamSchema),
  validate(updateProposalSchema),
  updateProposal
);

// Submit proposal (vendors only)
router.patch('/:id/submit', validateParams(mongoIdParamSchema), submitProposal);

// Withdraw proposal (vendors only)
router.patch('/:id/withdraw', validateParams(mongoIdParamSchema), withdrawProposal);

// Evaluate proposal (org users only)
router.patch('/:id/evaluate',
  validateParams(mongoIdParamSchema),
  validate(evaluateProposalSchema),
  evaluateProposal
);

// Accept proposal (org users only)
router.patch('/:id/accept',
  validateParams(mongoIdParamSchema),
  validate(acceptProposalSchema),
  acceptProposal
);

// Reject proposal (org users only)
router.patch('/:id/reject',
  validateParams(mongoIdParamSchema),
  validate(rejectProposalSchema),
  rejectProposal
);

// Delete proposal (vendors only, draft only)
router.delete('/:id', validateParams(mongoIdParamSchema), deleteProposal);

export default router;