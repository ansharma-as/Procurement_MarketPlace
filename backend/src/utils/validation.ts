import { z } from 'zod';

// Common schemas
const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');
const emailSchema = z.string().email('Invalid email format');
const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format').optional();

// Address schema
const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required'),
});

// Contact schema
const contactSchema = z.object({
  email: emailSchema,
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format'),
  website: z.string().url('Invalid website URL').optional(),
});

// Organization validation schemas
export const createOrganizationSchema = z.object({
  organization: z.object({
    name: z.string().min(1, 'Organization name is required').max(200, 'Organization name cannot exceed 200 characters'),
    industry: z.enum([
      'Technology',
      'Healthcare',
      'Manufacturing',
      'Construction',
      'Retail',
      'Financial Services',
      'Education',
      'Government',
      'Energy',
      'Transportation',
      'Real Estate',
      'Agriculture',
      'Other'
    ]),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    address: addressSchema,
    contact: contactSchema,
    registrationNumber: z.string().optional(),
    taxId: z.string().optional(),
  }),
  admin: z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
    email: emailSchema,
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format').optional(),
  }),
});

// Auth validation schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
  role: z.enum(['admin', 'manager', 'user']).default('user'),
  organization: mongoIdSchema,
  manager: mongoIdSchema.optional(),
  phone: phoneSchema,
  department: z.string().max(100, 'Department cannot exceed 100 characters').optional(),
  permissions: z.array(z.enum([
    'approve_requests',
    'create_market_requests',
    'manage_users',
    'view_analytics',
    'manage_organization',
    'approve_high_value'
  ])).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  userType: z.enum(['user', 'vendor']).default('user'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// User validation schemas
export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters').optional(),
  phone: phoneSchema,
  department: z.string().max(100, 'Department cannot exceed 100 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'user']),
});

// Vendor validation schemas
export const createVendorSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name cannot exceed 50 characters'),
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format').optional(),
  specialization: z.array(z.enum([
    'Electronics',
    'Hardware',
    'Software',
    'Office Supplies',
    'Furniture',
    'Machinery',
    'Tools',
    'Vehicles',
    'Services',
    'Maintenance',
    'Consulting',
    'Other'
  ])).min(1, 'At least one specialization is required'),
  location: z.string().min(1, 'Location is required'),
  portfolio: z.string().max(2000, 'Portfolio description cannot exceed 2000 characters').optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  certifications: z.array(z.object({
    name: z.string().min(1, 'Certification name is required'),
    issuedBy: z.string().min(1, 'Issuing authority is required'),
    issuedDate: z.string().datetime(),
    expiryDate: z.string().datetime().optional(),
    documentUrl: z.string().url('Invalid document URL').optional(),
  })).optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

