import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  class TestAuthError extends Error {
    status = 401;
  }

  return {
    requireServerAuth: vi.fn(),
    assertPermission: vi.fn(),
    AuthError: TestAuthError,
    ragFrom: vi.fn(),
  };
});

vi.mock('../../../lib/serverAuth', () => ({
  requireServerAuth: mocks.requireServerAuth,
  assertPermission: mocks.assertPermission,
  AuthError: mocks.AuthError,
}));

vi.mock('../../../lib/ragSupabaseServer', () => ({
  ragSupabaseServer: { from: mocks.ragFrom },
}));

vi.mock('../../../lib/supabaseServer', () => ({ supabaseServer: {} }));

import { POST } from './route';

describe('POST /api/rag authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireServerAuth.mockRejectedValue(new mocks.AuthError('Authentication required'));
  });

  it('rejects unauthenticated document deletion before database access', async () => {
    const request = new Request('http://localhost/api/rag', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'delete_document', id: 'doc-1' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(mocks.ragFrom).not.toHaveBeenCalled();
  });
});
