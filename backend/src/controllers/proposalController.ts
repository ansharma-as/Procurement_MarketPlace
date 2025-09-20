import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Proposal, MarketRequest, Vendor, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Create proposal (vendors only)
export const createProposal = asyncHandler(async (req: Request, res: Response) => {
  const {
    marketRequest: marketRequestId,
    proposedItem,
    description,
    specifications,
    quantity,
    unitPrice,
    currency,
    deliveryTime,
    deliveryDate,
    warranty,
    additionalServices,
    complianceDocuments,
    vendorNotes,
  } = req.body;

  const userType = req.user!.userType;
  const vendorId = req.user!.userId;

  // Only vendors can create proposals
  if (userType !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can create proposals',
    });
  }

  // Verify market request exists and is open
  const marketRequest = await MarketRequest.findById(marketRequestId);
  if (!marketRequest) {
    return res.status(404).json({
      success: false,
      message: 'Market request not found',
    });
  }

  if (marketRequest.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'Market request is not open for proposals',
    });
  }

  // Check if deadline has passed
  if (new Date() > marketRequest.deadline) {
    return res.status(400).json({
      success: false,
      message: 'Market request deadline has passed',
    });
  }

  // Check if vendor already has a proposal for this market request
  const existingProposal = await Proposal.findOne({
    marketRequest: marketRequestId,
    vendor: vendorId,
  });

  if (existingProposal) {
    return res.status(400).json({
      success: false,
      message: 'You have already submitted a proposal for this market request',
    });
  }

  const proposal = await Proposal.create({
    marketRequest: marketRequestId,
    vendor: vendorId,
    proposedItem,
    description,
    specifications,
    quantity,
    unitPrice,
    currency,
    deliveryTime,
    deliveryDate,
    warranty,
    additionalServices,
    complianceDocuments,
    vendorNotes,
  });

  // Increment proposals count on market request
  marketRequest.proposalsCount += 1;
  await marketRequest.save();

  await proposal.populate([
    { path: 'vendor', select: 'firstName lastName email specialization' },
    { path: 'marketRequest', select: 'title organization' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Proposal created successfully',
    data: {
      proposal,
    },
  });
});

// Get proposals (filtered by user type and role)
export const getProposals = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    status,
    marketRequest,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const userType = req.user!.userType;
  const userId = req.user!.userId;

  let filter: any = {};

  if (userType === 'vendor') {
    // Vendors can only see their own proposals
    filter.vendor = userId;
  } else {
    // Organization users can see proposals for their market requests
    const user = await User.findById(userId);
    if (user) {
      const marketRequestIds = await MarketRequest.find({
        organization: user.organization
      }).distinct('_id');
      filter.marketRequest = { $in: marketRequestIds };
    }
  }

  // Add additional filters
  if (status) filter.status = status;
  if (marketRequest) filter.marketRequest = marketRequest;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [proposals, total] = await Promise.all([
    Proposal.find(filter)
      .populate('vendor', 'firstName lastName email specialization')
      .populate('marketRequest', 'title organization deadline')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum),
    Proposal.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      proposals,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});

// Get single proposal
export const getProposal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userType = req.user!.userType;
  const userId = req.user!.userId;

  const proposal = await Proposal.findById(id)
    .populate('vendor', 'firstName lastName email specialization location')
    .populate('marketRequest', 'title organization deadline evaluationCriteria');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found',
    });
  }

  // Check permissions
  let canView = false;

  if (userType === 'vendor') {
    // Vendors can only view their own proposals
    canView = proposal.vendor._id.toString() === userId;
  } else {
    // Organization users can view proposals for their market requests
    const user = await User.findById(userId);
    if (user) {
      const marketRequest = await MarketRequest.findOne({
        _id: proposal.marketRequest._id,
        organization: user.organization,
      });
      canView = !!marketRequest;
    }
  }

  if (!canView) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this proposal',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      proposal,
    },
  });
});

// Update proposal (vendors only, draft/submitted status only)
export const updateProposal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userType = req.user!.userType;
  const vendorId = req.user!.userId;

  if (userType !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can update proposals',
    });
  }

  const proposal = await Proposal.findById(id);

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found',
    });
  }

  // Only proposal owner can update
  if (proposal.vendor.toString() !== vendorId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this proposal',
    });
  }

  // Can only update if editable
  if (!proposal.isEditable) {
    return res.status(400).json({
      success: false,
      message: 'Proposal cannot be edited in current status',
    });
  }

  const allowedFields = [
    'proposedItem', 'description', 'specifications', 'quantity', 'unitPrice',
    'currency', 'deliveryTime', 'deliveryDate', 'warranty', 'additionalServices',
    'complianceDocuments', 'vendorNotes'
  ];
  const updateData: any = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedProposal = await Proposal.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'vendor', select: 'firstName lastName email specialization' },
    { path: 'marketRequest', select: 'title organization' }
  ]);

  res.status(200).json({
    success: true,
    message: 'Proposal updated successfully',
    data: {
      proposal: updatedProposal,
    },
  });
});

