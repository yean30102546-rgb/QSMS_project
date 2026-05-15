/**
 * User Management Service
 * Handles user administration, roles, and permissions for small organizations
 * 
 * For organizations with up to 20 users:
 * - Stores user data in Google Sheets
 * - Manages roles and permissions
 * - Provides user CRUD operations
 */

import { UserRole, ROLE_PERMISSIONS } from '../config/auth.config';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  enabled: boolean;
  createdAt: string;
  lastLogin?: string;
  notes?: string;
}

export interface UserCreateRequest {
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

export interface UserUpdateRequest extends Partial<UserCreateRequest> {
  id: string;
  enabled?: boolean;
}

/**
 * Create a new user account
 * In production: Call backend API with proper validation
 */
export async function createUser(userData: UserCreateRequest): Promise<{ success: boolean; data?: UserAccount; error?: string }> {
  try {
    if (!userData.email || !userData.name || !userData.role) {
      return {
        success: false,
        error: 'Email, name, and role are required',
      };
    }

    // Validate email format
    if (!isValidEmail(userData.email)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    // TODO: Call backend API
    // POST /api/users/create
    // Returns: UserAccount

    return {
      success: false,
      error: 'Backend integration required',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}

/**
 * Update user account
 */
export async function updateUser(userData: UserUpdateRequest): Promise<{ success: boolean; data?: UserAccount; error?: string }> {
  try {
    if (!userData.id) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    // TODO: Call backend API
    // PUT /api/users/{id}
    // Returns: UserAccount

    return {
      success: false,
      error: 'Backend integration required',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    };
  }
}

/**
 * Delete user account
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    // TODO: Call backend API
    // DELETE /api/users/{id}

    return {
      success: false,
      error: 'Backend integration required',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<{ success: boolean; data?: UserAccount[]; error?: string }> {
  try {
    // TODO: Call backend API
    // GET /api/users

    return {
      success: false,
      error: 'Backend integration required',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    };
  }
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<{ success: boolean; data?: UserAccount; error?: string }> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    // TODO: Call backend API
    // GET /api/users/{id}

    return {
      success: false,
      error: 'Backend integration required',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    };
  }
}

/**
 * Assign role to user
 */
export async function assignRole(userId: string, role: UserRole): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId || !role) {
      return {
        success: false,
        error: 'User ID and role are required',
      };
    }

    if (!Object.values(UserRole).includes(role)) {
      return {
        success: false,
        error: 'Invalid role',
      };
    }

    // TODO: Call backend API
    // PATCH /api/users/{id}/role

    return {
      success: false,
      error: 'Backend integration required',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign role',
    };
  }
}

/**
 * Get permissions for a role
 */
export function getRolePermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user has specific permission
 */
export function userHasPermission(userRole: UserRole, permission: string): boolean {
  const permissions = getRolePermissions(userRole);
  return permissions.includes(permission);
}

/**
 * Get available roles
 */
export function getAvailableRoles(): Array<{ value: UserRole; label: string; description: string }> {
  return [
    {
      value: UserRole.ADMIN,
      label: 'Administrator',
      description: 'Full system access, user management, and system configuration',
    },
    {
      value: UserRole.QSMS,
      label: 'QSMS',
      description: 'Full system access, delete, and advanced editing',
    },
    {
      value: UserRole.PDB,
      label: 'PDB',
      description: 'Can create cases and update resolution methods',
    },
    {
      value: UserRole.FINANCE,
      label: 'Finance',
      description: 'Valuation and rework cost assessment only',
    },
  ];
}

/**
 * Reset user password
 */
export async function resetUserPassword(userId: string): Promise<{ success: boolean; temporaryPassword?: string; error?: string }> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    // TODO: Call backend API
    // POST /api/users/{id}/reset-password
    // Returns: { temporaryPassword: string }

    return {
      success: false,
      error: 'Backend integration required',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset password',
    };
  }
}

/**
 * Enable/Disable user account
 */
export async function toggleUserStatus(userId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    // TODO: Call backend API
    // PATCH /api/users/{id}/status

    return {
      success: false,
      error: 'Backend integration required',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user status',
    };
  }
}

/**
 * Utility: Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Utility: Generate temporary password
 */
export function generateTemporaryPassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default {
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getUser,
  assignRole,
  getRolePermissions,
  userHasPermission,
  getAvailableRoles,
  resetUserPassword,
  toggleUserStatus,
  generateTemporaryPassword,
};
