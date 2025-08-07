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
}