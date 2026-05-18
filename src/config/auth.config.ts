/**
 * Authentication Configuration
 * Minimal PIN-based authentication for 2-3 users
 */

// ===== AUTH SETTINGS =====
export const AUTH_CONFIG = {
  // Token expiry in hours
  tokenExpiryHours: 8,
  
  // Refresh token before expiry (in minutes)
  tokenRefreshThreshold: 15,
  
  // Session timeout in minutes (after this, user must re-login)
  sessionTimeoutMinutes: 480, // 8 hours
  
  // Use secure HTTP-only cookies (recommended for production)
  useSecureCookies: true,
  
  // Enable multi-factor authentication
  enableMFA: false, // Set to true if needed for security
  
  // Failed login attempts before lockout
  maxFailedLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  
  // Password requirements
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
};

// ===== USER ROLES & PERMISSIONS =====
export enum UserRole {
  ADMIN = 'admin',           // Full access
  QSMS = 'qsms',             // Full access, Delete, Edit
  PDB = 'pdb',               // Add Case, Overall, Update Status, Resolution, Export
  OPERATOR = 'operator',     // Operator Role / Production Rework
  FINANCE = 'finance',       // Overall (Valuation only)
}

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    'view_dashboard',
    'view_overall',
    'create_case',
    'edit_case',
    'delete_case',
    'update_status',
    'fill_resolution',
    'fill_valuation',
    'export_data',
  ],
  [UserRole.QSMS]: [
    'view_dashboard',
    'view_overall',
    'create_case',
    'edit_case',
    'delete_case',
    'update_status',
    'fill_resolution',
    'fill_valuation',
    'export_data',
  ],
  [UserRole.PDB]: [
    'view_overall',
    'create_case',
    'update_status',
    'fill_resolution',
    'export_data',
  ],
  [UserRole.OPERATOR]: [
    'view_overall',
    'create_case',
    'update_status',
    'fill_resolution',
    'export_data',
  ],
  [UserRole.FINANCE]: [
    'view_overall',
    'fill_valuation',
  ],
};

// ===== AUTH PROVIDERS =====
export enum AuthProvider {
  GOOGLE = 'google',
  FIREBASE = 'firebase',
  CUSTOM = 'custom', // For custom user management
}

// ===== ERROR MESSAGES =====
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_DISABLED: 'User account is disabled',
  TOO_MANY_ATTEMPTS: 'Too many login attempts. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  REQUIRES_MFA: 'Multi-factor authentication is required.',
};

export default {
  AUTH_CONFIG,
  UserRole,
  ROLE_PERMISSIONS,
  AuthProvider,
  AUTH_ERROR_MESSAGES,
};
