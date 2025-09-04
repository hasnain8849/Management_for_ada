const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemCode: {
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
    enum: ['001', '002', '003', '004']
  },
  quantityAvailable: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  quantitySold: {
    type: Number,
    required: true,
    min: [0, 'Quantity sold cannot be negative'],
    default: 0
  },
  reorderLevel: {
    type: Number,
    min: [0, 'Reorder level cannot be negative'],
    default: 10
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  restockedBy: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total quantity
inventorySchema.virtual('totalQuantity').get(function() {
  return this.quantityAvailable + this.quantitySold;
});

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.quantityAvailable === 0) return 'out-of-stock';
  if (this.quantityAvailable <= this.reorderLevel) return 'low-stock';
  return 'in-stock';
});

// Compound index for unique product per shop
inventorySchema.index({ productCode: 1, shopCode: 1 }, { unique: true });

// Index for efficient queries
inventorySchema.index({ shopCode: 1, quantityAvailable: 1 });
inventorySchema.index({ stockStatus: 1 });

// Static method to generate next item code
inventorySchema.statics.generateItemCode = async function() {
  const lastItem = await this.findOne({}, {}, { sort: { 'itemCode': -1 } });
  
  if (!lastItem) {
    return 'ITM-0001';
  }
  
  const lastNumber = parseInt(lastItem.itemCode.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `ITM-${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = mongoose.model('Inventory', inventorySchema);