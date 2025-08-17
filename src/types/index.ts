export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'employee' | 'laborer';
  department: string;
  position: string;
  hourlyRate: number;
  joinDate: string;
  isActive: boolean;
  // Enhanced Employee Fields
  designation: string;
  salary: number;
  wages: number;
  employeeId: string;
  contact: string;
  address: string;
  accountNo: string;
  status: 'active' | 'inactive';
  locationId: string;
  payrollType: 'daily' | 'weekly' | 'monthly';
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  hoursWorked: number;
  status: 'present' | 'absent' | 'partial';
  notes?: string;
}

export interface WageRecord {
  id: string;
  employeeId: string;
  period: string;
  periodType: 'weekly' | 'monthly';
  totalHours: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  startDate: string;
  endDate: string;
}

export interface DashboardStats {
  totalEmployees: number;
  totalLaborers: number;
  presentToday: number;
  totalWagesThisMonth: number;
  averageHoursPerDay: number;
  attendanceRate: number;
  // Enhanced Dashboard Stats
  totalLocations: number;
  totalVendors: number;
  totalStockValue: number;
  monthlyProfit: number;
  lowStockItems: number;
}

// New Types for Enhanced Features
export interface Location {
  id: string;
  code: string;
  name: string;
  address: string;
  manager: string;
  phone: string;
  isActive: boolean;
  type: 'warehouse' | 'shop' | 'mall' | 'online';
}

export interface Vendor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  performanceRating: number;
  totalDeliveries: number;
  onTimeDeliveries: number;
  totalReturns: number;
  joinDate: string;
}

export interface StockItem {
  id: string;
  itemCode: string;
  designName: string;
  collectionName: string;
  color: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  quantity: number;
  inHouseStock: number;
  inSourceStock: number;
  costPrice: number;
  sellingPrice: number;
  barcode?: string;
  qrCode?: string;
  locationId: string;
  vendorId: string;
  dateReceived: string;
  category: string;
  description?: string;
  images?: string[];
}

export interface StockTransfer {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  itemId: string;
  quantity: number;
  transferDate: string;
  status: 'pending' | 'in-transit' | 'completed' | 'cancelled';
  notes?: string;
  transferredBy: string;
  receivedBy?: string;
}

export interface StockReceiving {
  id: string;
  vendorId: string;
  locationId: string;
  receiveDate: string;
  items: {
    itemId: string;
    quantity: number;
    costPrice: number;
  }[];
  totalAmount: number;
  status: 'pending' | 'received' | 'partial';
  notes?: string;
  receivedBy: string;
}

export interface StockReturn {
  id: string;
  itemId: string;
  vendorId: string;
  locationId: string;
  quantity: number;
  returnDate: string;
  reason: 'defective' | 'wrong-item' | 'excess' | 'transfer';
  status: 'pending' | 'approved' | 'completed';
  notes?: string;
  returnedBy: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  period: string;
  periodType: 'daily' | 'weekly' | 'monthly';
  baseSalary: number;
  overtime: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  payDate: string;
  status: 'pending' | 'paid' | 'cancelled';
}