import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Vendor } from '../types';
import { Truck, Plus, Edit, Trash2, Mail, Phone, Building, Star, TrendingUp, AlertCircle } from 'lucide-react';

const VendorManagement: React.FC = () => {
  const { state, dispatch, getVendorPerformance } = useAppContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive',;
    // Enhanced vendor fields
    vendorName: '',
    cnicId: '',
    contactNumber: '',
    fullAddress: '',
    bankAccountNumber: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      status: 'active', // Added comma here
      vendorName: '',
      cnicId: '',
      contactNumber: '',
      fullAddress: '',
      bankAccountNumber: ''
    });
    setEditingVendor(null);
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const vendorData: Vendor = {
      id: editingVendor?.id || Date.now().toString(),
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      status: formData.status,
      performanceRating: editingVendor?.performanceRating || 5,
      totalDeliveries: editingVendor?.totalDeliveries || 0,
      onTimeDeliveries: editingVendor?.onTimeDeliveries || 0,
      totalReturns: editingVendor?.totalReturns || 0,
      joinDate: editingVendor?.joinDate || new Date().toISOString().split('T')[0], // Added comma here
      // Enhanced vendor fields
      vendorName: formData.vendorName || formData.name,
      cnicId: formData.cnicId,
      contactNumber: formData.contactNumber || formData.phone,
      fullAddress: formData.fullAddress || formData.address,
      bankAccountNumber: formData.bankAccountNumber,
      dateJoined: editingVendor?.dateJoined || new Date().toISOString().split('T')[0]
    };

    if (editingVendor) {
      dispatch({ type: 'UPDATE_VENDOR', payload: vendorData });
    } else {
      dispatch({ type: 'ADD_VENDOR', payload: vendorData });
    }

    resetForm();
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      company: vendor.company,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      status: vendor.status,
      vendorName: vendor.vendorName || vendor.name,
      cnicId: vendor.cnicId || '',
      contactNumber: vendor.contactNumber || vendor.phone,
      fullAddress: vendor.fullAddress || vendor.address,
      bankAccountNumber: vendor.bankAccountNumber || ''
    });
    setShowAddForm(true);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your suppliers and track their performance
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add Vendor
        </button>
      </div>

      {/* Vendor Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Truck className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{state.vendors.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Vendors</p>
              <p className="text-2xl font-bold text-gray-900">
                {state.vendors.filter(v => v.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {state.vendors.length > 0 
                  ? (state.vendors.reduce((sum, v) => sum + v.performanceRating, 0) / state.vendors.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.vendors.map((vendor) => {
          const performance = getVendorPerformance(vendor.id);
          
          return (
            <div key={vendor.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Truck size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                    <p className="text-sm text-gray-500">{vendor.company}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(vendor)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <Mail size={14} />
                  <span>{vendor.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone size={14} />
                  <span>{vendor.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building size={14} />
                  <span className="truncate">{vendor.address}</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rating:</span>
                  <div className="flex items-center space-x-1">
                    {getRatingStars(vendor.performanceRating)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">On-time Rate:</span>
                  <span className="text-sm font-medium text-green-600">
                    {performance.onTimeRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Deliveries:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {vendor.totalDeliveries}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                  {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                </span>
                <div className="text-xs text-gray-500">
                  Since: {new Date(vendor.joinDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.vendors.length === 0 && (
        <div className="text-center py-12">
          <Truck size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
          <p className="text-gray-500">Add your first vendor to get started.</p>
        </div>
      )}

      {/* Add/Edit Vendor Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vendorName}
                    onChange={(e) => setFormData({...formData, vendorName: e.target.value, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNIC / ID Card Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cnicId}
                    onChange={(e) => setFormData({...formData, cnicId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12345-1234567-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    required
                    value={formData.fullAddress}
                    onChange={(e) => setFormData({...formData, fullAddress: e.target.value, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Complete address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Bank account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
                    {editingVendor ? 'Update' : 'Add'} Vendor
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

export default VendorManagement;