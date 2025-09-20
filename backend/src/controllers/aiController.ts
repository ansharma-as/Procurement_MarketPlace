import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Proposal, MarketRequest, Vendor, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { geminiAI } from '../services/geminiAI.js';

// Trigger AI evaluation for a specific proposal
export const evaluateProposal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userType = req.user!.userType;
  const userId = req.user!.userId;

  // Only organization users can trigger AI evaluation
  if (userType === 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Vendors cannot trigger AI evaluation',
    });
  }

  const proposal = await Proposal.findById(id)
    .populate('vendor', 'firstName lastName email specialization location description')
    .populate('marketRequest', 'title description category maxBudget currency quantity deadline requirements evaluationCriteria');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found',
    });
  }

  // Verify user has permission to evaluate this proposal
  const user = await User.findById(userId);
  const marketRequest = await MarketRequest.findOne({
    _id: proposal.marketRequest._id,
    organization: user?.organization,
  });

  if (!marketRequest) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to evaluate this proposal',
    });
  }

  try {
    // Get vendor history for better evaluation
    const vendorHistory = await Proposal.find({
      vendor: proposal.vendor._id,
      status: { $in: ['accepted', 'rejected'] }
    }).select('proposedItem totalPrice currency deliveryTime status createdAt').limit(10);

    // Trigger AI evaluation
    const aiEvaluation = await geminiAI.evaluateProposal(
      proposal,
      proposal.marketRequest,
      vendorHistory
    );

    // Update proposal with AI evaluation
    proposal.aiEvaluation = aiEvaluation;
    await proposal.save();

    res.status(200).json({
      success: true,
      message: 'AI evaluation completed successfully',
      data: {
        aiEvaluation: proposal.aiEvaluation,
      },
    });
  } catch (error) {
    console.error('AI evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'AI evaluation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get stored AI evaluation results
export const getAIEvaluation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userType = req.user!.userType;
  const userId = req.user!.userId;

  const proposal = await Proposal.findById(id).select('aiEvaluation vendor marketRequest');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found',
    });
  }

  // Check permissions
  let canView = false;

  if (userType === 'vendor') {
    // Vendors can only view their own proposal evaluations
    canView = proposal.vendor.toString() === userId;
  } else {
    // Organization users can view evaluations for their market requests
    const user = await User.findById(userId);
    if (user) {
      const marketRequest = await MarketRequest.findOne({
        _id: proposal.marketRequest,
        organization: user.organization,
      });
      canView = !!marketRequest;
    }
  }

  if (!canView) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this evaluation',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      aiEvaluation: proposal.aiEvaluation || null,
    },
  });
});

