import mongoose, { Document, Schema } from 'mongoose';

export interface IProposal extends Document {
  _id: mongoose.Types.ObjectId;
  marketRequest: mongoose.Types.ObjectId;
  vendor: mongoose.Types.ObjectId;
  proposedItem: string;
  description: string;
  specifications: {
    [key: string]: any;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  deliveryTime: string;
  deliveryDate: Date;
  warranty: string;
  additionalServices: string[];
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>;
  complianceDocuments: Array<{
    requirement: string;
    documentName: string;
    documentUrl: string;
    isCompliant: boolean;
    notes?: string;
  }>;
  evaluation?: {
    scores: Array<{
      criterion: string;
      score: number;
      maxScore: number;
      notes?: string;
    }>;
    totalScore: number;
    maxTotalScore: number;
    percentageScore: number;
    evaluatedBy: mongoose.Types.ObjectId;
    evaluatedAt: Date;
    overallNotes?: string;
  };
  vendorNotes: string;
  managerNotes?: string;
  rejectionReason?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  withdrawnAt?: Date;
  aiEvaluation?: {
    costScore: number;
    deliveryScore: number;
    complianceScore: number;
    overallScore: number;
    insights: {
      costAnalysis: string;
      deliveryPrediction: string;
      complianceNotes: string;
      riskFactors: string[];
      recommendation: string;
    };
    confidence: number;
    evaluatedAt: Date;
    modelVersion: string;
  };
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  isEditable: boolean;
  canBeWithdrawn: boolean;
}

const proposalSchema = new Schema<IProposal>({
  marketRequest: {
    type: Schema.Types.ObjectId,
    ref: 'MarketRequest',
    required: [true, 'Market request reference is required'],
  },
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor reference is required'],
  },
  proposedItem: {
    type: String,
    required: [true, 'Proposed item name is required'],
    trim: true,
    maxlength: [200, 'Proposed item name cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Proposal description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
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
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price must be non-negative'],
  },
  totalPrice: {
    type: Number,
    min: [0, 'Total price must be non-negative'],
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR'],
  },
  deliveryTime: {
    type: String,
    required: [true, 'Delivery time is required'],
    trim: true,
    maxlength: [100, 'Delivery time cannot exceed 100 characters'],
  },
  deliveryDate: {
    type: Date,
    required: [true, 'Delivery date is required'],
    validate: {
      validator: function(value: Date) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return value >= today;
      },
      message: 'Delivery date must be today or in the future',
    },
  },
  warranty: {
    type: String,
    required: [true, 'Warranty information is required'],
    trim: true,
    maxlength: [200, 'Warranty information cannot exceed 200 characters'],
  },
  additionalServices: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'accepted', 'rejected', 'withdrawn'],
    default: 'draft',
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
  complianceDocuments: [{
    requirement: {
      type: String,
      required: [true, 'Requirement is required'],
      trim: true,
    },
    documentName: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
    },
    documentUrl: {
      type: String,
      required: [true, 'Document URL is required'],
      trim: true,
    },
    isCompliant: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  }],
  evaluation: {
    scores: [{
      criterion: {
        type: String,
        required: true,
        trim: true,
      },
      score: {
        type: Number,
        required: true,
        min: 0,
      },
      maxScore: {
        type: Number,
        required: true,
        min: 1,
      },
      notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Score notes cannot exceed 500 characters'],
      },
    }],
    totalScore: {
      type: Number,
      min: 0,
    },
    maxTotalScore: {
      type: Number,
      min: 1,
    },
    percentageScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    evaluatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    evaluatedAt: {
      type: Date,
    },
    overallNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Overall notes cannot exceed 1000 characters'],
    },
  },
  vendorNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Vendor notes cannot exceed 1000 characters'],
    default: '',
  },
  managerNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Manager notes cannot exceed 1000 characters'],
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
  },
  submittedAt: {
    type: Date,
  },
  reviewedAt: {
    type: Date,
  },
  acceptedAt: {
    type: Date,
  },
  rejectedAt: {
    type: Date,
  },
  withdrawnAt: {
    type: Date,
  },
  aiEvaluation: {
    costScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    deliveryScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    complianceScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    insights: {
      costAnalysis: {
        type: String,
        trim: true,
      },
      deliveryPrediction: {
        type: String,
        trim: true,
      },
      complianceNotes: {
        type: String,
        trim: true,
      },
      riskFactors: [{
        type: String,
        trim: true,
      }],
      recommendation: {
        type: String,
        trim: true,
      },
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
    },
    modelVersion: {
      type: String,
      default: 'gemini-pro-v1',
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
proposalSchema.index({ marketRequest: 1, vendor: 1 }, { unique: true });
proposalSchema.index({ vendor: 1, status: 1 });
proposalSchema.index({ marketRequest: 1, status: 1 });
proposalSchema.index({ status: 1, submittedAt: -1 });
proposalSchema.index({ totalPrice: 1 });

// Virtual for price per unit
proposalSchema.virtual('pricePerUnit').get(function() {
  if (this.quantity === 0) return 0;
  return this.totalPrice / this.quantity;
});

// Virtual for days until delivery
proposalSchema.virtual('daysUntilDelivery').get(function() {
  if (!this.deliveryDate) return null;
  const now = new Date();
  const diffTime = this.deliveryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for compliance rate
proposalSchema.virtual('complianceRate').get(function() {
  if (!this.complianceDocuments || this.complianceDocuments.length === 0) return 100;
  const compliantCount = this.complianceDocuments.filter(doc => doc.isCompliant).length;
  return (compliantCount / this.complianceDocuments.length) * 100;
});

// Virtual for is editable
proposalSchema.virtual('isEditable').get(function() {
  return ['draft'].includes(this.status);
});

// Virtual for can be withdrawn
proposalSchema.virtual('canBeWithdrawn').get(function() {
  return ['submitted', 'under_review'].includes(this.status);
});

// Pre-save middleware to calculate total price
proposalSchema.pre('save', function(next) {
  if (this.isModified('unitPrice') || this.isModified('quantity') || this.isNew) {
    this.totalPrice = this.unitPrice * this.quantity;
  }
  next();
});

// Pre-save middleware to set timestamps based on status
proposalSchema.pre('save', function(next) {
  const now = new Date();

  if (this.isModified('status')) {
    switch (this.status) {
      case 'submitted':
        if (!this.submittedAt) this.submittedAt = now;
        break;
      case 'under_review':
        if (!this.reviewedAt) this.reviewedAt = now;
        break;
      case 'accepted':
        if (!this.acceptedAt) this.acceptedAt = now;
        break;
      case 'rejected':
        if (!this.rejectedAt) this.rejectedAt = now;
        break;
      case 'withdrawn':
        if (!this.withdrawnAt) this.withdrawnAt = now;
        break;
    }
  }
  next();
});

// Pre-save middleware to calculate evaluation percentage score
proposalSchema.pre('save', function(next) {
  if (this.evaluation && this.evaluation.totalScore && this.evaluation.maxTotalScore) {
    this.evaluation.percentageScore = (this.evaluation.totalScore / this.evaluation.maxTotalScore) * 100;
  }
  next();
});

// Pre-save middleware to prevent duplicate proposals
proposalSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingProposal = await mongoose.model('Proposal').findOne({
      marketRequest: this.marketRequest,
      vendor: this.vendor,
    });

    if (existingProposal) {
      return next(new Error('Vendor has already submitted a proposal for this market request'));
    }
  }
  next();
});

const Proposal = mongoose.model<IProposal>('Proposal', proposalSchema);

export default Proposal;