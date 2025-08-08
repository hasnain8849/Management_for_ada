import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'hr' | 'manager';
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Demo users for authentication
const DEMO_USERS = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@hijabumar.com',
    password: 'admin123',
    role: 'admin' as const,
    name: 'System Administrator'
  },
  {
    id: '2',
    username: 'hr',
    email: 'hr@hijabumar.com',
    password: 'hr123',
    role: 'hr' as const,
    name: 'HR Manager'
  },
  {
    id: '3',
    username: 'manager',
    email: 'manager@hijabumar.com',
    password: 'manager123',
    role: 'manager' as const,
    name: 'Operations Manager'
  }
];

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      };
    case 'LOGIN_FAILURE':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: action.payload 
      };
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        error: null 
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  login: (usernameOrEmail: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      const savedUser = localStorage.getItem('hijab-umar-user');
      const sessionUser = sessionStorage.getItem('hijab-umar-user');
      
      if (savedUser || sessionUser) {
        try {
          const user = JSON.parse(savedUser || sessionUser || '');
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (error) {
          // Clear invalid session data
          localStorage.removeItem('hijab-umar-user');
          sessionStorage.removeItem('hijab-umar-user');
        }
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    checkExistingSession();
  }, []);

  const login = async (usernameOrEmail: string, password: string, rememberMe = false): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user by username or email
    const user = DEMO_USERS.find(u => 
      (u.username === usernameOrEmail || u.email === usernameOrEmail) && 
      u.password === password
    );

    if (user) {
      const userSession = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      };

      // Save session based on remember me preference
      if (rememberMe) {
        localStorage.setItem('hijab-umar-user', JSON.stringify(userSession));
      } else {
        sessionStorage.setItem('hijab-umar-user', JSON.stringify(userSession));
      }

      dispatch({ type: 'LOGIN_SUCCESS', payload: userSession });
      return true;
    } else {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid username/email or password' });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('hijab-umar-user');
    sessionStorage.removeItem('hijab-umar-user');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}