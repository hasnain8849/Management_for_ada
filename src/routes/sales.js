const express = require('express');
const router = express.Router();
const SalesRecord = require('../models/SalesRecord');
const ShopArticle = require('../models/ShopArticle');
const mongoose = require('mongoose');

// Validation middleware for sales
const validateSaleData = (req, res, next) => {
  const { articleCode, quantitySold, soldBy, shopCode } = req.body;
  
  const errors = [];
  
  if (!articleCode) errors.push('Article code is required');
  if (!quantitySold || quantitySold < 1) errors.push('Valid quantity sold is required');
  if (!soldBy) errors.push('Sold by is required');
  if (!shopCode) errors.push('Shop code is required');
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

// GET /api/sales - Get all sales records with filters
router.get('/', async (req, res) => {
  try {
    const {
      shopCode,
      collectionName,
      soldBy,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'dateOfSale',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'completed' };
    
    if (shopCode && shopCode !== 'all') filter.shopCode = shopCode;
    if (collectionName && collectionName !== 'all') filter.collectionName = collectionName;
    if (soldBy && soldBy !== 'all') filter.soldBy = new RegExp(soldBy, 'i');
    
    if (startDate || endDate) {
      filter.dateOfSale = {};
      if (startDate) filter.dateOfSale.$gte = new Date(startDate);
      if (endDate) filter.dateOfSale.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [sales, total] = await Promise.all([
      SalesRecord.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      SalesRecord.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        sales,
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
      message: 'Error fetching sales records',
      error: error.message
    });
  }
});

// GET /api/sales/shop/:shopCode - Get sales by shop
router.get('/shop/:shopCode', async (req, res) => {
  try {
    const { shopCode } = req.params;
    const { startDate, endDate } = req.query;
    
    const filter = { shopCode, status: 'completed' };
    
    if (startDate || endDate) {
      filter.dateOfSale = {};
      if (startDate) filter.dateOfSale.$gte = new Date(startDate);
      if (endDate) filter.dateOfSale.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const sales = await SalesRecord.find(filter).sort({ dateOfSale: -1 });

    const summary = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.finalAmount, 0),
      totalQuantitySold: sales.reduce((sum, sale) => sum + sale.quantitySold, 0),
      averageSaleValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.finalAmount, 0) / sales.length : 0
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
      message: 'Error fetching shop sales',
      error: error.message
    });
  }
});

// POST /api/sales - Record a new sale
router.post('/', validateSaleData, async (req, res) => {
  try {
    const {
      articleCode,
      quantitySold,
      soldBy,
      shopCode,
      customerName = '',
      customerPhone = '',
      paymentMethod = 'Cash',
      discount = 0,
      notes = ''
    } = req.body;

    // Find the article
    const article = await ShopArticle.findOne({ 
      articleCode, 
      shopCode, 
      isActive: true 
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found in this shop'
      });
    }

    if (article.quantityAvailable < quantitySold) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    // Generate unique sale ID
    const saleID = await SalesRecord.generateSaleID();

    // Calculate final amount
    const grossAmount = article.salePrice * quantitySold;
    const finalAmount = grossAmount - discount;

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create sales record
      const salesRecord = new SalesRecord({
        saleID,
        articleCode,
        articleName: article.articleName,
        collectionName: article.collectionName,
        category: article.category,
        size: article.size,
        color: article.color,
        salePrice: article.salePrice,
        quantitySold,
        soldBy,
        shopCode,
        customerName,
        customerPhone,
        paymentMethod,
        discount,
        finalAmount,
        notes
      });

      await salesRecord.save({ session });

      // Update article stock
      article.quantityAvailable -= quantitySold;
      article.quantitySold += quantitySold;
      article.lastUpdated = new Date();
      article.updatedBy = soldBy;
      await article.save({ session });

      await session.commitTransaction();

      res.status(201).json({
        success: true,
        message: 'Sale recorded successfully',
        data: {
          sale: salesRecord,
          updatedArticle: article
        }
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording sale',
      error: error.message
    });
  }
});

// GET /api/sales/reports/daily/:shopCode - Daily sales report
router.get('/reports/daily/:shopCode', async (req, res) => {
  try {
    const { shopCode } = req.params;
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const startDate = new Date(date);
    const endDate = new Date(date + 'T23:59:59.999Z');

    const sales = await SalesRecord.find({
      shopCode,
      dateOfSale: { $gte: startDate, $lte: endDate },
      status: 'completed'
    }).sort({ dateOfSale: -1 });

    const summary = {
      date,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.finalAmount, 0),
      totalQuantitySold: sales.reduce((sum, sale) => sum + sale.quantitySold, 0),
      totalDiscount: sales.reduce((sum, sale) => sum + sale.discount, 0)
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

// GET /api/sales/reports/collection/:collectionName - Collection performance report
router.get('/reports/collection/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { startDate, endDate, shopCode } = req.query;
    
    const filter = { collectionName, status: 'completed' };
    if (shopCode && shopCode !== 'all') filter.shopCode = shopCode;
    
    if (startDate || endDate) {
      filter.dateOfSale = {};
      if (startDate) filter.dateOfSale.$gte = new Date(startDate);
      if (endDate) filter.dateOfSale.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const [sales, shopBreakdown] = await Promise.all([
      SalesRecord.find(filter).sort({ dateOfSale: -1 }),
      SalesRecord.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$shopCode',
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$finalAmount' },
            totalQuantitySold: { $sum: '$quantitySold' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ])
    ]);

    const summary = {
      collectionName,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.finalAmount, 0),
      totalQuantitySold: sales.reduce((sum, sale) => sum + sale.quantitySold, 0),
      shopBreakdown
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
      message: 'Error generating collection report',
      error: error.message
    });
  }
});

module.exports = router;