import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  class TestAuthError extends Error {
    status = 401;
    constructor(message: string, status = 401) {
      super(message);
      this.status = status;
    }
  }

  return {
    requireServerAuth: vi.fn(),
    AuthError: TestAuthError,
    supabaseFrom: vi.fn(),
  };
});

vi.mock('@/src/lib/serverAuth', () => ({
  requireServerAuth: mocks.requireServerAuth,
  assertPermission: vi.fn(),
  AuthError: mocks.AuthError,
}));

vi.mock('@/src/lib/supabaseServer', () => ({
  supabaseServer: {
    from: mocks.supabaseFrom,
  },
}));

import { POST } from './route';

describe('POST /api/admin RBAC & Role Management Security Boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401 status', async () => {
    mocks.requireServerAuth.mockRejectedValue(new mocks.AuthError('Authentication required', 401));

    const request = new Request('http://localhost/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'listUsers' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('rejects non-admin role (PDF technician) with 403 Forbidden', async () => {
    mocks.requireServerAuth.mockResolvedValue({
      email: 'tech@qsms.internal',
      profile: 'PDF',
    });

    const request = new Request('http://localhost/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'listUsers' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Admin Only');
  });

  it('rejects warehouse role (WPK) with 403 Forbidden', async () => {
    mocks.requireServerAuth.mockResolvedValue({
      email: 'warehouse@qsms.internal',
      profile: 'WPK',
    });

    const request = new Request('http://localhost/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'listUsers' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('rejects creating user with invalid/unregistered role with 400 Bad Request', async () => {
    mocks.requireServerAuth.mockResolvedValue({
      email: 'admin@qsms.internal',
      profile: 'ADMIN',
    });

    const request = new Request('http://localhost/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createUser',
        username: 'badrole_user',
        password: 'ValidPassword123!',
        name: 'Bad Role User',
        role: 'SUPER_HACKER_ROLE',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('ไม่ถูกต้องในระบบ RBAC');
  });

  it('allows ADMIN to create user with valid operational role (CS)', async () => {
    mocks.requireServerAuth.mockResolvedValue({
      email: 'admin@qsms.internal',
      profile: 'ADMIN',
    });

    // Mock supabase select for checking existing user -> null
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    // Mock insert user
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-cs-1', username: 'cs.somying', name: 'Somying', role: 'CS', created_at: '2026-10-12T00:00:00Z' },
          error: null,
        }),
      }),
    });

    // Mock rework_logs audit insert
    const auditMock = vi.fn().mockResolvedValue({ data: null, error: null });

    mocks.supabaseFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: selectMock,
          insert: insertMock,
        };
      }
      if (table === 'rework_logs') {
        return {
          insert: auditMock,
        };
      }
      return {};
    });

    const request = new Request('http://localhost/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createUser',
        username: 'cs.somying',
        password: 'Password123!',
        name: 'Somying',
        role: 'CS',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.role).toBe('CS');
  });

  it('rejects updating user to an invalid role with 400 Bad Request', async () => {
    mocks.requireServerAuth.mockResolvedValue({
      email: 'admin@qsms.internal',
      profile: 'ADMIN',
    });

    const request = new Request('http://localhost/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateUser',
        id: 'user-123',
        role: 'INVALID_ROLE_XYZ',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('ไม่ถูกต้องในระบบ RBAC');
  });
});

