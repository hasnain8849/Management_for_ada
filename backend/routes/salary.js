const express = require('express');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/salary/calculate/:employeeId - Calculate salary for employee
router.get('/calculate/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, month } = req.query;

    // Find employee
    const employee = await Employee.findOne({ employeeId, isActive: true });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    let dateFilter = {};
    
    if (month) {
      // Calculate for specific month (YYYY-MM format)
      const year = month.split('-')[0];
      const monthNum = month.split('-')[1];
      dateFilter = {
        date: {
          $gte: new Date(`${year}-${monthNum}-01`),
          $lte: new Date(`${year}-${monthNum}-31`)
        }
      };
    } else if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter = {
        date: { $gte: firstDay, $lte: lastDay }
      };
    }

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      employeeId,
      ...dateFilter
    }).sort({ date: 1 });

    // Calculate salary
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
    const halfDays = attendanceRecords.filter(r => r.status === 'half-day').length;
    const totalHours = attendanceRecords.reduce((sum, r) => sum + r.hoursWorked, 0);
    const overtimeHours = attendanceRecords.reduce((sum, r) => sum + r.overtime, 0);

    // Calculate wages
    const regularWagePKR = (presentDays + (halfDays * 0.5)) * employee.wagePKR;
    const overtimeWagePKR = overtimeHours * (employee.wagePKR * 1.5); // 1.5x for overtime
    const grossSalaryPKR = regularWagePKR + overtimeWagePKR;

    // Calculate deductions (example: 2% tax, 1% insurance)
    const taxDeduction = grossSalaryPKR * 0.02;
    const insuranceDeduction = grossSalaryPKR * 0.01;
    const totalDeductions = taxDeduction + insuranceDeduction;
    
    const netSalaryPKR = grossSalaryPKR - totalDeductions;

    const salaryCalculation = {
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        wageUSD: employee.wageUSD,
        wagePKR: employee.wagePKR
      },
      period: {
        startDate: dateFilter.date.$gte,
        endDate: dateFilter.date.$lte,
        month: month || `${dateFilter.date.$gte.getFullYear()}-${(dateFilter.date.$gte.getMonth() + 1).toString().padStart(2, '0')}`
      },
      attendance: {
        totalDays,
        presentDays,
        halfDays,
        absentDays: totalDays - presentDays - halfDays,
        totalHours,
        overtimeHours
      },
      salary: {
        regularWagePKR,
        overtimeWagePKR,
        grossSalaryPKR,
        deductions: {
          tax: taxDeduction,
          insurance: insuranceDeduction,
          total: totalDeductions
        },
        netSalaryPKR
      },
      attendanceRecords
    };

    res.json({
      success: true,
      data: salaryCalculation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating salary',
      error: error.message
    });
  }
});

// GET /api/salary/monthly/:month - Get monthly salary report for all employees
router.get('/monthly/:month', async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM
    
    const year = month.split('-')[0];
    const monthNum = month.split('-')[1];
    
    const startDate = new Date(`${year}-${monthNum}-01`);
    const endDate = new Date(`${year}-${monthNum}-31`);

    // Get all active employees
    const employees = await Employee.find({ isActive: true });
    
    // Calculate salary for each employee
    const salaryReports = await Promise.all(
      employees.map(async (employee) => {
        const attendanceRecords = await Attendance.find({
          employeeId: employee.employeeId,
          date: { $gte: startDate, $lte: endDate }
        });

        const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
        const halfDays = attendanceRecords.filter(r => r.status === 'half-day').length;
        const totalHours = attendanceRecords.reduce((sum, r) => sum + r.hoursWorked, 0);
        const overtimeHours = attendanceRecords.reduce((sum, r) => sum + r.overtime, 0);

        const regularWagePKR = (presentDays + (halfDays * 0.5)) * employee.wagePKR;
        const overtimeWagePKR = overtimeHours * (employee.wagePKR * 1.5);
        const grossSalaryPKR = regularWagePKR + overtimeWagePKR;
        const totalDeductions = grossSalaryPKR * 0.03; // 3% total deductions
        const netSalaryPKR = grossSalaryPKR - totalDeductions;

        return {
          employee: {
            id: employee._id,
            employeeId: employee.employeeId,
            name: employee.name,
            department: employee.department,
            role: employee.role,
            wageUSD: employee.wageUSD,
            wagePKR: employee.wagePKR
          },
          attendance: {
            totalDays: attendanceRecords.length,
            presentDays,
            halfDays,
            absentDays: attendanceRecords.length - presentDays - halfDays,
            totalHours,
            overtimeHours
          },
          salary: {
            regularWagePKR,
            overtimeWagePKR,
            grossSalaryPKR,
            totalDeductions,
            netSalaryPKR
          }
        };
      })
    );

    // Calculate totals
    const totals = {
      totalEmployees: employees.length,
      totalGrossSalary: salaryReports.reduce((sum, r) => sum + r.salary.grossSalaryPKR, 0),
      totalDeductions: salaryReports.reduce((sum, r) => sum + r.salary.totalDeductions, 0),
      totalNetSalary: salaryReports.reduce((sum, r) => sum + r.salary.netSalaryPKR, 0),
      totalHours: salaryReports.reduce((sum, r) => sum + r.attendance.totalHours, 0),
      totalOvertimeHours: salaryReports.reduce((sum, r) => sum + r.attendance.overtimeHours, 0)
    };

    res.json({
      success: true,
      data: {
        month,
        salaryReports,
        totals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating monthly salary report',
      error: error.message
    });
  }
});

// GET /api/salary/summary - Get salary summary
router.get('/summary', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    // Get monthly summaries for the year
    const monthlySummaries = [];
    
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      const startDate = new Date(`${year}-${month.toString().padStart(2, '0')}-01`);
      const endDate = new Date(year, month, 0); // Last day of month

      const employees = await Employee.find({ isActive: true });
      
      let monthlyTotal = 0;
      
      for (const employee of employees) {
        const attendanceRecords = await Attendance.find({
          employeeId: employee.employeeId,
          date: { $gte: startDate, $lte: endDate }
        });

        const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
        const halfDays = attendanceRecords.filter(r => r.status === 'half-day').length;
        const overtimeHours = attendanceRecords.reduce((sum, r) => sum + r.overtime, 0);

        const regularWage = (presentDays + (halfDays * 0.5)) * employee.wagePKR;
        const overtimeWage = overtimeHours * (employee.wagePKR * 1.5);
        const grossSalary = regularWage + overtimeWage;
        const netSalary = grossSalary * 0.97; // 3% deductions

        monthlyTotal += netSalary;
      }

      monthlySummaries.push({
        month: monthStr,
        monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
        totalSalary: monthlyTotal,
        employeeCount: employees.length
      });
    }

    const yearlyTotal = monthlySummaries.reduce((sum, m) => sum + m.totalSalary, 0);

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        monthlySummaries,
        yearlyTotal,
        averageMonthly: yearlyTotal / 12
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating salary summary',
      error: error.message
    });
  }
});

module.exports = router;