// Submit proposal (vendors only)
export const submitProposal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userType = req.user!.userType;
  const vendorId = req.user!.userId;

  if (userType !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can submit proposals',
    });
  }

  const proposal = await Proposal.findById(id).populate('marketRequest');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found',
    });
  }

  // Only proposal owner can submit
  if (proposal.vendor.toString() !== vendorId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to submit this proposal',
    });
  }

  if (proposal.status !== 'draft') {
    return res.status(400).json({
      success: false,
      message: 'Only draft proposals can be submitted',
    });
  }

  // Check if market request is still open
  if ((proposal.marketRequest as any).status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'Market request is no longer open',
    });
  }

  // Check deadline
  if (new Date() > (proposal.marketRequest as any).deadline) {
    return res.status(400).json({
      success: false,
      message: 'Market request deadline has passed',
    });
  }

  proposal.status = 'submitted';
  await proposal.save();

  res.status(200).json({
    success: true,
    message: 'Proposal submitted successfully',
    data: {
      proposal,
    },
  });
});

// Withdraw proposal (vendors only)
export const withdrawProposal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userType = req.user!.userType;
  const vendorId = req.user!.userId;

  if (userType !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can withdraw proposals',
    });
  }

  const proposal = await Proposal.findById(id);

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found',
    });
  }

  // Only proposal owner can withdraw
  if (proposal.vendor.toString() !== vendorId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to withdraw this proposal',
    });
  }

  if (!proposal.canBeWithdrawn) {
    return res.status(400).json({
      success: false,
      message: 'Proposal cannot be withdrawn in current status',
    });
  }

  proposal.status = 'withdrawn';
  if (reason) proposal.vendorNotes = reason;
  await proposal.save();

  res.status(200).json({
    success: true,
    message: 'Proposal withdrawn successfully',
  });
});

// Evaluate proposal (organization users only)
export const evaluateProposal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { scores, overallNotes } = req.body;
  const userType = req.user!.userType;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  if (userType === 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Vendors cannot evaluate proposals',
    });
  }

  // Only managers and admins can evaluate
  if (!userRole || !['manager', 'admin'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to evaluate proposals',
    });
  }

  const proposal = await Proposal.findById(id).populate('marketRequest');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found',
    });
  }

  if (proposal.status !== 'submitted') {
    return res.status(400).json({
      success: false,
      message: 'Can only evaluate submitted proposals',
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

  // Calculate total scores
  const totalScore = scores.reduce((sum: number, score: any) => sum + score.score, 0);
  const maxTotalScore = scores.reduce((sum: number, score: any) => sum + score.maxScore, 0);

  proposal.evaluation = {
    scores,
    totalScore,
    maxTotalScore,
    percentageScore: (totalScore / maxTotalScore) * 100,
    evaluatedBy: new mongoose.Types.ObjectId(userId),
    evaluatedAt: new Date(),
    overallNotes,
  };

  proposal.status = 'under_review';
  await proposal.save();

  res.status(200).json({
    success: true,
    message: 'Proposal evaluated successfully',
    data: {
      proposal,
    },
  });
});

// Accept proposal (organization users only)
export const acceptProposal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { managerNotes } = req.body;
  const userType = req.user!.userType;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  if (userType === 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Vendors cannot accept proposals',
    });
  }

  // Only managers and admins can accept
  if (!userRole || !['manager', 'admin'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to accept proposals',
    });
  }

  const proposal = await Proposal.findById(id).populate('marketRequest');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found',
    });
  }

  if (!['submitted', 'under_review'].includes(proposal.status)) {
    return res.status(400).json({
      success: false,
      message: 'Can only accept submitted or reviewed proposals',
    });
  }

  // Verify user has permission
  const user = await User.findById(userId);
  const marketRequest = await MarketRequest.findOne({
    _id: proposal.marketRequest._id,
    organization: user?.organization,
  });

  if (!marketRequest) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to accept this proposal',
    });
  }

  proposal.status = 'accepted';
  if (managerNotes) proposal.managerNotes = managerNotes;
  await proposal.save();

  // Update market request
  marketRequest.status = 'awarded';
  marketRequest.winningProposal = proposal._id;
  await marketRequest.save();

  res.status(200).json({
    success: true,
    message: 'Proposal accepted successfully',
    data: {
      proposal,
    },
  });
});

// Reject proposal (organization users only)
export const rejectProposal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rejectionReason, managerNotes } = req.body;
  const userType = req.user!.userType;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  if (userType === 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Vendors cannot reject proposals',
    });
  }

  // Only managers and admins can reject
  if (!userRole || !['manager', 'admin'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to reject proposals',
    });
  }

  const proposal = await Proposal.findById(id).populate('marketRequest');

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found',
    });
  }

  if (!['submitted', 'under_review'].includes(proposal.status)) {
    return res.status(400).json({
      success: false,
      message: 'Can only reject submitted or reviewed proposals',
    });
  }

  // Verify user has permission
  const user = await User.findById(userId);
  const marketRequest = await MarketRequest.findOne({
    _id: proposal.marketRequest._id,
    organization: user?.organization,
  });

  if (!marketRequest) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to reject this proposal',
    });
  }

  proposal.status = 'rejected';
  proposal.rejectionReason = rejectionReason;
  if (managerNotes) proposal.managerNotes = managerNotes;
  await proposal.save();

  res.status(200).json({
    success: true,
    message: 'Proposal rejected successfully',
    data: {
      proposal,
    },
  });
});

// Delete proposal (vendors only, draft status only)
export const deleteProposal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userType = req.user!.userType;
  const vendorId = req.user!.userId;

  if (userType !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can delete proposals',
    });
  }

  const proposal = await Proposal.findById(id);

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found',
    });
  }

  // Only proposal owner can delete
  if (proposal.vendor.toString() !== vendorId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this proposal',
    });
  }

  if (proposal.status !== 'draft') {
    return res.status(400).json({
      success: false,
      message: 'Can only delete draft proposals',
    });
  }

  await Proposal.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Proposal deleted successfully',
  });
});