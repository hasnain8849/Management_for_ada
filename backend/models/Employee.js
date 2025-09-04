const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[0-9\-\(\)\s]{10,}$/, 'Please enter a valid phone number']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
    maxlength: [50, 'Role cannot exceed 50 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    maxlength: [50, 'Department cannot exceed 50 characters']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    maxlength: [50, 'Position cannot exceed 50 characters']
  },
  wageUSD: {
    type: Number,
    required: [true, 'Wage in USD is required'],
    min: [0, 'Wage cannot be negative']
  },
  wagePKR: {
    type: Number,
    default: function() {
      return this.wageUSD * (process.env.USD_TO_PKR_RATE || 280);
    }
  },
  joinDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  address: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    branchCode: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for monthly salary in PKR
employeeSchema.virtual('monthlySalaryPKR').get(function() {
  return this.wagePKR * 30; // Assuming daily wage
});

// Index for efficient queries
employeeSchema.index({ name: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });

// Pre-save middleware to update PKR wage
employeeSchema.pre('save', function(next) {
  if (this.isModified('wageUSD')) {
    this.wagePKR = this.wageUSD * (process.env.USD_TO_PKR_RATE || 280);
  }
  next();
});

// Static method to generate next employee ID
employeeSchema.statics.generateEmployeeId = async function() {
  const lastEmployee = await this.findOne({}, {}, { sort: { 'employeeId': -1 } });
  
  if (!lastEmployee) {
    return 'EMP-0001';
  }
  
  const lastNumber = parseInt(lastEmployee.employeeId.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `EMP-${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = mongoose.model('Employee', employeeSchema);