// Internal Request validation schemas
export const createRFPRequestSchema = z.object({
  title: z.string().min(1, 'Request title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(1, 'Request description is required').max(2000, 'Description cannot exceed 2000 characters'),
  category: z.enum([
    'Electronics',
    'Hardware',
    'Software',
    'Office Supplies',
    'Furniture',
    'Machinery',
    'Tools',
    'Vehicles',
    'Services',
    'Maintenance',
    'Other'
  ]),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  specifications: z.record(z.string(), z.any()).default({}),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  budgetEstimate: z.number().min(0, 'Budget estimate must be non-negative'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR']).default('USD'),
  justification: z.string().min(1, 'Justification is required').max(1000, 'Justification cannot exceed 1000 characters'),
  expectedDeliveryDate: z.string().datetime().optional(),
});

export const reviewRFPRequestSchema = z.object({
  status: z.enum(['approved', 'rejected', 'needs_clarification']),
  managerNotes: z.string().max(1000, 'Manager notes cannot exceed 1000 characters').optional(),
  clarificationNotes: z.string().max(1000, 'Clarification notes cannot exceed 1000 characters').optional(),
  rejectionReason: z.string().max(500, 'Rejection reason cannot exceed 500 characters').optional(),
});

// Market Request validation schemas
const requirementSchema = z.object({
  title: z.string().min(1, 'Requirement title is required'),
  description: z.string().min(1, 'Requirement description is required'),
  isMandatory: z.boolean().default(true),
  weight: z.number().min(0).max(100).optional(),
});

const evaluationCriteriaSchema = z.object({
  criterion: z.string().min(1, 'Evaluation criterion is required'),
  description: z.string().optional(),
  weight: z.number().min(0).max(100),
  maxScore: z.number().min(1, 'Max score must be at least 1'),
});

const deliveryLocationSchema = z.object({
  address: z.string().min(1, 'Delivery address is required'),
  city: z.string().min(1, 'Delivery city is required'),
  state: z.string().min(1, 'Delivery state is required'),
  zipCode: z.string().min(1, 'Delivery zip code is required'),
  country: z.string().min(1, 'Delivery country is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  contactPhone: z.string().regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'),
});

export const createMarketRequestSchema = z.object({
  title: z.string().min(1, 'Market request title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(1, 'Market request description is required').max(3000, 'Description cannot exceed 3000 characters'),
  rfpRequest: mongoIdSchema,
  specifications: z.record(z.string(), z.any()).default({}),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  maxBudget: z.number().min(0, 'Maximum budget must be non-negative'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR']).default('USD'),
  deadline: z.string().datetime(),
  deliveryLocation: deliveryLocationSchema,
  requirements: z.array(requirementSchema).optional(),
  evaluationCriteria: z.array(evaluationCriteriaSchema).min(1, 'At least one evaluation criterion is required'),
});

export const updateMarketRequestSchema = createMarketRequestSchema.partial();

// Proposal validation schemas
const complianceDocumentSchema = z.object({
  requirement: z.string().min(1, 'Requirement is required'),
  documentName: z.string().min(1, 'Document name is required'),
  documentUrl: z.string().url('Invalid document URL'),
  isCompliant: z.boolean().default(false),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

export const createProposalSchema = z.object({
  marketRequest: mongoIdSchema,
  proposedItem: z.string().min(1, 'Proposed item name is required').max(200, 'Proposed item name cannot exceed 200 characters'),
  description: z.string().min(1, 'Proposal description is required').max(2000, 'Description cannot exceed 2000 characters'),
  specifications: z.record(z.string(), z.any()).default({}),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR']).default('USD'),
  deliveryTime: z.string().min(1, 'Delivery time is required').max(100, 'Delivery time cannot exceed 100 characters'),
  deliveryDate: z.string().datetime(),
  warranty: z.string().min(1, 'Warranty information is required').max(200, 'Warranty information cannot exceed 200 characters'),
  additionalServices: z.array(z.string()).default([]),
  complianceDocuments: z.array(complianceDocumentSchema).optional(),
  vendorNotes: z.string().max(1000, 'Vendor notes cannot exceed 1000 characters').default(''),
});

export const updateProposalSchema = createProposalSchema.partial();

export const evaluateProposalSchema = z.object({
  scores: z.array(z.object({
    criterion: z.string().min(1, 'Criterion is required'),
    score: z.number().min(0, 'Score must be non-negative'),
    maxScore: z.number().min(1, 'Max score must be at least 1'),
    notes: z.string().max(500, 'Score notes cannot exceed 500 characters').optional(),
  })).min(1, 'At least one score is required'),
  overallNotes: z.string().max(1000, 'Overall notes cannot exceed 1000 characters').optional(),
});

export const acceptProposalSchema = z.object({
  managerNotes: z.string().max(1000, 'Manager notes cannot exceed 1000 characters').optional(),
});

export const rejectProposalSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required').max(500, 'Rejection reason cannot exceed 500 characters'),
  managerNotes: z.string().max(1000, 'Manager notes cannot exceed 1000 characters').optional(),
});

// Generic pagination and query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  category: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().datetime('Invalid date format').optional(),
  dateTo: z.string().datetime('Invalid date format').optional(),
});

// Parameter validation schemas
export const mongoIdParamSchema = z.object({
  id: mongoIdSchema,
});

export const rfpIdParamSchema = z.object({
  rfpId: mongoIdSchema,
});

export const quotationIdParamSchema = z.object({
  quotationId: mongoIdSchema,
});

// Utility function for validation middleware
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
        });
      }
      next(error);
    }
  };
};

// Utility function for query validation
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse(req.query);
      req.validatedQuery = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Query validation error',
          errors,
        });
      }
      next(error);
    }
  };
};

// Utility function for parameter validation
export const validateParams = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse(req.params);
      req.params = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Parameter validation error',
          errors,
        });
      }
      next(error);
    }
  };
};