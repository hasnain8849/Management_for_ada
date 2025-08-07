import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { AttendanceRecord } from '../types';
import { Clock, Calendar, Check, X, AlertCircle, Plus } from 'lucide-react';

const AttendanceManagement: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const todayRecords = state.attendanceRecords.filter(record => record.date === selectedDate);
  const employeesWithoutRecord = state.employees.filter(employee => 
    !todayRecords.some(record => record.employeeId === employee.id)
  );

  const handleQuickClockIn = (employeeId: string) => {
    const now = new Date();
    const clockInTime = now.toTimeString().slice(0, 5);
    
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      employeeId,
      date: selectedDate,
      clockIn: clockInTime,
      hoursWorked: 0,
      status: 'present'
    };

    dispatch({ type: 'ADD_ATTENDANCE', payload: newRecord });
  };

  const handleClockOut = (recordId: string) => {
    const record = state.attendanceRecords.find(r => r.id === recordId);
    if (!record || !record.clockIn) return;

    const now = new Date();
    const clockOutTime = now.toTimeString().slice(0, 5);
    
    // Calculate hours worked
    const clockIn = new Date(`2000-01-01T${record.clockIn}:00`);
    const clockOut = new Date(`2000-01-01T${clockOutTime}:00`);
    const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    const updatedRecord: AttendanceRecord = {
      ...record,
      clockOut: clockOutTime,
      hoursWorked: Math.max(hoursWorked, 0),
      status: hoursWorked >= 6 ? 'present' : 'partial'
    };

    dispatch({ type: 'UPDATE_ATTENDANCE', payload: updatedRecord });
  };

  const handleManualEntry = (employeeId: string, clockIn: string, clockOut: string, notes: string) => {
    const clockInTime = new Date(`2000-01-01T${clockIn}:00`);
    const clockOutTime = new Date(`2000-01-01T${clockOut}:00`);
    const hoursWorked = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      employeeId,
      date: selectedDate,
      clockIn,
      clockOut,
      hoursWorked: Math.max(hoursWorked, 0),
      status: hoursWorked >= 6 ? 'present' : hoursWorked > 0 ? 'partial' : 'absent',
      notes
    };

    dispatch({ type: 'ADD_ATTENDANCE', payload: newRecord });
    setShowClockInModal(false);
  };

  const markAbsent = (employeeId: string) => {
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      employeeId,
      date: selectedDate,
      hoursWorked: 0,
      status: 'absent',
      notes: 'Marked absent'
    };

    dispatch({ type: 'ADD_ATTENDANCE', payload: newRecord });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <Check size={16} className="text-green-600" />;
      case 'partial': return <AlertCircle size={16} className="text-yellow-600" />;
      case 'absent': return <X size={16} className="text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track daily attendance for all employees and laborers
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <Check className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Present</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayRecords.filter(r => r.status === 'present').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Partial</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayRecords.filter(r => r.status === 'partial').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <X className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Absent</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayRecords.filter(r => r.status === 'absent').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg Hours</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayRecords.length > 0 
                  ? (todayRecords.reduce((sum, r) => sum + r.hoursWorked, 0) / todayRecords.length).toFixed(1)
                  : '0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions for Employees Without Records */}
      {employeesWithoutRecord.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Clock-In</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeesWithoutRecord.map((employee) => (
              <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-500">{employee.position}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleQuickClockIn(employee.id)}
                      className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                    >
                      Clock In
                    </button>
                    <button
                      onClick={() => markAbsent(employee.id)}
                      className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                    >
                      Absent
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Attendance Records for {new Date(selectedDate).toLocaleDateString()}
            </h3>
            <button
              onClick={() => setShowClockInModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Manual Entry
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
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
              {todayRecords.map((record) => {
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
                      {record.clockIn || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clockOut || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.hoursWorked.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        <span className="ml-1 capitalize">{record.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.clockIn && !record.clockOut && (
                        <button
                          onClick={() => handleClockOut(record.id)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Clock Out
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {todayRecords.length === 0 && (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
            <p className="text-gray-500">No attendance has been recorded for this date yet.</p>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {showClockInModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Attendance Entry</h3>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleManualEntry(
                  formData.get('employeeId') as string,
                  formData.get('clockIn') as string,
                  formData.get('clockOut') as string,
                  formData.get('notes') as string
                );
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    name="employeeId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Employee</option>
                    {employeesWithoutRecord.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clock In Time
                  </label>
                  <input
                    type="time"
                    name="clockIn"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Clock Out Time
                  </label>
                  <input
                    type="time"
                    name="clockOut"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional notes..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowClockInModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Record
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

export default AttendanceManagement;