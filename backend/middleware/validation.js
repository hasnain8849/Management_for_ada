const Joi = require('joi');

// Inventory validation schemas
const inventorySchemas = {
  addItem: Joi.object({
    collectionName: Joi.string().valid('Sajna Lawn', 'Parwaz', 'Noor Jehan', 'Raabta', 'Custom').required(),
    designName: Joi.string().trim().min(2).max(100).required(),
    color: Joi.string().trim().min(2).max(50).required(),
    size: Joi.string().valid('S', 'M', 'L', 'XL', 'XXL').required(),
    inHouseStock: Joi.number().integer().min(0).default(0),
    outSourceStock: Joi.number().integer().min(0).default(0),
    receivedBy: Joi.string().trim().min(2).max(100).required(),
    locationCode: Joi.string().valid('001', '002', '003', '004', '005').required(),
    supplierName: Joi.string().trim().max(100).allow('').optional(),
    vendorName: Joi.string().trim().min(2).max(100).required(),
    remarks: Joi.string().trim().max(500).allow('').optional(),
    costPrice: Joi.number().min(0).default(0),
    sellingPrice: Joi.number().min(0).default(0)
  }),

  updateStock: Joi.object({
    inHouseChange: Joi.number().integer().default(0),
    outSourceChange: Joi.number().integer().default(0),
    updatedBy: Joi.string().trim().min(2).max(100).required(),
    notes: Joi.string().trim().max(500).allow('').optional(),
    movementType: Joi.string().valid('received', 'transferred', 'sold', 'returned', 'adjusted').default('adjusted')
  }),

  transferStock: Joi.object({
    itemCode: Joi.string().pattern(/^ITM-\d{4}$/).required(),
    fromLocationCode: Joi.string().valid('001', '002', '003', '004', '005').required(),
    toLocationCode: Joi.string().valid('001', '002', '003', '004', '005').required(),
    quantity: Joi.number().integer().min(1).required(),
    transferredBy: Joi.string().trim().min(2).max(100).required(),
    notes: Joi.string().trim().max(500).allow('').optional()
  }).custom((value, helpers) => {
    if (value.fromLocationCode === value.toLocationCode) {
      return helpers.error('any.invalid', { message: 'Source and destination locations must be different' });
    }
    return value;
  }),

  queryFilters: Joi.object({
    collectionName: Joi.string().valid('Sajna Lawn', 'Parwaz', 'Noor Jehan', 'Raabta', 'Custom', 'all').optional(),
    color: Joi.string().trim().max(50).optional(),
    size: Joi.string().valid('S', 'M', 'L', 'XL', 'XXL', 'all').optional(),
    locationCode: Joi.string().valid('001', '002', '003', '004', '005', 'all').optional(),
    vendorName: Joi.string().trim().max(100).optional(),
    isActive: Joi.string().valid('true', 'false', 'all').default('true'),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    sortBy: Joi.string().valid('itemCode', 'designName', 'collectionName', 'receivedDate', 'quantity').default('receivedDate'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

// Validation middleware factory
const createValidationMiddleware = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = source === 'query' ? req.query : req.body;
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace the original data with validated and sanitized data
    if (source === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};

// Export validation middlewares
module.exports = {
  validateAddItem: createValidationMiddleware(inventorySchemas.addItem),
  validateUpdateStock: createValidationMiddleware(inventorySchemas.updateStock),
  validateTransferStock: createValidationMiddleware(inventorySchemas.transferStock),
  validateQueryFilters: createValidationMiddleware(inventorySchemas.queryFilters, 'query'),
  
  // Custom validation functions
  validateItemCode: (req, res, next) => {
    const { itemCode } = req.params;
    
    if (!itemCode || !/^ITM-\d{4}$/.test(itemCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item code format. Expected format: ITM-0001'
      });
    }
    
    next();
  },

  validateLocationCode: (req, res, next) => {
    const { locationCode } = req.params;
    const validCodes = ['001', '002', '003', '004', '005'];
    
    if (!validCodes.includes(locationCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location code. Valid codes: 001-005'
      });
    }
    
    next();
  }
};