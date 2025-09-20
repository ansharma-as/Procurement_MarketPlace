import mongoose, { Document, Schema } from 'mongoose';

export interface IRFPRequest extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  requestedBy: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  manager: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'needs_clarification' | 'converted_to_market';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  specifications: {
    [key: string]: any;
  };
  quantity: number;
  budgetEstimate: number;
  currency: string;
  justification: string;
  expectedDeliveryDate?: Date;
  managerNotes?: string;
  clarificationNotes?: string;
  rejectionReason?: string;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>;
  marketRequestId?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const rfpRequestSchema = new Schema<IRFPRequest>({
  title: {
    type: String,
    required: [true, 'Request title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Request description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
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
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requesting user is required'],
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Manager is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_clarification', 'converted_to_market'],
    default: 'pending',
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
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
  budgetEstimate: {
    type: Number,
    required: [true, 'Budget estimate is required'],
    min: [0, 'Budget estimate must be non-negative'],
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'],
  },
  justification: {
    type: String,
    required: [true, 'Justification is required'],
    trim: true,
    maxlength: [1000, 'Justification cannot exceed 1000 characters'],
  },
  expectedDeliveryDate: {
    type: Date,
  },
  managerNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Manager notes cannot exceed 1000 characters'],
  },
  clarificationNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Clarification notes cannot exceed 1000 characters'],
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
  },
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
  marketRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'MarketRequest',
  },
  reviewedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
rfpRequestSchema.index({ requestedBy: 1, createdAt: -1 });
rfpRequestSchema.index({ manager: 1, status: 1 });
rfpRequestSchema.index({ organization: 1, status: 1 });
rfpRequestSchema.index({ category: 1 });
rfpRequestSchema.index({ urgency: 1, createdAt: -1 });

// Virtual for days since request
rfpRequestSchema.virtual('daysSinceRequest').get(function() {
  if (!this.createdAt) return null;
  const now = new Date();
  const diffTime = now.getTime() - this.createdAt.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for days until expected delivery
rfpRequestSchema.virtual('daysUntilDelivery').get(function() {
  if (!this.expectedDeliveryDate) return null;
  const now = new Date();
  const diffTime = this.expectedDeliveryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is overdue
rfpRequestSchema.virtual('isOverdue').get(function() {
  if (!this.expectedDeliveryDate) return false;
  return new Date() > this.expectedDeliveryDate && this.status === 'pending';
});

// Pre-save middleware to set reviewedAt when status changes
rfpRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }
  next();
});

// Pre-save middleware to validate manager belongs to same organization
rfpRequestSchema.pre('save', async function(next) {
  if (this.isModified('manager') || this.isModified('organization')) {
    const User = mongoose.model('User');
    const manager = await User.findOne({
      _id: this.manager,
      organization: this.organization,
      role: 'manager',
    });

    if (!manager) {
      return next(new Error('Manager must belong to the same organization and have manager role'));
    }
  }
  next();
});

const RFPRequest = mongoose.model<IRFPRequest>('RFPRequest', rfpRequestSchema);

export default RFPRequest;