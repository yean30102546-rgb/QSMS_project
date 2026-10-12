import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  class TestAuthError extends Error {
    status = 401;
  }

  return {
    requireServerAuth: vi.fn(),
    AuthError: TestAuthError,
    destroy: vi.fn(),
  };
});

vi.mock('../../../../lib/serverAuth', () => ({
  requireServerAuth: mocks.requireServerAuth,
  AuthError: mocks.AuthError,
}));

vi.mock('cloudinary', () => ({
  v2: { config: vi.fn(), uploader: { destroy: mocks.destroy } },
}));

import { POST } from './route';

describe('POST /api/cloudinary/rollback authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireServerAuth.mockRejectedValue(new mocks.AuthError('Authentication required'));
  });

  it('rejects unauthenticated rollback requests before deleting media', async () => {
    const request = new Request('http://localhost/api/cloudinary/rollback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ urls: ['https://res.cloudinary.com/example/image/upload/test.jpg'] }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(mocks.destroy).not.toHaveBeenCalled();
  });
});
