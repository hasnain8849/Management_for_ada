import React from 'react';
import { useAppContext } from '../context/AppContext';
import { formatPKR } from '../utils/currency';
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  Clock, 
  TrendingUp,
  Calendar,
  MapPin,
  Truck,
  Package,
  AlertTriangle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { getDashboardStats, state } = useAppContext();
  const stats = getDashboardStats();

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Laborers', 
      value: stats.totalLaborers,
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Present Today',
      value: stats.presentToday,
      icon: UserCheck,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Monthly Wages',
      value: formatPKR(stats.totalWagesThisMonth),
      icon: DollarSign,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Active Locations',
      value: stats.totalLocations,
      icon: MapPin,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Active Vendors',
      value: stats.totalVendors,
      icon: Truck,
      color: 'bg-pink-500',
      textColor: 'text-pink-600'
    },
    {
      title: 'Stock Value',
      value: formatPKR(stats.totalStockValue),
      icon: Package,
      color: 'bg-teal-500',
      textColor: 'text-teal-600'
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  const recentAttendance = state.attendanceRecords
    .slice(-5)
    .reverse()
    .map(record => {
      const employee = state.employees.find(emp => emp.id === record.employeeId);
      return { ...record, employeeName: employee?.name || 'Unknown' };
    });

  const upcomingWages = state.employees.slice(0, 3).map(employee => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weeklyHours = state.attendanceRecords
      .filter(record => 
        record.employeeId === employee.id &&
        new Date(record.date) >= weekStart &&
        new Date(record.date) <= weekEnd
      )
      .reduce((total, record) => total + record.hoursWorked, 0);
    
    return {
      ...employee,
      weeklyHours,
      estimatedPay: weeklyHours * employee.hourlyRate
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome to Hijab Omer</h1>
            <p className="text-blue-100 mt-1">Attendance & Wage Management System</p>
          </div>
          <Calendar size={48} className="text-blue-200" />
        </div>
        <div className="mt-4 text-sm text-blue-100">
          Today: {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h3>
          <div className="space-y-3">
            {recentAttendance.length > 0 ? recentAttendance.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    record.status === 'present' ? 'bg-green-500' : 
                    record.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{record.employeeName}</p>
                    <p className="text-sm text-gray-500">{record.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{record.hoursWorked}h</p>
                  <p className="text-xs text-gray-500 capitalize">{record.status}</p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">No recent attendance records</p>
            )}
          </div>
        </div>

        {/* Weekly Wage Estimates */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Wage Estimates</h3>
          <div className="space-y-3">
            {upcomingWages.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{employee.name}</p>
                  <p className="text-sm text-gray-500">{employee.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatPKR(employee.estimatedPay)}
                  </p>
                  <p className="text-xs text-gray-500">{employee.weeklyHours}h this week</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;