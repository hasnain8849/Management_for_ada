const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  collectionName: {
    type: String,
    required: [true, 'Collection name is required'],
    enum: ['Sajna Lawn', 'Parwaz', 'Noor Jehan', 'Raabta', 'Custom'],
    index: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Sample', 'Ready To Wear (RTW)'],
    index: true
  },
  size: {
    type: String,
    required: [true, 'Size is required'],
    enum: ['S', 'M', 'L', 'XL', 'XXL'],
    index: true
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    trim: true,
    index: true
  },
  costPrice: {
    type: Number,
    required: [true, 'Cost price is required'],
    min: [0, 'Cost price cannot be negative']
  },
  salePrice: {
    type: Number,
    required: [true, 'Sale price is required'],
    min: [0, 'Sale price cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.salePrice > 0) {
    return ((this.salePrice - this.costPrice) / this.salePrice) * 100;
  }
  return 0;
});

// Index for efficient queries
productSchema.index({ collectionName: 1, category: 1 });
productSchema.index({ name: 'text', collectionName: 'text' });

// Static method to generate next product code
productSchema.statics.generateProductCode = async function() {
  const lastProduct = await this.findOne({}, {}, { sort: { 'productCode': -1 } });
  
  if (!lastProduct) {
    return 'PRD-0001';
  }
  
  const lastNumber = parseInt(lastProduct.productCode.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `PRD-${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = mongoose.model('Product', productSchema);