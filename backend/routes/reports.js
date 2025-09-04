const express = require('express');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/reports/dashboard - Get dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalEmployees,
      activeEmployees,
      todayAttendance,
      todaySales,
      monthlySales,
      totalProducts,
      lowStockItems,
      totalInventoryValue
    ] = await Promise.all([
      Employee.countDocuments({}),
      Employee.countDocuments({ isActive: true }),
      Attendance.countDocuments({ 
        date: { $gte: startOfToday, $lte: endOfToday },
        status: 'present'
      }),
      Sale.aggregate([
        {
          $match: {
            saleDate: { $gte: startOfToday, $lte: endOfToday },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$finalAmount' },
            totalQuantity: { $sum: '$quantitySold' }
          }
        }
      ]),
      Sale.aggregate([
        {
          $match: {
            saleDate: { $gte: startOfMonth, $lte: endOfMonth },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$finalAmount' },
            totalQuantity: { $sum: '$quantitySold' }
          }
        }
      ]),
      Product.countDocuments({ isActive: true }),
      Inventory.countDocuments({ 
        $expr: { $lte: ['$quantityAvailable', '$reorderLevel'] }
      }),
      Inventory.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: 'productCode',
            foreignField: 'productCode',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $group: {
            _id: null,
            totalValue: { 
              $sum: { $multiply: ['$quantityAvailable', '$product.costPrice'] }
            }
          }
        }
      ])
    ]);

    const dashboardData = {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        presentToday: todayAttendance
      },
      sales: {
        today: todaySales[0] || { totalSales: 0, totalRevenue: 0, totalQuantity: 0 },
        monthly: monthlySales[0] || { totalSales: 0, totalRevenue: 0, totalQuantity: 0 }
      },
      inventory: {
        totalProducts,
        lowStockItems,
        totalValue: totalInventoryValue[0]?.totalValue || 0
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating dashboard report',
      error: error.message
    });
  }
});

