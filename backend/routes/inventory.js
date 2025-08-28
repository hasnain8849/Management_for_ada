const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

// Validation middleware
const validateInventoryData = (req, res, next) => {
  const { collectionName, designName, color, size, vendorName, receivedBy, locationCode } = req.body;
  
  const errors = [];
  
  if (!collectionName) errors.push('Collection name is required');
  if (!designName) errors.push('Design name is required');
  if (!color) errors.push('Color is required');
  if (!size) errors.push('Size is required');
  if (!vendorName) errors.push('Vendor name is required');
  if (!receivedBy) errors.push('Received by is required');
  if (!locationCode) errors.push('Location code is required');
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

// GET /api/inventory - Get all inventory with filters
router.get('/', async (req, res) => {
  try {
    const {
      collectionName,
      color,
      size,
      locationCode,
      vendorName,
      isActive = 'true',
      page = 1,
      limit = 50,
      sortBy = 'receivedDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (collectionName && collectionName !== 'all') filter.collectionName = collectionName;
    if (color && color !== 'all') filter.color = new RegExp(color, 'i');
    if (size && size !== 'all') filter.size = size;
    if (locationCode && locationCode !== 'all') filter.locationCode = locationCode;
    if (vendorName && vendorName !== 'all') filter.vendorName = new RegExp(vendorName, 'i');
    if (isActive !== 'all') filter.isActive = isActive === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [items, totalCount] = await Promise.all([
      Inventory.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Inventory.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message
    });
  }
});

// GET /api/inventory/location/:locationCode - Get inventory by location
router.get('/location/:locationCode', async (req, res) => {
  try {
    const { locationCode } = req.params;
    const { isActive = 'true' } = req.query;

    const filter = { locationCode };
    if (isActive !== 'all') filter.isActive = isActive === 'true';

    const items = await Inventory.find(filter)
      .sort({ collectionName: 1, designName: 1 })
      .lean();

    const summary = {
      totalItems: items.length,
      totalInHouseStock: items.reduce((sum, item) => sum + item.inHouseStock, 0),
      totalOutSourceStock: items.reduce((sum, item) => sum + item.outSourceStock, 0),
      totalValue: items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0),
      lowStockItems: items.filter(item => item.quantity < 10).length
    };

    res.json({
      success: true,
      data: {
        items,
        summary
      }
    });
  } catch (error) {
    console.error('Error fetching location inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location inventory',
      error: error.message
    });
  }
});

// POST /api/inventory - Add new inventory item
router.post('/', validateInventoryData, async (req, res) => {
  try {
    const {
      collectionName,
      designName,
      color,
      size,
      quantity = 0,
      inHouseStock = 0,
      outSourceStock = 0,
      receivedBy,
      locationCode,
      supplierName = '',
      vendorName,
      remarks = '',
      costPrice = 0,
      sellingPrice = 0
    } = req.body;

    // Generate unique item code
    const itemCode = await Inventory.generateItemCode();

    // Calculate total quantity
    const totalQuantity = inHouseStock + outSourceStock;

    const inventoryItem = new Inventory({
      itemCode,
      collectionName,
      designName,
      color,
      size,
      quantity: Math.max(quantity, totalQuantity),
      inHouseStock,
      outSourceStock,
      receivedBy,
      locationCode,
      supplierName,
      vendorName,
      remarks,
      costPrice,
      sellingPrice,
      receivedDate: new Date(),
      updatedBy: receivedBy
    });

    await inventoryItem.save();

    // Create stock movement record
    const stockMovement = new StockMovement({
      itemCode,
      movementType: 'received',
      toLocationCode: locationCode,
      quantity: totalQuantity,
      processedBy: receivedBy,
      notes: `Initial stock received - ${remarks}`,
      referenceNumber: `REC-${Date.now()}`
    });

    await stockMovement.save();

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: inventoryItem
    });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Item code already exists',
        error: 'Duplicate item code'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to add inventory item',
      error: error.message
    });
  }
});

