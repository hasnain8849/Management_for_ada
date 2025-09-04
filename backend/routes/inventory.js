const express = require('express');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware
const validateInventoryData = (req, res, next) => {
  const { productCode, shopCode, quantityAvailable, restockedBy } = req.body;
  
  const errors = [];
  
  if (!productCode) errors.push('Product code is required');
  if (!shopCode || !['001', '002', '003', '004'].includes(shopCode)) {
    errors.push('Valid shop code is required');
  }
  if (quantityAvailable === undefined || quantityAvailable < 0) {
    errors.push('Valid quantity is required');
  }
  if (!restockedBy || restockedBy.trim().length < 2) {
    errors.push('Restocked by is required');
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

// GET /api/inventory - Get all inventory
router.get('/', async (req, res) => {
  try {
    const {
      shopCode,
      collectionName,
      category,
      size,
      color,
      stockStatus,
      search,
      page = 1,
      limit = 50,
      sortBy = 'lastRestocked',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (shopCode && shopCode !== 'all') filter.shopCode = shopCode;
    if (stockStatus) {
      if (stockStatus === 'low-stock') {
        filter.$expr = { $lte: ['$quantityAvailable', '$reorderLevel'] };
      } else if (stockStatus === 'out-of-stock') {
        filter.quantityAvailable = 0;
      } else if (stockStatus === 'in-stock') {
        filter.$expr = { $gt: ['$quantityAvailable', '$reorderLevel'] };
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [inventoryItems, total] = await Promise.all([
      Inventory.find(filter)
        .populate('productCode', 'name collectionName category size color costPrice salePrice')
        .populate('shopCode', 'name type location.city')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Inventory.countDocuments(filter)
    ]);

    // Apply additional filters that require populated data
    let filteredItems = inventoryItems;
    
    if (collectionName && collectionName !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.productCode && item.productCode.collectionName === collectionName
      );
    }
    
    if (category && category !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.productCode && item.productCode.category === category
      );
    }
    
    if (size && size !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.productCode && item.productCode.size === size
      );
    }
    
    if (color && color !== 'all') {
      filteredItems = filteredItems.filter(item => 
        item.productCode && item.productCode.color.toLowerCase().includes(color.toLowerCase())
      );
    }
    
    if (search) {
      filteredItems = filteredItems.filter(item => 
        item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
        (item.productCode && item.productCode.name.toLowerCase().includes(search.toLowerCase()))
      );
    }

    res.json({
      success: true,
      data: {
        inventoryItems: filteredItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredItems.length,
          pages: Math.ceil(filteredItems.length / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory',
      error: error.message
    });
  }
});

// GET /api/inventory/shop/:shopCode - Get inventory by shop
router.get('/shop/:shopCode', async (req, res) => {
  try {
    const { shopCode } = req.params;
    const { stockStatus, collectionName } = req.query;

    const filter = { shopCode };
    
    if (stockStatus) {
      if (stockStatus === 'low-stock') {
        filter.$expr = { $lte: ['$quantityAvailable', '$reorderLevel'] };
      } else if (stockStatus === 'out-of-stock') {
        filter.quantityAvailable = 0;
      }
    }

    const inventoryItems = await Inventory.find(filter)
      .populate('productCode', 'name collectionName category size color costPrice salePrice')
      .populate('shopCode', 'name type')
      .sort({ lastRestocked: -1 });

    // Filter by collection if specified
    let filteredItems = inventoryItems;
    if (collectionName && collectionName !== 'all') {
      filteredItems = inventoryItems.filter(item => 
        item.productCode && item.productCode.collectionName === collectionName
      );
    }

    // Calculate summary
    const summary = {
      totalItems: filteredItems.length,
      totalQuantityAvailable: filteredItems.reduce((sum, item) => sum + item.quantityAvailable, 0),
      totalQuantitySold: filteredItems.reduce((sum, item) => sum + item.quantitySold, 0),
      totalStockValue: filteredItems.reduce((sum, item) => 
        sum + (item.productCode ? item.productCode.costPrice * item.quantityAvailable : 0), 0
      ),
      lowStockItems: filteredItems.filter(item => item.quantityAvailable <= item.reorderLevel).length,
      outOfStockItems: filteredItems.filter(item => item.quantityAvailable === 0).length
    };

    res.json({
      success: true,
      data: {
        inventoryItems: filteredItems,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shop inventory',
      error: error.message
    });
  }
});

// POST /api/inventory - Add inventory item
router.post('/', requireAdminOrManager, validateInventoryData, async (req, res) => {
  try {
    const { productCode, shopCode, quantityAvailable, reorderLevel, restockedBy } = req.body;

    // Verify product exists
    const product = await Product.findOne({ productCode, isActive: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify shop exists
    const shop = await Shop.findOne({ shopCode, isActive: true });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    // Check if inventory already exists for this product in this shop
    const existingInventory = await Inventory.findOne({ productCode, shopCode });
    
    if (existingInventory) {
      return res.status(400).json({
        success: false,
        message: 'Inventory already exists for this product in this shop'
      });
    }

    // Generate item code
    const itemCode = await Inventory.generateItemCode();

    const inventory = new Inventory({
      itemCode,
      productCode,
      shopCode,
      quantityAvailable,
      reorderLevel: reorderLevel || 10,
      restockedBy
    });

    await inventory.save();

    // Populate the response
    await inventory.populate('productCode', 'name collectionName category size color costPrice salePrice');
    await inventory.populate('shopCode', 'name type');

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding inventory item',
      error: error.message
    });
  }
});

// PUT /api/inventory/:itemCode/stock - Update stock quantity
router.put('/:itemCode/stock', requireAdminOrManager, async (req, res) => {
  try {
    const { itemCode } = req.params;
    const { quantityAvailable, restockedBy, operation = 'set' } = req.body;

    if (quantityAvailable === undefined || quantityAvailable < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const inventory = await Inventory.findOne({ itemCode });
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Update quantity based on operation
    if (operation === 'add') {
      inventory.quantityAvailable += quantityAvailable;
    } else if (operation === 'subtract') {
      inventory.quantityAvailable = Math.max(0, inventory.quantityAvailable - quantityAvailable);
    } else {
      inventory.quantityAvailable = quantityAvailable;
    }

    inventory.lastRestocked = new Date();
    inventory.restockedBy = restockedBy || req.user.name;

    await inventory.save();

    // Populate the response
    await inventory.populate('productCode', 'name collectionName category size color costPrice salePrice');
    await inventory.populate('shopCode', 'name type');

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error.message
    });
  }
});

// POST /api/inventory/transfer - Transfer stock between shops
router.post('/transfer', requireAdminOrManager, async (req, res) => {
  try {
    const {
      productCode,
      fromShopCode,
      toShopCode,
      quantity,
      transferredBy
    } = req.body;

    // Validation
    if (!productCode || !fromShopCode || !toShopCode || !quantity || !transferredBy) {
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

    // Find source inventory
    const sourceInventory = await Inventory.findOne({ productCode, shopCode: fromShopCode });
    
    if (!sourceInventory) {
      return res.status(404).json({
        success: false,
        message: 'Source inventory not found'
      });
    }

    if (sourceInventory.quantityAvailable < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for transfer'
      });
    }

    // Find or create destination inventory
    let destinationInventory = await Inventory.findOne({ productCode, shopCode: toShopCode });
    
    if (!destinationInventory) {
      // Create new inventory item at destination
      const itemCode = await Inventory.generateItemCode();
      
      destinationInventory = new Inventory({
        itemCode,
        productCode,
        shopCode: toShopCode,
        quantityAvailable: quantity,
        restockedBy: transferredBy
      });
    } else {
      // Update existing inventory
      destinationInventory.quantityAvailable += quantity;
      destinationInventory.lastRestocked = new Date();
      destinationInventory.restockedBy = transferredBy;
    }

    // Update source inventory
    sourceInventory.quantityAvailable -= quantity;
    sourceInventory.lastRestocked = new Date();
    sourceInventory.restockedBy = transferredBy;

    // Save both inventories
    await Promise.all([
      sourceInventory.save(),
      destinationInventory.save()
    ]);

    // Populate the responses
    await Promise.all([
      sourceInventory.populate('productCode', 'name collectionName category size color'),
      sourceInventory.populate('shopCode', 'name type'),
      destinationInventory.populate('productCode', 'name collectionName category size color'),
      destinationInventory.populate('shopCode', 'name type')
    ]);

    res.json({
      success: true,
      message: 'Stock transferred successfully',
      data: {
        sourceInventory,
        destinationInventory,
        transferDetails: {
          productCode,
          fromShopCode,
          toShopCode,
          quantity,
          transferredBy,
          transferDate: new Date()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error transferring stock',
      error: error.message
    });
  }
});

// GET /api/inventory/low-stock - Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const { shopCode, threshold } = req.query;
    
    const filter = {
      $expr: { $lte: ['$quantityAvailable', '$reorderLevel'] }
    };
    
    if (shopCode && shopCode !== 'all') {
      filter.shopCode = shopCode;
    }

    const lowStockItems = await Inventory.find(filter)
      .populate('productCode', 'name collectionName category size color costPrice salePrice')
      .populate('shopCode', 'name type')
      .sort({ quantityAvailable: 1 });

    res.json({
      success: true,
      data: lowStockItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock items',
      error: error.message
    });
  }
});

// GET /api/inventory/summary - Get inventory summary
router.get('/summary', async (req, res) => {
  try {
    const { shopCode } = req.query;
    
    const filter = {};
    if (shopCode && shopCode !== 'all') filter.shopCode = shopCode;

    const [
      totalItems,
      inventoryItems,
      lowStockCount,
      outOfStockCount
    ] = await Promise.all([
      Inventory.countDocuments(filter),
      Inventory.find(filter).populate('productCode', 'costPrice salePrice'),
      Inventory.countDocuments({ 
        ...filter, 
        $expr: { $lte: ['$quantityAvailable', '$reorderLevel'] }
      }),
      Inventory.countDocuments({ ...filter, quantityAvailable: 0 })
    ]);

    const totalStockValue = inventoryItems.reduce((sum, item) => 
      sum + (item.productCode ? item.productCode.costPrice * item.quantityAvailable : 0), 0
    );

    const totalSellingValue = inventoryItems.reduce((sum, item) => 
      sum + (item.productCode ? item.productCode.salePrice * item.quantityAvailable : 0), 0
    );

    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantityAvailable, 0);

    res.json({
      success: true,
      data: {
        totalItems,
        totalQuantity,
        totalStockValue,
        totalSellingValue,
        potentialProfit: totalSellingValue - totalStockValue,
        lowStockCount,
        outOfStockCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory summary',
      error: error.message
    });
  }
});

module.exports = router;