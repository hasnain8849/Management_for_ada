import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatPKR } from '../utils/currency';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Warehouse,
  Download
} from 'lucide-react';

interface WarehouseMaterial {
  id: string;
  materialCode: string;
  materialName: string;
  category: 'Hand Work' | 'Accessories' | 'Fabric';
  quantityAvailable: number;
  pricePerUnit: number;
  remarks: string;
  addedDate: string;
  addedBy: string;
  totalValue: number;
}

const WarehouseDashboard: React.FC = () => {
  const { state } = useAppContext();
  const [materials, setMaterials] = useState<WarehouseMaterial[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<WarehouseMaterial | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'Hand Work' | 'Accessories' | 'Fabric'>('all');
  const [sortBy, setSortBy] = useState('addedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    materialName: '',
    category: 'Fabric' as 'Hand Work' | 'Accessories' | 'Fabric',
    quantityAvailable: '',
    pricePerUnit: '',
    remarks: '',
    addedBy: ''
  });

  // Initialize with sample data
  useEffect(() => {
    const sampleMaterials: WarehouseMaterial[] = [
      {
        id: '1',
        materialCode: 'MAT-0001',
        materialName: 'Premium Cotton Fabric',
        category: 'Fabric',
        quantityAvailable: 150,
        pricePerUnit: 450,
        remarks: 'High quality cotton for lawn collection',
        addedDate: '2025-01-01',
        addedBy: 'Admin',
        totalValue: 67500
      },
      {
        id: '2',
        materialCode: 'MAT-0002',
        materialName: 'Embroidered Patches',
        category: 'Hand Work',
        quantityAvailable: 75,
        pricePerUnit: 120,
        remarks: 'Traditional embroidery work',
        addedDate: '2025-01-02',
        addedBy: 'Manager',
        totalValue: 9000
      },
      {
        id: '3',
        materialCode: 'MAT-0003',
        materialName: 'Designer Buttons',
        category: 'Accessories',
        quantityAvailable: 500,
        pricePerUnit: 25,
        remarks: 'Assorted designer buttons',
        addedDate: '2025-01-03',
        addedBy: 'Admin',
        totalValue: 12500
      }
    ];
    setMaterials(sampleMaterials);
  }, []);

  // Generate next material code
  const generateMaterialCode = (): string => {
    const existingCodes = materials.map(material => material.materialCode);
    const numbers = existingCodes
      .filter(code => code.startsWith('MAT-'))
      .map(code => parseInt(code.split('-')[1]))
      .filter(num => !isNaN(num));
    
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `MAT-${nextNumber.toString().padStart(4, '0')}`;
  };

  // Filter and sort materials
  const filteredMaterials = materials
    .filter(material => {
      const matchesSearch = 
        material.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.remarks.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategory === 'all' || material.category === filterCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof WarehouseMaterial];
      const bValue = b[sortBy as keyof WarehouseMaterial];
      
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

  // Calculate summary stats
  const summaryStats = {
    totalMaterials: filteredMaterials.length,
    totalQuantity: filteredMaterials.reduce((sum, material) => sum + material.quantityAvailable, 0),
    totalValue: filteredMaterials.reduce((sum, material) => sum + material.totalValue, 0),
    lowStockItems: filteredMaterials.filter(material => material.quantityAvailable < 10).length
  };

  const categoryStats = ['Hand Work', 'Accessories', 'Fabric'].map(category => {
    const categoryMaterials = filteredMaterials.filter(m => m.category === category);
    return {
      category,
      count: categoryMaterials.length,
      totalValue: categoryMaterials.reduce((sum, m) => sum + m.totalValue, 0),
      totalQuantity: categoryMaterials.reduce((sum, m) => sum + m.quantityAvailable, 0)
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const materialData: WarehouseMaterial = {
      id: editingMaterial?.id || Date.now().toString(),
      materialCode: editingMaterial?.materialCode || generateMaterialCode(),
      materialName: formData.materialName,
      category: formData.category,
      quantityAvailable: parseInt(formData.quantityAvailable),
      pricePerUnit: parseFloat(formData.pricePerUnit),
      remarks: formData.remarks,
      addedDate: editingMaterial?.addedDate || new Date().toISOString().split('T')[0],
      addedBy: formData.addedBy,
      totalValue: parseInt(formData.quantityAvailable) * parseFloat(formData.pricePerUnit)
    };

    if (editingMaterial) {
      setMaterials(prev => prev.map(m => m.id === editingMaterial.id ? materialData : m));
    } else {
      setMaterials(prev => [...prev, materialData]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      materialName: '',
      category: 'Fabric',
      quantityAvailable: '',
      pricePerUnit: '',
      remarks: '',
      addedBy: ''
    });
    setEditingMaterial(null);
    setShowAddForm(false);
  };

  const handleEdit = (material: WarehouseMaterial) => {
    setEditingMaterial(material);
    setFormData({
      materialName: material.materialName,
      category: material.category,
      quantityAvailable: material.quantityAvailable.toString(),
      pricePerUnit: material.pricePerUnit.toString(),
      remarks: material.remarks,
      addedBy: material.addedBy
    });
    setShowAddForm(true);
  };

  const handleDelete = (materialId: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      setMaterials(prev => prev.filter(m => m.id !== materialId));
    }
  };

  const exportMaterials = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const csvContent = [
      ['Material Code', 'Material Name', 'Category', 'Quantity Available', 'Price Per Unit (PKR)', 'Total Value (PKR)', 'Added Date', 'Added By', 'Remarks'],
      ...filteredMaterials.map(material => [
        material.materialCode,
        material.materialName,
        material.category,
        material.quantityAvailable.toString(),
        material.pricePerUnit.toFixed(2),
        material.totalValue.toFixed(2),
        material.addedDate,
        material.addedBy,
        material.remarks
      ])
    ].map(row => row.join(',')).join('\n');

    const BOM = '\uFEFF';
    const finalContent = BOM + csvContent;
    const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hijab-umar-warehouse-materials-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Warehouse className="mr-3 text-blue-600" size={32} />
            Warehouse Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage raw materials inventory for all locations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={exportMaterials}
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
            Add Material
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Materials</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalMaterials}</p>
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
            <TrendingUp className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
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

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categoryStats.map((category) => (
            <div key={category.category} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{category.category}</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-medium">{category.count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-medium">{category.totalQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Value:</span>
                  <span className="font-medium">{formatPKR(category.totalValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="Hand Work">Hand Work</option>
            <option value="Accessories">Accessories</option>
            <option value="Fabric">Fabric</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="addedDate-desc">Newest First</option>
            <option value="addedDate-asc">Oldest First</option>
            <option value="materialName-asc">Name A-Z</option>
            <option value="materialName-desc">Name Z-A</option>
            <option value="quantityAvailable-desc">Highest Stock</option>
            <option value="quantityAvailable-asc">Lowest Stock</option>
            <option value="totalValue-desc">Highest Value</option>
            <option value="totalValue-asc">Lowest Value</option>
          </select>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock & Pricing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.map((material) => {
                const isLowStock = material.quantityAvailable < 10;
                
                return (
                  <tr key={material.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{material.materialCode}</span>
                          {isLowStock && (
                            <AlertTriangle size={16} className="ml-2 text-red-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-900 font-medium">{material.materialName}</div>
                        {material.remarks && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{material.remarks}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        material.category === 'Hand Work' ? 'bg-purple-100 text-purple-800' :
                        material.category === 'Accessories' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {material.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Quantity: <span className="font-medium">{material.quantityAvailable}</span></div>
                        <div>Price: <span className="font-medium">{formatPKR(material.pricePerUnit)}</span></div>
                        <div className="text-green-600 font-medium">
                          Total: {formatPKR(material.totalValue)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Date: {new Date(material.addedDate).toLocaleDateString()}</div>
                        <div>By: {material.addedBy}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-500">Add your first warehouse material to get started.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Material Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingMaterial ? 'Edit Material' : 'Add New Material'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.materialName}
                    onChange={(e) => setFormData({...formData, materialName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter material name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Fabric">Fabric</option>
                    <option value="Hand Work">Hand Work</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Available
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantityAvailable}
                    onChange={(e) => setFormData({...formData, quantityAvailable: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Per Unit (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({...formData, pricePerUnit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Added By
                  </label>
                  <select
                    required
                    value={formData.addedBy}
                    onChange={(e) => setFormData({...formData, addedBy: e.target.value})}
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
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Additional notes or remarks"
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
                    {editingMaterial ? 'Update' : 'Add'} Material
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

export default WarehouseDashboard;