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
  Eye,
  RefreshCw
} from 'lucide-react';

const InventoryManagement: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    collectionName: 'all',
    color: 'all',
    size: 'all',
    locationCode: 'all',
    vendorName: 'all',
    lowStock: false
  });

  const [formData, setFormData] = useState({
    collectionName: 'Sajna Lawn',
    designName: '',
    color: '',
    size: 'M' as 'S' | 'M' | 'L' | 'XL' | 'XXL',
    inHouseStock: '',
    outSourceStock: '',
    receivedBy: '',
    locationCode: '001',
    supplierName: '',
    vendorName: '',
    remarks: '',
    costPrice: '',
    sellingPrice: ''
  });

  const [transferData, setTransferData] = useState({
    itemCode: '',
    fromLocationCode: '',
    toLocationCode: '',
    quantity: '',
    transferredBy: '',
    notes: ''
  });

  const collections = ['Sajna Lawn', 'Parwaz', 'Noor Jehan', 'Raabta'];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  // Filter inventory items
  const filteredItems = state.stockItems.filter(item => {
    const matchesSearch = 
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilters = 
      (filters.collectionName === 'all' || item.collectionName === filters.collectionName) &&
      (filters.color === 'all' || item.color.toLowerCase().includes(filters.color.toLowerCase())) &&
      (filters.size === 'all' || item.size === filters.size) &&
      (filters.locationCode === 'all' || item.locationId === filters.locationCode) &&
      (filters.vendorName === 'all' || item.vendorId.toLowerCase().includes(filters.vendorName.toLowerCase())) &&
      (!filters.lowStock || item.quantity < 10);

    return matchesSearch && matchesFilters;
  });

  const resetForm = () => {
    setFormData({
      collectionName: 'Sajna Lawn',
      designName: '',
      color: '',
      size: 'M',
      inHouseStock: '',
      outSourceStock: '',
      receivedBy: '',
      locationCode: '001',
      supplierName: '',
      vendorName: '',
      remarks: '',
      costPrice: '',
      sellingPrice: ''
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const generateItemCode = () => {
    const existingCodes = state.stockItems.map(item => item.itemCode);
    let nextNumber = 1;
    
    while (existingCodes.includes(`ITM-${nextNumber.toString().padStart(4, '0')}`)) {
      nextNumber++;
    }
    
    return `ITM-${nextNumber.toString().padStart(4, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const inHouseStock = parseInt(formData.inHouseStock) || 0;
    const outSourceStock = parseInt(formData.outSourceStock) || 0;
    const totalQuantity = inHouseStock + outSourceStock;

    const itemData: StockItem = {
      id: editingItem?.id || Date.now().toString(),
      itemCode: editingItem?.itemCode || generateItemCode(),
      designName: formData.designName,
      collectionName: formData.collectionName,
      color: formData.color,
      size: formData.size,
      quantity: totalQuantity,
      inHouseStock,
      outSourceStock,
      costPrice: parseFloat(formData.costPrice) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      locationId: formData.locationCode,
      vendorId: formData.vendorName,
      dateReceived: editingItem?.dateReceived || new Date().toISOString().split('T')[0],
      category: 'clothing',
      receivedBy: formData.receivedBy,
      supplierName: formData.supplierName,
      remarks: formData.remarks
    };

    if (editingItem) {
      dispatch({ type: 'UPDATE_STOCK_ITEM', payload: itemData });
    } else {
      dispatch({ type: 'ADD_STOCK_ITEM', payload: itemData });
    }

    resetForm();
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      collectionName: item.collectionName,
      designName: item.designName,
      color: item.color,
      size: item.size,
      inHouseStock: item.inHouseStock.toString(),
      outSourceStock: item.outSourceStock.toString(),
      receivedBy: item.receivedBy || '',
      locationCode: item.locationId,
      supplierName: item.supplierName || '',
      vendorName: item.vendorId,
      remarks: item.remarks || '',
      costPrice: item.costPrice.toString(),
      sellingPrice: item.sellingPrice.toString()
    });
    setShowAddForm(true);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sourceItem = state.stockItems.find(item => item.itemCode === transferData.itemCode);
    if (!sourceItem) return;

    const transferQuantity = parseInt(transferData.quantity);
    if (sourceItem.inHouseStock < transferQuantity) {
      alert('Insufficient stock for transfer');
      return;
    }

    // Update source item
    const updatedSourceItem = {
      ...sourceItem,
      inHouseStock: sourceItem.inHouseStock - transferQuantity,
      quantity: sourceItem.quantity - transferQuantity
    };
    dispatch({ type: 'UPDATE_STOCK_ITEM', payload: updatedSourceItem });

    // Find or create destination item
    let destinationItem = state.stockItems.find(item => 
      item.collectionName === sourceItem.collectionName &&
      item.designName === sourceItem.designName &&
      item.color === sourceItem.color &&
      item.size === sourceItem.size &&
      item.locationId === transferData.toLocationCode
    );

    if (destinationItem) {
      // Update existing destination item
      const updatedDestinationItem = {
        ...destinationItem,
        inHouseStock: destinationItem.inHouseStock + transferQuantity,
        quantity: destinationItem.quantity + transferQuantity
      };
      dispatch({ type: 'UPDATE_STOCK_ITEM', payload: updatedDestinationItem });
    } else {
      // Create new item at destination
      const newDestinationItem: StockItem = {
        ...sourceItem,
        id: Date.now().toString(),
        itemCode: generateItemCode(),
        locationId: transferData.toLocationCode,
        inHouseStock: transferQuantity,
        outSourceStock: 0,
        quantity: transferQuantity,
        receivedBy: transferData.transferredBy,
        dateReceived: new Date().toISOString().split('T')[0],
        remarks: `Transferred from ${transferData.fromLocationCode}`
      };
      dispatch({ type: 'ADD_STOCK_ITEM', payload: newDestinationItem });
    }

    setShowTransferModal(false);
    setTransferData({
      itemCode: '',
      fromLocationCode: '',
      toLocationCode: '',
      quantity: '',
      transferredBy: '',
      notes: ''
    });
  };

  const exportInventory = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const csvContent = [
      ['Item Code', 'Collection', 'Design', 'Color', 'Size', 'In-House Stock', 'Out-Source Stock', 'Total Quantity', 'Cost Price', 'Selling Price', 'Location', 'Vendor', 'Received Date', 'Received By'],
      ...filteredItems.map(item => {
        const location = state.locations.find(loc => loc.id === item.locationId);
        return [
          item.itemCode,
          item.collectionName,
          item.designName,
          item.color,
          item.size,
          item.inHouseStock.toString(),
          item.outSourceStock.toString(),
          item.quantity.toString(),
          item.costPrice.toFixed(2),
          item.sellingPrice.toFixed(2),
          location?.name || item.locationId,
          item.vendorId,
          item.dateReceived,
          item.receivedBy || ''
        ];
      })
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

  const getStockStatusColor = (quantity: number) => {
    if (quantity === 0) return 'text-red-600 bg-red-50';
    if (quantity < 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
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
            onClick={() => setShowTransferModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowUpDown size={16} className="mr-2" />
            Transfer Stock
          </button>
          <button
            onClick={exportInventory}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download size={16} className="mr-2" />
            Export
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
            value={filters.collectionName}
            onChange={(e) => setFilters({...filters, collectionName: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Collections</option>
            {collections.map(collection => (
              <option key={collection} value={collection}>{collection}</option>
            ))}
          </select>

          <select
            value={filters.size}
            onChange={(e) => setFilters({...filters, size: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Sizes</option>
            {sizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>

          <select
            value={filters.locationCode}
            onChange={(e) => setFilters({...filters, locationCode: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Locations</option>
            {state.locations.map(location => (
              <option key={location.id} value={location.code}>
                {location.code} - {location.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={(e) => setFilters({...filters, lowStock: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show low stock only</span>
          </label>
          
          <div className="text-sm text-gray-500">
            Showing {filteredItems.length} of {state.stockItems.length} items
          </div>
        </div>
      </div>

      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-lg font-semibold text-gray-900">{state.stockItems.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Stock</p>
              <p className="text-lg font-semibold text-gray-900">
                {state.stockItems.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-lg font-semibold text-gray-900">
                {state.stockItems.filter(item => item.quantity < 10).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Stock Value</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatPKR(state.stockItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Inventory Items</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const location = state.locations.find(loc => loc.id === item.locationId || loc.code === item.locationId);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.itemCode}</div>
                        <div className="text-sm text-gray-500">{item.designName}</div>
                        <div className="text-xs text-gray-400">{item.color} • {item.size}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.collectionName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(item.quantity)}`}>
                          Total: {item.quantity}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          In-House: {item.inHouseStock} • Out-Source: {item.outSourceStock}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {location?.name || item.locationId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.vendorId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Cost: {formatPKR(item.costPrice)}</div>
                        <div className="text-green-600">Sell: {formatPKR(item.sellingPrice)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setTransferData({
                              ...transferData,
                              itemCode: item.itemCode,
                              fromLocationCode: item.locationId
                            });
                            setShowTransferModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          <ArrowUpDown size={16} />
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

      {/* Add/Edit Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Collection Name
                    </label>
                    <select
                      required
                      value={formData.collectionName}
                      onChange={(e) => setFormData({...formData, collectionName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {collections.map(collection => (
                        <option key={collection} value={collection}>{collection}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Design Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.designName}
                      onChange={(e) => setFormData({...formData, designName: e.target.value})}
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
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
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
                      value={formData.size}
                      onChange={(e) => setFormData({...formData, size: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {sizes.map(size => (
                        <option key={size} value={size}>{size}</option>
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
                      required
                      value={formData.inHouseStock}
                      onChange={(e) => setFormData({...formData, inHouseStock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Out-Source Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.outSourceStock}
                      onChange={(e) => setFormData({...formData, outSourceStock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <select
                      required
                      value={formData.locationCode}
                      onChange={(e) => setFormData({...formData, locationCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
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
                      value={formData.vendorName}
                      onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Vendor</option>
                      {state.vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.name}>
                          {vendor.name} - {vendor.company}
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
                      value={formData.receivedBy}
                      onChange={(e) => setFormData({...formData, receivedBy: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Employee</option>
                      {state.employees.map(employee => (
                        <option key={employee.id} value={employee.name}>
                          {employee.name} - {employee.position}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
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
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Any additional notes..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingItem ? 'Update' : 'Add'} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Stock</h3>
              
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Code
                  </label>
                  <select
                    required
                    value={transferData.itemCode}
                    onChange={(e) => {
                      const selectedItem = state.stockItems.find(item => item.itemCode === e.target.value);
                      setTransferData({
                        ...transferData,
                        itemCode: e.target.value,
                        fromLocationCode: selectedItem?.locationId || ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Item</option>
                    {state.stockItems.filter(item => item.inHouseStock > 0).map(item => (
                      <option key={item.id} value={item.itemCode}>
                        {item.itemCode} - {item.designName} ({item.inHouseStock} available)
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
                    value={transferData.fromLocationCode}
                    onChange={(e) => setTransferData({...transferData, fromLocationCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!!transferData.itemCode}
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
                    value={transferData.toLocationCode}
                    onChange={(e) => setTransferData({...transferData, toLocationCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Destination Location</option>
                    {state.locations.filter(loc => loc.code !== transferData.fromLocationCode).map(location => (
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
                    min="1"
                    required
                    value={transferData.quantity}
                    onChange={(e) => setTransferData({...transferData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transferred By
                  </label>
                  <select
                    required
                    value={transferData.transferredBy}
                    onChange={(e) => setTransferData({...transferData, transferredBy: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {state.employees.map(employee => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={transferData.notes}
                    onChange={(e) => setTransferData({...transferData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Transfer notes..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
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