import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Employee, AttendanceRecord, WageRecord, DashboardStats, Location, Vendor, StockItem, StockTransfer, StockReceiving, StockReturn, PayrollRecord, WarehouseMaterial, ShopArticle, SalesRecord, ShopLocation } from '../types';
import { convertUSDToPKR } from '../utils/currency';

interface AppState {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  wageRecords: WageRecord[];
  currentView: string;
  // New state for enhanced features
  locations: Location[];
  vendors: Vendor[];
  stockItems: StockItem[];
  stockTransfers: StockTransfer[];
  stockReceiving: StockReceiving[];
  stockReturns: StockReturn[];
  payrollRecords: PayrollRecord[];
  // New state for enhanced features
  collections: Collection[];
  stockMovements: StockMovement[];
  attendanceRecords: AttendanceRecord[];
  // New state for multi-location system
  warehouseMaterials: WarehouseMaterial[];
  shopArticles: ShopArticle[];
  salesRecords: SalesRecord[];
  shopLocations: ShopLocation[];
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
  | { type: 'SET_VIEW'; payload: string }
  // New actions for enhanced features
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
  // New actions for enhanced features
  | { type: 'SET_COLLECTIONS'; payload: Collection[] }
  | { type: 'ADD_COLLECTION'; payload: Collection }
  | { type: 'SET_STOCK_MOVEMENTS'; payload: StockMovement[] }
  | { type: 'ADD_STOCK_MOVEMENT'; payload: StockMovement }
  | { type: 'SET_ATTENDANCE_RECORDS'; payload: AttendanceRecord[] }
  | { type: 'ADD_ATTENDANCE_RECORD'; payload: AttendanceRecord }
  // New actions for multi-location system
  | { type: 'SET_WAREHOUSE_MATERIALS'; payload: WarehouseMaterial[] }
  | { type: 'ADD_WAREHOUSE_MATERIAL'; payload: WarehouseMaterial }
  | { type: 'UPDATE_WAREHOUSE_MATERIAL'; payload: WarehouseMaterial }
  | { type: 'SET_SHOP_ARTICLES'; payload: ShopArticle[] }
  | { type: 'ADD_SHOP_ARTICLE'; payload: ShopArticle }
  | { type: 'UPDATE_SHOP_ARTICLE'; payload: ShopArticle }
  | { type: 'SET_SALES_RECORDS'; payload: SalesRecord[] }
  | { type: 'ADD_SALES_RECORD'; payload: SalesRecord }
  | { type: 'SET_SHOP_LOCATIONS'; payload: ShopLocation[] };

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
  stockMovements: [],
  warehouseMaterials: [],
  shopArticles: [],
  salesRecords: [],
  shopLocations: []
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
    // New cases for enhanced features
    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload };
    case 'ADD_LOCATION':
      return { ...state, locations: [...state.locations, action.payload] };
    case 'UPDATE_LOCATION':
      return {
        ...state,
        locations: state.locations.map(loc => 
          loc.id === action.payload.id ? action.payload : loc
        )
      };
    case 'SET_VENDORS':
      return { ...state, vendors: action.payload };
    case 'ADD_VENDOR':
      return { ...state, vendors: [...state.vendors, action.payload] };
    case 'UPDATE_VENDOR':
      return {
        ...state,
        vendors: state.vendors.map(vendor => 
          vendor.id === action.payload.id ? action.payload : vendor
        )
      };
    case 'SET_STOCK_ITEMS':
      return { ...state, stockItems: action.payload };
    case 'ADD_STOCK_ITEM':
      return { ...state, stockItems: [...state.stockItems, action.payload] };
    case 'UPDATE_STOCK_ITEM':
      return {
        ...state,
        stockItems: state.stockItems.map(item => 
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'SET_STOCK_TRANSFERS':
      return { ...state, stockTransfers: action.payload };
    case 'ADD_STOCK_TRANSFER':
      return { ...state, stockTransfers: [...state.stockTransfers, action.payload] };
    case 'SET_PAYROLL':
      return { ...state, payrollRecords: action.payload };
    case 'ADD_PAYROLL':
      return { ...state, payrollRecords: [...state.payrollRecords, action.payload] };
    // New cases for enhanced features
    case 'SET_COLLECTIONS':
      return { ...state, collections: action.payload };
    case 'ADD_COLLECTION':
      return { ...state, collections: [...state.collections, action.payload] };
    case 'SET_STOCK_MOVEMENTS':
      return { ...state, stockMovements: action.payload };
    case 'ADD_STOCK_MOVEMENT':
      return { ...state, stockMovements: [...state.stockMovements, action.payload] };
    case 'SET_ATTENDANCE_RECORDS':
      return { ...state, attendanceRecords: action.payload };
    case 'ADD_ATTENDANCE_RECORD':
      return { ...state, attendanceRecords: [...state.attendanceRecords, action.payload] };
    // New cases for multi-location system
    case 'SET_WAREHOUSE_MATERIALS':
      return { ...state, warehouseMaterials: action.payload };
    case 'ADD_WAREHOUSE_MATERIAL':
      return { ...state, warehouseMaterials: [...state.warehouseMaterials, action.payload] };
    case 'UPDATE_WAREHOUSE_MATERIAL':
      return {
        ...state,
        warehouseMaterials: state.warehouseMaterials.map(material => 
          material.id === action.payload.id ? action.payload : material
        )
      };
    case 'SET_SHOP_ARTICLES':
      return { ...state, shopArticles: action.payload };
    case 'ADD_SHOP_ARTICLE':
      return { ...state, shopArticles: [...state.shopArticles, action.payload] };
    case 'UPDATE_SHOP_ARTICLE':
      return {
        ...state,
        shopArticles: state.shopArticles.map(article => 
          article.id === action.payload.id ? action.payload : article
        )
      };
    case 'SET_SALES_RECORDS':
      return { ...state, salesRecords: action.payload };
    case 'ADD_SALES_RECORD':
      return { ...state, salesRecords: [...state.salesRecords, action.payload] };
    case 'SET_SHOP_LOCATIONS':
      return { ...state, shopLocations: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getDashboardStats: () => DashboardStats;
  calculateWages: (employeeId: string, startDate: string, endDate: string) => number;
  // New helper functions
  getLocationStock: (locationId: string) => StockItem[];
  getVendorPerformance: (vendorId: string) => { onTimeRate: number; returnRate: number };
  calculateProfit: (startDate: string, endDate: string) => number;
  // New helper functions for multi-location system
  getShopArticles: (shopCode: string) => ShopArticle[];
  getShopSales: (shopCode: string, startDate?: string, endDate?: string) => SalesRecord[];
  getWarehouseMaterialsByCategory: (category: string) => WarehouseMaterial[];
  calculateShopRevenue: (shopCode: string, startDate?: string, endDate?: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedEmployees = localStorage.getItem('hijab-umar-employees');
    const savedAttendance = localStorage.getItem('hijab-umar-attendance');
    const savedWages = localStorage.getItem('hijab-umar-wages');
    const savedLocations = localStorage.getItem('hijab-umar-locations');
    const savedVendors = localStorage.getItem('hijab-umar-vendors');
    const savedStockItems = localStorage.getItem('hijab-umar-stock-items');

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
    
    // Load new data with default locations if not exists
    if (savedLocations) {
      dispatch({ type: 'SET_LOCATIONS', payload: JSON.parse(savedLocations) });
    } else {
      // Initialize default locations
      const defaultLocations: Location[] = [
        { id: '001', code: '001', name: 'Warehouse', address: 'Main Warehouse', manager: 'Admin', phone: '', isActive: true, type: 'warehouse' },
        { id: '002', code: '002', name: 'Gulberg Shop', address: 'Gulberg, Lahore', manager: 'Manager', phone: '', isActive: true, type: 'shop' },
        { id: '003', code: '003', name: 'Dolmen Mall Lahore', address: 'Dolmen Mall, Lahore', manager: 'Manager', phone: '', isActive: true, type: 'mall' },
        { id: '004', code: '004', name: 'Dolmen Mall Karachi', address: 'Dolmen Mall, Karachi', manager: 'Manager', phone: '', isActive: true, type: 'mall' },
        { id: '005', code: '005', name: 'Online Shop', address: 'Online Platform', manager: 'Admin', phone: '', isActive: true, type: 'online' }
      ];
      dispatch({ type: 'SET_LOCATIONS', payload: defaultLocations });
      
      // Initialize default collections
      const defaultCollections: Collection[] = [
        { id: '1', name: 'Sajna Lawn', description: 'Premium lawn collection', isActive: true, createdDate: new Date().toISOString().split('T')[0] },
        { id: '2', name: 'Parwaz', description: 'Elegant formal wear', isActive: true, createdDate: new Date().toISOString().split('T')[0] },
        { id: '3', name: 'Noor Jehan', description: 'Traditional designs', isActive: true, createdDate: new Date().toISOString().split('T')[0] },
        { id: '4', name: 'Raabta', description: 'Modern casual wear', isActive: true, createdDate: new Date().toISOString().split('T')[0] }
      ];
      dispatch({ type: 'SET_COLLECTIONS', payload: defaultCollections });
    }
    
    if (savedVendors) {
      dispatch({ type: 'SET_VENDORS', payload: JSON.parse(savedVendors) });
    }
    if (savedStockItems) {
      dispatch({ type: 'SET_STOCK_ITEMS', payload: JSON.parse(savedStockItems) });
    }

    // Initialize shop locations
    const defaultShopLocations: ShopLocation[] = [
      { code: '001', name: 'Warehouse (Raw Materials)', type: 'warehouse', isActive: true },
      { code: '002', name: 'Shop 1 (FP2 Lahore)', type: 'shop', address: 'FP2 Lahore', manager: 'Manager 1', isActive: true },
      { code: '003', name: 'Shop 2 (FP2 Karachi)', type: 'shop', address: 'FP2 Karachi', manager: 'Manager 2', isActive: true },
      { code: '004', name: 'Online Shop', type: 'online', manager: 'Online Manager', isActive: true }
    ];
    dispatch({ type: 'SET_SHOP_LOCATIONS', payload: defaultShopLocations });
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

  // Save new data
  useEffect(() => {
    localStorage.setItem('hijab-umar-locations', JSON.stringify(state.locations));
  }, [state.locations]);

  useEffect(() => {
    localStorage.setItem('hijab-umar-vendors', JSON.stringify(state.vendors));
  }, [state.vendors]);

  useEffect(() => {
    localStorage.setItem('hijab-umar-stock-items', JSON.stringify(state.stockItems));
  }, [state.stockItems]);

  // Save new multi-location data
  useEffect(() => {
    localStorage.setItem('hijab-umar-warehouse-materials', JSON.stringify(state.warehouseMaterials));
  }, [state.warehouseMaterials]);

  useEffect(() => {
    localStorage.setItem('hijab-umar-shop-articles', JSON.stringify(state.shopArticles));
  }, [state.shopArticles]);

  useEffect(() => {
    localStorage.setItem('hijab-umar-sales-records', JSON.stringify(state.salesRecords));
  }, [state.salesRecords]);

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

    // Enhanced stats
    const totalStockValue = state.stockItems.reduce((total, item) => total + (item.costPrice * item.quantity), 0);
    const warehouseValue = state.warehouseMaterials.reduce((total, material) => total + (material.pricePerUnit * material.quantityAvailable), 0);
    const shopStockValue = state.shopArticles.reduce((total, article) => total + (article.salePrice * article.quantityAvailable), 0);
    const lowStockItems = state.stockItems.filter(item => item.quantity < 10).length;
    const lowStockMaterials = state.warehouseMaterials.filter(material => material.quantityAvailable < 10).length;
    const lowStockArticles = state.shopArticles.filter(article => article.quantityAvailable < 5).length;
    const monthlyProfit = calculateProfit(currentMonth + '-01', new Date().toISOString().split('T')[0]);
    
    return {
      totalEmployees,
      totalLaborers,
      presentToday,
      totalWagesThisMonth: monthlyWages,
      averageHoursPerDay: averageHours,
      attendanceRate,
      totalLocations: state.locations.filter(loc => loc.isActive).length,
      totalVendors: state.vendors.filter(vendor => vendor.status === 'active').length,
      totalStockValue: totalStockValue + warehouseValue + shopStockValue,
      monthlyProfit,
      lowStockItems: lowStockItems + lowStockMaterials + lowStockArticles
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

  const getLocationStock = (locationId: string): StockItem[] => {
    return state.stockItems.filter(item => item.locationId === locationId);
  };

  const getVendorPerformance = (vendorId: string) => {
    const vendor = state.vendors.find(v => v.id === vendorId);
    if (!vendor) return { onTimeRate: 0, returnRate: 0 };
    
    const onTimeRate = vendor.totalDeliveries > 0 ? (vendor.onTimeDeliveries / vendor.totalDeliveries) * 100 : 0;
    const returnRate = vendor.totalDeliveries > 0 ? (vendor.totalReturns / vendor.totalDeliveries) * 100 : 0;
    
    return { onTimeRate, returnRate };
  };

  const calculateProfit = (startDate: string, endDate: string): number => {
    // This would calculate profit based on sales data
    const salesInPeriod = state.salesRecords.filter(sale => 
      sale.dateOfSale >= startDate && sale.dateOfSale <= endDate
    );
    
    const totalRevenue = salesInPeriod.reduce((total, sale) => total + sale.finalAmount, 0);
    const totalCost = salesInPeriod.reduce((total, sale) => {
      const article = state.shopArticles.find(a => a.articleCode === sale.articleCode);
      return total + ((article?.costPrice || 0) * sale.quantitySold);
    }, 0);
    
    return totalRevenue - totalCost;
  };

  // New helper functions for multi-location system
  const getShopArticles = (shopCode: string): ShopArticle[] => {
    return state.shopArticles.filter(article => article.shopCode === shopCode);
  };

  const getShopSales = (shopCode: string, startDate?: string, endDate?: string): SalesRecord[] => {
    return state.salesRecords.filter(sale => {
      const matchesShop = sale.shopCode === shopCode;
      const matchesDate = !startDate || !endDate || 
        (sale.dateOfSale >= startDate && sale.dateOfSale <= endDate);
      return matchesShop && matchesDate;
    });
  };

  const getWarehouseMaterialsByCategory = (category: string): WarehouseMaterial[] => {
    return state.warehouseMaterials.filter(material => material.category === category);
  };

  const calculateShopRevenue = (shopCode: string, startDate?: string, endDate?: string): number => {
    const shopSales = getShopSales(shopCode, startDate, endDate);
    return shopSales.reduce((total, sale) => total + sale.finalAmount, 0);
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      getDashboardStats, 
      calculateWages,
      getLocationStock,
      getVendorPerformance,
      calculateProfit,
      getShopArticles,
      getShopSales,
      getWarehouseMaterialsByCategory,
      calculateShopRevenue
    }}>
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