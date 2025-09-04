const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const WarehouseMaterial = require('../models/WarehouseMaterial');
require('dotenv').config();

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Shop.deleteMany({}),
      Product.deleteMany({}),
      WarehouseMaterial.deleteMany({})
    ]);

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@hijabumar.com',
      password: 'admin123',
      name: 'System Administrator',
      role: 'admin'
    });
    await adminUser.save();
    console.log('✅ Admin user created');

    // Create shops
    const shops = [
      {
        shopCode: '001',
        name: 'Warehouse (Raw Materials)',
        type: 'warehouse',
        location: {
          city: 'Lahore',
          address: 'Main Warehouse, Industrial Area'
        },
        manager: {
          name: 'Warehouse Manager',
          phone: '+92-300-1234567',
          email: 'warehouse@hijabumar.com'
        },
        operatingHours: {
          openTime: '08:00',
          closeTime: '18:00',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        }
      },
      {
        shopCode: '002',
        name: 'Shop 1 (FP2 Lahore)',
        type: 'physical',
        location: {
          city: 'Lahore',
          address: 'FP2 Market, Lahore'
        },
        manager: {
          name: 'Lahore Shop Manager',
          phone: '+92-300-2345678',
          email: 'lahore@hijabumar.com'
        },
        operatingHours: {
          openTime: '10:00',
          closeTime: '22:00',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }
      },
      {
        shopCode: '003',
        name: 'Shop 2 (FP2 Karachi)',
        type: 'physical',
        location: {
          city: 'Karachi',
          address: 'FP2 Market, Karachi'
        },
        manager: {
          name: 'Karachi Shop Manager',
          phone: '+92-300-3456789',
          email: 'karachi@hijabumar.com'
        },
        operatingHours: {
          openTime: '10:00',
          closeTime: '22:00',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }
      },
      {
        shopCode: '004',
        name: 'Online Shop',
        type: 'online',
        location: {
          city: 'Online',
          address: 'E-commerce Platform'
        },
        manager: {
          name: 'Online Manager',
          phone: '+92-300-4567890',
          email: 'online@hijabumar.com'
        },
        operatingHours: {
          openTime: '00:00',
          closeTime: '23:59',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }
      }
    ];

    await Shop.insertMany(shops);
    console.log('✅ Shops created');

    // Create sample employees
    const employees = [
      {
        employeeId: 'EMP-0001',
        name: 'Ahmed Ali',
        email: 'ahmed@hijabumar.com',
        phone: '+92-300-1111111',
        role: 'Manager',
        department: 'Operations',
        position: 'Operations Manager',
        wageUSD: 15
      },
      {
        employeeId: 'EMP-0002',
        name: 'Fatima Khan',
        email: 'fatima@hijabumar.com',
        phone: '+92-300-2222222',
        role: 'Sales Associate',
        department: 'Sales',
        position: 'Senior Sales Associate',
        wageUSD: 8
      },
      {
        employeeId: 'EMP-0003',
        name: 'Muhammad Hassan',
        email: 'hassan@hijabumar.com',
        phone: '+92-300-3333333',
        role: 'Inventory Manager',
        department: 'Inventory',
        position: 'Inventory Supervisor',
        wageUSD: 12
      }
    ];

    await Employee.insertMany(employees);
    console.log('✅ Employees created');

    // Create sample warehouse materials
    const warehouseMaterials = [
      {
        materialCode: 'MAT-0001',
        materialName: 'Premium Cotton Fabric',
        category: 'Fabric',
        quantityAvailable: 150,
        pricePerUnit: 450,
        remarks: 'High quality cotton for lawn collection',
        addedBy: 'Ahmed Ali'
      },
      {
        materialCode: 'MAT-0002',
        materialName: 'Embroidered Patches',
        category: 'Hand Work',
        quantityAvailable: 75,
        pricePerUnit: 120,
        remarks: 'Traditional embroidery work',
        addedBy: 'Ahmed Ali'
      },
      {
        materialCode: 'MAT-0003',
        materialName: 'Designer Buttons',
        category: 'Accessories',
        quantityAvailable: 500,
        pricePerUnit: 25,
        remarks: 'Assorted designer buttons',
        addedBy: 'Muhammad Hassan'
      },
      {
        materialCode: 'MAT-0004',
        materialName: 'Silk Fabric',
        category: 'Fabric',
        quantityAvailable: 80,
        pricePerUnit: 850,
        remarks: 'Premium silk for formal wear',
        addedBy: 'Ahmed Ali'
      },
      {
        materialCode: 'MAT-0005',
        materialName: 'Lace Trim',
        category: 'Accessories',
        quantityAvailable: 200,
        pricePerUnit: 35,
        remarks: 'Decorative lace for borders',
        addedBy: 'Muhammad Hassan'
      }
    ];

    await WarehouseMaterial.insertMany(warehouseMaterials);
    console.log('✅ Warehouse materials created');

    // Create sample products
    const products = [
      {
        productCode: 'PRD-0001',
        name: 'Floral Print Lawn Suit',
        collectionName: 'Sajna Lawn',
        category: 'Ready To Wear (RTW)',
        size: 'M',
        color: 'Blue',
        costPrice: 2500,
        salePrice: 4500,
        description: 'Beautiful floral print lawn suit with embroidered neckline',
        tags: ['floral', 'lawn', 'summer'],
        createdBy: 'Ahmed Ali'
      },
      {
        productCode: 'PRD-0002',
        name: 'Embroidered Formal Dress',
        collectionName: 'Parwaz',
        category: 'Sample',
        size: 'L',
        color: 'Red',
        costPrice: 4500,
        salePrice: 7500,
        description: 'Elegant embroidered formal dress for special occasions',
        tags: ['embroidered', 'formal', 'elegant'],
        createdBy: 'Ahmed Ali'
      },
      {
        productCode: 'PRD-0003',
        name: 'Traditional Kurta Set',
        collectionName: 'Noor Jehan',
        category: 'Ready To Wear (RTW)',
        size: 'S',
        color: 'Green',
        costPrice: 1800,
        salePrice: 3200,
        description: 'Traditional kurta set with matching dupatta',
        tags: ['traditional', 'kurta', 'casual'],
        createdBy: 'Fatima Khan'
      },
      {
        productCode: 'PRD-0004',
        name: 'Designer Casual Wear',
        collectionName: 'Raabta',
        category: 'Ready To Wear (RTW)',
        size: 'XL',
        color: 'Black',
        costPrice: 2200,
        salePrice: 3800,
        description: 'Modern designer casual wear for everyday use',
        tags: ['designer', 'casual', 'modern'],
        createdBy: 'Fatima Khan'
      }
    ];

    await Product.insertMany(products);
    console.log('✅ Products created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Created Data Summary:');
    console.log(`👤 Admin User: admin / admin123`);
    console.log(`👥 Employees: ${employees.length}`);
    console.log(`🏪 Shops: ${shops.length}`);
    console.log(`📦 Products: ${products.length}`);
    console.log(`🏭 Warehouse Materials: ${warehouseMaterials.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

module.exports = seedData;