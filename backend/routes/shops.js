const express = require('express');
const Shop = require('../models/Shop');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware
const validateShopData = (req, res, next) => {
  const { shopCode, name, type, manager } = req.body;
  
  const errors = [];
  
  if (!shopCode || !['001', '002', '003', '004'].includes(shopCode)) {
    errors.push('Valid shop code is required (001-004)');
  }
  if (!name || name.trim().length < 2) errors.push('Shop name is required');
  if (!type || !['warehouse', 'physical', 'online'].includes(type)) {
    errors.push('Valid shop type is required (warehouse, physical, online)');
  }
  if (!manager || !manager.name || !manager.phone) {
    errors.push('Manager name and phone are required');
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

// GET /api/shops - Get all shops
router.get('/', async (req, res) => {
  try {
    const { type, isActive, city } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (city) filter['location.city'] = new RegExp(city, 'i');

    const shops = await Shop.find(filter).sort({ shopCode: 1 });

    res.json({
      success: true,
      data: shops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shops',
      error: error.message
    });
  }
});

// GET /api/shops/:shopCode - Get shop by code
router.get('/:shopCode', async (req, res) => {
  try {
    const shop = await Shop.findOne({ shopCode: req.params.shopCode });
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    res.json({
      success: true,
      data: shop
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shop',
      error: error.message
    });
  }
});

// POST /api/shops - Create new shop
router.post('/', requireAdminOrManager, validateShopData, async (req, res) => {
  try {
    const shop = new Shop(req.body);
    await shop.save();

    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      data: shop
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Shop with this code already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error creating shop',
        error: error.message
      });
    }
  }
});

// PUT /api/shops/:shopCode - Update shop
router.put('/:shopCode', requireAdminOrManager, validateShopData, async (req, res) => {
  try {
    const shop = await Shop.findOneAndUpdate(
      { shopCode: req.params.shopCode },
      req.body,
      { new: true, runValidators: true }
    );

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    res.json({
      success: true,
      message: 'Shop updated successfully',
      data: shop
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating shop',
      error: error.message
    });
  }
});

// DELETE /api/shops/:shopCode - Delete shop (soft delete)
router.delete('/:shopCode', requireAdminOrManager, async (req, res) => {
  try {
    const shop = await Shop.findOneAndUpdate(
      { shopCode: req.params.shopCode },
      { isActive: false },
      { new: true }
    );

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    res.json({
      success: true,
      message: 'Shop deleted successfully',
      data: shop
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting shop',
      error: error.message
    });
  }
});

module.exports = router;