// AI-powered comparison of all proposals for a market request
export const compareProposals = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userType = req.user!.userType;
  const userId = req.user!.userId;

  // Only organization users can trigger AI comparison
  if (userType === 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Vendors cannot access proposal comparisons',
    });
  }

  // Verify user has permission
  const user = await User.findById(userId);
  const marketRequest = await MarketRequest.findOne({
    _id: id,
    organization: user?.organization,
  });

  if (!marketRequest) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to compare proposals for this market request',
    });
  }

  // Get all proposals for this market request
  const proposals = await Proposal.find({
    marketRequest: id,
    status: { $in: ['submitted', 'under_review', 'accepted', 'rejected'] }
  }).populate('vendor', 'firstName lastName email specialization');

  if (proposals.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No proposals found for comparison',
    });
  }

  try {
    // Trigger AI comparison
    const comparison = await geminiAI.compareProposals(proposals, marketRequest);

    res.status(200).json({
      success: true,
      message: 'AI comparison completed successfully',
      data: {
        comparison,
      },
    });
  } catch (error) {
    console.error('AI comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'AI comparison failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get vendor insights and performance predictions
export const getVendorInsights = asyncHandler(async (req: Request, res: Response) => {
  const { vendorId } = req.params;
  const userType = req.user!.userType;

  // Only organization users can view vendor insights
  if (userType === 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Vendors cannot access vendor insights',
    });
  }

  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found',
    });
  }

  try {
    // Get vendor's proposal history
    const proposalHistory = await Proposal.find({
      vendor: vendorId,
      status: { $in: ['submitted', 'under_review', 'accepted', 'rejected'] }
    }).select('proposedItem totalPrice currency deliveryTime status createdAt marketRequest')
      .populate('marketRequest', 'title category')
      .limit(20);

    // Generate AI insights
    const insights = await geminiAI.analyzeVendor(vendor, proposalHistory);

    res.status(200).json({
      success: true,
      data: {
        insights,
      },
    });
  } catch (error) {
    console.error('Vendor insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate vendor insights',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// AI analysis of market request requirements
export const analyzeMarketRequest = asyncHandler(async (req: Request, res: Response) => {
  const { marketRequestId } = req.body;
  const userType = req.user!.userType;
  const userId = req.user!.userId;

  // Only organization users can analyze market requests
  if (userType === 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Vendors cannot analyze market requests',
    });
  }

  // Verify user has permission
  const user = await User.findById(userId);
  const marketRequest = await MarketRequest.findOne({
    _id: marketRequestId,
    organization: user?.organization,
  });

  if (!marketRequest) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to analyze this market request',
    });
  }

  try {
    // Generate AI analysis
    const analysis = await geminiAI.analyzeMarketRequest(marketRequest);

    res.status(200).json({
      success: true,
      data: {
        analysis,
      },
    });
  } catch (error) {
    console.error('Market analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Market analysis failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Generate executive summary with AI recommendations
export const getExecutiveSummary = asyncHandler(async (req: Request, res: Response) => {
  const { marketRequestId } = req.params;
  const userType = req.user!.userType;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // Only managers and admins can view executive summaries
  if (userType === 'vendor' || !userRole || !['manager', 'admin'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view executive summaries',
    });
  }

  // Verify user has permission
  const user = await User.findById(userId);
  const marketRequest = await MarketRequest.findOne({
    _id: marketRequestId,
    organization: user?.organization,
  });

  if (!marketRequest) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view summary for this market request',
    });
  }

  // Get all proposals for this market request
  const proposals = await Proposal.find({
    marketRequest: marketRequestId,
    status: { $in: ['submitted', 'under_review', 'accepted', 'rejected'] }
  }).populate('vendor', 'firstName lastName email');

  if (proposals.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No proposals found for summary generation',
    });
  }

  try {
    // Generate executive summary
    const summary = await geminiAI.generateExecutiveSummary(proposals, marketRequest);

    res.status(200).json({
      success: true,
      data: {
        summary,
      },
    });
  } catch (error) {
    console.error('Executive summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate executive summary',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Batch evaluate all proposals for a market request
export const batchEvaluateProposals = asyncHandler(async (req: Request, res: Response) => {
  const { marketRequestId } = req.body;
  const userType = req.user!.userType;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // Only managers and admins can trigger batch evaluation
  if (userType === 'vendor' || !userRole || !['manager', 'admin'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to perform batch evaluation',
    });
  }

  // Verify user has permission
  const user = await User.findById(userId);
  const marketRequest = await MarketRequest.findOne({
    _id: marketRequestId,
    organization: user?.organization,
  });

  if (!marketRequest) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to evaluate proposals for this market request',
    });
  }

  // Get all unevaluated proposals
  const proposals = await Proposal.find({
    marketRequest: marketRequestId,
    status: { $in: ['submitted', 'under_review'] },
    aiEvaluation: { $exists: false }
  }).populate('vendor', 'firstName lastName email specialization location description');

  if (proposals.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No proposals found for evaluation',
    });
  }

  try {
    const results = [];

    // Evaluate each proposal
    for (const proposal of proposals) {
      try {
        // Get vendor history
        const vendorHistory = await Proposal.find({
          vendor: proposal.vendor._id,
          status: { $in: ['accepted', 'rejected'] }
        }).select('proposedItem totalPrice currency deliveryTime status createdAt').limit(10);

        // Generate AI evaluation
        const aiEvaluation = await geminiAI.evaluateProposal(
          proposal,
          marketRequest,
          vendorHistory
        );

        // Update proposal
        proposal.aiEvaluation = aiEvaluation;
        await proposal.save();

        results.push({
          proposalId: proposal._id,
          vendorName: `${(proposal.vendor as any).firstName} ${(proposal.vendor as any).lastName}`,
          overallScore: aiEvaluation.overallScore,
          success: true
        });
      } catch (error) {
        results.push({
          proposalId: proposal._id,
          vendorName: `${(proposal.vendor as any).firstName} ${(proposal.vendor as any).lastName}`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Batch evaluation completed. ${results.filter(r => r.success).length}/${results.length} proposals evaluated successfully.`,
      data: {
        results,
      },
    });
  } catch (error) {
    console.error('Batch evaluation error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch evaluation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});