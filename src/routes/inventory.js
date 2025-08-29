const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');

// Validation middleware
const validateInventoryData = (req, res, next) => {
  const { collectionName, designName, color, size, quantity, receivedBy, locationCode, vendorName, costPrice, sellingPrice } = req.body;
  
  const errors = [];
  
  if (!collectionName) errors.push('Collection name is required');
  if (!designName) errors.push('Design name is required');
  if (!color) errors.push('Color is required');
  if (!size) errors.push('Size is required');
  if (quantity === undefined || quantity < 0) errors.push('Valid quantity is required');
  if (!receivedBy) errors.push('Received by is required');
  if (!locationCode) errors.push('Location code is required');
  if (!vendorName) errors.push('Vendor name is required');
  if (!costPrice || costPrice < 0) errors.push('Valid cost price is required');
  if (!sellingPrice || sellingPrice < 0) errors.push('Valid selling price is required');
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

// GET /api/inventory - Get all inventory items with filters
router.get('/', async (req, res) => {
  try {
    const {
      collectionName,
      color,
      size,
      locationCode,
      vendorName,
      search,
      page = 1,
      limit = 50,
      sortBy = 'receivedDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (collectionName) filter.collectionName = collectionName;
    if (color) filter.color = new RegExp(color, 'i');
    if (size) filter.size = size;
    if (locationCode) filter.locationCode = locationCode;
    if (vendorName) filter.vendorName = new RegExp(vendorName, 'i');
    
    if (search) {
      filter.$or = [
        { itemCode: new RegExp(search, 'i') },
        { designName: new RegExp(search, 'i') },
        { color: new RegExp(search, 'i') },
        { vendorName: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [items, total] = await Promise.all([
      Inventory.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Inventory.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        items,
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
      message: 'Error fetching inventory',
      error: error.message
    });
  }
});

// GET /api/inventory/location/:locationCode - Get inventory by location
router.get('/location/:locationCode', async (req, res) => {
  try {
    const { locationCode } = req.params;
    
    const items = await Inventory.find({ 
      locationCode, 
      isActive: true 
    }).sort({ receivedDate: -1 });

    const summary = {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
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
    res.status(500).json({
      success: false,
      message: 'Error fetching location inventory',
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
      quantity,
      inHouseStock = 0,
      outSourceStock = 0,
      receivedBy,
      locationCode,
      supplierName = '',
      vendorName,
      remarks = '',
      costPrice,
      sellingPrice,
      category = 'clothing'
    } = req.body;

    // Generate unique item code
    const itemCode = await Inventory.generateItemCode();

    // Calculate stock distribution
    const totalStock = quantity;
    const finalInHouseStock = inHouseStock || totalStock;
    const finalOutSourceStock = outSourceStock;

    const inventoryItem = new Inventory({
      itemCode,
      collectionName,
      designName,
      color,
      size,
      quantity: totalStock,
      inHouseStock: finalInHouseStock,
      outSourceStock: finalOutSourceStock,
      receivedBy,
      locationCode,
      supplierName,
      vendorName,
      remarks,
      costPrice,
      sellingPrice,
      category
    });

    await inventoryItem.save();

    // Create stock movement record
    const stockMovement = new StockMovement({
      itemCode,
      movementType: 'received',
      toLocationCode: locationCode,
      quantity: totalStock,
      employeeName: receivedBy,
      notes: `Initial stock received from ${vendorName}`
    });

    await stockMovement.save();

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: inventoryItem
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Item code already exists',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error adding inventory item',
        error: error.message
      });
    }
  }
});

// PUT /api/inventory/:itemCode - Update inventory item
router.put('/:itemCode', async (req, res) => {
  try {
    const { itemCode } = req.params;
    const updateData = { ...req.body };
    
    // Add update tracking
    updateData.lastUpdated = new Date();
    updateData.updatedBy = req.body.updatedBy || 'System';

    const item = await Inventory.findOneAndUpdate(
      { itemCode, isActive: true },
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
    res.status(500).json({
      success: false,
      message: 'Error updating inventory item',
      error: error.message
    });
  }
});

// PUT /api/inventory/:itemCode/stock - Update stock quantity
router.put('/:itemCode/stock', async (req, res) => {
  try {
    const { itemCode } = req.params;
    const { inHouseStock, outSourceStock, updatedBy, notes = '' } = req.body;

    if (inHouseStock === undefined && outSourceStock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one stock type must be provided'
      });
    }

    const item = await Inventory.findOne({ itemCode, isActive: true });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const oldInHouse = item.inHouseStock;
    const oldOutSource = item.outSourceStock;

    // Update stock quantities
    if (inHouseStock !== undefined) item.inHouseStock = Math.max(0, inHouseStock);
    if (outSourceStock !== undefined) item.outSourceStock = Math.max(0, outSourceStock);
    
    item.quantity = item.inHouseStock + item.outSourceStock;
    item.lastUpdated = new Date();
    item.updatedBy = updatedBy || 'System';

    await item.save();

    // Create stock movement record for tracking
    const movements = [];
    
    if (inHouseStock !== undefined && inHouseStock !== oldInHouse) {
      movements.push({
        itemCode,
        movementType: 'adjusted',
        toLocationCode: item.locationCode,
        quantity: Math.abs(inHouseStock - oldInHouse),
        employeeName: updatedBy || 'System',
        notes: `In-house stock ${inHouseStock > oldInHouse ? 'increased' : 'decreased'}: ${notes}`
      });
    }
    
    if (outSourceStock !== undefined && outSourceStock !== oldOutSource) {
      movements.push({
        itemCode,
        movementType: 'adjusted',
        fromLocationCode: 'vendor',
        quantity: Math.abs(outSourceStock - oldOutSource),
        employeeName: updatedBy || 'System',
        notes: `Out-source stock ${outSourceStock > oldOutSource ? 'increased' : 'decreased'}: ${notes}`
      });
    }

    if (movements.length > 0) {
      await StockMovement.insertMany(movements);
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
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

    if (fromLocationCode === toLocationCode) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination locations cannot be the same'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Transfer quantity must be greater than 0'
      });
    }

    // Find source item
    const sourceItem = await Inventory.findOne({ 
      itemCode, 
      locationCode: fromLocationCode, 
      isActive: true 
    });

    if (!sourceItem) {
      return res.status(404).json({
        success: false,
        message: 'Source inventory item not found'
      });
    }

    if (sourceItem.inHouseStock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for transfer'
      });
    }

    // Check if destination item exists
    let destinationItem = await Inventory.findOne({
      collectionName: sourceItem.collectionName,
      designName: sourceItem.designName,
      color: sourceItem.color,
      size: sourceItem.size,
      locationCode: toLocationCode,
      isActive: true
    });

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update source item
      sourceItem.inHouseStock -= quantity;
      sourceItem.quantity = sourceItem.inHouseStock + sourceItem.outSourceStock;
      sourceItem.lastUpdated = new Date();
      sourceItem.updatedBy = transferredBy;
      await sourceItem.save({ session });

      // Update or create destination item
      if (destinationItem) {
        destinationItem.inHouseStock += quantity;
        destinationItem.quantity = destinationItem.inHouseStock + destinationItem.outSourceStock;
        destinationItem.lastUpdated = new Date();
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
          category: sourceItem.category,
          remarks: `Transferred from ${fromLocationCode}`
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
        employeeName: transferredBy,
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
    res.status(500).json({
      success: false,
      message: 'Error transferring stock',
      error: error.message
    });
  }
});

