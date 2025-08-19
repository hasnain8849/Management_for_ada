import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { StockItem } from '../types';
import { formatPKR } from '../utils/currency';
import { Package, Plus, Edit, Search, Filter, BarChart3, AlertTriangle, MapPin } from 'lucide-react';

const InventoryManagement: React.FC = () => {
  const { state, dispatch, getLocationStock } = useAppContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [formData, setFormData] = useState({
    itemCode: '',
    designName: '',
    collectionName: '',
    color: '',
    size: 'M' as 'S' | 'M' | 'L' | 'XL' | 'XXL',
    quantity: '',
    inHouseStock: '',
    inSourceStock: '',
    costPrice: '',
    sellingPrice: '',
    barcode: '',
    locationId: '',
    vendorId: '',
    category: '',
    description: ''
    // Enhanced stock fields
    receivedBy: '',
    supplierName: '',
    remarks: '',
    outSourceStock: ''
  });

  const filteredItems = state.stockItems.filter(item => {
    const matchesSearch = item.designName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.collectionName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || item.locationId === selectedLocation;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesLocation && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      itemCode: '',
      designName: '',
      collectionName: '',
      color: '',
      size: 'M',
      quantity: '',
      inHouseStock: '',
      inSourceStock: '',
      costPrice: '',
      sellingPrice: '',
      barcode: '',
      locationId: '',
      vendorId: '',
      category: '',
      description: ''
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData: StockItem = {
      id: editingItem?.id || Date.now().toString(),
      itemCode: formData.itemCode,
      designName: formData.designName,
      collectionName: formData.collectionName,
      color: formData.color,
      size: formData.size,
      quantity: parseInt(formData.quantity),
      inHouseStock: parseInt(formData.inHouseStock),
      inSourceStock: parseInt(formData.inSourceStock),
      costPrice: parseFloat(formData.costPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      barcode: formData.barcode,
      locationId: formData.locationId,
      vendorId: formData.vendorId,
      dateReceived: editingItem?.dateReceived || new Date().toISOString().split('T')[0],
      category: formData.category,
      description: formData.description
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
      itemCode: item.itemCode,
      designName: item.designName,
      collectionName: item.collectionName,
      color: item.color,
      size: item.size,
      quantity: item.quantity.toString(),
      inHouseStock: item.inHouseStock.toString(),
      inSourceStock: item.inSourceStock.toString(),
      costPrice: item.costPrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      barcode: item.barcode || '',
      locationId: item.locationId,
      vendorId: item.vendorId,
      category: item.category,
      description: item.description || ''
    });
    setShowAddForm(true);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: 'text-red-600', label: 'Out of Stock' };
    if (quantity < 10) return { color: 'text-yellow-600', label: 'Low Stock' };
    return { color: 'text-green-600', label: 'In Stock' };
  };

  const getSizeColor = (size: string) => {
    const colors = {
      'S': 'bg-blue-100 text-blue-800',
      'M': 'bg-green-100 text-green-800',
      'L': 'bg-yellow-100 text-yellow-800',
      'XL': 'bg-purple-100 text-purple-800',
      'XXL': 'bg-red-100 text-red-800'
    };
    return colors[size as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const totalStockValue = filteredItems.reduce((total, item) => total + (item.costPrice * item.quantity), 0);
  const lowStockItems = filteredItems.filter(item => item.quantity < 10).length;
  const outOfStockItems = filteredItems.filter(item => item.quantity === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your clothing stock across all locations
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add Stock Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{filteredItems.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatPKR(totalStockValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{outOfStockItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Locations</option>
            {state.locations.map(location => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="shirts">Shirts</option>
            <option value="pants">Pants</option>
            <option value="dresses">Dresses</option>
            <option value="accessories">Accessories</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {filteredItems.length} items found
            </span>
          </div>
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
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const location = state.locations.find(loc => loc.id === item.locationId);
                const vendor = state.vendors.find(v => v.id === item.vendorId);
                const stockStatus = getStockStatus(item.quantity);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.designName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.itemCode} • {item.collectionName}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">{item.color}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSizeColor(item.size)}`}>
                            {item.size}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin size={14} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{location?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Total: {item.quantity}</div>
                        <div className="text-xs text-gray-500">
                          In-House: {item.inHouseStock} | Source: {item.inSourceStock}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Cost: {formatPKR(item.costPrice)}</div>
                        <div>Sell: {formatPKR(item.sellingPrice)}</div>
                        <div className="text-xs text-green-600">
                          Profit: {formatPKR(item.sellingPrice - item.costPrice)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500">Add your first stock item to get started.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Edit Stock Item' : 'Add New Stock Item'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Code
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.itemCode}
                      onChange={(e) => setFormData({...formData, itemCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., HU-001"
                    />
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
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.collectionName}
                      onChange={(e) => setFormData({...formData, collectionName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    <select
                      value={formData.size}
                      onChange={(e) => setFormData({...formData, size: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="S">Small (S)</option>
                      <option value="M">Medium (M)</option>
                      <option value="L">Large (L)</option>
                      <option value="XL">Extra Large (XL)</option>
                      <option value="XXL">Double XL (XXL)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <select
                      required
                      value={formData.locationId}
                      onChange={(e) => setFormData({...formData, locationId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Location</option>
                      {state.locations.map(location => (
                        <option key={location.id} value={location.id}>{location.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor
                    </label>
                    <select
                      required
                      value={formData.vendorId}
                      onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Vendor</option>
                      {state.vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>{vendor.company}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      <option value="shirts">Shirts</option>
                      <option value="pants">Pants</option>
                      <option value="dresses">Dresses</option>
                      <option value="accessories">Accessories</option>
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
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      In-House Stock
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.inHouseStock}
                      onChange={(e) => setFormData({...formData, inHouseStock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      In-Source Stock
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.inSourceStock}
                      onChange={(e) => setFormData({...formData, inSourceStock: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
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
                      required
                      min="0"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barcode (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Out-Source Stock
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.outSourceStock}
                    placeholder="Any additional notes or remarks"
                    placeholder="External/vendor stock"
                    onChange={(e) => setFormData({...formData, outSourceStock: e.target.value})}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Received By (Employee)
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
                        {employee.name} ({employee.systemEmployeeId || employee.employeeId})
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
                    placeholder="Supplier name if different from vendor"
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
    </div>
  );
};

export default InventoryManagement;
                    Remarks (Optional)