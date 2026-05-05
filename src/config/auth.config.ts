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
  SUPERVISOR = 'supervisor', // Can approve, export, manage users
  OPERATOR = 'operator',     // Can create, edit, view cases
  VIEWER = 'viewer',         // Read-only access
}

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: [
    'create_case',
    'edit_case',
    'delete_case',
    'approve_case',
    'view_dashboard',
    'export_data',
    'manage_users',
    'view_reports',
    'manage_system',
  ],
  [UserRole.SUPERVISOR]: [
    'create_case',
    'edit_case',
    'view_case',
    'approve_case',
    'view_dashboard',
    'export_data',
    'manage_subordinates',
    'view_reports',
  ],
  [UserRole.OPERATOR]: [
    'create_case',
    'edit_case',
    'view_case',
    'view_dashboard',
    'view_reports',
  ],
  [UserRole.VIEWER]: [
    'view_case',
    'view_dashboard',
    'view_reports',
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
