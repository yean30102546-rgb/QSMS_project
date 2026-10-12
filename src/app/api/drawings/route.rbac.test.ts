import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  return {
    requireServerAuth: vi.fn(),
    storageFrom: vi.fn(),
    fromQuery: vi.fn(),
  };
});

vi.mock('../../../lib/serverAuth', () => ({
  requireServerAuth: mocks.requireServerAuth,
  AuthError: class extends Error { status = 401; },
}));

vi.mock('../../../lib/ragSupabaseServer', () => ({
  ragSupabaseServer: {
    storage: { from: mocks.storageFrom },
    from: mocks.fromQuery,
  },
}));

import { POST, isDrawingEditor } from './route';

describe('POST /api/drawings RBAC Security Boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isDrawingEditor helper', () => {
    it('grants editor rights to ADMIN and QSMS', () => {
      expect(isDrawingEditor('ADMIN')).toBe(true);
      expect(isDrawingEditor('admin')).toBe(true);
      expect(isDrawingEditor('QSMS')).toBe(true);
      expect(isDrawingEditor('qsms')).toBe(true);
    });

    it('denies editor rights to non-editor roles', () => {
      expect(isDrawingEditor('OPERATOR')).toBe(false);
      expect(isDrawingEditor('operator')).toBe(false);
      expect(isDrawingEditor('WPK')).toBe(false);
      expect(isDrawingEditor('PDF')).toBe(false);
      expect(isDrawingEditor(undefined)).toBe(false);
      expect(isDrawingEditor('')).toBe(false);
    });
  });

  describe('Role-based endpoint rejection', () => {
    it('blocks OPERATOR from calling save_drawing with 403 Forbidden', async () => {
      mocks.requireServerAuth.mockResolvedValue({
        email: 'operator@qsms.internal',
        profile: 'OPERATOR',
      });

      const req = new Request('http://localhost/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_drawing' }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain('เฉพาะบทบาท ADMIN หรือ QSMS');
    });

    it('blocks PDF technician from calling update_drawing with 403 Forbidden', async () => {
      mocks.requireServerAuth.mockResolvedValue({
        email: 'technician@qsms.internal',
        profile: 'PDF',
      });

      const req = new Request('http://localhost/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_drawing', id: 'doc-123' }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain('เฉพาะบทบาท ADMIN หรือ QSMS');
    });

    it('blocks WPK clerk from calling parse_drawing with 403 Forbidden', async () => {
      mocks.requireServerAuth.mockResolvedValue({
        email: 'warehouse@qsms.internal',
        profile: 'WPK',
      });

      const req = new Request('http://localhost/api/drawings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse_drawing', base64Data: 'dummy' }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toContain('เฉพาะบทบาท ADMIN หรือ QSMS');
    });
  });
});

