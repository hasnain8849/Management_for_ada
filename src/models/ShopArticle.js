const mongoose = require('mongoose');

const shopArticleSchema = new mongoose.Schema({
  articleCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  articleName: {
    type: String,
    required: true,
    trim: true
  },
  collectionName: {
    type: String,
    required: true,
    enum: ['Sajna Lawn', 'Parwaz', 'Noor Jehan', 'Raabta', 'Custom'],
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Sample', 'Ready To Wear (RTW)'],
    index: true
  },
  size: {
    type: String,
    required: true,
    enum: ['S', 'M', 'L', 'XL', 'XXL'],
    index: true
  },
  color: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0
  },
  quantityAvailable: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  quantitySold: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  dateAdded: {
    type: Date,
    required: true,
    default: Date.now
  },
  shopCode: {
    type: String,
    required: true,
    enum: ['002', '003', '004'], // Shop 1, Shop 2, Online
    index: true
  },
  addedBy: {
    type: String,
    required: true,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional fields for better tracking
  costPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  images: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total quantity (available + sold)
shopArticleSchema.virtual('totalQuantity').get(function() {
  return this.quantityAvailable + this.quantitySold;
});

// Virtual for total revenue
shopArticleSchema.virtual('totalRevenue').get(function() {
  return this.quantitySold * this.salePrice;
});

// Virtual for profit margin
shopArticleSchema.virtual('profitMargin').get(function() {
  if (this.costPrice > 0) {
    return ((this.salePrice - this.costPrice) / this.salePrice) * 100;
  }
  return 0;
});

// Index for efficient queries
shopArticleSchema.index({ shopCode: 1, collectionName: 1 });
shopArticleSchema.index({ shopCode: 1, category: 1 });
shopArticleSchema.index({ articleName: 'text', collectionName: 'text' });

// Pre-save middleware to update lastUpdated
shopArticleSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to generate next article code
shopArticleSchema.statics.generateArticleCode = async function() {
  const lastArticle = await this.findOne({}, {}, { sort: { 'articleCode': -1 } });
  
  if (!lastArticle) {
    return 'ART-0001';
  }
  
  const lastNumber = parseInt(lastArticle.articleCode.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `ART-${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = mongoose.model('ShopArticle', shopArticleSchema);