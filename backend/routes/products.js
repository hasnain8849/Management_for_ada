const express = require('express');
const Product = require('../models/Product');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware
const validateProductData = (req, res, next) => {
  const { name, collectionName, category, size, color, costPrice, salePrice } = req.body;
  
  const errors = [];
  
  if (!name || name.trim().length < 2) errors.push('Product name is required');
  if (!collectionName) errors.push('Collection name is required');
  if (!category) errors.push('Category is required');
  if (!size) errors.push('Size is required');
  if (!color || color.trim().length < 1) errors.push('Color is required');
  if (!costPrice || costPrice < 0) errors.push('Valid cost price is required');
  if (!salePrice || salePrice < 0) errors.push('Valid sale price is required');
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const {
      collectionName,
      category,
      size,
      color,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (collectionName && collectionName !== 'all') filter.collectionName = collectionName;
    if (category && category !== 'all') filter.category = category;
    if (size && size !== 'all') filter.size = size;
    if (color && color !== 'all') filter.color = new RegExp(color, 'i');
    
    if (search) {
      filter.$or = [
        { productCode: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
        { color: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        products,
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
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// GET /api/products/:productCode - Get product by code
router.get('/:productCode', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      productCode: req.params.productCode,
      isActive: true 
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// POST /api/products - Create new product
router.post('/', requireAdminOrManager, validateProductData, async (req, res) => {
  try {
    const {
      name,
      collectionName,
      category,
      size,
      color,
      costPrice,
      salePrice,
      description,
      images,
      tags
    } = req.body;

    // Generate product code
    const productCode = await Product.generateProductCode();

    const product = new Product({
      productCode,
      name,
      collectionName,
      category,
      size,
      color,
      costPrice,
      salePrice,
      description,
      images,
      tags,
      createdBy: req.user.name
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// PUT /api/products/:productCode - Update product
router.put('/:productCode', requireAdminOrManager, validateProductData, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productCode: req.params.productCode, isActive: true },
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// DELETE /api/products/:productCode - Delete product (soft delete)
router.delete('/:productCode', requireAdminOrManager, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { productCode: req.params.productCode },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

// GET /api/products/collections/list - Get all collections
router.get('/meta/collections', async (req, res) => {
  try {
    const collections = await Product.distinct('collectionName', { isActive: true });
    
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

module.exports = router;