// GET /api/reports/sales/shop-wise - Shop-wise sales report
router.get('/sales/shop-wise', async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.saleDate = {};
      if (startDate) dateFilter.saleDate.$gte = new Date(startDate);
      if (endDate) dateFilter.saleDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter.saleDate = { $gte: firstDay, $lte: lastDay };
    }

    const shopWiseSales = await Sale.aggregate([
      {
        $match: { ...dateFilter, status: 'completed' }
      },
      {
        $lookup: {
          from: 'shops',
          localField: 'shopCode',
          foreignField: 'shopCode',
          as: 'shop'
        }
      },
      {
        $unwind: '$shop'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productCode',
          foreignField: 'productCode',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: {
            shopCode: '$shopCode',
            shopName: '$shop.name',
            shopType: '$shop.type'
          },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          totalQuantitySold: { $sum: '$quantitySold' },
          totalDiscount: { $sum: '$discount' },
          totalProfit: { 
            $sum: { 
              $subtract: [
                { $multiply: ['$quantitySold', { $subtract: ['$unitPrice', '$product.costPrice'] }] },
                '$discount'
              ]
            }
          },
          averageSaleValue: { $avg: '$finalAmount' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    // Calculate totals
    const totals = shopWiseSales.reduce((acc, shop) => ({
      totalSales: acc.totalSales + shop.totalSales,
      totalRevenue: acc.totalRevenue + shop.totalRevenue,
      totalQuantitySold: acc.totalQuantitySold + shop.totalQuantitySold,
      totalProfit: acc.totalProfit + shop.totalProfit
    }), { totalSales: 0, totalRevenue: 0, totalQuantitySold: 0, totalProfit: 0 });

    res.json({
      success: true,
      data: {
        period: {
          startDate: dateFilter.saleDate.$gte,
          endDate: dateFilter.saleDate.$lte
        },
        shopWiseSales,
        totals
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating shop-wise sales report',
      error: error.message
    });
  }
});

// GET /api/reports/sales/collection-wise - Collection-wise sales report
router.get('/sales/collection-wise', async (req, res) => {
  try {
    const { startDate, endDate, shopCode } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.saleDate = {};
      if (startDate) dateFilter.saleDate.$gte = new Date(startDate);
      if (endDate) dateFilter.saleDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    let shopFilter = {};
    if (shopCode && shopCode !== 'all') {
      shopFilter.shopCode = shopCode;
    }

    const collectionWiseSales = await Sale.aggregate([
      {
        $match: { ...dateFilter, ...shopFilter, status: 'completed' }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productCode',
          foreignField: 'productCode',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $group: {
          _id: {
            collectionName: '$product.collectionName'
          },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          totalQuantitySold: { $sum: '$quantitySold' },
          totalProfit: { 
            $sum: { 
              $subtract: [
                { $multiply: ['$quantitySold', { $subtract: ['$unitPrice', '$product.costPrice'] }] },
                '$discount'
              ]
            }
          },
          averageSaleValue: { $avg: '$finalAmount' },
          shopBreakdown: {
            $push: {
              shopCode: '$shopCode',
              sales: 1,
              revenue: '$finalAmount',
              quantity: '$quantitySold'
            }
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    // Process shop breakdown for each collection
    const processedCollections = collectionWiseSales.map(collection => {
      const shopBreakdown = {};
      
      collection.shopBreakdown.forEach(item => {
        if (!shopBreakdown[item.shopCode]) {
          shopBreakdown[item.shopCode] = {
            shopCode: item.shopCode,
            totalSales: 0,
            totalRevenue: 0,
            totalQuantity: 0
          };
        }
        
        shopBreakdown[item.shopCode].totalSales += 1;
        shopBreakdown[item.shopCode].totalRevenue += item.revenue;
        shopBreakdown[item.shopCode].totalQuantity += item.quantity;
      });

      return {
        ...collection,
        shopBreakdown: Object.values(shopBreakdown)
      };
    });

    res.json({
      success: true,
      data: {
        period: {
          startDate: dateFilter.saleDate?.$gte,
          endDate: dateFilter.saleDate?.$lte
        },
        collectionWiseSales: processedCollections
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating collection-wise sales report',
      error: error.message
    });
  }
});

// GET /api/reports/inventory/shop-wise - Shop-wise inventory report
router.get('/inventory/shop-wise', async (req, res) => {
  try {
    const { collectionName, stockStatus } = req.query;

    let matchFilter = {};
    if (stockStatus) {
      if (stockStatus === 'low-stock') {
        matchFilter.$expr = { $lte: ['$quantityAvailable', '$reorderLevel'] };
      } else if (stockStatus === 'out-of-stock') {
        matchFilter.quantityAvailable = 0;
      }
    }

    const shopWiseInventory = await Inventory.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'products',
          localField: 'productCode',
          foreignField: 'productCode',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $lookup: {
          from: 'shops',
          localField: 'shopCode',
          foreignField: 'shopCode',
          as: 'shop'
        }
      },
      {
        $unwind: '$shop'
      },
      {
        $match: collectionName && collectionName !== 'all' ? 
          { 'product.collectionName': collectionName } : {}
      },
      {
        $group: {
          _id: {
            shopCode: '$shopCode',
            shopName: '$shop.name',
            shopType: '$shop.type'
          },
          totalItems: { $sum: 1 },
          totalQuantityAvailable: { $sum: '$quantityAvailable' },
          totalQuantitySold: { $sum: '$quantitySold' },
          totalStockValue: { 
            $sum: { $multiply: ['$quantityAvailable', '$product.costPrice'] }
          },
          totalSellingValue: { 
            $sum: { $multiply: ['$quantityAvailable', '$product.salePrice'] }
          },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ['$quantityAvailable', '$reorderLevel'] }, 1, 0]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [{ $eq: ['$quantityAvailable', 0] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { totalStockValue: -1 }
      }
    ]);

    res.json({
      success: true,
      data: shopWiseInventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating shop-wise inventory report',
      error: error.message
    });
  }
});

// GET /api/reports/attendance/monthly/:month - Monthly attendance report
router.get('/attendance/monthly/:month', async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM
    const { department } = req.query;
    
    const year = month.split('-')[0];
    const monthNum = month.split('-')[1];
    
    const startDate = new Date(`${year}-${monthNum}-01`);
    const endDate = new Date(`${year}-${monthNum}-31`);

    let employeeFilter = { isActive: true };
    if (department) employeeFilter.department = department;

    const employees = await Employee.find(employeeFilter);
    
    const attendanceReport = await Promise.all(
      employees.map(async (employee) => {
        const attendanceRecords = await Attendance.find({
          employeeId: employee.employeeId,
          date: { $gte: startDate, $lte: endDate }
        });

        const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
        const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
        const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
        const halfDays = attendanceRecords.filter(r => r.status === 'half-day').length;
        const totalHours = attendanceRecords.reduce((sum, r) => sum + r.hoursWorked, 0);

        const workingDays = attendanceRecords.length;
        const attendanceRate = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;

        return {
          employee: {
            id: employee._id,
            employeeId: employee.employeeId,
            name: employee.name,
            department: employee.department,
            role: employee.role
          },
          attendance: {
            workingDays,
            presentDays,
            absentDays,
            lateDays,
            halfDays,
            totalHours,
            attendanceRate
          }
        };
      })
    );

    // Calculate department-wise summary
    const departmentSummary = {};
    attendanceReport.forEach(emp => {
      const dept = emp.employee.department;
      if (!departmentSummary[dept]) {
        departmentSummary[dept] = {
          totalEmployees: 0,
          totalPresentDays: 0,
          totalAbsentDays: 0,
          totalHours: 0,
          averageAttendanceRate: 0
        };
      }
      
      departmentSummary[dept].totalEmployees += 1;
      departmentSummary[dept].totalPresentDays += emp.attendance.presentDays;
      departmentSummary[dept].totalAbsentDays += emp.attendance.absentDays;
      departmentSummary[dept].totalHours += emp.attendance.totalHours;
    });

    // Calculate average attendance rates
    Object.keys(departmentSummary).forEach(dept => {
      const deptData = departmentSummary[dept];
      const totalDays = deptData.totalPresentDays + deptData.totalAbsentDays;
      deptData.averageAttendanceRate = totalDays > 0 ? 
        (deptData.totalPresentDays / totalDays) * 100 : 0;
    });

    res.json({
      success: true,
      data: {
        month,
        attendanceReport,
        departmentSummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating monthly attendance report',
      error: error.message
    });
  }
});

module.exports = router;