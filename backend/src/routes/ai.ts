import { Router } from 'express';
import {
  evaluateProposal,
  getAIEvaluation,
  compareProposals,
  getVendorInsights,
  analyzeMarketRequest,
  getExecutiveSummary,
  batchEvaluateProposals,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

// Core AI Evaluation Endpoints
router.post('/proposals/:id/evaluate', evaluateProposal);
router.get('/proposals/:id/evaluation', getAIEvaluation);
router.post('/market-requests/:id/compare-proposals', compareProposals);

// AI Insights & Analytics Endpoints
router.get('/vendor-insights/:vendorId', getVendorInsights);
router.post('/market-analysis', analyzeMarketRequest);
router.get('/evaluation-summary/:marketRequestId', getExecutiveSummary);

// Batch Operations
router.post('/batch-evaluate', batchEvaluateProposals);

export default router;