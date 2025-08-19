import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Employee } from '../types';
import { formatPKR, convertUSDToPKR } from '../utils/currency';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, Building, DollarSign } from 'lucide-react';

const EmployeeManagement: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'employee' | 'laborer'>('all');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'employee' as 'employee' | 'laborer',
    department: '',
    position: '',
    hourlyRate: '',
    // New comprehensive fields
    fullName: '',
    phoneNumber: '',
    designation: '',
    monthlySalary: '',
    dailyWages: '',
    weeklyWages: '',
    cnicId: '',
    address: '',
    bankAccountNumber: '',
    assignedLocation: ''
  });

  const filteredEmployees = state.employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || employee.type === filterType;
    return matchesSearch && matchesType;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      type: 'employee',
      department: '',
      position: '',
      hourlyRate: '',
      fullName: '',
      phoneNumber: '',
      designation: '',
      monthlySalary: '',
      dailyWages: '',
      weeklyWages: '',
      cnicId: '',
      address: '',
      bankAccountNumber: '',
      assignedLocation: ''
    });
    setEditingEmployee(null);
    setShowAddForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const employeeData: Employee = {
      id: editingEmployee?.id || Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type: formData.type,
      department: formData.department,
      position: formData.position,
      hourlyRate: parseFloat(formData.hourlyRate),
      joinDate: editingEmployee?.joinDate || new Date().toISOString().split('T')[0],
      isActive: true,
      // New comprehensive fields
      fullName: formData.fullName || formData.name,
      phoneNumber: formData.phoneNumber || formData.phone,
      designation: formData.designation || formData.position,
      monthlySalary: parseFloat(formData.monthlySalary) || 0,
      dailyWages: parseFloat(formData.dailyWages) || 0,
      weeklyWages: parseFloat(formData.weeklyWages) || 0,
      cnicId: formData.cnicId,
      systemEmployeeId: editingEmployee?.systemEmployeeId || `EMP-${Date.now().toString().slice(-6)}`,
      fullAddress: formData.address,
      bankAccountNumber: formData.bankAccountNumber,
      assignedLocation: formData.assignedLocation,
      // Legacy fields for compatibility
      salary: parseFloat(formData.monthlySalary) || 0,
      wages: parseFloat(formData.dailyWages) || 0,
      employeeId: editingEmployee?.employeeId || `EMP-${Date.now().toString().slice(-6)}`,
      contact: formData.phoneNumber || formData.phone,
      address: formData.address,
      accountNo: formData.bankAccountNumber,
      status: 'active',
      locationId: formData.assignedLocation,
      payrollType: 'monthly'
    };

    if (editingEmployee) {
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: employeeData });
    } else {
      dispatch({ type: 'ADD_EMPLOYEE', payload: employeeData });
    }

    resetForm();
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      type: employee.type,
      department: employee.department,
      position: employee.position,
      hourlyRate: employee.hourlyRate.toString(),
      fullName: employee.fullName || employee.name,
      phoneNumber: employee.phoneNumber || employee.phone,
      designation: employee.designation || employee.position,
      monthlySalary: employee.monthlySalary?.toString() || employee.salary?.toString() || '',
      dailyWages: employee.dailyWages?.toString() || employee.wages?.toString() || '',
      weeklyWages: employee.weeklyWages?.toString() || '',
      cnicId: employee.cnicId || '',
      address: employee.fullAddress || employee.address || '',
      bankAccountNumber: employee.bankAccountNumber || employee.accountNo || '',
      assignedLocation: employee.assignedLocation || employee.locationId || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (employeeId: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      dispatch({ type: 'DELETE_EMPLOYEE', payload: employeeId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your workforce of employees and laborers
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add Employee/Laborer
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'employee' | 'laborer')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="employee">Employees</option>
            <option value="laborer">Laborers</option>
          </select>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.type === 'employee' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {employee.type}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(employee)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(employee.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Mail size={14} />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={14} />
                <span>{employee.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building size={14} />
                <span>{employee.position} - {employee.department}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign size={14} />
                <span>{formatPKR(employee.hourlyRate)}/hour</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Joined: {new Date(employee.joinDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-500">Get started by adding your first employee or laborer.</p>
        </div>
      )}

      {/* Add/Edit Employee Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingEmployee ? 'Edit Employee' : 'Add New Employee/Laborer'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
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
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Salary (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.monthlySalary}
                    onChange={(e) => setFormData({...formData, monthlySalary: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter monthly salary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Wages (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.dailyWages}
                    onChange={(e) => setFormData({...formData, dailyWages: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter daily wages"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weekly Wages (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weeklyWages}
                    onChange={(e) => setFormData({...formData, weeklyWages: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter weekly wages"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
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
                    Assigned Location
                  </label>
                  <select
                    required
                    value={formData.assignedLocation}
                    onChange={(e) => setFormData({...formData, assignedLocation: e.target.value})}
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

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {editingEmployee ? 'Update' : 'Add'} Employee
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

export default EmployeeManagement;