import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatPKR } from '../utils/currency';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  DollarSign,
  Package,
  Users,
  Store
} from 'lucide-react';

interface SalesReport {
  period: string;
  shopCode: string;
  shopName: string;
  totalSales: number;
  totalRevenue: number;
  totalQuantitySold: number;
  topSellingArticle: string;
  averageSaleValue: number;
}

interface CollectionReport {
  collectionName: string;
  totalSales: number;
  totalRevenue: number;
  totalQuantitySold: number;
  shopBreakdown: {
    shopCode: string;
    shopName: string;
    sales: number;
    revenue: number;
  }[];
}

const SalesReports: React.FC = () => {
  const { state } = useAppContext();
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedShop, setSelectedShop] = useState('all');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [salesReports, setSalesReports] = useState<SalesReport[]>([]);
  const [collectionReports, setCollectionReports] = useState<CollectionReport[]>([]);

  const shopLocations = [
    { code: '002', name: 'Shop 1 (FP2 Lahore)' },
    { code: '003', name: 'Shop 2 (FP2 Karachi)' },
    { code: '004', name: 'Online Shop' }
  ];

  const collections = ['Sajna Lawn', 'Parwaz', 'Noor Jehan', 'Raabta', 'Custom'];

  // Initialize with sample data
  useEffect(() => {
    const sampleSalesReports: SalesReport[] = [
      {
        period: '2025-01-15',
        shopCode: '002',
        shopName: 'Shop 1 (FP2 Lahore)',
        totalSales: 12,
        totalRevenue: 54000,
        totalQuantitySold: 18,
        topSellingArticle: 'Floral Print Lawn Suit',
        averageSaleValue: 4500
      },
      {
        period: '2025-01-15',
        shopCode: '003',
        shopName: 'Shop 2 (FP2 Karachi)',
        totalSales: 8,
        totalRevenue: 36000,
        totalQuantitySold: 12,
        topSellingArticle: 'Embroidered Formal Dress',
        averageSaleValue: 4500
      },
      {
        period: '2025-01-15',
        shopCode: '004',
        shopName: 'Online Shop',
        totalSales: 5,
        totalRevenue: 22500,
        totalQuantitySold: 7,
        topSellingArticle: 'Designer Casual Wear',
        averageSaleValue: 4500
      }
    ];

    const sampleCollectionReports: CollectionReport[] = [
      {
        collectionName: 'Sajna Lawn',
        totalSales: 15,
        totalRevenue: 67500,
        totalQuantitySold: 22,
        shopBreakdown: [
          { shopCode: '002', shopName: 'Shop 1 (FP2 Lahore)', sales: 8, revenue: 36000 },
          { shopCode: '003', shopName: 'Shop 2 (FP2 Karachi)', sales: 4, revenue: 18000 },
          { shopCode: '004', shopName: 'Online Shop', sales: 3, revenue: 13500 }
        ]
      },
      {
        collectionName: 'Parwaz',
        totalSales: 10,
        totalRevenue: 45000,
        totalQuantitySold: 15,
        shopBreakdown: [
          { shopCode: '002', shopName: 'Shop 1 (FP2 Lahore)', sales: 4, revenue: 18000 },
          { shopCode: '003', shopName: 'Shop 2 (FP2 Karachi)', sales: 4, revenue: 18000 },
          { shopCode: '004', shopName: 'Online Shop', sales: 2, revenue: 9000 }
        ]
      }
    ];

    setSalesReports(sampleSalesReports);
    setCollectionReports(sampleCollectionReports);
  }, []);

  // Filter reports based on selections
  const filteredSalesReports = salesReports.filter(report => {
    const matchesShop = selectedShop === 'all' || report.shopCode === selectedShop;
    const matchesDate = report.period >= dateRange.startDate && report.period <= dateRange.endDate;
    return matchesShop && matchesDate;
  });

  const filteredCollectionReports = collectionReports.filter(report => {
    return selectedCollection === 'all' || report.collectionName === selectedCollection;
  });

  // Calculate totals
  const totalStats = {
    totalSales: filteredSalesReports.reduce((sum, report) => sum + report.totalSales, 0),
    totalRevenue: filteredSalesReports.reduce((sum, report) => sum + report.totalRevenue, 0),
    totalQuantitySold: filteredSalesReports.reduce((sum, report) => sum + report.totalQuantitySold, 0),
    averageSaleValue: filteredSalesReports.length > 0 
      ? filteredSalesReports.reduce((sum, report) => sum + report.averageSaleValue, 0) / filteredSalesReports.length 
      : 0
  };

  const exportReport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    let csvContent = '';
    let filename = '';

    if (reportType === 'daily') {
      csvContent = [
        ['Hijab Umar - Daily Sales Report'],
        [`Period: ${dateRange.startDate} to ${dateRange.endDate}`],
        [`Generated on: ${new Date().toLocaleDateString()}`],
        [''],
        ['SHOP PERFORMANCE'],
        ['Shop Code', 'Shop Name', 'Total Sales', 'Total Revenue (PKR)', 'Quantity Sold', 'Average Sale Value (PKR)', 'Top Selling Article'],
        ...filteredSalesReports.map(report => [
          report.shopCode,
          report.shopName,
          report.totalSales.toString(),
          report.totalRevenue.toFixed(2),
          report.totalQuantitySold.toString(),
          report.averageSaleValue.toFixed(2),
          report.topSellingArticle
        ]),
        [''],
        ['SUMMARY'],
        ['Total Sales', totalStats.totalSales.toString()],
        ['Total Revenue (PKR)', totalStats.totalRevenue.toFixed(2)],
        ['Total Quantity Sold', totalStats.totalQuantitySold.toString()],
        ['Average Sale Value (PKR)', totalStats.averageSaleValue.toFixed(2)]
      ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
      filename = `hijab-umar-daily-sales-report-${timestamp}.csv`;
    } else {
      csvContent = [
        ['Hijab Umar - Collection Performance Report'],
        [`Generated on: ${new Date().toLocaleDateString()}`],
        [''],
        ['COLLECTION PERFORMANCE'],
        ['Collection', 'Total Sales', 'Total Revenue (PKR)', 'Quantity Sold'],
        ...filteredCollectionReports.map(report => [
          report.collectionName,
          report.totalSales.toString(),
          report.totalRevenue.toFixed(2),
          report.totalQuantitySold.toString()
        ]),
        [''],
        ['SHOP BREAKDOWN BY COLLECTION'],
        ...filteredCollectionReports.flatMap(collection => [
          [`${collection.collectionName} - Shop Breakdown`],
          ['Shop Code', 'Shop Name', 'Sales', 'Revenue (PKR)'],
          ...collection.shopBreakdown.map(shop => [
            shop.shopCode,
            shop.shopName,
            shop.sales.toString(),
            shop.revenue.toFixed(2)
          ]),
          ['']
        ])
      ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
      filename = `hijab-umar-collection-report-${timestamp}.csv`;
    }

    const BOM = '\uFEFF';
    const finalContent = BOM + csvContent;
    const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 text-blue-600" size={32} />
            Sales Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive sales performance across all locations
          </p>
        </div>
        <button
          onClick={exportReport}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Download size={16} className="mr-2" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop</label>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Shops</option>
              {shopLocations.map(shop => (
                <option key={shop.code} value={shop.code}>{shop.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Collections</option>
              {collections.map(collection => (
                <option key={collection} value={collection}>{collection}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalSales}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatPKR(totalStats.totalRevenue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Items Sold</p>
              <p className="text-2xl font-bold text-gray-900">{totalStats.totalQuantitySold}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Sale Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatPKR(totalStats.averageSaleValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Performance Report */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Shop Performance Report</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Sale Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Top Selling
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSalesReports.map((report) => {
                const performancePercentage = totalStats.totalRevenue > 0 
                  ? (report.totalRevenue / totalStats.totalRevenue) * 100 
                  : 0;
                
                return (
                  <tr key={`${report.shopCode}-${report.period}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Store size={20} className="text-blue-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{report.shopName}</div>
                          <div className="text-sm text-gray-500">Code: {report.shopCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalSales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatPKR(report.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.totalQuantitySold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPKR(report.averageSaleValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.topSellingArticle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${performancePercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{performancePercentage.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collection Performance Report */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Collection Performance Report</h3>
        </div>
        
        <div className="space-y-6 p-6">
          {filteredCollectionReports.map((collection) => (
            <div key={collection.collectionName} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{collection.collectionName}</h4>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-xl font-bold text-green-600">{formatPKR(collection.totalRevenue)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-lg font-semibold text-gray-900">{collection.totalSales}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Quantity Sold</p>
                  <p className="text-lg font-semibold text-gray-900">{collection.totalQuantitySold}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Avg Price</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatPKR(collection.totalQuantitySold > 0 ? collection.totalRevenue / collection.totalQuantitySold : 0)}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Share</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {collection.shopBreakdown.map((shop) => {
                      const sharePercentage = collection.totalRevenue > 0 
                        ? (shop.revenue / collection.totalRevenue) * 100 
                        : 0;
                      
                      return (
                        <tr key={shop.shopCode}>
                          <td className="px-4 py-2 text-sm text-gray-900">{shop.shopName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{shop.sales}</td>
                          <td className="px-4 py-2 text-sm font-semibold text-green-600">{formatPKR(shop.revenue)}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center">
                              <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${sharePercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-600">{sharePercentage.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesReports;