const express = require('express');
const router = express.Router();
const ShopArticle = require('../models/ShopArticle');
const SalesRecord = require('../models/SalesRecord');

// Validation middleware for shop articles
const validateArticleData = (req, res, next) => {
  const { articleName, collectionName, category, size, color, salePrice, quantityAvailable, shopCode, addedBy } = req.body;
  
  const errors = [];
  
  if (!articleName) errors.push('Article name is required');
  if (!collectionName) errors.push('Collection name is required');
  if (!category) errors.push('Category is required');
  if (!size) errors.push('Size is required');
  if (!color) errors.push('Color is required');
  if (!salePrice || salePrice < 0) errors.push('Valid sale price is required');
  if (quantityAvailable === undefined || quantityAvailable < 0) errors.push('Valid quantity is required');
  if (!shopCode) errors.push('Shop code is required');
  if (!addedBy) errors.push('Added by is required');
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

// GET /api/shop-articles - Get all shop articles with filters
router.get('/', async (req, res) => {
  try {
    const {
      shopCode,
      collectionName,
      category,
      size,
      color,
      search,
      page = 1,
      limit = 50,
      sortBy = 'dateAdded',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (shopCode && shopCode !== 'all') filter.shopCode = shopCode;
    if (collectionName && collectionName !== 'all') filter.collectionName = collectionName;
    if (category && category !== 'all') filter.category = category;
    if (size && size !== 'all') filter.size = size;
    if (color && color !== 'all') filter.color = new RegExp(color, 'i');
    
    if (search) {
      filter.$or = [
        { articleCode: new RegExp(search, 'i') },
        { articleName: new RegExp(search, 'i') },
        { color: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [articles, total] = await Promise.all([
      ShopArticle.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      ShopArticle.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        articles,
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
      message: 'Error fetching shop articles',
      error: error.message
    });
  }
});

// GET /api/shop-articles/shop/:shopCode - Get articles by shop
router.get('/shop/:shopCode', async (req, res) => {
  try {
    const { shopCode } = req.params;
    const { collectionName, category, size } = req.query;
    
    const filter = { shopCode, isActive: true };
    if (collectionName && collectionName !== 'all') filter.collectionName = collectionName;
    if (category && category !== 'all') filter.category = category;
    if (size && size !== 'all') filter.size = size;

    const articles = await ShopArticle.find(filter).sort({ dateAdded: -1 });

    const summary = {
      totalArticles: articles.length,
      totalQuantityAvailable: articles.reduce((sum, article) => sum + article.quantityAvailable, 0),
      totalQuantitySold: articles.reduce((sum, article) => sum + article.quantitySold, 0),
      totalStockValue: articles.reduce((sum, article) => sum + (article.salePrice * article.quantityAvailable), 0),
      totalRevenue: articles.reduce((sum, article) => sum + (article.salePrice * article.quantitySold), 0),
      lowStockItems: articles.filter(article => article.quantityAvailable < 5).length
    };

    res.json({
      success: true,
      data: {
        articles,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shop articles',
      error: error.message
    });
  }
});

// POST /api/shop-articles - Add new shop article
router.post('/', validateArticleData, async (req, res) => {
  try {
    const {
      articleName,
      collectionName,
      category,
      size,
      color,
      salePrice,
      quantityAvailable,
      shopCode,
      addedBy,
      costPrice = 0,
      description = '',
      tags = []
    } = req.body;

    // Generate unique article code
    const articleCode = await ShopArticle.generateArticleCode();

    const article = new ShopArticle({
      articleCode,
      articleName,
      collectionName,
      category,
      size,
      color,
      salePrice,
      quantityAvailable,
      shopCode,
      addedBy,
      costPrice,
      description,
      tags
    });

    await article.save();

    res.status(201).json({
      success: true,
      message: 'Shop article added successfully',
      data: article
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Article code already exists',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error adding shop article',
        error: error.message
      });
    }
  }
});

// PUT /api/shop-articles/:articleCode - Update shop article
router.put('/:articleCode', async (req, res) => {
  try {
    const { articleCode } = req.params;
    const updateData = { ...req.body };
    
    updateData.lastUpdated = new Date();
    updateData.updatedBy = req.body.updatedBy || 'System';

    const article = await ShopArticle.findOneAndUpdate(
      { articleCode, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Shop article not found'
      });
    }

    res.json({
      success: true,
      message: 'Shop article updated successfully',
      data: article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating shop article',
      error: error.message
    });
  }
});

// POST /api/shop-articles/:articleCode/transfer - Transfer article between shops
router.post('/:articleCode/transfer', async (req, res) => {
  try {
    const { articleCode } = req.params;
    const { fromShopCode, toShopCode, quantity, transferredBy, notes = '' } = req.body;

    // Validation
    if (!fromShopCode || !toShopCode || !quantity || !transferredBy) {
      return res.status(400).json({
        success: false,
        message: 'All transfer fields are required'
      });
    }

    if (fromShopCode === toShopCode) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination shops cannot be the same'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Transfer quantity must be greater than 0'
      });
    }

    // Find source article
    const sourceArticle = await ShopArticle.findOne({ 
      articleCode, 
      shopCode: fromShopCode, 
      isActive: true 
    });

    if (!sourceArticle) {
      return res.status(404).json({
        success: false,
        message: 'Source article not found'
      });
    }

    if (sourceArticle.quantityAvailable < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for transfer'
      });
    }

    // Check if destination article exists
    let destinationArticle = await ShopArticle.findOne({
      articleName: sourceArticle.articleName,
      collectionName: sourceArticle.collectionName,
      category: sourceArticle.category,
      size: sourceArticle.size,
      color: sourceArticle.color,
      shopCode: toShopCode,
      isActive: true
    });

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update source article
      sourceArticle.quantityAvailable -= quantity;
      sourceArticle.lastUpdated = new Date();
      sourceArticle.updatedBy = transferredBy;
      await sourceArticle.save({ session });

      // Update or create destination article
      if (destinationArticle) {
        destinationArticle.quantityAvailable += quantity;
        destinationArticle.lastUpdated = new Date();
        destinationArticle.updatedBy = transferredBy;
        await destinationArticle.save({ session });
      } else {
        // Create new article at destination
        const newArticleCode = await ShopArticle.generateArticleCode();
        destinationArticle = new ShopArticle({
          articleCode: newArticleCode,
          articleName: sourceArticle.articleName,
          collectionName: sourceArticle.collectionName,
          category: sourceArticle.category,
          size: sourceArticle.size,
          color: sourceArticle.color,
          salePrice: sourceArticle.salePrice,
          quantityAvailable: quantity,
          quantitySold: 0,
          shopCode: toShopCode,
          addedBy: transferredBy,
          costPrice: sourceArticle.costPrice,
          description: sourceArticle.description + ` (Transferred from ${fromShopCode})`,
          tags: sourceArticle.tags
        });
        await destinationArticle.save({ session });
      }

      await session.commitTransaction();

      res.json({
        success: true,
        message: 'Article transferred successfully',
        data: {
          sourceArticle,
          destinationArticle
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
      message: 'Error transferring article',
      error: error.message
    });
  }
});

// GET /api/shop-articles/collections - Get all collections
router.get('/collections', async (req, res) => {
  try {
    const collections = await ShopArticle.distinct('collectionName');
    
    res.json({
      success: true,
      data: collections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching collections',
      error: error.message
    });
  }
});

// GET /api/shop-articles/low-stock/:shopCode - Get low stock articles for a shop
router.get('/low-stock/:shopCode', async (req, res) => {
  try {
    const { shopCode } = req.params;
    const { threshold = 5 } = req.query;
    
    const lowStockArticles = await ShopArticle.find({
      shopCode,
      quantityAvailable: { $lt: parseInt(threshold) },
      isActive: true
    }).sort({ quantityAvailable: 1 });

    res.json({
      success: true,
      data: lowStockArticles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock articles',
      error: error.message
    });
  }
});

module.exports = router;