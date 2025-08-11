// Input Validation Utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export function validateField(value: any, rule: ValidationRule): string | null {
  // Required validation
  if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return 'This field is required';
  }

  // Skip other validations if field is empty and not required
  if (!value && !rule.required) {
    return null;
  }

  // String validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return `Minimum length is ${rule.minLength} characters`;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return `Maximum length is ${rule.maxLength} characters`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return 'Invalid format';
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return `Minimum value is ${rule.min}`;
    }

    if (rule.max !== undefined && value > rule.max) {
      return `Maximum value is ${rule.max}`;
    }
  }

  // Custom validation
  if (rule.custom) {
    return rule.custom(value);
  }

  return null;
}

export function validateForm(data: any, rules: ValidationRules): ValidationErrors {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach(field => {
    const error = validateField(data[field], rules[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
}

// Common validation rules
export const commonRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },
  
  phone: {
    pattern: /^[\+]?[0-9\-\(\)\s]+$/,
    minLength: 10,
    custom: (value: string) => {
      if (value && !/^[\+]?[0-9\-\(\)\s]{10,}$/.test(value)) {
        return 'Please enter a valid phone number';
      }
      return null;
    }
  },
  
  password: {
    minLength: 6,
    custom: (value: string) => {
      if (value && value.length < 6) {
        return 'Password must be at least 6 characters long';
      }
      return null;
    }
  },
  
  hourlyRate: {
    min: 0,
    custom: (value: number) => {
      if (value !== undefined && (isNaN(value) || value < 0)) {
        return 'Hourly rate must be a positive number';
      }
      return null;
    }
  },
  
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    custom: (value: string) => {
      if (value && !/^[a-zA-Z\s]+$/.test(value)) {
        return 'Name should only contain letters and spaces';
      }
      return null;
    }
  }
};

// Employee validation rules
export const employeeValidationRules: ValidationRules = {
  name: { required: true, ...commonRules.name },
  email: { required: true, ...commonRules.email },
  phone: { required: true, ...commonRules.phone },
  type: { required: true },
  department: { required: true, minLength: 2, maxLength: 50 },
  position: { required: true, minLength: 2, maxLength: 50 },
  hourlyRate: { required: true, ...commonRules.hourlyRate }
};

// Attendance validation rules
export const attendanceValidationRules: ValidationRules = {
  employeeId: { required: true },
  date: { required: true },
  clockIn: { 
    pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    custom: (value: string) => {
      if (value && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return 'Please enter a valid time (HH:MM)';
      }
      return null;
    }
  },
  clockOut: { 
    pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    custom: (value: string) => {
      if (value && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return 'Please enter a valid time (HH:MM)';
      }
      return null;
    }
  }
};

// Login validation rules
export const loginValidationRules: ValidationRules = {
  usernameOrEmail: { required: true, minLength: 3 },
  password: { required: true, ...commonRules.password }
};