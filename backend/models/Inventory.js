const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  collectionName: {
    type: String,
    required: true,
    enum: ['Sajna Lawn', 'Parwaz', 'Noor Jehan', 'Raabta', 'Custom'],
    index: true
  },
  designName: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  size: {
    type: String,
    required: true,
    enum: ['S', 'M', 'L', 'XL', 'XXL'],
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  inHouseStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  outSourceStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  receivedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  receivedBy: {
    type: String,
    required: true,
    trim: true
  },
  locationCode: {
    type: String,
    required: true,
    enum: ['001', '002', '003', '004', '005'],
    index: true
  },
  supplierName: {
    type: String,
    trim: true,
    default: ''
  },
  vendorName: {
    type: String,
    required: true,
    trim: true
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  costPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  sellingPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total stock
inventorySchema.virtual('totalStock').get(function() {
  return this.inHouseStock + this.outSourceStock;
});

// Index for efficient queries
inventorySchema.index({ collectionName: 1, color: 1, size: 1 });
inventorySchema.index({ locationCode: 1, isActive: 1 });
inventorySchema.index({ vendorName: 1, receivedDate: -1 });

// Pre-save middleware to update lastUpdated
inventorySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to generate next item code
inventorySchema.statics.generateItemCode = async function() {
  const lastItem = await this.findOne({}, {}, { sort: { itemCode: -1 } });
  
  if (!lastItem) {
    return 'ITM-0001';
  }
  
  const lastNumber = parseInt(lastItem.itemCode.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `ITM-${nextNumber.toString().padStart(4, '0')}`;
};

// Instance method to update stock
inventorySchema.methods.updateStock = function(inHouseChange = 0, outSourceChange = 0) {
  this.inHouseStock = Math.max(0, this.inHouseStock + inHouseChange);
  this.outSourceStock = Math.max(0, this.outSourceStock + outSourceChange);
  this.quantity = this.inHouseStock + this.outSourceStock;
  return this.save();
};

module.exports = mongoose.model('Inventory', inventorySchema);