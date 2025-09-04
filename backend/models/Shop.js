const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shopCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    enum: ['001', '002', '003', '004'] // 001=Warehouse, 002=Lahore, 003=Karachi, 004=Online
  },
  name: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    maxlength: [100, 'Shop name cannot exceed 100 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['warehouse', 'physical', 'online'],
    default: 'physical'
  },
  location: {
    city: {
      type: String,
      required: function() { return this.type !== 'online'; },
      trim: true
    },
    address: {
      type: String,
      required: function() { return this.type !== 'online'; },
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  manager: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  operatingHours: {
    openTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    closeTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    workingDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  establishedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
shopSchema.index({ type: 1, isActive: 1 });
shopSchema.index({ 'location.city': 1 });

module.exports = mongoose.model('Shop', shopSchema);