// PUT /api/inventory/:itemCode/stock - Update stock quantity
router.put('/:itemCode/stock', async (req, res) => {
  try {
    const { itemCode } = req.params;
    const { 
      inHouseChange = 0, 
      outSourceChange = 0, 
      updatedBy, 
      notes = '',
      movementType = 'adjusted'
    } = req.body;

    if (!updatedBy) {
      return res.status(400).json({
        success: false,
        message: 'Updated by field is required'
      });
    }

    const item = await Inventory.findOne({ itemCode });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Update stock using instance method
    await item.updateStock(inHouseChange, outSourceChange);
    item.updatedBy = updatedBy;
    await item.save();

    // Create stock movement record
    if (inHouseChange !== 0 || outSourceChange !== 0) {
      const totalChange = inHouseChange + outSourceChange;
      const stockMovement = new StockMovement({
        itemCode,
        movementType,
        toLocationCode: item.locationCode,
        quantity: Math.abs(totalChange),
        processedBy: updatedBy,
        notes: notes || `Stock ${totalChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(totalChange)}`,
        referenceNumber: `ADJ-${Date.now()}`
      });

      await stockMovement.save();
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
});

// POST /api/inventory/transfer - Transfer stock between locations
router.post('/transfer', async (req, res) => {
  try {
    const {
      itemCode,
      fromLocationCode,
      toLocationCode,
      quantity,
      transferredBy,
      notes = ''
    } = req.body;

    // Validation
    if (!itemCode || !fromLocationCode || !toLocationCode || !quantity || !transferredBy) {
      return res.status(400).json({
        success: false,
        message: 'All transfer fields are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Transfer quantity must be greater than 0'
      });
    }

    if (fromLocationCode === toLocationCode) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination locations cannot be the same'
      });
    }

    // Find source item
    const sourceItem = await Inventory.findOne({ 
      itemCode, 
      locationCode: fromLocationCode 
    });

    if (!sourceItem) {
      return res.status(404).json({
        success: false,
        message: 'Source item not found'
      });
    }

    if (sourceItem.inHouseStock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for transfer'
      });
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Reduce stock from source location
      await sourceItem.updateStock(-quantity, 0);
      sourceItem.updatedBy = transferredBy;
      await sourceItem.save({ session });

      // Find or create destination item
      let destinationItem = await Inventory.findOne({
        collectionName: sourceItem.collectionName,
        designName: sourceItem.designName,
        color: sourceItem.color,
        size: sourceItem.size,
        locationCode: toLocationCode
      }).session(session);

      if (destinationItem) {
        // Update existing item
        await destinationItem.updateStock(quantity, 0);
        destinationItem.updatedBy = transferredBy;
        await destinationItem.save({ session });
      } else {
        // Create new item at destination
        const newItemCode = await Inventory.generateItemCode();
        destinationItem = new Inventory({
          itemCode: newItemCode,
          collectionName: sourceItem.collectionName,
          designName: sourceItem.designName,
          color: sourceItem.color,
          size: sourceItem.size,
          quantity: quantity,
          inHouseStock: quantity,
          outSourceStock: 0,
          receivedBy: transferredBy,
          locationCode: toLocationCode,
          supplierName: sourceItem.supplierName,
          vendorName: sourceItem.vendorName,
          costPrice: sourceItem.costPrice,
          sellingPrice: sourceItem.sellingPrice,
          remarks: `Transferred from ${fromLocationCode}`,
          updatedBy: transferredBy
        });
        await destinationItem.save({ session });
      }

      // Create stock movement record
      const stockMovement = new StockMovement({
        itemCode: sourceItem.itemCode,
        movementType: 'transferred',
        fromLocationCode,
        toLocationCode,
        quantity,
        processedBy: transferredBy,
        notes: notes || `Transfer from ${fromLocationCode} to ${toLocationCode}`,
        referenceNumber: `TRF-${Date.now()}`
      });

      await stockMovement.save({ session });

      await session.commitTransaction();

      res.json({
        success: true,
        message: 'Stock transferred successfully',
        data: {
          sourceItem,
          destinationItem,
          movement: stockMovement
        }
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error transferring stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer stock',
      error: error.message
    });
  }
});

