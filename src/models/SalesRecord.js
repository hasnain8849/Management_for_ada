const mongoose = require('mongoose');

const salesRecordSchema = new mongoose.Schema({
  saleID: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  articleCode: {
    type: String,
    required: true,
    ref: 'ShopArticle'
  },
  articleName: {
    type: String,
    required: true,
    trim: true
  },
  collectionName: {
    type: String,
    required: true,
    enum: ['Sajna Lawn', 'Parwaz', 'Noor Jehan', 'Raabta', 'Custom']
  },
  category: {
    type: String,
    required: true,
    enum: ['Sample', 'Ready To Wear (RTW)']
  },
  size: {
    type: String,
    required: true,
    enum: ['S', 'M', 'L', 'XL', 'XXL']
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantitySold: {
    type: Number,
    required: true,
    min: 1
  },
  dateOfSale: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  soldBy: {
    type: String,
    required: true,
    trim: true
  },
  shopCode: {
    type: String,
    required: true,
    enum: ['002', '003', '004'], // Shop 1, Shop 2, Online
    index: true
  },
  // Additional sales fields
  customerName: {
    type: String,
    trim: true,
    default: ''
  },
  customerPhone: {
    type: String,
    trim: true,
    default: ''
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Online', 'Bank Transfer'],
    default: 'Cash'
  },
  discount: {
    type: Number,
    min: 0,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    default: ''
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

// Virtual for total sale value
salesRecordSchema.virtual('totalSaleValue').get(function() {
  return this.quantitySold * this.salePrice;
});

// Index for efficient queries
salesRecordSchema.index({ shopCode: 1, dateOfSale: -1 });
salesRecordSchema.index({ collectionName: 1, dateOfSale: -1 });
salesRecordSchema.index({ soldBy: 1, dateOfSale: -1 });

// Static method to generate next sale ID
salesRecordSchema.statics.generateSaleID = async function() {
  const lastSale = await this.findOne({}, {}, { sort: { 'saleID': -1 } });
  
  if (!lastSale) {
    return 'SALE-0001';
  }
  
  const lastNumber = parseInt(lastSale.saleID.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `SALE-${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = mongoose.model('SalesRecord', salesRecordSchema);