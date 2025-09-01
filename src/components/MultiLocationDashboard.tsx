import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ShopDashboard from './ShopDashboard';
import WarehouseDashboard from './WarehouseDashboard';
import { Store, Warehouse, MapPin, TrendingUp, Package, DollarSign } from 'lucide-react';
import { formatPKR } from '../utils/currency';

const MultiLocationDashboard: React.FC = () => {
  const { state } = useAppContext();
  const [selectedLocation, setSelectedLocation] = useState<string>('overview');

  // Define shop locations
  const shopLocations = [
    { code: '001', name: 'Warehouse (Raw Materials)', type: 'warehouse', icon: Warehouse },
    { code: '002', name: 'Shop 1 (FP2 Lahore)', type: 'shop', icon: Store },
    { code: '003', name: 'Shop 2 (FP2 Karachi)', type: 'shop', icon: Store },
    { code: '004', name: 'Online Shop', type: 'online', icon: Store }
  ];

  // Mock data for overview (in real app, this would come from API)
  const overviewStats = {
    totalLocations: shopLocations.length,
    totalArticles: 156,
    totalStockValue: 2450000,
    totalSalesToday: 45000,
    totalMaterials: 89,
    materialsValue: 125000
  };

  const locationPerformance = [
    { code: '002', name: 'Shop 1 (FP2 Lahore)', articles: 45, stockValue: 890000, salesToday: 25000, status: 'active' },
    { code: '003', name: 'Shop 2 (FP2 Karachi)', articles: 38, stockValue: 720000, salesToday: 15000, status: 'active' },
    { code: '004', name: 'Online Shop', articles: 73, stockValue: 840000, salesToday: 5000, status: 'active' }
  ];

  if (selectedLocation === '001') {
    return <WarehouseDashboard />;
  }

  if (selectedLocation !== 'overview') {
    const location = shopLocations.find(loc => loc.code === selectedLocation);
    if (location && location.type === 'shop') {
      return <ShopDashboard shopCode={selectedLocation} shopName={location.name} />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Multi-Location Overview</h1>
            <p className="text-blue-100 mt-1">Manage inventory and sales across all locations</p>
          </div>
          <MapPin size={48} className="text-blue-200" />
        </div>
      </div>

      {/* Location Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {shopLocations.map((location) => {
          const Icon = location.icon;
          const performance = locationPerformance.find(p => p.code === location.code);
          
          return (
            <div
              key={location.code}
              onClick={() => setSelectedLocation(location.code)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Icon size={24} className="text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase">
                  {location.code}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{location.name}</h3>
              
              {location.type === 'warehouse' ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Materials:</span>
                    <span className="font-medium">{overviewStats.totalMaterials}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Value:</span>
                    <span className="font-medium">{formatPKR(overviewStats.materialsValue)}</span>
                  </div>
                </div>
              ) : performance && (
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Articles:</span>
                    <span className="font-medium">{performance.articles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock Value:</span>
                    <span className="font-medium">{formatPKR(performance.stockValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales Today:</span>
                    <span className="font-medium text-green-600">{formatPKR(performance.salesToday)}</span>
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <span className="text-xs text-blue-600 font-medium">Click to manage →</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <MapPin className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Locations</p>
              <p className="text-2xl font-bold text-gray-900">{overviewStats.totalLocations}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Articles</p>
              <p className="text-2xl font-bold text-gray-900">{overviewStats.totalArticles}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatPKR(overviewStats.totalStockValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Sales Today</p>
              <p className="text-2xl font-bold text-gray-900">{formatPKR(overviewStats.totalSalesToday)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Location Performance Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Shop Performance Overview</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Articles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Today
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locationPerformance.map((location) => {
                const performancePercentage = overviewStats.totalSalesToday > 0 
                  ? (location.salesToday / overviewStats.totalSalesToday) * 100 
                  : 0;
                
                return (
                  <tr key={location.code} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Store size={20} className="text-blue-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{location.name}</div>
                          <div className="text-sm text-gray-500">Code: {location.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {location.articles}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPKR(location.stockValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatPKR(location.salesToday)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${performancePercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{performancePercentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedLocation(location.code)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Collections */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Collections</h3>
          <div className="space-y-3">
            {['Sajna Lawn', 'Parwaz', 'Noor Jehan', 'Raabta'].map((collection, index) => {
              const salesValue = [45000, 32000, 28000, 15000][index];
              const percentage = (salesValue / 120000) * 100;
              
              return (
                <div key={collection} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{collection}</span>
                      <span className="text-sm text-gray-500">{formatPKR(salesValue)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="bg-green-100 p-2 rounded-full">
                <DollarSign size={16} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Sale Recorded</p>
                <p className="text-xs text-gray-500">Shop 1 • Floral Print Suit • Rs. 4,500</p>
              </div>
              <span className="text-xs text-gray-500">2 min ago</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-full">
                <Package size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Stock Added</p>
                <p className="text-xs text-gray-500">Online Shop • New Collection Items</p>
              </div>
              <span className="text-xs text-gray-500">15 min ago</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Package size={16} className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Low Stock Alert</p>
                <p className="text-xs text-gray-500">Shop 2 • Embroidered Dress • 3 items left</p>
              </div>
              <span className="text-xs text-gray-500">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Performance Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Location Performance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Articles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Today
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locationPerformance.map((location) => {
                const performancePercentage = overviewStats.totalSalesToday > 0 
                  ? (location.salesToday / overviewStats.totalSalesToday) * 100 
                  : 0;
                
                return (
                  <tr key={location.code} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Store size={20} className="text-blue-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{location.name}</div>
                          <div className="text-sm text-gray-500">Code: {location.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {location.articles}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPKR(location.stockValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatPKR(location.salesToday)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${performancePercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{performancePercentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedLocation(location.code)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MultiLocationDashboard;