// GET /api/inventory/collections - Get all collections
router.get('/collections', async (req, res) => {
  try {
    const collections = await Inventory.distinct('collectionName');
    
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

// GET /api/inventory/low-stock - Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    
    const lowStockItems = await Inventory.find({
      quantity: { $lt: parseInt(threshold) },
      isActive: true
    }).sort({ quantity: 1 });

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

// GET /api/inventory/movements/:itemCode - Get stock movements for an item
router.get('/movements/:itemCode', async (req, res) => {
  try {
    const { itemCode } = req.params;
    
    const movements = await StockMovement.find({ itemCode })
      .sort({ movementDate: -1 })
      .limit(50);

    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stock movements',
      error: error.message
    });
  }
});

// GET /api/inventory/summary - Get inventory summary
router.get('/summary', async (req, res) => {
  try {
    const { locationCode } = req.query;
    
    const filter = { isActive: true };
    if (locationCode) filter.locationCode = locationCode;

    const [
      totalItems,
      totalValue,
      lowStockCount,
      collectionSummary
    ] = await Promise.all([
      Inventory.countDocuments(filter),
      Inventory.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: { $multiply: ['$costPrice', '$quantity'] } } } }
      ]),
      Inventory.countDocuments({ ...filter, quantity: { $lt: 10 } }),
      Inventory.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$collectionName',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' },
            totalValue: { $sum: { $multiply: ['$costPrice', '$quantity'] } }
          }
        },
        { $sort: { totalValue: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalItems,
        totalValue: totalValue[0]?.total || 0,
        lowStockCount,
        collectionSummary
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

// DELETE /api/inventory/:itemCode - Soft delete inventory item
router.delete('/:itemCode', async (req, res) => {
  try {
    const { itemCode } = req.params;
    const { deletedBy } = req.body;

    const item = await Inventory.findOneAndUpdate(
      { itemCode, isActive: true },
      { 
        isActive: false, 
        lastUpdated: new Date(),
        updatedBy: deletedBy || 'System'
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
    res.status(500).json({
      success: false,
      message: 'Error deleting inventory item',
      error: error.message
    });
  }
});

module.exports = router;