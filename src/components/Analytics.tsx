import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatPKR } from '../utils/currency';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, MapPin, Calendar, Download } from 'lucide-react';

const Analytics: React.FC = () => {
  const { state, calculateProfit } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().getFullYear().toString();

  // Calculate analytics data
  const getAnalyticsData = () => {
    const filteredItems = selectedLocation === 'all' 
      ? state.stockItems 
      : state.stockItems.filter(item => item.locationId === selectedLocation);

    const totalStockValue = filteredItems.reduce((total, item) => total + (item.costPrice * item.quantity), 0);
    const totalSellingValue = filteredItems.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0);
    const potentialProfit = totalSellingValue - totalStockValue;

    // Location-wise breakdown
    const locationBreakdown = state.locations.map(location => {
      const locationItems = state.stockItems.filter(item => item.locationId === location.id);
      const stockValue = locationItems.reduce((total, item) => total + (item.costPrice * item.quantity), 0);
      const itemCount = locationItems.length;
      const totalQuantity = locationItems.reduce((total, item) => total + item.quantity, 0);
      
      return {
        location: location.name,
        stockValue,
        itemCount,
        totalQuantity
      };
    });

    // Category-wise breakdown
    const categoryBreakdown = ['shirts', 'pants', 'dresses', 'accessories'].map(category => {
      const categoryItems = filteredItems.filter(item => item.category === category);
      const stockValue = categoryItems.reduce((total, item) => total + (item.costPrice * item.quantity), 0);
      const itemCount = categoryItems.length;
      
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        stockValue,
        itemCount
      };
    });

    // Vendor performance
    const vendorPerformance = state.vendors.map(vendor => {
      const vendorItems = filteredItems.filter(item => item.vendorId === vendor.id);
      const stockValue = vendorItems.reduce((total, item) => total + (item.costPrice * item.quantity), 0);
      const itemCount = vendorItems.length;
      
      return {
        vendor: vendor.company,
        stockValue,
        itemCount,
        onTimeRate: vendor.totalDeliveries > 0 ? (vendor.onTimeDeliveries / vendor.totalDeliveries) * 100 : 0,
        returnRate: vendor.totalDeliveries > 0 ? (vendor.totalReturns / vendor.totalDeliveries) * 100 : 0
      };
    });

    return {
      totalStockValue,
      totalSellingValue,
      potentialProfit,
      locationBreakdown,
      categoryBreakdown,
      vendorPerformance
    };
  };

  const analytics = getAnalyticsData();

  const exportAnalytics = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const csvContent = [
      ['Analytics Report - Hijab Umar'],
      ['Generated on:', new Date().toLocaleDateString()],
      ['Period:', selectedPeriod],
      ['Location:', selectedLocation === 'all' ? 'All Locations' : state.locations.find(l => l.id === selectedLocation)?.name],
      [''],
      ['Summary'],
      ['Total Stock Value (PKR)', analytics.totalStockValue.toFixed(2)],
      ['Total Selling Value (PKR)', analytics.totalSellingValue.toFixed(2)],
      ['Potential Profit (PKR)', analytics.potentialProfit.toFixed(2)],
      [''],
      ['Location Breakdown'],
      ['Location', 'Stock Value (PKR)', 'Item Count', 'Total Quantity'],
      ...analytics.locationBreakdown.map(loc => [
        loc.location,
        loc.stockValue.toFixed(2),
        loc.itemCount.toString(),
        loc.totalQuantity.toString()
      ]),
      [''],
      ['Category Breakdown'],
      ['Category', 'Stock Value (PKR)', 'Item Count'],
      ...analytics.categoryBreakdown.map(cat => [
        cat.category,
        cat.stockValue.toFixed(2),
        cat.itemCount.toString()
      ])
    ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');

    const BOM = '\uFEFF';
    const finalContent = BOM + csvContent;
    const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hijab-umar-analytics-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
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
          <button
            onClick={exportAnalytics}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPKR(analytics.totalStockValue)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Potential Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPKR(analytics.totalSellingValue)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            {analytics.potentialProfit >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-500" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-500" />
            )}
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Potential Profit</p>
              <p className={`text-2xl font-bold ${analytics.potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPKR(analytics.potentialProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location Performance */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Location Performance</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.locationBreakdown.map((location, index) => {
                  const percentage = analytics.totalStockValue > 0 
                    ? (location.stockValue / analytics.totalStockValue) * 100 
                    : 0;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {location.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPKR(location.stockValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {location.itemCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {location.totalQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category & Vendor Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Category Analysis</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.categoryBreakdown.map((category, index) => {
                const percentage = analytics.totalStockValue > 0 
                  ? (category.stockValue / analytics.totalStockValue) * 100 
                  : 0;
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {category.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatPKR(category.stockValue)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {category.itemCount} items
                        </span>
                        <span className="text-xs text-gray-500">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Vendor Performance */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Vendor Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.vendorPerformance.slice(0, 5).map((vendor, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {vendor.vendor}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatPKR(vendor.stockValue)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="block">Items: {vendor.itemCount}</span>
                      <span className="block">On-time: {vendor.onTimeRate.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="block">Return Rate: {vendor.returnRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;