import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IVendor extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  specialization: string[];
  location: string;
  portfolio?: string;
  description?: string;
  certifications: Array<{
    name: string;
    issuedBy: string;
    issuedDate: Date;
    expiryDate?: Date;
    documentUrl?: string;
  }>;
  rating: number;
  totalRatings: number;
  completedOrders: number;
  totalOrderValue: number;
  responseTime: number; // Average response time in hours
  isVerified: boolean;
  isActive: boolean;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  preferences: {
    minimumOrderValue?: number;
    maxDeliveryDistance?: number; // in km
    availableHours: {
      start: string;
      end: string;
    };
    workingDays: string[];
  };
  statistics: {
    totalProposals: number;
    acceptedProposals: number;
    rejectedProposals: number;
    averageOrderValue: number;
    onTimeDeliveryRate: number;
  };
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  emailVerificationToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementLoginAttempts(): Promise<this>;
  isLocked: boolean;
}

const vendorSchema = new Schema<IVendor>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
  },
  avatar: {
    type: String,
    default: null,
  },
  specialization: {
    type: [String],
    required: [true, 'At least one specialization is required'],
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
      'Consulting',
      'Other',
    ],
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  portfolio: {
    type: String,
    trim: true,
    maxlength: [2000, 'Portfolio description cannot exceed 2000 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  certifications: [{
    name: {
      type: String,
      required: [true, 'Certification name is required'],
      trim: true,
    },
    issuedBy: {
      type: String,
      required: [true, 'Issuing authority is required'],
      trim: true,
    },
    issuedDate: {
      type: Date,
      required: [true, 'Issue date is required'],
    },
    expiryDate: {
      type: Date,
    },
    documentUrl: {
      type: String,
      trim: true,
    },
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0,
  },
  completedOrders: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalOrderValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  responseTime: {
    type: Number,
    default: 24, // Default 24 hours
    min: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  bankDetails: {
    bankName: {
      type: String,
      trim: true,
    },
    accountName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    routingNumber: {
      type: String,
      trim: true,
    },
    swiftCode: {
      type: String,
      trim: true,
    },
  },
  preferences: {
    minimumOrderValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxDeliveryDistance: {
      type: Number,
      min: 0,
      default: 100, // 100km default
    },
    availableHours: {
      start: {
        type: String,
        default: '09:00',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
      },
      end: {
        type: String,
        default: '17:00',
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'],
      },
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
  },
  statistics: {
    totalProposals: {
      type: Number,
      default: 0,
      min: 0,
    },
    acceptedProposals: {
      type: Number,
      default: 0,
      min: 0,
    },
    rejectedProposals: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    onTimeDeliveryRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
  },
  lastLogin: {
    type: Date,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for full name
vendorSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
vendorSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Virtual for success rate
vendorSchema.virtual('successRate').get(function() {
  if (this.statistics.totalProposals === 0) return 0;
  return (this.statistics.acceptedProposals / this.statistics.totalProposals) * 100;
});

// Indexes
vendorSchema.index({ specialization: 1 });
vendorSchema.index({ location: 1 });
vendorSchema.index({ rating: -1 });
vendorSchema.index({ isActive: 1, isVerified: 1 });
vendorSchema.index({ 'preferences.minimumOrderValue': 1 });

// Constants for account locking
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Pre-save middleware to hash password
vendorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare passwords
vendorSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Instance method to increment login attempts
vendorSchema.methods.incrementLoginAttempts = function(): Promise<IVendor> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $set: {
        loginAttempts: 1,
      },
      $unset: {
        lockUntil: 1,
      },
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // Lock the account if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.updateOne(updates);
};

// Static method to find vendor by email for authentication
vendorSchema.statics.findByCredentials = async function(email: string, password: string) {
  const vendor = await this.findOne({ email, isActive: true }).select('+password');

  if (!vendor) {
    throw new Error('Invalid credentials');
  }

  // Check if account is locked
  if (vendor.isLocked) {
    await vendor.incrementLoginAttempts();
    throw new Error('Account temporarily locked due to too many failed login attempts');
  }

  const isMatch = await vendor.comparePassword(password);

  if (!isMatch) {
    await vendor.incrementLoginAttempts();
    throw new Error('Invalid credentials');
  }

  // Reset login attempts on successful login
  if (vendor.loginAttempts > 0) {
    await vendor.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 },
      $set: { lastLogin: new Date() },
    });
  }

  return vendor;
};

const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);

export default Vendor;