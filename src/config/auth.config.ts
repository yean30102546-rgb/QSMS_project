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
  ADMIN = 'ADMIN',           // Full access, User/Master Management, Delete, Edit
  QSMS = 'QSMS',             // Quality Control / Inspection, Item Master & Requisition
  WPK = 'WPK',               // Warehouse & Packaging / Case Initiation & Material Issuing
  PDF = 'PDF',               // Production / Defect Fix & Repair, Defend Flagging
  OPERATOR = 'OPERATOR',     // Backward compatibility alias for PDF / Operator
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'manage_users',
    'manage_masters',
    'view_dashboard',
    'view_overall',
    'create_case',
    'edit_case',
    'delete_case',
    'update_status',
    'fill_resolution',
    'fill_analysis',
    'request_materials',
    'issue_materials',
    'repair_case',
    'block_case',
    'close_case',
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
    'fill_analysis',
    'request_materials',
    'close_case',
    'export_data',
  ],
  [UserRole.WPK]: [
    'view_overall',
    'create_case',
    'issue_materials',
    'export_data',
  ],
  [UserRole.PDF]: [
    'view_overall',
    'update_status',
    'repair_case',
    'block_case',
    'close_case',
    'export_data',
  ],
  [UserRole.OPERATOR]: [
    'view_overall',
    'create_case',
    'update_status',
    'fill_resolution',
    'repair_case',
    'block_case',
    'close_case',
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
