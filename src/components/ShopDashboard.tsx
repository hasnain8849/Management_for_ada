import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatPKR } from '../utils/currency';
import { 
  Store, 
  Plus, 
  Search, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Filter,
  Download,
  AlertTriangle,
  Edit,
  BarChart3
} from 'lucide-react';

interface ShopArticle {
  id: string;
  articleCode: string;
  articleName: string;
  collectionName: string;
  category: 'Sample' | 'Ready To Wear (RTW)';
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color: string;
  salePrice: number;
  quantityAvailable: number;
  quantitySold: number;
  dateAdded: string;
  shopCode: string;
  addedBy: string;
}

interface SalesRecord {
  id: string;
  saleID: string;
  articleCode: string;
  articleName: string;
  collectionName: string;
  size: string;
  color: string;
  salePrice: number;
  quantitySold: number;
  dateOfSale: string;
  soldBy: string;
  shopCode: string;
  customerName?: string;
  paymentMethod: string;
  finalAmount: number;
}

interface ShopDashboardProps {
  shopCode: string;
  shopName: string;
}

const ShopDashboard: React.FC<ShopDashboardProps> = ({ shopCode, shopName }) => {
  const { state } = useAppContext();
  const [articles, setArticles] = useState<ShopArticle[]>([]);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [showAddArticleForm, setShowAddArticleForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ShopArticle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    collection: 'all',
    category: 'all',
    size: 'all'
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [articleFormData, setArticleFormData] = useState({
    articleName: '',
    collectionName: '',
    category: 'Ready To Wear (RTW)' as 'Sample' | 'Ready To Wear (RTW)',
    size: 'M' as 'S' | 'M' | 'L' | 'XL' | 'XXL',
    color: '',
    salePrice: '',
    quantityAvailable: '',
    addedBy: ''
  });

  const [saleFormData, setSaleFormData] = useState({
    articleCode: '',
    quantitySold: '',
    soldBy: '',
    customerName: '',
    paymentMethod: 'Cash',
    discount: '',
    notes: ''
  });

  // Initialize with sample data
  useEffect(() => {
    const sampleArticles: ShopArticle[] = [
      {
        id: '1',
        articleCode: 'ART-0001',
        articleName: 'Floral Print Lawn Suit',
        collectionName: 'Sajna Lawn',
        category: 'Ready To Wear (RTW)',
        size: 'M',
        color: 'Blue',
        salePrice: 4500,
        quantityAvailable: 12,
        quantitySold: 8,
        dateAdded: '2025-01-01',
        shopCode,
        addedBy: 'Manager'
      },
      {
        id: '2',
        articleCode: 'ART-0002',
        articleName: 'Embroidered Formal Dress',
        collectionName: 'Parwaz',
        category: 'Sample',
        size: 'L',
        color: 'Red',
        salePrice: 7500,
        quantityAvailable: 3,
        quantitySold: 2,
        dateAdded: '2025-01-02',
        shopCode,
        addedBy: 'Admin'
      }
    ];

    const sampleSales: SalesRecord[] = [
      {
        id: '1',
        saleID: 'SALE-0001',
        articleCode: 'ART-0001',
        articleName: 'Floral Print Lawn Suit',
        collectionName: 'Sajna Lawn',
        size: 'M',
        color: 'Blue',
        salePrice: 4500,
        quantitySold: 2,
        dateOfSale: '2025-01-15',
        soldBy: 'Sales Person',
        shopCode,
        customerName: 'Fatima Khan',
        paymentMethod: 'Cash',
        finalAmount: 9000
      }
    ];

    setArticles(sampleArticles);
    setSalesRecords(sampleSales);
  }, [shopCode]);

  // Generate next article code
  const generateArticleCode = (): string => {
    const existingCodes = articles.map(article => article.articleCode);
    const numbers = existingCodes
      .filter(code => code.startsWith('ART-'))
      .map(code => parseInt(code.split('-')[1]))
      .filter(num => !isNaN(num));
    
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `ART-${nextNumber.toString().padStart(4, '0')}`;
  };

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = 
      article.articleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.articleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.color.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCollection = filters.collection === 'all' || article.collectionName === filters.collection;
    const matchesCategory = filters.category === 'all' || article.category === filters.category;
    const matchesSize = filters.size === 'all' || article.size === filters.size;

    return matchesSearch && matchesCollection && matchesCategory && matchesSize;
  });

  // Calculate summary stats
  const summaryStats = {
    totalArticles: filteredArticles.length,
    totalStock: filteredArticles.reduce((sum, article) => sum + article.quantityAvailable, 0),
    totalSold: filteredArticles.reduce((sum, article) => sum + article.quantitySold, 0),
    totalStockValue: filteredArticles.reduce((sum, article) => sum + (article.salePrice * article.quantityAvailable), 0),
    totalRevenue: salesRecords
      .filter(sale => sale.dateOfSale >= dateRange.startDate && sale.dateOfSale <= dateRange.endDate)
      .reduce((sum, sale) => sum + sale.finalAmount, 0),
    lowStockItems: filteredArticles.filter(article => article.quantityAvailable < 5).length
  };

  const handleAddArticle = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newArticle: ShopArticle = {
      id: Date.now().toString(),
      articleCode: generateArticleCode(),
      articleName: articleFormData.articleName,
      collectionName: articleFormData.collectionName,
      category: articleFormData.category,
      size: articleFormData.size,
      color: articleFormData.color,
      salePrice: parseFloat(articleFormData.salePrice),
      quantityAvailable: parseInt(articleFormData.quantityAvailable),
      quantitySold: 0,
      dateAdded: new Date().toISOString().split('T')[0],
      shopCode,
      addedBy: articleFormData.addedBy
    };

    setArticles(prev => [...prev, newArticle]);
    
    // Reset form
    setArticleFormData({
      articleName: '',
      collectionName: '',
      category: 'Ready To Wear (RTW)',
      size: 'M',
      color: '',
      salePrice: '',
      quantityAvailable: '',
      addedBy: ''
    });
    setShowAddArticleForm(false);
  };

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    
    const article = articles.find(a => a.articleCode === saleFormData.articleCode);
    if (!article) return;

    const quantitySold = parseInt(saleFormData.quantitySold);
    if (article.quantityAvailable < quantitySold) {
      alert('Insufficient stock available');
      return;
    }

    // Generate sale ID
    const saleID = `SALE-${(salesRecords.length + 1).toString().padStart(4, '0')}`;
    
    const grossAmount = article.salePrice * quantitySold;
    const discount = parseFloat(saleFormData.discount) || 0;
    const finalAmount = grossAmount - discount;

    const newSale: SalesRecord = {
      id: Date.now().toString(),
      saleID,
      articleCode: article.articleCode,
      articleName: article.articleName,
      collectionName: article.collectionName,
      size: article.size,
      color: article.color,
      salePrice: article.salePrice,
      quantitySold,
      dateOfSale: new Date().toISOString().split('T')[0],
      soldBy: saleFormData.soldBy,
      shopCode,
      customerName: saleFormData.customerName,
      paymentMethod: saleFormData.paymentMethod,
      finalAmount
    };

    setSalesRecords(prev => [...prev, newSale]);

    // Update article stock
    setArticles(prev => prev.map(a => 
      a.articleCode === article.articleCode 
        ? { ...a, quantityAvailable: a.quantityAvailable - quantitySold, quantitySold: a.quantitySold + quantitySold }
        : a
    ));

    // Reset form
    setSaleFormData({
      articleCode: '',
      quantitySold: '',
      soldBy: '',
      customerName: '',
      paymentMethod: 'Cash',
      discount: '',
      notes: ''
    });
    setShowSaleForm(false);
  };

  const exportShopData = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const csvContent = [
      [`${shopName} - Inventory & Sales Report`],
      [`Generated on: ${new Date().toLocaleDateString()}`],
      [''],
      ['INVENTORY'],
      ['Article Code', 'Article Name', 'Collection', 'Category', 'Size', 'Color', 'Sale Price', 'Available', 'Sold', 'Stock Value'],
      ...filteredArticles.map(article => [
        article.articleCode,
        article.articleName,
        article.collectionName,
        article.category,
        article.size,
        article.color,
        article.salePrice.toFixed(2),
        article.quantityAvailable.toString(),
        article.quantitySold.toString(),
        (article.salePrice * article.quantityAvailable).toFixed(2)
      ]),
      [''],
      ['SALES RECORDS'],
      ['Sale ID', 'Article Code', 'Article Name', 'Quantity Sold', 'Sale Price', 'Total Amount', 'Date', 'Sold By'],
      ...salesRecords
        .filter(sale => sale.dateOfSale >= dateRange.startDate && sale.dateOfSale <= dateRange.endDate)
        .map(sale => [
          sale.saleID,
          sale.articleCode,
          sale.articleName,
          sale.quantitySold.toString(),
          sale.salePrice.toFixed(2),
          sale.finalAmount.toFixed(2),
          sale.dateOfSale,
          sale.soldBy
        ])
    ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');

    const BOM = '\uFEFF';
    const finalContent = BOM + csvContent;
    const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shopName.toLowerCase().replace(/\s+/g, '-')}-report-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Store className="mr-3 text-blue-600" size={32} />
            {shopName}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Shop Code: {shopCode} • Inventory & Sales Management
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={exportShopData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
          <button
            onClick={() => setShowSaleForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <ShoppingCart size={16} className="mr-2" />
            Record Sale
          </button>
          <button
            onClick={() => setShowAddArticleForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Add Article
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Articles</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalArticles}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Stock Available</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalStock}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Items Sold</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalSold}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Revenue Today</p>
              <p className="text-2xl font-bold text-gray-900">{formatPKR(summaryStats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
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
            <option value="Sajna Lawn">Sajna Lawn</option>
            <option value="Parwaz">Parwaz</option>
            <option value="Noor Jehan">Noor Jehan</option>
            <option value="Raabta">Raabta</option>
            <option value="Custom">Custom</option>
          </select>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="Sample">Sample</option>
            <option value="Ready To Wear (RTW)">Ready To Wear (RTW)</option>
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

          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Article Inventory</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pricing
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
              {filteredArticles.map((article) => {
                const isLowStock = article.quantityAvailable < 5;
                const totalQuantity = article.quantityAvailable + article.quantitySold;
                const sellThroughRate = totalQuantity > 0 ? (article.quantitySold / totalQuantity) * 100 : 0;
                
                return (
                  <tr key={article.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{article.articleCode}</span>
                          {isLowStock && (
                            <AlertTriangle size={16} className="ml-2 text-red-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-900 font-medium">{article.articleName}</div>
                        <div className="text-sm text-gray-500">{article.collectionName}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {article.color}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {article.size}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            article.category === 'Sample' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {article.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">Available: {article.quantityAvailable}</div>
                        <div className="text-gray-500">Sold: {article.quantitySold}</div>
                        <div className="text-gray-500">Total: {totalQuantity}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{formatPKR(article.salePrice)}</div>
                        <div className="text-green-600 text-xs">
                          Stock Value: {formatPKR(article.salePrice * article.quantityAvailable)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(sellThroughRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{sellThroughRate.toFixed(1)}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Sell-through rate</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSaleFormData({
                              ...saleFormData,
                              articleCode: article.articleCode
                            });
                            setShowSaleForm(true);
                          }}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Record Sale"
                        >
                          <ShoppingCart size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedArticle(article);
                            setArticleFormData({
                              articleName: article.articleName,
                              collectionName: article.collectionName,
                              category: article.category,
                              size: article.size,
                              color: article.color,
                              salePrice: article.salePrice.toString(),
                              quantityAvailable: article.quantityAvailable.toString(),
                              addedBy: article.addedBy
                            });
                            setShowAddArticleForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit Article"
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

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500">Add your first article to get started.</p>
          </div>
        )}
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Sales</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sale Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity & Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer & Payment
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesRecords.slice(0, 10).map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sale.saleID}</div>
                      <div className="text-sm text-gray-500">{new Date(sale.dateOfSale).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-500">By: {sale.soldBy}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sale.articleName}</div>
                      <div className="text-sm text-gray-500">{sale.collectionName}</div>
                      <div className="text-sm text-gray-500">{sale.color} • {sale.size}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Qty: <span className="font-medium">{sale.quantitySold}</span></div>
                      <div>Price: <span className="font-medium">{formatPKR(sale.salePrice)}</span></div>
                      <div className="text-green-600 font-medium">
                        Total: {formatPKR(sale.finalAmount)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>{sale.customerName || 'Walk-in Customer'}</div>
                      <div className="text-gray-500">{sale.paymentMethod}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Article Modal */}
      {showAddArticleForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedArticle ? 'Edit Article' : 'Add New Article'}
              </h3>
              
              <form onSubmit={handleAddArticle} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Article Name
                  </label>
                  <input
                    type="text"
                    required
                    value={articleFormData.articleName}
                    onChange={(e) => setArticleFormData({...articleFormData, articleName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection
                  </label>
                  <select
                    required
                    value={articleFormData.collectionName}
                    onChange={(e) => setArticleFormData({...articleFormData, collectionName: e.target.value})}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      required
                      value={articleFormData.category}
                      onChange={(e) => setArticleFormData({...articleFormData, category: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Ready To Wear (RTW)">Ready To Wear (RTW)</option>
                      <option value="Sample">Sample</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    <select
                      required
                      value={articleFormData.size}
                      onChange={(e) => setArticleFormData({...articleFormData, size: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    required
                    value={articleFormData.color}
                    onChange={(e) => setArticleFormData({...articleFormData, color: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sale Price (PKR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={articleFormData.salePrice}
                      onChange={(e) => setArticleFormData({...articleFormData, salePrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={articleFormData.quantityAvailable}
                      onChange={(e) => setArticleFormData({...articleFormData, quantityAvailable: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Added By
                  </label>
                  <select
                    required
                    value={articleFormData.addedBy}
                    onChange={(e) => setArticleFormData({...articleFormData, addedBy: e.target.value})}
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

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddArticleForm(false);
                      setSelectedArticle(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {selectedArticle ? 'Update' : 'Add'} Article
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Record Sale Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Record New Sale</h3>
              
              <form onSubmit={handleRecordSale} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Article
                  </label>
                  <select
                    required
                    value={saleFormData.articleCode}
                    onChange={(e) => setSaleFormData({...saleFormData, articleCode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Article</option>
                    {articles.filter(a => a.quantityAvailable > 0).map(article => (
                      <option key={article.id} value={article.articleCode}>
                        {article.articleCode} - {article.articleName} (Available: {article.quantityAvailable})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Sold
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={saleFormData.quantitySold}
                      onChange={(e) => setSaleFormData({...saleFormData, quantitySold: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount (PKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={saleFormData.discount}
                      onChange={(e) => setSaleFormData({...saleFormData, discount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sold By
                  </label>
                  <select
                    required
                    value={saleFormData.soldBy}
                    onChange={(e) => setSaleFormData({...saleFormData, soldBy: e.target.value})}
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
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={saleFormData.customerName}
                    onChange={(e) => setSaleFormData({...saleFormData, customerName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={saleFormData.paymentMethod}
                    onChange={(e) => setSaleFormData({...saleFormData, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Online">Online</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSaleForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Record Sale
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

export default ShopDashboard;