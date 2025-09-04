const express = require('express');
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware
const validateSaleData = (req, res, next) => {
  const { productCode, shopCode, quantitySold, soldBy } = req.body;
  
  const errors = [];
  
  if (!productCode) errors.push('Product code is required');
  if (!shopCode || !['002', '003', '004'].includes(shopCode)) {
    errors.push('Valid shop code is required (002-004, warehouse cannot have sales)');
  }
  if (!quantitySold || quantitySold < 1) errors.push('Valid quantity sold is required');
  if (!soldBy || soldBy.trim().length < 2) errors.push('Sold by is required');
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

// GET /api/sales - Get all sales
router.get('/', async (req, res) => {
  try {
    const {
      shopCode,
      soldBy,
      startDate,
      endDate,
      status,
      collectionName,
      page = 1,
      limit = 50,
      sortBy = 'saleDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (shopCode && shopCode !== 'all') filter.shopCode = shopCode;
    if (soldBy) filter.soldBy = new RegExp(soldBy, 'i');
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .populate('productCode', 'name collectionName category size color costPrice salePrice')
        .populate('shopCode', 'name type location.city')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Sale.countDocuments(filter)
    ]);

    // Apply collection filter if specified (after population)
    let filteredSales = sales;
    if (collectionName && collectionName !== 'all') {
      filteredSales = sales.filter(sale => 
        sale.productCode && sale.productCode.collectionName === collectionName
      );
    }

    res.json({
      success: true,
      data: {
        sales: filteredSales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredSales.length,
          pages: Math.ceil(filteredSales.length / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales',
      error: error.message
    });
  }
});

// POST /api/sales - Record new sale
router.post('/', requireAdminOrManager, validateSaleData, async (req, res) => {
  try {
    const {
      productCode,
      shopCode,
      quantitySold,
      discount = 0,
      soldBy,
      customer,
      paymentMethod = 'cash',
      notes
    } = req.body;

    // Find product
    const product = await Product.findOne({ productCode, isActive: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find inventory
    const inventory = await Inventory.findOne({ productCode, shopCode });
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Product not available in this shop'
      });
    }

    // Check stock availability
    if (inventory.quantityAvailable < quantitySold) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    // Generate sale ID
    const saleId = await Sale.generateSaleId();

    // Create sale record
    const sale = new Sale({
      saleId,
      productCode,
      shopCode,
      quantitySold,
      unitPrice: product.salePrice,
      discount,
      soldBy,
      customer,
      paymentMethod,
      notes
    });

    // Update inventory
    inventory.quantityAvailable -= quantitySold;
    inventory.quantitySold += quantitySold;
    inventory.lastRestocked = new Date();
    inventory.restockedBy = soldBy;

    // Save both records
    await Promise.all([
      sale.save(),
      inventory.save()
    ]);

    // Populate the response
    await sale.populate('productCode', 'name collectionName category size color costPrice salePrice');
    await sale.populate('shopCode', 'name type location.city');

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: {
        sale,
        updatedInventory: {
          itemCode: inventory.itemCode,
          quantityAvailable: inventory.quantityAvailable,
          quantitySold: inventory.quantitySold
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording sale',
      error: error.message
    });
  }
});

// GET /api/sales/shop/:shopCode - Get sales by shop
router.get('/shop/:shopCode', async (req, res) => {
  try {
    const { shopCode } = req.params;
    const { startDate, endDate, collectionName } = req.query;
    
    const filter = { shopCode, status: 'completed' };
    
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const sales = await Sale.find(filter)
      .populate('productCode', 'name collectionName category size color costPrice salePrice')
      .sort({ saleDate: -1 });

    // Filter by collection if specified
    let filteredSales = sales;
    if (collectionName && collectionName !== 'all') {
      filteredSales = sales.filter(sale => 
        sale.productCode && sale.productCode.collectionName === collectionName
      );
    }

    // Calculate summary
    const summary = {
      totalSales: filteredSales.length,
      totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.finalAmount, 0),
      totalQuantitySold: filteredSales.reduce((sum, sale) => sum + sale.quantitySold, 0),
      totalDiscount: filteredSales.reduce((sum, sale) => sum + sale.discount, 0),
      averageSaleValue: filteredSales.length > 0 ? 
        filteredSales.reduce((sum, sale) => sum + sale.finalAmount, 0) / filteredSales.length : 0
    };

    res.json({
      success: true,
      data: {
        sales: filteredSales,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shop sales',
      error: error.message
    });
  }
});

// GET /api/sales/daily/:shopCode/:date - Get daily sales report
router.get('/daily/:shopCode/:date', async (req, res) => {
  try {
    const { shopCode, date } = req.params;
    
    const startDate = new Date(date);
    const endDate = new Date(date + 'T23:59:59.999Z');

    const sales = await Sale.find({
      shopCode,
      saleDate: { $gte: startDate, $lte: endDate },
      status: 'completed'
    })
    .populate('productCode', 'name collectionName category size color costPrice salePrice')
    .sort({ saleDate: -1 });

    const summary = {
      date,
      shopCode,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.finalAmount, 0),
      totalQuantitySold: sales.reduce((sum, sale) => sum + sale.quantitySold, 0),
      totalDiscount: sales.reduce((sum, sale) => sum + sale.discount, 0),
      totalProfit: sales.reduce((sum, sale) => {
        const costPrice = sale.productCode ? sale.productCode.costPrice : 0;
        return sum + ((sale.unitPrice - costPrice) * sale.quantitySold) - sale.discount;
      }, 0)
    };

    res.json({
      success: true,
      data: {
        sales,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating daily sales report',
      error: error.message
    });
  }
});

module.exports = router;