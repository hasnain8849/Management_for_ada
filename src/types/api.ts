// API Types for Backend Integration

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    role: 'admin' | 'hr' | 'manager';
  };
  token: string;
  refreshToken: string;
}

export interface EmployeeRequest {
  name: string;
  email: string;
  phone: string;
  type: 'employee' | 'laborer';
  department: string;
  position: string;
  hourlyRate: number;
}

export interface AttendanceRequest {
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: 'present' | 'absent' | 'partial';
  notes?: string;
}

export interface SalaryRequest {
  employeeId: string;
  month: string;
  periodType: 'weekly' | 'monthly';
}

export interface ReportRequest {
  type: 'attendance' | 'salary' | 'summary';
  startDate: string;
  endDate: string;
  employeeIds?: string[];
  format?: 'json' | 'csv' | 'pdf';
}

// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  
  // Employees
  EMPLOYEES: '/api/employees',
  EMPLOYEE_BY_ID: (id: string) => `/api/employees/${id}`,
  
  // Attendance
  ATTENDANCE: '/api/attendance',
  ATTENDANCE_BY_DATE: (date: string) => `/api/attendance/date/${date}`,
  ATTENDANCE_BY_EMPLOYEE: (employeeId: string) => `/api/attendance/employee/${employeeId}`,
  
  // Salary
  SALARY: '/api/salary',
  SALARY_GENERATE: '/api/salary/generate',
  SALARY_BY_EMPLOYEE: (employeeId: string) => `/api/salary/employee/${employeeId}`,
  
  // Reports
  REPORTS: '/api/reports',
  REPORTS_EXPORT: '/api/reports/export',
  
  // Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats',
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];