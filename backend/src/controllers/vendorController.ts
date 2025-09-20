import type { Request, Response } from 'express';
import { Vendor, MarketRequest, Proposal } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Get all vendors (for organization users to view)
export const getVendors = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    specialization,
    location,
    isActive,
    search,
    sortBy = 'firstName',
    sortOrder = 'asc',
  } = req.query;

  // Build filter
  const filter: any = {};

  if (specialization) filter.specialization = { $in: Array.isArray(specialization) ? specialization : [specialization] };
  if (location) filter.location = { $regex: location, $options: 'i' };
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum),
    Vendor.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      vendors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});

// Get single vendor profile
export const getVendor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const vendor = await Vendor.findById(id)
    .select('-password -emailVerificationToken -passwordResetToken');

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      vendor,
    },
  });
});

// Update vendor profile (vendors only, their own profile)
export const updateVendor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userType = req.user!.userType;
  const userId = req.user!.userId;

  if (userType !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can update vendor profiles',
    });
  }

  if (id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Can only update your own profile',
    });
  }

  const allowedFields = [
    'firstName', 'lastName', 'phone', 'specialization', 'location',
    'portfolio', 'description', 'certifications', 'preferences'
  ];
  const updateData: any = {};

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const vendor = await Vendor.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -emailVerificationToken -passwordResetToken');

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Vendor profile updated successfully',
    data: {
      vendor,
    },
  });
});

// Get vendor dashboard stats (vendors only)
export const getVendorDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userType = req.user!.userType;
  const vendorId = req.user!.userId;

  if (userType !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can access vendor dashboard',
    });
  }

  // Get proposal stats
  const [
    totalProposals,
    draftProposals,
    submittedProposals,
    acceptedProposals,
    rejectedProposals,
    recentProposals,
    marketRequestsViewed,
  ] = await Promise.all([
    Proposal.countDocuments({ vendor: vendorId }),
    Proposal.countDocuments({ vendor: vendorId, status: 'draft' }),
    Proposal.countDocuments({ vendor: vendorId, status: 'submitted' }),
    Proposal.countDocuments({ vendor: vendorId, status: 'accepted' }),
    Proposal.countDocuments({ vendor: vendorId, status: 'rejected' }),
    Proposal.find({ vendor: vendorId })
      .populate('marketRequest', 'title organization')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status totalPrice submittedAt marketRequest'),
    MarketRequest.countDocuments({
      'interestedVendors.vendor': vendorId
    }),
  ]);

  const stats = {
    proposals: {
      total: totalProposals,
      draft: draftProposals,
      submitted: submittedProposals,
      accepted: acceptedProposals,
      rejected: rejectedProposals,
      winRate: totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0,
    },
    marketRequests: {
      viewed: marketRequestsViewed,
    },
    recentActivity: recentProposals,
  };

  res.status(200).json({
    success: true,
    data: {
      stats,
    },
  });
});

// Get vendor's proposals
export const getVendorProposals = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const userType = req.user!.userType;
  const vendorId = req.user!.userId;

  if (userType !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can access vendor proposals',
    });
  }

  const filter: any = { vendor: vendorId };
  if (status) filter.status = status;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

  const [proposals, total] = await Promise.all([
    Proposal.find(filter)
      .populate('marketRequest', 'title deadline status')
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