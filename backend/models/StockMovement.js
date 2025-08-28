const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  itemCode: {
    type: String,
    required: true,
    ref: 'Inventory'
  },
  movementType: {
    type: String,
    required: true,
    enum: ['received', 'transferred', 'sold', 'returned', 'adjusted']
  },
  fromLocationCode: {
    type: String,
    enum: ['001', '002', '003', '004', '005', 'vendor']
  },
  toLocationCode: {
    type: String,
    enum: ['001', '002', '003', '004', '005', 'customer']
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  movementDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  processedBy: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  referenceNumber: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
stockMovementSchema.index({ itemCode: 1, movementDate: -1 });
stockMovementSchema.index({ movementType: 1, status: 1 });
stockMovementSchema.index({ fromLocationCode: 1, toLocationCode: 1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);