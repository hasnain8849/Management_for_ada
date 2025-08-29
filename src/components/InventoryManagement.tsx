import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { StockItem } from '../types';
import { formatPKR } from '../utils/currency';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  Download,
  AlertTriangle,
  MapPin,
  Truck,
  Calendar,
  User,
  BarChart3
} from 'lucide-react';

const InventoryManagement: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    collection: 'all',
    size: 'all',
    color: 'all',
    location: 'all',
    vendor: 'all'
  });
  const [sortBy, setSortBy] = useState('receivedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [addFormData, setAddFormData] = useState({
    collectionName: '',
    designName: '',
    color: '',
    size: 'M' as 'S' | 'M' | 'L' | 'XL' | 'XXL',
    quantity: '',
    inHouseStock: '',
    outSourceStock: '',
    receivedBy: '',
    locationCode: '',
    supplierName: '',
    vendorName: '',
    remarks: '',
    costPrice: '',
    sellingPrice: '',
    category: 'clothing'
  });

  const [updateFormData, setUpdateFormData] = useState({
    itemCode: '',
    inHouseStock: '',
    outSourceStock: '',
    updatedBy: '',
    notes: ''
  });

  const [transferFormData, setTransferFormData] = useState({
    itemCode: '',
    fromLocationCode: '',
    toLocationCode: '',
    quantity: '',
    transferredBy: '',
    notes: ''
  });

  // Generate next item code
  const generateItemCode = (): string => {
    const existingCodes = state.stockItems.map(item => item.itemCode);
    const numbers = existingCodes
      .filter(code => code.startsWith('ITM-'))
      .map(code => parseInt(code.split('-')[1]))
      .filter(num => !isNaN(num));
    
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `ITM-${nextNumber.toString().padStart(4, '0')}`;
  };

  // Filter and sort items
  const filteredItems = state.stockItems
    .filter(item => {
      const matchesSearch = 
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.designName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCollection = filters.collection === 'all' || item.collectionName === filters.collection;
      const matchesSize = filters.size === 'all' || item.size === filters.size;
      const matchesColor = filters.color === 'all' || item.color.toLowerCase().includes(filters.color.toLowerCase());
      const matchesLocation = filters.location === 'all' || item.locationId === filters.location;
      const matchesVendor = filters.vendor === 'all' || item.vendorName.toLowerCase().includes(filters.vendor.toLowerCase());

      return matchesSearch && matchesCollection && matchesSize && matchesColor && matchesLocation && matchesVendor;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof StockItem];
      const bValue = b[sortBy as keyof StockItem];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  // Get unique values for filters
  const collections = [...new Set(state.stockItems.map(item => item.collectionName))];
  const colors = [...new Set(state.stockItems.map(item => item.color))];
  const vendors = [...new Set(state.stockItems.map(item => item.vendorName))];

  // Calculate summary stats
  const summaryStats = {
    totalItems: filteredItems.length,
    totalQuantity: filteredItems.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: filteredItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0),
    lowStockItems: filteredItems.filter(item => item.quantity < 10).length
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newItem: StockItem = {
      id: Date.now().toString(),
      itemCode: generateItemCode(),
      collectionName: addFormData.collectionName,
      designName: addFormData.designName,
      color: addFormData.color,
      size: addFormData.size,
      quantity: parseInt(addFormData.quantity),
      inHouseStock: parseInt(addFormData.inHouseStock) || parseInt(addFormData.quantity),
      outSourceStock: parseInt(addFormData.outSourceStock) || 0,
      costPrice: parseFloat(addFormData.costPrice),
      sellingPrice: parseFloat(addFormData.sellingPrice),
      locationId: addFormData.locationCode,
      vendorId: '', // Will be set based on vendor name
      dateReceived: new Date().toISOString().split('T')[0],
      category: addFormData.category,
      description: addFormData.remarks,
      // Additional fields for compatibility
      barcode: '',
      qrCode: '',
      images: [],
      receivedBy: addFormData.receivedBy,
      supplierName: addFormData.supplierName,
      remarks: addFormData.remarks,
      vendorName: addFormData.vendorName
    };

    dispatch({ type: 'ADD_STOCK_ITEM', payload: newItem });
    
    // Reset form
    setAddFormData({
      collectionName: '',
      designName: '',
      color: '',
      size: 'M',
      quantity: '',
      inHouseStock: '',
      outSourceStock: '',
      receivedBy: '',
      locationCode: '',
      supplierName: '',
      vendorName: '',
      remarks: '',
      costPrice: '',
      sellingPrice: '',
      category: 'clothing'
    });
    setShowAddForm(false);
  };

  const handleUpdateStock = (e: React.FormEvent) => {
    e.preventDefault();
    
    const item = state.stockItems.find(item => item.itemCode === updateFormData.itemCode);
    if (!item) return;

    const updatedItem: StockItem = {
      ...item,
      inHouseStock: parseInt(updateFormData.inHouseStock) || item.inHouseStock,
      outSourceStock: parseInt(updateFormData.outSourceStock) || item.outSourceStock,
      quantity: (parseInt(updateFormData.inHouseStock) || item.inHouseStock) + 
                (parseInt(updateFormData.outSourceStock) || item.outSourceStock)
    };

    dispatch({ type: 'UPDATE_STOCK_ITEM', payload: updatedItem });
    
    // Reset form
    setUpdateFormData({
      itemCode: '',
      inHouseStock: '',
      outSourceStock: '',
      updatedBy: '',
      notes: ''
    });
    setShowUpdateForm(false);
  };

  const handleTransferStock = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sourceItem = state.stockItems.find(item => 
      item.itemCode === transferFormData.itemCode && 
      item.locationId === transferFormData.fromLocationCode
    );
    
    if (!sourceItem) return;

    const transferQuantity = parseInt(transferFormData.quantity);
    if (sourceItem.inHouseStock < transferQuantity) {
      alert('Insufficient stock for transfer');
      return;
    }

    // Update source item
    const updatedSourceItem: StockItem = {
      ...sourceItem,
      inHouseStock: sourceItem.inHouseStock - transferQuantity,
      quantity: sourceItem.quantity - transferQuantity
    };

    dispatch({ type: 'UPDATE_STOCK_ITEM', payload: updatedSourceItem });

    // Check if destination item exists
    let destinationItem = state.stockItems.find(item =>
      item.collectionName === sourceItem.collectionName &&
      item.designName === sourceItem.designName &&
      item.color === sourceItem.color &&
      item.size === sourceItem.size &&
      item.locationId === transferFormData.toLocationCode
    );

    if (destinationItem) {
      // Update existing destination item
      const updatedDestinationItem: StockItem = {
        ...destinationItem,
        inHouseStock: destinationItem.inHouseStock + transferQuantity,
        quantity: destinationItem.quantity + transferQuantity
      };
      dispatch({ type: 'UPDATE_STOCK_ITEM', payload: updatedDestinationItem });
    } else {
      // Create new destination item
      const newDestinationItem: StockItem = {
        ...sourceItem,
        id: Date.now().toString(),
        itemCode: generateItemCode(),
        locationId: transferFormData.toLocationCode,
        inHouseStock: transferQuantity,
        outSourceStock: 0,
        quantity: transferQuantity,
        receivedBy: transferFormData.transferredBy,
        remarks: `Transferred from ${transferFormData.fromLocationCode}`
      };
      dispatch({ type: 'ADD_STOCK_ITEM', payload: newDestinationItem });
    }

    // Reset form
    setTransferFormData({
      itemCode: '',
      fromLocationCode: '',
      toLocationCode: '',
      quantity: '',
      transferredBy: '',
      notes: ''
    });
    setShowTransferForm(false);
  };

  const exportInventory = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const csvContent = [
      ['Item Code', 'Collection', 'Design', 'Color', 'Size', 'Quantity', 'In-House', 'Out-Source', 'Cost Price', 'Selling Price', 'Location', 'Vendor', 'Received Date', 'Received By'],
      ...filteredItems.map(item => [
        item.itemCode,
        item.collectionName,
        item.designName,
        item.color,
        item.size,
        item.quantity.toString(),
        item.inHouseStock.toString(),
        item.outSourceStock.toString(),
        item.costPrice.toFixed(2),
        item.sellingPrice.toFixed(2),
        state.locations.find(loc => loc.code === item.locationId)?.name || item.locationId,
        item.vendorName,
        item.dateReceived,
        item.receivedBy
      ])
    ].map(row => row.join(',')).join('\n');

    const BOM = '\uFEFF';
    const finalContent = BOM + csvContent;
    const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hijab-umar-inventory-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage stock across all locations and collections
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setShowUpdateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowUpDown size={16} className="mr-2" />
            Update Stock
          </button>
          <button
            onClick={() => setShowTransferForm(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowUpDown size={16} className="mr-2" />
            Transfer Stock
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Add Item
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalItems}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalQuantity}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatPKR(summaryStats.totalValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.lowStockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.collection}
            onChange={(e) => setFilters({...filters, collection: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Collections</option>
            {collections.map(collection => (
              <option key={collection} value={collection}>{collection}</option>
            ))}
          </select>
          
          <select
            value={filters.size}
            onChange={(e) => setFilters({...filters, size: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Sizes</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
          </select>
          
          <select
            value={filters.location}
            onChange={(e) => setFilters({...filters, location: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Locations</option>
            {state.locations.map(location => (
              <option key={location.id} value={location.code}>
                {location.code} - {location.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="receivedDate">Date Received</option>
              <option value="itemCode">Item Code</option>
              <option value="designName">Design Name</option>
              <option value="quantity">Quantity</option>
              <option value="costPrice">Cost Price</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowUpDown size={16} />
            </button>
          </div>
          
          <button
            onClick={exportInventory}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location & Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const location = state.locations.find(loc => loc.code === item.locationId);
                const isLowStock = item.quantity < 10;
                
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{item.itemCode}</span>
                          {isLowStock && (
                            <AlertTriangle size={16} className="ml-2 text-red-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{item.collectionName}</div>
                        <div className="text-sm text-gray-900">{item.designName}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {item.color}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {item.size}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">Total: {item.quantity}</div>
                        <div className="text-gray-500">In-House: {item.inHouseStock}</div>
                        <div className="text-gray-500">Out-Source: {item.outSourceStock}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Cost: {formatPKR(item.costPrice)}</div>
                        <div>Selling: {formatPKR(item.sellingPrice)}</div>
                        <div className="text-xs text-green-600">
                          Profit: {formatPKR(item.sellingPrice - item.costPrice)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-1 text-gray-400" />
                          {location?.name || item.locationId}
                        </div>
                        <div className="flex items-center mt-1">
                          <Truck size={14} className="mr-1 text-gray-400" />
                          {item.vendorName}
                        </div>
                        <div className="flex items-center mt-1">
                          <Calendar size={14} className="mr-1 text-gray-400" />
                          {new Date(item.dateReceived).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setUpdateFormData({
                              itemCode: item.itemCode,
                              inHouseStock: item.inHouseStock.toString(),
                              outSourceStock: item.outSourceStock.toString(),
                              updatedBy: '',
                              notes: ''
                            });
                            setShowUpdateForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
            <p className="text-gray-500">Add your first inventory item to get started.</p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Inventory Item</h3>
              
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Collection Name
                    </label>
                    <select
                      required
                      value={addFormData.collectionName}
                      onChange={(e) => setAddFormData({...addFormData, collectionName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Collection</option>
                      <option value="Sajna Lawn">Sajna Lawn</option>
                      <option value="Parwaz">Parwaz</option>
                      <option value="Noor Jehan">Noor Jehan</option>
                      <option value="Raabta">Raabta</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Design Name
                    </label>
                    <input
                      type="text"
                      required
                      value={addFormData.designName}
                      onChange={(e) => setAddFormData({...addFormData, designName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter design name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      required
                      value={addFormData.color}
                      onChange={(e) => setAddFormData({...addFormData, color: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter color"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    <select
                      required
                      value={addFormData.size}
                      onChange={(e) => setAddFormData({...addFormData, size: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Quantity
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={addFormData.quantity}
                      onChange={(e) => setAddFormData({...addFormData, quantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      In-House Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={addFormData.inHouseStock}
                      onChange={(e) => setAddFormData({...addFormData, inHouseStock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Leave empty to use total quantity"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Out-Source Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={addFormData.outSourceStock}
                      onChange={(e) => setAddFormData({...addFormData, outSourceStock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location Code
                    </label>
                    <select
                      required
                      value={addFormData.locationCode}
                      onChange={(e) => setAddFormData({...addFormData, locationCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Location</option>
                      {state.locations.map(location => (
                        <option key={location.id} value={location.code}>
                          {location.code} - {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor Name
                    </label>
                    <select
                      required
                      value={addFormData.vendorName}
                      onChange={(e) => setAddFormData({...addFormData, vendorName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Vendor</option>
                      {state.vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.name}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Received By
                    </label>
                    <select
                      required
                      value={addFormData.receivedBy}
                      onChange={(e) => setAddFormData({...addFormData, receivedBy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Employee</option>
                      {state.employees.map(employee => (
                        <option key={employee.id} value={employee.name}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={addFormData.costPrice}
                      onChange={(e) => setAddFormData({...addFormData, costPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={addFormData.sellingPrice}
                      onChange={(e) => setAddFormData({...addFormData, sellingPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={addFormData.supplierName}
                      onChange={(e) => setAddFormData({...addFormData, supplierName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Supplier name if different from vendor"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks (Optional)
                    </label>
                    <textarea
                      value={addFormData.remarks}
                      onChange={(e) => setAddFormData({...addFormData, remarks: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Additional notes or remarks"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Update Stock Modal */}
      {showUpdateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Stock Quantity</h3>
              
              <form onSubmit={handleUpdateStock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Code
                  </label>
                  <select
                    required
                    value={updateFormData.itemCode}
                    onChange={(e) => setUpdateFormData({...updateFormData, itemCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Item</option>
                    {state.stockItems.map(item => (
                      <option key={item.id} value={item.itemCode}>
                        {item.itemCode} - {item.designName} ({item.color}, {item.size})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    In-House Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={updateFormData.inHouseStock}
                    onChange={(e) => setUpdateFormData({...updateFormData, inHouseStock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Out-Source Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={updateFormData.outSourceStock}
                    onChange={(e) => setUpdateFormData({...updateFormData, outSourceStock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Updated By
                  </label>
                  <select
                    required
                    value={updateFormData.updatedBy}
                    onChange={(e) => setUpdateFormData({...updateFormData, updatedBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {state.employees.map(employee => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={updateFormData.notes}
                    onChange={(e) => setUpdateFormData({...updateFormData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Reason for stock update"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUpdateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Update Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Stock Modal */}
      {showTransferForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Stock</h3>
              
              <form onSubmit={handleTransferStock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Code
                  </label>
                  <select
                    required
                    value={transferFormData.itemCode}
                    onChange={(e) => setTransferFormData({...transferFormData, itemCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Item</option>
                    {state.stockItems.filter(item => item.inHouseStock > 0).map(item => (
                      <option key={item.id} value={item.itemCode}>
                        {item.itemCode} - {item.designName} (Available: {item.inHouseStock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Location
                  </label>
                  <select
                    required
                    value={transferFormData.fromLocationCode}
                    onChange={(e) => setTransferFormData({...transferFormData, fromLocationCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Source Location</option>
                    {state.locations.map(location => (
                      <option key={location.id} value={location.code}>
                        {location.code} - {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Location
                  </label>
                  <select
                    required
                    value={transferFormData.toLocationCode}
                    onChange={(e) => setTransferFormData({...transferFormData, toLocationCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Destination Location</option>
                    {state.locations.filter(loc => loc.code !== transferFormData.fromLocationCode).map(location => (
                      <option key={location.id} value={location.code}>
                        {location.code} - {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity to Transfer
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={transferFormData.quantity}
                    onChange={(e) => setTransferFormData({...transferFormData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transferred By
                  </label>
                  <select
                    required
                    value={transferFormData.transferredBy}
                    onChange={(e) => setTransferFormData({...transferFormData, transferredBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {state.employees.map(employee => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transfer Notes
                  </label>
                  <textarea
                    value={transferFormData.notes}
                    onChange={(e) => setTransferFormData({...transferFormData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Reason for transfer"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTransferForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Transfer Stock
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;