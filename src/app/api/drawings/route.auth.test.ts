import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  class TestAuthError extends Error {
    status = 401;
  }

  return {
    requireServerAuth: vi.fn(),
    AuthError: TestAuthError,
    storageFrom: vi.fn(),
  };
});

vi.mock('../../../lib/serverAuth', () => ({
  requireServerAuth: mocks.requireServerAuth,
  AuthError: mocks.AuthError,
}));

vi.mock('../../../lib/ragSupabaseServer', () => ({
  ragSupabaseServer: { storage: { from: mocks.storageFrom } },
}));

import { GET } from './route';

describe('GET /api/drawings authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireServerAuth.mockRejectedValue(new mocks.AuthError('Authentication required'));
  });

  it('rejects unauthenticated signed URL requests before storage access', async () => {
    const request = new Request(
      'http://localhost/api/drawings?action=get_download_url&key=drawings/doc.pdf'
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(mocks.storageFrom).not.toHaveBeenCalled();
  });
});
