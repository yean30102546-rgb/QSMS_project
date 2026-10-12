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
    assertPermission: vi.fn(),
    AuthError: TestAuthError,
  };
});

vi.mock('@/src/lib/serverAuth', () => ({
  requireServerAuth: mocks.requireServerAuth,
  assertPermission: mocks.assertPermission,
  AuthError: mocks.AuthError,
}));

vi.mock('@/src/lib/supabaseServer', () => ({
  supabaseServer: {
    from: vi.fn(),
  },
}));

import { POST } from './register/route';

describe('POST /api/auth/register authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    mocks.requireServerAuth.mockRejectedValue(new mocks.AuthError('Authentication required', 401));

    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newuser', password: 'Password123!', name: 'New User' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('rejects users without manage_users permission with 403', async () => {
    mocks.requireServerAuth.mockResolvedValue({ email: 'operator@factory.com', profile: 'OPERATOR' });
    mocks.assertPermission.mockImplementation(() => {
      throw new mocks.AuthError('You do not have permission to perform this action.', 403);
    });

    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newuser', password: 'Password123!', name: 'New User' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

