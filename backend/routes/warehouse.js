const express = require('express');
const WarehouseMaterial = require('../models/WarehouseMaterial');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware for warehouse materials
const validateMaterialData = (req, res, next) => {
  const { materialName, category, quantityAvailable, pricePerUnit, addedBy } = req.body;
  
  const errors = [];
  
  if (!materialName || materialName.trim().length < 2) errors.push('Material name is required');
  if (!category || !['Hand Work', 'Accessories', 'Fabric'].includes(category)) {
    errors.push('Valid category is required (Hand Work, Accessories, Fabric)');
  }
  if (quantityAvailable === undefined || quantityAvailable < 0) errors.push('Valid quantity is required');
  if (!pricePerUnit || pricePerUnit < 0) errors.push('Valid price per unit is required');
  if (!addedBy || addedBy.trim().length < 2) errors.push('Added by is required');
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

// GET /api/warehouse - Get all warehouse materials
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 50,
      sortBy = 'addedDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (category && category !== 'all') filter.category = category;
    
    if (search) {
      filter.$or = [
        { materialCode: new RegExp(search, 'i') },
        { materialName: new RegExp(search, 'i') },
        { remarks: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [materials, total] = await Promise.all([
      WarehouseMaterial.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      WarehouseMaterial.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        materials,
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
      message: 'Error fetching warehouse materials',
      error: error.message
    });
  }
});

// GET /api/warehouse/summary - Get warehouse summary
router.get('/summary', async (req, res) => {
  try {
    const [
      totalMaterials,
      totalValue,
      lowStockCount,
      categorySummary
    ] = await Promise.all([
      WarehouseMaterial.countDocuments({ isActive: true }),
      WarehouseMaterial.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$pricePerUnit', '$quantityAvailable'] } } } }
      ]),
      WarehouseMaterial.countDocuments({ isActive: true, quantityAvailable: { $lt: 10 } }),
      WarehouseMaterial.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalQuantity: { $sum: '$quantityAvailable' },
            totalValue: { $sum: { $multiply: ['$pricePerUnit', '$quantityAvailable'] } }
          }
        },
        { $sort: { totalValue: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalMaterials,
        totalValue: totalValue[0]?.total || 0,
        lowStockCount,
        categorySummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching warehouse summary',
      error: error.message
    });
  }
});

// POST /api/warehouse - Add new warehouse material
router.post('/', requireAdminOrManager, validateMaterialData, async (req, res) => {
  try {
    const {
      materialName,
      category,
      quantityAvailable,
      pricePerUnit,
      remarks = '',
      addedBy
    } = req.body;

    // Generate unique material code
    const materialCode = await WarehouseMaterial.generateMaterialCode();

    const material = new WarehouseMaterial({
      materialCode,
      materialName,
      category,
      quantityAvailable,
      pricePerUnit,
      remarks,
      addedBy
    });

    await material.save();

    res.status(201).json({
      success: true,
      message: 'Warehouse material added successfully',
      data: material
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Material code already exists',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error adding warehouse material',
        error: error.message
      });
    }
  }
});

// PUT /api/warehouse/:materialCode - Update warehouse material
router.put('/:materialCode', requireAdminOrManager, async (req, res) => {
  try {
    const { materialCode } = req.params;
    const updateData = { ...req.body };
    
    updateData.lastUpdated = new Date();
    updateData.updatedBy = req.body.updatedBy || req.user.name;

    const material = await WarehouseMaterial.findOneAndUpdate(
      { materialCode, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse material not found'
      });
    }

    res.json({
      success: true,
      message: 'Warehouse material updated successfully',
      data: material
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating warehouse material',
      error: error.message
    });
  }
});

// DELETE /api/warehouse/:materialCode - Soft delete warehouse material
router.delete('/:materialCode', requireAdminOrManager, async (req, res) => {
  try {
    const { materialCode } = req.params;

    const material = await WarehouseMaterial.findOneAndUpdate(
      { materialCode, isActive: true },
      { 
        isActive: false, 
        lastUpdated: new Date(),
        updatedBy: req.user.name
      },
      { new: true }
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse material not found'
      });
    }

    res.json({
      success: true,
      message: 'Warehouse material deleted successfully',
      data: material
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting warehouse material',
      error: error.message
    });
  }
});

// GET /api/warehouse/low-stock - Get low stock materials
router.get('/low-stock', async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    
    const lowStockMaterials = await WarehouseMaterial.find({
      quantityAvailable: { $lt: parseInt(threshold) },
      isActive: true
    }).sort({ quantityAvailable: 1 });

    res.json({
      success: true,
      data: lowStockMaterials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock materials',
      error: error.message
    });
  }
});

module.exports = router;