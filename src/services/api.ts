// API Service Layer for Backend Integration

import { ApiResponse, LoginRequest, LoginResponse, EmployeeRequest, AttendanceRequest, SalaryRequest, ReportRequest, API_ENDPOINTS } from '../types/api';
import { Employee, AttendanceRecord, WageRecord, DashboardStats } from '../types';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('hijab-umar-token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication Methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data.token) {
      this.token = response.data.token;
      localStorage.setItem('hijab-umar-token', this.token);
    }

    return response.data;
  }

  async logout(): Promise<void> {
    await this.request(API_ENDPOINTS.LOGOUT, { method: 'POST' });
    this.token = null;
    localStorage.removeItem('hijab-umar-token');
  }

  // Employee Methods
  async getEmployees(): Promise<Employee[]> {
    const response = await this.request<Employee[]>(API_ENDPOINTS.EMPLOYEES);
    return response.data;
  }

  async createEmployee(employee: EmployeeRequest): Promise<Employee> {
    const response = await this.request<Employee>(API_ENDPOINTS.EMPLOYEES, {
      method: 'POST',
      body: JSON.stringify(employee),
    });
    return response.data;
  }

  async updateEmployee(id: string, employee: Partial<EmployeeRequest>): Promise<Employee> {
    const response = await this.request<Employee>(API_ENDPOINTS.EMPLOYEE_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(employee),
    });
    return response.data;
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.request(API_ENDPOINTS.EMPLOYEE_BY_ID(id), {
      method: 'DELETE',
    });
  }

  // Attendance Methods
  async getAttendance(date?: string): Promise<AttendanceRecord[]> {
    const endpoint = date 
      ? API_ENDPOINTS.ATTENDANCE_BY_DATE(date)
      : API_ENDPOINTS.ATTENDANCE;
    
    const response = await this.request<AttendanceRecord[]>(endpoint);
    return response.data;
  }

  async createAttendance(attendance: AttendanceRequest): Promise<AttendanceRecord> {
    const response = await this.request<AttendanceRecord>(API_ENDPOINTS.ATTENDANCE, {
      method: 'POST',
      body: JSON.stringify(attendance),
    });
    return response.data;
  }

  async updateAttendance(id: string, attendance: Partial<AttendanceRequest>): Promise<AttendanceRecord> {
    const response = await this.request<AttendanceRecord>(`${API_ENDPOINTS.ATTENDANCE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendance),
    });
    return response.data;
  }

  // Salary Methods
  async getSalaries(): Promise<WageRecord[]> {
    const response = await this.request<WageRecord[]>(API_ENDPOINTS.SALARY);
    return response.data;
  }

  async generateSalary(request: SalaryRequest): Promise<WageRecord> {
    const response = await this.request<WageRecord>(API_ENDPOINTS.SALARY_GENERATE, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  // Dashboard Methods
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.request<DashboardStats>(API_ENDPOINTS.DASHBOARD_STATS);
    return response.data;
  }

  // Reports Methods
  async generateReport(request: ReportRequest): Promise<any> {
    const response = await this.request(API_ENDPOINTS.REPORTS, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  async exportReport(request: ReportRequest): Promise<Blob> {
    const response = await fetch(`${this.baseURL}${API_ENDPOINTS.REPORTS_EXPORT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default ApiService;