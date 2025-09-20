import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MarketRequest, RFPRequest, User, Organization } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Create market request from internal request (managers/admins only)
export const createMarketRequest = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    description,
    rfpRequest: rfpRequestId,
    specifications,
    quantity,
    maxBudget,
    currency,
    deadline,
    deliveryLocation,
    requirements,
    evaluationCriteria,
  } = req.body;

  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // Only managers and admins can create market requests
  if (!userRole || !['manager', 'admin'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to create market requests',
    });
  }

  // Verify internal request exists and is approved
  const rfpRequest = await RFPRequest.findById(rfpRequestId);
  if (!rfpRequest) {
    return res.status(404).json({
      success: false,
      message: 'Internal request not found',
    });
  }

  if (rfpRequest.status !== 'approved') {
    return res.status(400).json({
      success: false,
      message: 'Internal request must be approved before creating market request',
    });
  }

  // Check if market request already exists for this internal request
  const existingMarketRequest = await MarketRequest.findOne({ rfpRequest: rfpRequestId });
  if (existingMarketRequest) {
    return res.status(400).json({
      success: false,
      message: 'Market request already exists for this internal request',
    });
  }

  // Get user organization
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const marketRequest = await MarketRequest.create({
    title,
    description,
    category: rfpRequest.category,
    rfpRequest: rfpRequestId,
    createdBy: userId,
    organization: user.organization,
    specifications,
    quantity,
    maxBudget,
    currency,
    deadline,
    deliveryLocation,
    requirements,
    evaluationCriteria,
  });

  // Update internal request status
  rfpRequest.status = 'converted_to_market';
  rfpRequest.marketRequestId = marketRequest._id;
  await rfpRequest.save();

  await marketRequest.populate([
    { path: 'rfpRequest', select: 'title description requestedBy' },
    { path: 'createdBy', select: 'firstName lastName email' },
    { path: 'organization', select: 'name' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Market request created successfully',
    data: {
      marketRequest,
    },
  });
});

// Get market requests (public for vendors, filtered for organization users)
export const getMarketRequests = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    maxBudget,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const userType = req.user!.userType;
  const userId = req.user!.userId;

  let filter: any = {};

  if (userType === 'vendor') {
    // Vendors can see all open market requests
    filter.status = 'open';
  } else {
    // Organization users can see market requests from their organization
    const user = await User.findById(userId);
    if (user) {
      filter.organization = user.organization;
    }
  }

  // Add additional filters
  if (status && userType !== 'vendor') filter.status = status;
  if (category) filter.category = category;
  if (maxBudget) filter.maxBudget = { $lte: parseInt(maxBudget as string) };

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [requests, total] = await Promise.all([
    MarketRequest.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('organization', 'name')
      .select(userType === 'vendor' ? '-interestedVendors' : '')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum),
    MarketRequest.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});

// Get single market request
export const getMarketRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userType = req.user!.userType;
  const userId = req.user!.userId;

  let selectFields = '';
  if (userType === 'vendor') {
    // Vendors can't see interested vendors list
    selectFields = '-interestedVendors';
  }

  const request = await MarketRequest.findById(id)
    .populate('createdBy', 'firstName lastName email')
    .populate('organization', 'name')
    .populate('rfpRequest', 'title description requestedBy createdAt')
    .select(selectFields);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Market request not found',
    });
  }

  // Check if vendor has viewed this request before
  if (userType === 'vendor' && request.status === 'open') {
    const vendorViewed = request.interestedVendors.some(
      (vendor: any) => vendor.vendor.toString() === userId
    );

    if (!vendorViewed) {
      // Add vendor to interested list and increment views
      request.interestedVendors.push({
        vendor: new mongoose.Types.ObjectId(userId),
        viewedAt: new Date(),
        isInterested: false,
      });
      request.viewsCount += 1;
      await request.save();
    }
  }

  res.status(200).json({
    success: true,
    data: {
      request,
    },
  });
});

// Mark interest in market request (vendors only)
export const markInterest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isInterested } = req.body;
  const userType = req.user!.userType;
  const userId = req.user!.userId;

  if (userType !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can mark interest',
    });
  }

  const request = await MarketRequest.findById(id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Market request not found',
    });
  }

  if (request.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'Market request is not open for interest',
    });
  }

  // Find or create vendor entry in interested vendors
  const vendorIndex = request.interestedVendors.findIndex(
    (vendor: any) => vendor.vendor.toString() === userId
  );

  if (vendorIndex >= 0) {
    request.interestedVendors[vendorIndex]!.isInterested = isInterested;
  } else {
    request.interestedVendors.push({
      vendor: new mongoose.Types.ObjectId(userId),
      viewedAt: new Date(),
      isInterested,
    });
    request.viewsCount += 1;
  }

  await request.save();

  res.status(200).json({
    success: true,
    message: `Interest ${isInterested ? 'marked' : 'unmarked'} successfully`,
  });
});

// Update market request (creators only, open status only)
export const updateMarketRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const request = await MarketRequest.findById(id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Market request not found',
    });
  }

  // Only creators can update
  if (request.createdBy.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this market request',
    });
  }

  // Can only update if status is open
  if (request.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'Can only update open market requests',
    });
  }

  const allowedFields = [
    'title', 'description', 'specifications', 'quantity', 'maxBudget',
    'currency', 'deadline', 'deliveryLocation', 'requirements', 'evaluationCriteria'
  ];
  const updateData: any = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedRequest = await MarketRequest.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'createdBy', select: 'firstName lastName email' },
    { path: 'organization', select: 'name' },
    { path: 'rfpRequest', select: 'title description' }
  ]);

  res.status(200).json({
    success: true,
    message: 'Market request updated successfully',
    data: {
      request: updatedRequest,
    },
  });
});

// Close market request (creators only)
export const closeMarketRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user!.userId;

  const request = await MarketRequest.findById(id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Market request not found',
    });
  }

  // Only creators can close
  if (request.createdBy.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to close this market request',
    });
  }

  if (request.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'Market request is already closed',
    });
  }

  request.status = 'closed';
  if (reason) request.cancellationReason = reason;
  await request.save();

  res.status(200).json({
    success: true,
    message: 'Market request closed successfully',
  });
});

// Award market request to winning proposal (creators only)
export const awardMarketRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { proposalId, managerNotes } = req.body;
  const userId = req.user!.userId;

  const request = await MarketRequest.findById(id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Market request not found',
    });
  }

  // Only creators can award
  if (request.createdBy.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to award this market request',
    });
  }

  if (request.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'Can only award open market requests',
    });
  }

  // Verify proposal belongs to this market request
  const { Proposal } = await import('../models/index.js');
  const proposal = await Proposal.findOne({
    _id: proposalId,
    marketRequest: id,
    status: 'submitted'
  });

  if (!proposal) {
    return res.status(404).json({
      success: false,
      message: 'Valid proposal not found for this market request',
    });
  }

  // Update market request
  request.status = 'awarded';
  request.winningProposal = proposalId;
  await request.save();

  // Update proposal status
  proposal.status = 'accepted';
  proposal.managerNotes = managerNotes;
  await proposal.save();

  res.status(200).json({
    success: true,
    message: 'Market request awarded successfully',
    data: {
      request,
      winningProposal: proposal,
    },
  });
});