/**
 * User Management & Admin Monitoring Service
 * Handles user administration, roles, live SLA monitoring, and defect defend logs
 */

import { UserRole, ROLE_PERMISSIONS } from '../config/auth.config';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole | string;
  employee_id?: string;
  createdAt?: string;
  created_at?: string;
}

export interface UserCreateRequest {
  username: string;
  name: string;
  password: string;
  role: UserRole | string;
  employee_id?: string;
}

export interface UserUpdateRequest {
  id: string;
  name?: string;
  role?: UserRole | string;
  employee_id?: string;
  password?: string;
}

export interface AuditLogItem {
  id: string;
  case_id: string;
  action: string;
  performed_by: string;
  timestamp: string;
}

export interface MonitorMetrics {
  users: {
    total: number;
    roleCounts: Record<string, number>;
  };
  cases: {
    pendingAnalysis: number;
    awaitingMaterials: number;
    inProgress: number;
    blocked: number;
    completed: number;
    total: number;
  };
  blockedCases: Array<{
    id: string;
    caseName: string;
    customerName: string;
    reasonCategory?: string;
    reasonDetail?: string;
    blockedAt?: string;
    reportedBy?: string;
  }>;
}

async function adminApiFetch<T>(payload: Record<string, unknown>): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error communicating with Admin API',
    };
  }
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<{ success: boolean; data?: UserAccount[]; error?: string }> {
  const res = await adminApiFetch<UserAccount[]>({ action: 'listUsers' });
  return {
    success: res.success,
    data: res.data || [],
    error: res.error,
  };
}

/**
 * Create a new user account (Admin only)
 */
export async function createUser(userData: UserCreateRequest): Promise<{ success: boolean; data?: UserAccount; error?: string }> {
  if (!userData.username || !userData.name || !userData.password || !userData.role) {
    return {
      success: false,
      error: 'กรุณากรอก Username, รหัสผ่าน, ชื่อ-นามสกุล และบทบาท (Role) ให้ครบถ้วน',
    };
  }

  const res = await adminApiFetch<UserAccount>({
    action: 'createUser',
    username: userData.username,
    password: userData.password,
    name: userData.name,
    role: userData.role,
    employee_id: userData.employee_id,
  });

  return res;
}

/**
 * Update user account
 */
export async function updateUser(userData: UserUpdateRequest): Promise<{ success: boolean; data?: UserAccount; error?: string }> {
  if (!userData.id) {
    return {
      success: false,
      error: 'User ID is required',
    };
  }

  return await adminApiFetch<UserAccount>({
    action: 'updateUser',
    ...userData,
  });
}

/**
 * Delete user account
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return {
      success: false,
      error: 'User ID is required',
    };
  }

  return await adminApiFetch({
    action: 'deleteUser',
    id: userId,
  });
}

/**
 * Fetch live Audit Trail
 */
export async function fetchAuditLogs(limit: number = 40): Promise<{ success: boolean; data?: AuditLogItem[]; error?: string }> {
  const res = await adminApiFetch<AuditLogItem[]>({
    action: 'fetchAuditLogs',
    limit,
  });
  return {
    success: res.success,
    data: res.data || [],
    error: res.error,
  };
}

/**
 * Fetch Admin Monitor Metrics
 */
export async function fetchMonitorMetrics(): Promise<{ success: boolean; data?: MonitorMetrics; error?: string }> {
  return await adminApiFetch<MonitorMetrics>({
    action: 'fetchMonitorMetrics',
  });
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
      label: 'Admin (System Administrator)',
      description: 'Full system control, user & master management, reports',
    },
    {
      value: UserRole.QSMS,
      label: 'QSMS (Quality Control)',
      description: 'Defect analysis, photo verification, container requisition spec',
    },
    {
      value: UserRole.WFG,
      label: 'WFG (Warehouse Finished Goods)',
      description: 'Internal RW case initiation from warehouse & factory lines',
    },
    {
      value: UserRole.CS,
      label: 'CS (Customer Service)',
      description: 'Customer return RT case initiation & claim document handling',
    },
    {
      value: UserRole.WPK,
      label: 'WPK (Warehouse & Packaging)',
      description: 'Case initiation (Step 1) and material issuing/fulfillment',
    },
    {
      value: UserRole.PDF,
      label: 'PDF (Production & Repair)',
      description: 'Repair progress execution, defend blocked issue reporting',
    },
  ];
}

export default {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchAuditLogs,
  fetchMonitorMetrics,
  getRolePermissions,
  userHasPermission,
  getAvailableRoles,
};
