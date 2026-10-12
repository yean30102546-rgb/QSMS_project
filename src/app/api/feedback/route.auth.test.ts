import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  class TestAuthError extends Error {
    status = 401;
  }

  return {
    requireServerAuth: vi.fn(),
    assertPermission: vi.fn(),
    AuthError: TestAuthError,
    from: vi.fn(),
  };
});

vi.mock('@/src/lib/serverAuth', () => ({
  requireServerAuth: mocks.requireServerAuth,
  assertPermission: mocks.assertPermission,
  AuthError: mocks.AuthError,
}));

vi.mock('@/src/lib/supabaseServer', () => ({ supabaseServer: { from: mocks.from } }));

import { GET } from './route';

describe('GET /api/feedback authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireServerAuth.mockRejectedValue(new mocks.AuthError('Authentication required'));
  });

  it('rejects unauthenticated feedback reads before querying the database', async () => {
    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
