const express = require('express');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware
const validateAttendanceData = (req, res, next) => {
  const { employeeId, date, status } = req.body;
  
  const errors = [];
  
  if (!employeeId) errors.push('Employee ID is required');
  if (!date) errors.push('Date is required');
  if (!status || !['present', 'absent', 'late', 'half-day'].includes(status)) {
    errors.push('Valid status is required (present, absent, late, half-day)');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

// GET /api/attendance - Get attendance records
router.get('/', async (req, res) => {
  try {
    const {
      date,
      employeeId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (date) {
      filter.date = new Date(date);
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [attendanceRecords, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employeeId', 'name employeeId department')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        attendanceRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
});

// GET /api/attendance/date/:date - Get attendance for specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const attendanceRecords = await Attendance.find({
      date: new Date(date)
    }).populate('employeeId', 'name employeeId department role');

    // Get all active employees
    const allEmployees = await Employee.find({ isActive: true });
    
    // Create attendance summary
    const attendanceSummary = allEmployees.map(employee => {
      const record = attendanceRecords.find(r => r.employeeId._id.toString() === employee._id.toString());
      
      return {
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          department: employee.department,
          role: employee.role
        },
        attendance: record || null,
        status: record ? record.status : 'not-marked'
      };
    });

    const summary = {
      date,
      totalEmployees: allEmployees.length,
      present: attendanceRecords.filter(r => r.status === 'present').length,
      absent: attendanceRecords.filter(r => r.status === 'absent').length,
      late: attendanceRecords.filter(r => r.status === 'late').length,
      halfDay: attendanceRecords.filter(r => r.status === 'half-day').length,
      notMarked: allEmployees.length - attendanceRecords.length
    };

    res.json({
      success: true,
      data: {
        attendanceSummary,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance for date',
      error: error.message
    });
  }
});

// POST /api/attendance - Mark attendance
router.post('/', requireAdminOrManager, validateAttendanceData, async (req, res) => {
  try {
    const {
      employeeId,
      date,
      status,
      clockIn,
      clockOut,
      notes
    } = req.body;

    // Check if employee exists
    const employee = await Employee.findOne({ employeeId, isActive: true });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date'
      });
    }

    const attendance = new Attendance({
      employeeId,
      date: new Date(date),
      status,
      clockIn,
      clockOut,
      notes,
      markedBy: req.user.name
    });

    await attendance.save();

    // Populate employee data
    await attendance.populate('employeeId', 'name employeeId department');

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// PUT /api/attendance/:id - Update attendance
router.put('/:id', requireAdminOrManager, async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { ...req.body, markedBy: req.user.name },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name employeeId department');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating attendance',
      error: error.message
    });
  }
});

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', requireAdminOrManager, async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance record',
      error: error.message
    });
  }
});

// GET /api/attendance/employee/:employeeId - Get attendance for specific employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { employeeId };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [attendanceRecords, total, employee] = await Promise.all([
      Attendance.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Attendance.countDocuments(filter),
      Employee.findOne({ employeeId })
    ]);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Calculate statistics
    const stats = {
      totalDays: attendanceRecords.length,
      presentDays: attendanceRecords.filter(r => r.status === 'present').length,
      absentDays: attendanceRecords.filter(r => r.status === 'absent').length,
      lateDays: attendanceRecords.filter(r => r.status === 'late').length,
      halfDays: attendanceRecords.filter(r => r.status === 'half-day').length,
      totalHours: attendanceRecords.reduce((sum, r) => sum + r.hoursWorked, 0),
      averageHours: attendanceRecords.length > 0 ? 
        attendanceRecords.reduce((sum, r) => sum + r.hoursWorked, 0) / attendanceRecords.length : 0
    };

    res.json({
      success: true,
      data: {
        employee,
        attendanceRecords,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee attendance',
      error: error.message
    });
  }
});

module.exports = router;