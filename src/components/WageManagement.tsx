import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { WageRecord } from '../types';
import { formatPKR } from '../utils/currency';
import { DollarSign, Calendar, Download, Plus } from 'lucide-react';

const WageManagement: React.FC = () => {
  const { state, dispatch, calculateWages } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().getFullYear();

  const generateWageRecord = (employeeId: string, startDate: string, endDate: string, periodType: 'weekly' | 'monthly') => {
    const employee = state.employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const relevantRecords = state.attendanceRecords.filter(record => 
      record.employeeId === employeeId &&
      record.date >= startDate &&
      record.date <= endDate
    );

    const totalHours = relevantRecords.reduce((total, record) => total + record.hoursWorked, 0);
    const grossPay = totalHours * employee.hourlyRate;
    const deductions = grossPay * 0.1; // 10% deductions (taxes, etc.)
    const netPay = grossPay - deductions;

    const wageRecord: WageRecord = {
      id: Date.now().toString() + employeeId,
      employeeId,
      period: periodType === 'monthly' ? startDate.slice(0, 7) : `${startDate} to ${endDate}`,
      periodType,
      totalHours,
      grossPay,
      deductions,
      netPay,
      startDate,
      endDate
    };

    dispatch({ type: 'ADD_WAGE', payload: wageRecord });
  };

  const generateMonthlyWages = (month: string) => {
    const startDate = `${month}-01`;
    const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
      .toISOString().split('T')[0];

    state.employees.forEach(employee => {
      // Check if wage record already exists for this period
      const existingRecord = state.wageRecords.find(record => 
        record.employeeId === employee.id && 
        record.period === month &&
        record.periodType === 'monthly'
      );

      if (!existingRecord) {
        generateWageRecord(employee.id, startDate, endDate, 'monthly');
      }
    });

    setShowGenerateModal(false);
  };

  const generateWeeklyWages = () => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay());
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

    const startDate = currentWeekStart.toISOString().split('T')[0];
    const endDate = currentWeekEnd.toISOString().split('T')[0];

    state.employees.forEach(employee => {
      // Check if wage record already exists for this week
      const existingRecord = state.wageRecords.find(record => 
        record.employeeId === employee.id && 
        record.startDate === startDate &&
        record.periodType === 'weekly'
      );

      if (!existingRecord) {
        generateWageRecord(employee.id, startDate, endDate, 'weekly');
      }
    });

    setShowGenerateModal(false);
  };

  const filteredWageRecords = state.wageRecords.filter(record => {
    if (selectedPeriod === 'weekly') {
      return record.periodType === 'weekly';
    } else {
      return record.periodType === 'monthly';
    }
  });

  const totalPayroll = filteredWageRecords.reduce((total, record) => total + record.netPay, 0);

  const exportWageData = () => {
    const csvContent = [
      ['Employee', 'Period', 'Total Hours', 'Gross Pay', 'Deductions', 'Net Pay'],
      ...filteredWageRecords.map(record => {
        const employee = state.employees.find(emp => emp.id === record.employeeId);
        return [
          employee?.name || 'Unknown',
          record.period,
          record.totalHours.toString(),
          record.grossPay.toFixed(2),
          record.deductions.toFixed(2),
          record.netPay.toFixed(2)
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wage-records-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wage Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage weekly and monthly wages for employees and laborers
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Generate Wages
          </button>
          <button
            onClick={exportWageData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPKR(totalPayroll)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pay Records</p>
              <p className="text-2xl font-bold text-gray-900">{filteredWageRecords.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Average Pay</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPKR(filteredWageRecords.length > 0 ? (totalPayroll / filteredWageRecords.length) : 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wage Records Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {selectedPeriod === 'weekly' ? 'Weekly' : 'Monthly'} Wage Records
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hourly Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Pay
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWageRecords.map((record) => {
                const employee = state.employees.find(emp => emp.id === record.employeeId);
                if (!employee) return null;

                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.position}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.totalHours.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPKR(employee.hourlyRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPKR(record.grossPay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPKR(record.deductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        {formatPKR(record.netPay)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredWageRecords.length === 0 && (
          <div className="text-center py-12">
            <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No wage records found</h3>
            <p className="text-gray-500">Generate wage records to see them here.</p>
          </div>
        )}
      </div>

      {/* Generate Wages Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Wage Records</h3>
              
              <div className="space-y-4">
                <button
                  onClick={() => generateWeeklyWages()}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar size={20} className="mr-3 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Generate This Week's Wages</p>
                    <p className="text-sm text-gray-500">Calculate wages for the current week</p>
                  </div>
                </button>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  generateMonthlyWages(formData.get('month') as string);
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Month for Monthly Wages
                    </label>
                    <input
                      type="month"
                      name="month"
                      defaultValue={currentMonth}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <DollarSign size={20} className="mr-3 text-green-500" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Generate Monthly Wages</p>
                      <p className="text-sm text-gray-500">Calculate wages for selected month</p>
                    </div>
                  </button>
                </form>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WageManagement;