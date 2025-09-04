const express = require('express');
const Employee = require('../models/Employee');
const { authenticateToken, requireAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware
const validateEmployeeData = (req, res, next) => {
  const { name, email, phone, role, department, position, wageUSD } = req.body;
  
  const errors = [];
  
  if (!name || name.trim().length < 2) errors.push('Valid name is required');
  if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) errors.push('Valid email is required');
  if (!phone || !/^[\+]?[0-9\-\(\)\s]{10,}$/.test(phone)) errors.push('Valid phone number is required');
  if (!role || role.trim().length < 2) errors.push('Role is required');
  if (!department || department.trim().length < 2) errors.push('Department is required');
  if (!position || position.trim().length < 2) errors.push('Position is required');
  if (!wageUSD || wageUSD < 0) errors.push('Valid wage in USD is required');
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

// GET /api/employees - Get all employees
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      department,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { employeeId: new RegExp(search, 'i') },
        { role: new RegExp(search, 'i') }
      ];
    }
    
    if (department) filter.department = department;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Employee.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        employees,
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
      message: 'Error fetching employees',
      error: error.message
    });
  }
});

// GET /api/employees/:id - Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
});

// POST /api/employees - Create new employee
router.post('/', requireAdminOrManager, validateEmployeeData, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      department,
      position,
      wageUSD,
      address,
      emergencyContact,
      bankDetails
    } = req.body;

    // Generate employee ID
    const employeeId = await Employee.generateEmployeeId();

    const employee = new Employee({
      employeeId,
      name,
      email,
      phone,
      role,
      department,
      position,
      wageUSD,
      address,
      emergencyContact,
      bankDetails
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      res.status(400).json({
        success: false,
        message: `Employee with this ${field} already exists`
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error creating employee',
        error: error.message
      });
    }
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', requireAdminOrManager, validateEmployeeData, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
});

// DELETE /api/employees/:id - Delete employee (soft delete)
router.delete('/:id', requireAdminOrManager, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
});

// GET /api/employees/departments - Get all departments
router.get('/meta/departments', async (req, res) => {
  try {
    const departments = await Employee.distinct('department', { isActive: true });
    
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
});

module.exports = router;