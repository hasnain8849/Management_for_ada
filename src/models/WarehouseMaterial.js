const mongoose = require('mongoose');

const warehouseMaterialSchema = new mongoose.Schema({
  materialCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  materialName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Hand Work', 'Accessories', 'Fabric'],
    index: true
  },
  quantityAvailable: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  addedDate: {
    type: Date,
    required: true,
    default: Date.now
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total value
warehouseMaterialSchema.virtual('totalValue').get(function() {
  return this.quantityAvailable * this.pricePerUnit;
});

// Index for efficient queries
warehouseMaterialSchema.index({ category: 1, isActive: 1 });
warehouseMaterialSchema.index({ materialName: 'text' });

// Pre-save middleware to update lastUpdated
warehouseMaterialSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to generate next material code
warehouseMaterialSchema.statics.generateMaterialCode = async function() {
  const lastMaterial = await this.findOne({}, {}, { sort: { 'materialCode': -1 } });
  
  if (!lastMaterial) {
    return 'MAT-0001';
  }
  
  const lastNumber = parseInt(lastMaterial.materialCode.split('-')[1]);
  const nextNumber = lastNumber + 1;
  return `MAT-${nextNumber.toString().padStart(4, '0')}`;
};

module.exports = mongoose.model('WarehouseMaterial', warehouseMaterialSchema);