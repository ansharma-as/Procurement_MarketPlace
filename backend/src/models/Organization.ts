import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  industry: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  adminId: mongoose.Types.ObjectId;
  registrationNumber?: string;
  taxId?: string;
  logo?: string;
  isActive: boolean;
  isVerified: boolean;
  settings: {
    autoApprovalLimit?: number;
    requireDualApproval: boolean;
    allowedFileTypes: string[];
    maxFileSize: number;
    notificationPreferences: {
      email: boolean;
      sms: boolean;
      inApp: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [200, 'Organization name cannot exceed 200 characters'],
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    enum: [
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
    ],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true,
    },
  },
  contact: {
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid website URL'],
    },
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin user is required'],
  },
  registrationNumber: {
    type: String,
    trim: true,
    sparse: true,
  },
  taxId: {
    type: String,
    trim: true,
    sparse: true,
  },
  logo: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  settings: {
    autoApprovalLimit: {
      type: Number,
      min: 0,
      default: 1000,
    },
    requireDualApproval: {
      type: Boolean,
      default: false,
    },
    allowedFileTypes: {
      type: [String],
      default: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    },
    maxFileSize: {
      type: Number,
      default: 10485760, // 10MB
      min: 1048576, // 1MB minimum
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
    },
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
organizationSchema.index({ name: 1 });
organizationSchema.index({ industry: 1 });
organizationSchema.index({ 'contact.email': 1 });
organizationSchema.index({ adminId: 1 });
organizationSchema.index({ isActive: 1, isVerified: 1 });

// Virtual for total users
organizationSchema.virtual('totalUsers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organization',
  count: true,
});

// Virtual for total managers
organizationSchema.virtual('totalManagers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'organization',
  count: true,
  match: { role: 'manager' },
});

// Pre-save middleware to ensure unique organization name
organizationSchema.pre('save', async function(next) {
  if (this.isModified('name')) {
    const existingOrg = await mongoose.model('Organization').findOne({
      name: { $regex: new RegExp(`^${this.name}$`, 'i') },
      _id: { $ne: this._id },
    });

    if (existingOrg) {
      return next(new Error('Organization name already exists'));
    }
  }
  next();
});

const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);

export default Organization;