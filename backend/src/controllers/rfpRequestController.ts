import type { Request, Response } from 'express';
import { RFPRequest, User, Organization } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Create RFP request (by users)
export const createRFPRequest = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, category, urgency, specifications, quantity, budgetEstimate, currency, justification, expectedDeliveryDate } = req.body;

  const userId = req.user!.userId;

  // Get user to find their organization and manager
  const user = await User.findById(userId).populate('organization');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Regular users must have a manager assigned to create requests
  // Admins and managers can create requests without a manager assigned
  if (!user.manager && user.role === 'user') {
    return res.status(400).json({
      success: false,
      message: 'You must have a manager assigned to create RFP requests',
    });
  }

  const rfpRequest = await RFPRequest.create({
    title,
    description,
    category,
    requestedBy: userId,
    organization: user.organization._id,
    manager: user.manager || userId, // If no manager assigned, use self (for admins/managers)
    urgency,
    specifications,
    quantity,
    budgetEstimate,
    currency,
    justification,
    expectedDeliveryDate,
  });

  await rfpRequest.populate([
    { path: 'requestedBy', select: 'firstName lastName email' },
    { path: 'manager', select: 'firstName lastName email' },
    { path: 'organization', select: 'name' }
  ]);

  res.status(201).json({
    success: true,
    message: 'RFP request created successfully',
    data: {
      rfpRequest,
    },
  });
});

// Get RFP requests (filtered by user role)
export const getRFPRequests = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    urgency,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const userId = req.user!.userId;
  const userRole = req.user!.role;

  let filter: any = {};

  // Filter based on user role
  if (userRole === 'user') {
    // Users can only see their own requests
    filter.requestedBy = userId;
  } else if (userRole === 'manager') {
    // Managers can see requests assigned to them
    filter.manager = userId;
  } else if (userRole === 'admin') {
    // Admins can see all requests in their organization
    const user = await User.findById(userId);
    filter.organization = user?.organization;
  }

  // Add additional filters
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (urgency) filter.urgency = urgency;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [requests, total] = await Promise.all([
    RFPRequest.find(filter)
      .populate('requestedBy', 'firstName lastName email')
      .populate('manager', 'firstName lastName email')
      .populate('organization', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum),
    RFPRequest.countDocuments(filter),
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

// Get single RFP request
export const getRFPRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const request = await RFPRequest.findById(id)
    .populate('requestedBy', 'firstName lastName email')
    .populate('manager', 'firstName lastName email')
    .populate('organization', 'name');

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'RFP request not found',
    });
  }

  // Check permissions
  const canView = userRole === 'admin' ||
                  request.requestedBy._id.toString() === userId ||
                  request.manager._id.toString() === userId;

  if (!canView) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this request',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      request,
    },
  });
});

// Update RFP request (only by the requester, and only if pending)
export const updateRFPRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const request = await RFPRequest.findById(id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'RFP request not found',
    });
  }

  // Only the requester can update, and only if still pending
  if (request.requestedBy.toString() !== userId || request.status !== 'pending') {
    return res.status(403).json({
      success: false,
      message: 'Cannot update this request',
    });
  }

  const allowedFields = ['title', 'description', 'category', 'urgency', 'specifications', 'quantity', 'budgetEstimate', 'currency', 'justification', 'expectedDeliveryDate'];
  const updateData: any = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedRequest = await RFPRequest.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'requestedBy', select: 'firstName lastName email' },
    { path: 'manager', select: 'firstName lastName email' },
    { path: 'organization', select: 'name' }
  ]);

  res.status(200).json({
    success: true,
    message: 'RFP request updated successfully',
    data: {
      request: updatedRequest,
    },
  });
});

// Review RFP request (by managers)
export const reviewRFPRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, managerNotes, clarificationNotes, rejectionReason } = req.body;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const request = await RFPRequest.findById(id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'RFP request not found',
    });
  }

  // Only managers and admins can review requests
  if (!userRole || !['manager', 'admin'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to review requests',
    });
  }

  // Managers can only review requests assigned to them
  if (userRole === 'manager' && request.manager.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to review this request',
    });
  }

  // Can only review pending requests
  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Request has already been reviewed',
    });
  }

  // Update request
  request.status = status;
  if (managerNotes) request.managerNotes = managerNotes;
  if (clarificationNotes) request.clarificationNotes = clarificationNotes;
  if (rejectionReason) request.rejectionReason = rejectionReason;

  await request.save();

  await request.populate([
    { path: 'requestedBy', select: 'firstName lastName email' },
    { path: 'manager', select: 'firstName lastName email' },
    { path: 'organization', select: 'name' }
  ]);

  res.status(200).json({
    success: true,
    message: 'RFP request reviewed successfully',
    data: {
      request,
    },
  });
});

// Delete RFP request (only by requester, only if pending)
export const deleteRFPRequest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const request = await RFPRequest.findById(id);

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'RFP request not found',
    });
  }

  // Only the requester can delete, and only if still pending
  if (request.requestedBy.toString() !== userId || request.status !== 'pending') {
    return res.status(403).json({
      success: false,
      message: 'Cannot delete this request',
    });
  }

  await RFPRequest.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'RFP request deleted successfully',
  });
});