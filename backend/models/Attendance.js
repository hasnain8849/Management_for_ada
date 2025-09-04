const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    ref: 'Employee'
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'present'
  },
  clockIn: {
    type: String, // Format: "HH:MM"
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid clock in time format']
  },
  clockOut: {
    type: String, // Format: "HH:MM"
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid clock out time format']
  },
  hoursWorked: {
    type: Number,
    min: 0,
    max: 24,
    default: 0
  },
  overtime: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  markedBy: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance for same employee on same date
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Index for efficient queries
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });

// Pre-save middleware to calculate hours worked
attendanceSchema.pre('save', function(next) {
  if (this.clockIn && this.clockOut && this.status === 'present') {
    const clockInTime = new Date(`2000-01-01T${this.clockIn}:00`);
    const clockOutTime = new Date(`2000-01-01T${this.clockOut}:00`);
    
    let hoursWorked = (clockOutTime - clockInTime) / (1000 * 60 * 60);
    
    // Handle overnight shifts
    if (hoursWorked < 0) {
      hoursWorked += 24;
    }
    
    this.hoursWorked = Math.round(hoursWorked * 100) / 100; // Round to 2 decimal places
    
    // Calculate overtime (assuming 8 hours is standard)
    if (hoursWorked > 8) {
      this.overtime = hoursWorked - 8;
    }
  } else if (this.status === 'half-day') {
    this.hoursWorked = 4;
  } else if (this.status === 'absent') {
    this.hoursWorked = 0;
    this.overtime = 0;
  }
  
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);