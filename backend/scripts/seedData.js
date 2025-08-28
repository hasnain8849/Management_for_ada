const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
require('dotenv').config();

const sampleInventoryData = [
  {
    collectionName: 'Sajna Lawn',
    designName: 'Floral Paradise',
    color: 'Pink',
    size: 'M',
    inHouseStock: 25,
    outSourceStock: 15,
    receivedBy: 'Ahmad Ali',
    locationCode: '001',
    supplierName: 'Textile Mills Ltd',
    vendorName: 'Fashion Suppliers Co',
    costPrice: 1200,
    sellingPrice: 1800,
    remarks: 'Premium quality lawn fabric'
  },
  {
    collectionName: 'Parwaz',
    designName: 'Royal Elegance',
    color: 'Blue',
    size: 'L',
    inHouseStock: 30,
    outSourceStock: 20,
    receivedBy: 'Fatima Khan',
    locationCode: '002',
    supplierName: 'Elite Textiles',
    vendorName: 'Premium Fabrics Ltd',
    costPrice: 1500,
    sellingPrice: 2200,
    remarks: 'Formal wear collection'
  },
  {
    collectionName: 'Noor Jehan',
    designName: 'Traditional Beauty',
    color: 'Green',
    size: 'S',
    inHouseStock: 20,
    outSourceStock: 10,
    receivedBy: 'Hassan Ahmed',
    locationCode: '003',
    supplierName: 'Heritage Textiles',
    vendorName: 'Classic Designs Co',
    costPrice: 1000,
    sellingPrice: 1500,
    remarks: 'Traditional embroidered design'
  },
  {
    collectionName: 'Raabta',
    designName: 'Modern Chic',
    color: 'Black',
    size: 'XL',
    inHouseStock: 15,
    outSourceStock: 25,
    receivedBy: 'Ayesha Malik',
    locationCode: '004',
    supplierName: 'Modern Textiles',
    vendorName: 'Contemporary Fashion',
    costPrice: 1300,
    sellingPrice: 1900,
    remarks: 'Contemporary casual wear'
  },
  {
    collectionName: 'Sajna Lawn',
    designName: 'Summer Breeze',
    color: 'Yellow',
    size: 'M',
    inHouseStock: 35,
    outSourceStock: 5,
    receivedBy: 'Muhammad Usman',
    locationCode: '005',
    supplierName: 'Summer Collections',
    vendorName: 'Seasonal Suppliers',
    costPrice: 1100,
    sellingPrice: 1650,
    remarks: 'Light summer fabric'
  }
];

async function seedInventoryData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hijab_umar');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Inventory.deleteMany({});
    await StockMovement.deleteMany({});
    console.log('Cleared existing inventory data');

    // Insert sample data
    for (let i = 0; i < sampleInventoryData.length; i++) {
      const itemData = sampleInventoryData[i];
      
      // Generate item code
      const itemCode = await Inventory.generateItemCode();
      
      // Create inventory item
      const inventoryItem = new Inventory({
        ...itemData,
        itemCode,
        quantity: itemData.inHouseStock + itemData.outSourceStock,
        receivedDate: new Date(),
        updatedBy: itemData.receivedBy
      });

      await inventoryItem.save();

      // Create initial stock movement
      const stockMovement = new StockMovement({
        itemCode,
        movementType: 'received',
        toLocationCode: itemData.locationCode,
        quantity: itemData.inHouseStock + itemData.outSourceStock,
        processedBy: itemData.receivedBy,
        notes: `Initial stock - ${itemData.remarks}`,
        referenceNumber: `SEED-${Date.now()}-${i}`
      });

      await stockMovement.save();
      
      console.log(`Created inventory item: ${itemCode} - ${itemData.designName}`);
    }

    console.log(`Successfully seeded ${sampleInventoryData.length} inventory items`);
    
    // Display summary
    const totalItems = await Inventory.countDocuments();
    const totalStock = await Inventory.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    
    console.log(`\nInventory Summary:`);
    console.log(`Total Items: ${totalItems}`);
    console.log(`Total Stock Quantity: ${totalStock[0]?.total || 0}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding inventory data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedInventoryData();