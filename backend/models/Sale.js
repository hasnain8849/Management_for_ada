const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  saleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  productCode: {
    type: String,
    required: true,
    ref: 'Product'
  },
  shopCode: {
    type: String,
    required: true,
    ref: 'Shop',
    enum: ['002', '003', '004'] // Only shops can have sales, not warehouse
  },
  quantitySold: {
    type: Number,
    required: [true, 'Quantity sold is required'],
    min: [1, 'Quantity sold must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: [0, 'Final amount cannot be negative']
  },
  saleDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  soldBy: {
    type: String,
    required: [true, 'Sold by is required'],
    trim: true
  },
  customer: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank-transfer', 'online'],
    default: 'cash'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'returned'],
    default: 'completed'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit
saleSchema.virtual('profit').get(function() {
  // This would need to be calculated with cost price from product
  return 0; // Placeholder
});

// Index for efficient queries
saleSchema.index({ shopCode: 1, saleDate: -1 });
saleSchema.index({ soldBy: 1, saleDate: -1 });
saleSchema.index({ status: 1 });

// Pre-save middleware to calculate totals
saleSchema.pre('save', function(next) {
  this.totalAmount = this.quantitySold * this.unitPrice;
  this.finalAmount = this.totalAmount - this.discount;
  next();
});

// Static method to generate next sale ID
saleSchema.statics.generateSaleId = async function() {
  const lastSale = await this.findOne({}, {}, { sort: { 'saleId': -1 } });
  
  if (!lastSale) {
    return 'SALE-0001';
  }
  
  const lastNumber = parseInt(lastSale.saleId.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `SALE-${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = mongoose.model('Sale', saleSchema);