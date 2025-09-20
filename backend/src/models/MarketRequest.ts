import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketRequest extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  rfpRequest: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  status: 'open' | 'closed' | 'awarded' | 'cancelled';
  specifications: {
    [key: string]: any;
  };
  quantity: number;
  maxBudget: number;
  currency: string;
  deadline: Date;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    contactPerson: string;
    contactPhone: string;
  };
  requirements: Array<{
    title: string;
    description: string;
    isMandatory: boolean;
    weight?: number;
  }>;
  evaluationCriteria: Array<{
    criterion: string;
    description?: string;
    weight: number;
    maxScore: number;
  }>;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>;
  proposalsCount: number;
  viewsCount: number;
  interestedVendors: Array<{
    vendor: mongoose.Types.ObjectId;
    viewedAt: Date;
    isInterested: boolean;
  }>;
  winningProposal?: mongoose.Types.ObjectId;
  awardedAt?: Date;
  closedAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const marketRequestSchema = new Schema<IMarketRequest>({
  title: {
    type: String,
    required: [true, 'Market request title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Market request description is required'],
    trim: true,
    maxlength: [3000, 'Description cannot exceed 3000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
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
      'Other',
    ],
  },
  rfpRequest: {
    type: Schema.Types.ObjectId,
    ref: 'RFPRequest',
    required: [true, 'Internal request reference is required'],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'awarded', 'cancelled'],
    default: 'open',
  },
  specifications: {
    type: Schema.Types.Mixed,
    default: {},
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
  },
  maxBudget: {
    type: Number,
    required: [true, 'Maximum budget is required'],
    min: [0, 'Maximum budget must be non-negative'],
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'],
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'Deadline must be in the future',
    },
  },
  deliveryLocation: {
    address: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Delivery city is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'Delivery state is required'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, 'Delivery zip code is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Delivery country is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person is required'],
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
    },
  },
  requirements: [{
    title: {
      type: String,
      required: [true, 'Requirement title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Requirement description is required'],
      trim: true,
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
    weight: {
      type: Number,
      min: 0,
      max: 100,
    },
  }],
  evaluationCriteria: [{
    criterion: {
      type: String,
      required: [true, 'Evaluation criterion is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: 0,
      max: 100,
    },
    maxScore: {
      type: Number,
      required: [true, 'Max score is required'],
      min: 1,
    },
  }],
  attachments: [{
    name: {
      type: String,
      required: [true, 'Attachment name is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Attachment URL is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Attachment type is required'],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, 'Attachment size is required'],
      min: [0, 'Attachment size must be non-negative'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  proposalsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  viewsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  interestedVendors: [{
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
    isInterested: {
      type: Boolean,
      default: false,
    },
  }],
  winningProposal: {
    type: Schema.Types.ObjectId,
    ref: 'Proposal',
  },
  awardedAt: {
    type: Date,
  },
  closedAt: {
    type: Date,
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
marketRequestSchema.index({ category: 1, status: 1 });
marketRequestSchema.index({ organization: 1, status: 1 });
marketRequestSchema.index({ createdBy: 1, createdAt: -1 });
marketRequestSchema.index({ deadline: 1, status: 1 });
marketRequestSchema.index({ status: 1, createdAt: -1 });
marketRequestSchema.index({ maxBudget: 1, category: 1 });

// Virtual for days until deadline
marketRequestSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const diffTime = this.deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is expired
marketRequestSchema.virtual('isExpired').get(function() {
  if (!this.deadline) return false;
  return new Date() > this.deadline && this.status === 'open';
});

// Virtual for total evaluation criteria weight
marketRequestSchema.virtual('totalEvaluationWeight').get(function() {
  if (!this.evaluationCriteria || this.evaluationCriteria.length === 0) return 0;
  return this.evaluationCriteria.reduce((total, criteria) => total + criteria.weight, 0);
});

// Virtual for interest rate
marketRequestSchema.virtual('interestRate').get(function() {
  if (this.viewsCount === 0 || !this.interestedVendors || this.interestedVendors.length === 0) return 0;
  const interestedCount = this.interestedVendors.filter(v => v.isInterested).length;
  return (interestedCount / this.viewsCount) * 100;
});

// Pre-save middleware to validate deadline
marketRequestSchema.pre('save', function(next) {
  if (this.isModified('deadline') && this.deadline <= new Date()) {
    return next(new Error('Deadline must be in the future'));
  }
  next();
});

// Pre-save middleware to validate evaluation criteria weights sum to 100
marketRequestSchema.pre('save', function(next) {
  if (this.evaluationCriteria && this.evaluationCriteria.length > 0) {
    const totalWeight = this.evaluationCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);
    if (totalWeight !== 100) {
      return next(new Error('Total evaluation criteria weights must sum to 100%'));
    }
  }
  next();
});

// Pre-save middleware to set closedAt when status changes to closed/awarded/cancelled
marketRequestSchema.pre('save', function(next) {
  if (this.isModified('status') &&
      ['closed', 'awarded', 'cancelled'].includes(this.status) &&
      !this.closedAt) {
    this.closedAt = new Date();
  }

  if (this.isModified('status') && this.status === 'awarded' && !this.awardedAt) {
    this.awardedAt = new Date();
  }

  next();
});

const MarketRequest = mongoose.model<IMarketRequest>('MarketRequest', marketRequestSchema);

export default MarketRequest;