import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Employee, AttendanceRecord, WageRecord, DashboardStats } from '../types';
import { convertUSDToPKR } from '../utils/currency';

interface AppState {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  wageRecords: WageRecord[];
  currentView: string;
}

type AppAction = 
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'SET_ATTENDANCE'; payload: AttendanceRecord[] }
  | { type: 'ADD_ATTENDANCE'; payload: AttendanceRecord }
  | { type: 'UPDATE_ATTENDANCE'; payload: AttendanceRecord }
  | { type: 'SET_WAGES'; payload: WageRecord[] }
  | { type: 'ADD_WAGE'; payload: WageRecord }
  | { type: 'SET_VIEW'; payload: string };

const initialState: AppState = {
  employees: [],
  attendanceRecords: [],
  wageRecords: [],
  currentView: 'dashboard'
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(emp => 
          emp.id === action.payload.id ? action.payload : emp
        )
      };
    case 'DELETE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.filter(emp => emp.id !== action.payload)
      };
    case 'SET_ATTENDANCE':
      return { ...state, attendanceRecords: action.payload };
    case 'ADD_ATTENDANCE':
      return { ...state, attendanceRecords: [...state.attendanceRecords, action.payload] };
    case 'UPDATE_ATTENDANCE':
      return {
        ...state,
        attendanceRecords: state.attendanceRecords.map(record =>
          record.id === action.payload.id ? action.payload : record
        )
      };
    case 'SET_WAGES':
      return { ...state, wageRecords: action.payload };
    case 'ADD_WAGE':
      return { ...state, wageRecords: [...state.wageRecords, action.payload] };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getDashboardStats: () => DashboardStats;
  calculateWages: (employeeId: string, startDate: string, endDate: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedEmployees = localStorage.getItem('hijab-umar-employees');
    const savedAttendance = localStorage.getItem('hijab-umar-attendance');
    const savedWages = localStorage.getItem('hijab-umar-wages');

    if (savedEmployees) {
      const employees = JSON.parse(savedEmployees);
      // Convert existing USD rates to PKR if needed
      const convertedEmployees = employees.map((emp: Employee) => ({
        ...emp,
        hourlyRate: emp.hourlyRate < 100 ? convertUSDToPKR(emp.hourlyRate) : emp.hourlyRate
      }));
      dispatch({ type: 'SET_EMPLOYEES', payload: convertedEmployees });
    }
    if (savedAttendance) {
      dispatch({ type: 'SET_ATTENDANCE', payload: JSON.parse(savedAttendance) });
    }
    if (savedWages) {
      const wages = JSON.parse(savedWages);
      // Convert existing USD wages to PKR if needed
      const convertedWages = wages.map((wage: WageRecord) => ({
        ...wage,
        grossPay: wage.grossPay < 10000 ? convertUSDToPKR(wage.grossPay) : wage.grossPay,
        deductions: wage.deductions < 1000 ? convertUSDToPKR(wage.deductions) : wage.deductions,
        netPay: wage.netPay < 10000 ? convertUSDToPKR(wage.netPay) : wage.netPay
      }));
      dispatch({ type: 'SET_WAGES', payload: convertedWages });
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('hijab-umar-employees', JSON.stringify(state.employees));
  }, [state.employees]);

  useEffect(() => {
    localStorage.setItem('hijab-umar-attendance', JSON.stringify(state.attendanceRecords));
  }, [state.attendanceRecords]);

  useEffect(() => {
    localStorage.setItem('hijab-umar-wages', JSON.stringify(state.wageRecords));
  }, [state.wageRecords]);

  const getDashboardStats = (): DashboardStats => {
    const totalEmployees = state.employees.filter(emp => emp.type === 'employee').length;
    const totalLaborers = state.employees.filter(emp => emp.type === 'laborer').length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = state.attendanceRecords.filter(record => record.date === today);
    const presentToday = todayAttendance.filter(record => record.status === 'present').length;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyWages = state.wageRecords
      .filter(wage => wage.startDate.slice(0, 7) === currentMonth)
      .reduce((total, wage) => total + wage.netPay, 0);
    
    const recentRecords = state.attendanceRecords.slice(-30);
    const averageHours = recentRecords.length > 0 
      ? recentRecords.reduce((total, record) => total + record.hoursWorked, 0) / recentRecords.length
      : 0;
    
    const attendanceRate = state.employees.length > 0 
      ? (presentToday / state.employees.length) * 100 
      : 0;

    return {
      totalEmployees,
      totalLaborers,
      presentToday,
      totalWagesThisMonth: monthlyWages,
      averageHoursPerDay: averageHours,
      attendanceRate
    };
  };

  const calculateWages = (employeeId: string, startDate: string, endDate: string): number => {
    const employee = state.employees.find(emp => emp.id === employeeId);
    if (!employee) return 0;

    const relevantRecords = state.attendanceRecords.filter(record => 
      record.employeeId === employeeId &&
      record.date >= startDate &&
      record.date <= endDate
    );

    const totalHours = relevantRecords.reduce((total, record) => total + record.hoursWorked, 0);
    return totalHours * employee.hourlyRate;
  };

  return (
    <AppContext.Provider value={{ state, dispatch, getDashboardStats, calculateWages }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}