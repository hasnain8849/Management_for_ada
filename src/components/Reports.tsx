import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatPKR } from '../utils/currency';
import { FileText, Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';

const Reports: React.FC = () => {
  const { state } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportType, setReportType] = useState('summary');

  const monthlyAttendance = state.attendanceRecords.filter(record => 
    record.date.slice(0, 7) === selectedMonth
  );

  const monthlyWages = state.wageRecords.filter(record => 
    record.period.slice(0, 7) === selectedMonth && record.periodType === 'monthly'
  );

  const getEmployeeStats = () => {
    return state.employees.map(employee => {
      const employeeAttendance = monthlyAttendance.filter(record => 
        record.employeeId === employee.id
      );
      
      const totalDaysPresent = employeeAttendance.filter(record => 
        record.status === 'present'
      ).length;
      
      const totalDaysPartial = employeeAttendance.filter(record => 
        record.status === 'partial'
      ).length;
      
      const totalDaysAbsent = employeeAttendance.filter(record => 
        record.status === 'absent'
      ).length;
      
      const totalHours = employeeAttendance.reduce((total, record) => 
        total + record.hoursWorked, 0
      );
      
      const monthlyWage = monthlyWages.find(wage => wage.employeeId === employee.id);
      
      return {
        ...employee,
        totalDaysPresent,
        totalDaysPartial,
        totalDaysAbsent,
        totalHours,
        attendanceRate: employeeAttendance.length > 0 ? 
          ((totalDaysPresent + totalDaysPartial * 0.5) / employeeAttendance.length) * 100 : 0,
        monthlyPay: monthlyWage?.netPay || 0
      };
    });
  };

  const employeeStats = getEmployeeStats();
  
  const summaryStats = {
    totalEmployees: state.employees.length,
    totalLaborers: state.employees.filter(emp => emp.type === 'laborer').length,
    totalRegularEmployees: state.employees.filter(emp => emp.type === 'employee').length,
    averageAttendanceRate: employeeStats.length > 0 ? 
      employeeStats.reduce((sum, emp) => sum + emp.attendanceRate, 0) / employeeStats.length : 0,
    totalMonthlyPayroll: monthlyWages.reduce((sum, wage) => sum + wage.netPay, 0),
    totalHoursWorked: monthlyAttendance.reduce((sum, record) => sum + record.hoursWorked, 0)
  };

  const exportReport = (type: string) => {
    let csvContent = '';
    let filename = '';
    const timestamp = new Date().toISOString().split('T')[0];

    switch (type) {
      case 'attendance':
        csvContent = [
          ['Employee', 'Type', 'Days Present', 'Days Partial', 'Days Absent', 'Total Hours', 'Attendance Rate (%)'],
          ...employeeStats.map(emp => [
            emp.name,
            emp.type,
            emp.totalDaysPresent.toString(),
            emp.totalDaysPartial.toString(),
            emp.totalDaysAbsent.toString(),
            emp.totalHours.toFixed(1),
            emp.attendanceRate.toFixed(1)
          ])
        ].map(row => row.join(',')).join('\n');
        filename = `hijab-umar-attendance-report-${selectedMonth}-${timestamp}.csv`;
        break;

      case 'wages':
        csvContent = [
          ['Employee', 'Type', 'Position', 'Total Hours', 'Hourly Rate', 'Monthly Pay'],
          ...employeeStats.map(emp => [
            emp.name,
            emp.type,
            emp.position,
            emp.totalHours.toFixed(1),
            emp.hourlyRate.toFixed(2),
            emp.monthlyPay.toFixed(2)
          ])
        ].map(row => row.join(',')).join('\n');
        filename = `hijab-umar-wage-report-${selectedMonth}-${timestamp}.csv`;
        break;

      case 'summary':
        csvContent = [
          ['Metric', 'Value'],
          ['Total Employees', summaryStats.totalEmployees.toString()],
          ['Regular Employees', summaryStats.totalRegularEmployees.toString()],
          ['Laborers', summaryStats.totalLaborers.toString()],
          ['Average Attendance Rate (%)', summaryStats.averageAttendanceRate.toFixed(1)],
          ['Total Monthly Payroll (PKR)', summaryStats.totalMonthlyPayroll.toFixed(2)],
          ['Total Hours Worked', summaryStats.totalHoursWorked.toFixed(1)]
        ].map(row => row.join(',')).join('\n');
        filename = `hijab-umar-summary-report-${selectedMonth}-${timestamp}.csv`;
        break;
    }

    // Add UTF-8 BOM for proper Excel compatibility
    const BOM = '\uFEFF';
    csvContent = BOM + csvContent;

    const blob = new Blob([csvContent], { type: 'text/csv' });
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
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comprehensive reports on attendance and wage data
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <input
          title='Select Month'
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
          title='Select Report Type'
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="summary">Summary</option>
            <option value="attendance">Attendance</option>
            <option value="wages">Wages</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Workforce</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalEmployees}</p>
              <p className="text-xs text-gray-500">
                {summaryStats.totalRegularEmployees} employees, {summaryStats.totalLaborers} laborers
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryStats.averageAttendanceRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                For {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Monthly Payroll</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPKR(summaryStats.totalMonthlyPayroll)}
              </p>
              <p className="text-xs text-gray-500">
                {summaryStats.totalHoursWorked.toFixed(0)} total hours
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {reportType === 'summary' ? 'Summary Report' : 
               reportType === 'attendance' ? 'Attendance Report' : 'Wage Report'} - {
                new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </h3>
            <button
              onClick={() => exportReport(reportType)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="p-6">
          {reportType === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Workforce Overview</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Regular Employees:</span>
                    <span className="font-medium">{summaryStats.totalRegularEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Laborers:</span>
                    <span className="font-medium">{summaryStats.totalLaborers}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-medium">Total:</span>
                    <span className="font-bold">{summaryStats.totalEmployees}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Attendance:</span>
                    <span className="font-medium">{summaryStats.averageAttendanceRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Hours:</span>
                    <span className="font-medium">{summaryStats.totalHoursWorked.toFixed(0)}h</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-medium">Total Payroll:</span>
                    <span className="font-bold">{formatPKR(summaryStats.totalMonthlyPayroll)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'attendance' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partial
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeeStats.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.position}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.type === 'employee' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {employee.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.totalDaysPresent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.totalDaysPartial}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.totalDaysAbsent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.totalHours.toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.attendanceRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'wages' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Pay
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeeStats.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.type === 'employee' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {employee.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.totalHours.toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPKR(employee.hourlyRate)}/hr
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatPKR(employee.monthlyPay)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {employeeStats.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
              <p className="text-gray-500">Add employees and attendance records to generate reports.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;