// GET /api/inventory/search - Search inventory with advanced filters
router.get('/search', async (req, res) => {
  try {
    const {
      q = '',
      collectionName,
      color,
      size,
      locationCode,
      vendorName,
      lowStock = 'false',
      page = 1,
      limit = 20
    } = req.query;

    // Build search filter
    const filter = { isActive: true };

    // Text search across multiple fields
    if (q) {
      filter.$or = [
        { itemCode: new RegExp(q, 'i') },
        { designName: new RegExp(q, 'i') },
        { color: new RegExp(q, 'i') },
        { vendorName: new RegExp(q, 'i') }
      ];
    }

    // Apply filters
    if (collectionName && collectionName !== 'all') filter.collectionName = collectionName;
    if (color && color !== 'all') filter.color = new RegExp(color, 'i');
    if (size && size !== 'all') filter.size = size;
    if (locationCode && locationCode !== 'all') filter.locationCode = locationCode;
    if (vendorName && vendorName !== 'all') filter.vendorName = new RegExp(vendorName, 'i');
    
    // Low stock filter
    if (lowStock === 'true') {
      filter.quantity = { $lt: 10 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, totalCount] = await Promise.all([
      Inventory.find(filter)
        .sort({ [req.query.sortBy || 'receivedDate']: req.query.sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Inventory.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error searching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search inventory',
      error: error.message
    });
  }
});

// GET /api/inventory/:itemCode - Get specific inventory item
router.get('/:itemCode', async (req, res) => {
  try {
    const { itemCode } = req.params;
    
    const item = await Inventory.findOne({ itemCode }).lean();
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Get stock movement history
    const movements = await StockMovement.find({ itemCode })
      .sort({ movementDate: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        item,
        movements
      }
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory item',
      error: error.message
    });
  }
});

// PUT /api/inventory/:itemCode - Update inventory item
router.put('/:itemCode', async (req, res) => {
  try {
    const { itemCode } = req.params;
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated directly
    delete updateData.itemCode;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // Update lastUpdated and updatedBy
    updateData.lastUpdated = new Date();
    
    const item = await Inventory.findOneAndUpdate(
      { itemCode },
      updateData,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message
    });
  }
});

// DELETE /api/inventory/:itemCode - Soft delete inventory item
router.delete('/:itemCode', async (req, res) => {
  try {
    const { itemCode } = req.params;
    const { deletedBy } = req.body;

    if (!deletedBy) {
      return res.status(400).json({
        success: false,
        message: 'Deleted by field is required'
      });
    }

    const item = await Inventory.findOneAndUpdate(
      { itemCode },
      { 
        isActive: false, 
        updatedBy: deletedBy,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory item deleted successfully',
      data: item
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
      error: error.message
    });
  }
});

// GET /api/inventory/analytics/summary - Get inventory analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { locationCode } = req.query;
    
    const filter = { isActive: true };
    if (locationCode && locationCode !== 'all') filter.locationCode = locationCode;

    const [
      totalItems,
      totalStockValue,
      lowStockItems,
      collectionBreakdown,
      locationBreakdown
    ] = await Promise.all([
      Inventory.countDocuments(filter),
      Inventory.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: { $multiply: ['$costPrice', '$quantity'] } } } }
      ]),
      Inventory.countDocuments({ ...filter, quantity: { $lt: 10 } }),
      Inventory.aggregate([
        { $match: filter },
        { $group: { 
          _id: '$collectionName', 
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$costPrice', '$quantity'] } }
        }},
        { $sort: { count: -1 } }
      ]),
      Inventory.aggregate([
        { $match: filter },
        { $group: { 
          _id: '$locationCode', 
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$costPrice', '$quantity'] } }
        }},
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalItems,
          totalStockValue: totalStockValue[0]?.total || 0,
          lowStockItems,
          averageItemValue: totalItems > 0 ? (totalStockValue[0]?.total || 0) / totalItems : 0
        },
        collectionBreakdown,
        locationBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory analytics',
      error: error.message
    });
  }
});

module.exports = router;