import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchAuditLogs,
  fetchMonitorMetrics,
  getAvailableRoles,
  getRolePermissions,
  userHasPermission
} from './userManagement';
import { UserRole } from '../config/auth.config';

describe('User Management Service & Admin API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns available roles with Thai descriptions', () => {
    const roles = getAvailableRoles();
    expect(roles).toHaveLength(6);
    const roleValues = roles.map(r => r.value);
    expect(roleValues).toContain(UserRole.ADMIN);
    expect(roleValues).toContain(UserRole.QSMS);
    expect(roleValues).toContain(UserRole.WFG);
    expect(roleValues).toContain(UserRole.CS);
    expect(roleValues).toContain(UserRole.WPK);
    expect(roleValues).toContain(UserRole.PDF);
  });

  it('checks permissions correctly by role', () => {
    expect(userHasPermission(UserRole.ADMIN, 'manage_users')).toBe(true);
    expect(userHasPermission(UserRole.WPK, 'manage_users')).toBe(false);
    expect(userHasPermission(UserRole.WPK, 'create_case')).toBe(true);
    expect(userHasPermission(UserRole.WFG, 'create_case')).toBe(true);
    expect(userHasPermission(UserRole.CS, 'create_case')).toBe(true);
    expect(userHasPermission(UserRole.PDF, 'repair_case')).toBe(true);
    expect(userHasPermission(UserRole.PDF, 'manage_masters')).toBe(false);
  });

  it('calls getAllUsers and handles response', async () => {
    const mockUsers = [
      { id: '1', username: 'admin', name: 'System Admin', role: UserRole.ADMIN },
      { id: '2', username: 'wpk01', name: 'Warehouse Lead', role: UserRole.WPK },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: mockUsers }),
    } as unknown as Response);

    const res = await getAllUsers();
    expect(res.success).toBe(true);
    expect(res.data).toEqual(mockUsers);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/admin', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ action: 'listUsers' }),
    }));
  });

  it('validates createUser fields before making API request', async () => {
    const res = await createUser({
      username: '',
      name: '',
      password: '',
      role: UserRole.PDF,
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('กรุณากรอก');
  });

  it('calls createUser API with correct payload', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: { id: '3', username: 'newuser', name: 'New User', role: UserRole.PDF },
      }),
    } as unknown as Response);

    const res = await createUser({
      username: 'newuser',
      name: 'New User',
      password: 'password123',
      role: UserRole.PDF,
      employee_id: 'EMP009',
    });

    expect(res.success).toBe(true);
    expect(res.data?.username).toBe('newuser');
  });

  it('calls fetchMonitorMetrics and returns pipeline stats', async () => {
    const mockMetrics = {
      users: { total: 4, roleCounts: { ADMIN: 1, QSMS: 1, WPK: 1, PDF: 1 } },
      cases: { pendingAnalysis: 2, awaitingMaterials: 1, inProgress: 3, blocked: 1, completed: 5, total: 12 },
      blockedCases: [
        { id: 'RW-2026-001', caseName: 'Defect batch', customerName: 'SFC', reasonCategory: 'waiting_oil' }
      ]
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: mockMetrics }),
    } as unknown as Response);

    const res = await fetchMonitorMetrics();
    expect(res.success).toBe(true);
    expect(res.data?.cases.blocked).toBe(1);
    expect(res.data?.blockedCases[0].reasonCategory).toBe('waiting_oil');
  });
});
