import React, { createContext, useReducer, useContext, ReactNode } from 'react';

// Define all your types (simplified example)
type Employee = { id: string; name: string; };
type AttendanceRecord = { id: string; employeeId: string; date: string; };
type WageRecord = { id: string; employeeId: string; amount: number; };
type Location = { id: string; name: string; };
type Vendor = { id: string; name: string; };
type StockItem = { id: string; name: string; };
type StockTransfer = { id: string; itemId: string; quantity: number; };
type PayrollRecord = { id: string; employeeId: string; amount: number; };
type Collection = { id: string; name: string; };
type StockMovement = { id: string; itemId: string; quantity: number; };

// AppState type
interface AppState {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  wageRecords: WageRecord[];
  currentView: string;
  locations: Location[];
  vendors: Vendor[];
  stockItems: StockItem[];
  stockTransfers: StockTransfer[];
  stockReceiving: StockTransfer[];
  stockReturns: StockTransfer[];
  payrollRecords: PayrollRecord[];
  collections: Collection[];
  stockMovements: StockMovement[];
}

// Union type for actions
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
  | { type: 'SET_VIEW'; payload: string }
  | { type: 'SET_LOCATIONS'; payload: Location[] }
  | { type: 'ADD_LOCATION'; payload: Location }
  | { type: 'UPDATE_LOCATION'; payload: Location }
  | { type: 'SET_VENDORS'; payload: Vendor[] }
  | { type: 'ADD_VENDOR'; payload: Vendor }
  | { type: 'UPDATE_VENDOR'; payload: Vendor }
  | { type: 'SET_STOCK_ITEMS'; payload: StockItem[] }
  | { type: 'ADD_STOCK_ITEM'; payload: StockItem }
  | { type: 'UPDATE_STOCK_ITEM'; payload: StockItem }
  | { type: 'SET_STOCK_TRANSFERS'; payload: StockTransfer[] }
  | { type: 'ADD_STOCK_TRANSFER'; payload: StockTransfer }
  | { type: 'SET_PAYROLL'; payload: PayrollRecord[] }
  | { type: 'ADD_PAYROLL'; payload: PayrollRecord }
  | { type: 'SET_COLLECTIONS'; payload: Collection[] }
  | { type: 'ADD_COLLECTION'; payload: Collection }
  | { type: 'SET_STOCK_MOVEMENTS'; payload: StockMovement[] }
  | { type: 'ADD_STOCK_MOVEMENT'; payload: StockMovement }
  | { type: 'SET_ATTENDANCE_RECORDS'; payload: AttendanceRecord[] }
  | { type: 'ADD_ATTENDANCE_RECORD'; payload: AttendanceRecord };

// Initial state
const initialState: AppState = {
  employees: [],
  attendanceRecords: [],
  wageRecords: [],
  currentView: 'dashboard',
  locations: [],
  vendors: [],
  stockItems: [],
  stockTransfers: [],
  stockReceiving: [],
  stockReturns: [],
  payrollRecords: [],
  collections: [],
  stockMovements: []
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };
    // Add other cases as needed
    default:
      return state;
  }
}

// Context creation
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null
});

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use context
export const useAppContext = () => useContext(AppContext);
