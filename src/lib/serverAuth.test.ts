import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateToken,
  verifyToken,
  AuthError,
  assertPermission,
  requireServerAuth
} from './serverAuth';

describe('Server Auth Library', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.AUTH_TOKEN_SECRET = 'test-secret-key-for-unit-testing-qsms-123456789';
  });

  describe('generateToken & verifyToken', () => {
    it('should generate a valid 3-part JWT token and verify it successfully', async () => {
      const token = await generateToken('operator1', 'OPERATOR');
      expect(token).toBeTypeOf('string');
      expect(token.split('.').length).toBe(3);

      const payload = await verifyToken(token);
      expect(payload.sub).toBe('operator1');
      expect(payload.profile).toBe('OPERATOR');
      expect(payload.type).toBe('auth_token');
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should throw AuthError for malformed token structure', async () => {
      await expect(verifyToken('invalid.token')).rejects.toThrow('Invalid token format');
    });

    it('should throw AuthError for tampered token signature', async () => {
      const validToken = await generateToken('operator1', 'OPERATOR');
      const parts = validToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.invalid_signature`;

      await expect(verifyToken(tamperedToken)).rejects.toThrow('Invalid token signature');
    });

    it('should throw AuthError when token subject sub is missing or empty', async () => {
      const headerB64 = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payloadB64 = btoa(JSON.stringify({ sub: '', profile: 'OPERATOR', exp: Math.floor(Date.now() / 1000) + 3600 }));
      const unsigned = `${headerB64}.${payloadB64}`;
      const { signToken } = await import('./serverAuth');
      const sig = await signToken(unsigned);
      const token = `${unsigned}.${sig}`;

      await expect(verifyToken(token)).rejects.toThrow('Token subject is missing');
    });
  });

  describe('assertPermission', () => {
    it('should allow valid permissions for ADMIN and QSMS profile', () => {
      const adminAuth = { email: 'admin@example.com', profile: 'ADMIN' };
      expect(() => assertPermission(adminAuth, 'manage_users')).not.toThrow();
      expect(() => assertPermission(adminAuth, 'delete_case')).not.toThrow();
      expect(() => assertPermission(adminAuth, 'manage_rag')).not.toThrow();
      expect(() => assertPermission(adminAuth, 'manage_masters')).not.toThrow();

      const qsmsAuth = { email: 'qsms@example.com', profile: 'QSMS' };
      expect(() => assertPermission(qsmsAuth, 'view_dashboard')).not.toThrow();
      expect(() => assertPermission(qsmsAuth, 'edit_case')).not.toThrow();
      expect(() => assertPermission(qsmsAuth, 'delete_case')).not.toThrow();
      expect(() => assertPermission(qsmsAuth, 'manage_rag')).not.toThrow();
      expect(() => assertPermission(qsmsAuth, 'manage_masters')).not.toThrow();
      expect(() => assertPermission(qsmsAuth, 'export_data')).not.toThrow();
      expect(() => assertPermission(qsmsAuth, 'fill_analysis')).not.toThrow();
      expect(() => assertPermission(qsmsAuth, 'request_materials')).not.toThrow();
      expect(() => assertPermission(qsmsAuth, 'manage_users')).toThrow(AuthError);
    });

    it('should allow WPK to create case and issue materials, but block repair_case', () => {
      const wpkAuth = { email: 'wpk@example.com', profile: 'WPK' };
      expect(() => assertPermission(wpkAuth, 'view_overall')).not.toThrow();
      expect(() => assertPermission(wpkAuth, 'create_case')).not.toThrow();
      expect(() => assertPermission(wpkAuth, 'issue_materials')).not.toThrow();
      expect(() => assertPermission(wpkAuth, 'repair_case')).toThrow(AuthError);
      expect(() => assertPermission(wpkAuth, 'delete_case')).toThrow(AuthError);
      expect(() => assertPermission(wpkAuth, 'manage_rag')).toThrow(AuthError);
    });

    it('should allow PDF to repair and block issues, but block manage_users and delete_case', () => {
      const pdfAuth = { email: 'pdf@example.com', profile: 'PDF' };
      expect(() => assertPermission(pdfAuth, 'view_overall')).not.toThrow();
      expect(() => assertPermission(pdfAuth, 'repair_case')).not.toThrow();
      expect(() => assertPermission(pdfAuth, 'block_case')).not.toThrow();
      expect(() => assertPermission(pdfAuth, 'close_case')).not.toThrow();
      expect(() => assertPermission(pdfAuth, 'delete_case')).toThrow(AuthError);
      expect(() => assertPermission(pdfAuth, 'manage_users')).toThrow(AuthError);
    });

    it('should allow WFG to initiate case, view dashboard, request materials but block repair_case and manage_users', () => {
      const wfgAuth = { email: 'wfg@example.com', profile: 'WFG' };
      expect(() => assertPermission(wfgAuth, 'view_overall')).not.toThrow();
      expect(() => assertPermission(wfgAuth, 'view_dashboard')).not.toThrow();
      expect(() => assertPermission(wfgAuth, 'create_case')).not.toThrow();
      expect(() => assertPermission(wfgAuth, 'request_materials')).not.toThrow();
      expect(() => assertPermission(wfgAuth, 'repair_case')).toThrow(AuthError);
      expect(() => assertPermission(wfgAuth, 'manage_users')).toThrow(AuthError);
    });

    it('should allow CS to initiate case and view dashboard but block delete_case and request_materials', () => {
      const csAuth = { email: 'cs@example.com', profile: 'CS' };
      expect(() => assertPermission(csAuth, 'view_overall')).not.toThrow();
      expect(() => assertPermission(csAuth, 'view_dashboard')).not.toThrow();
      expect(() => assertPermission(csAuth, 'create_case')).not.toThrow();
      expect(() => assertPermission(csAuth, 'update_status')).not.toThrow();
      expect(() => assertPermission(csAuth, 'export_data')).not.toThrow();
      expect(() => assertPermission(csAuth, 'delete_case')).toThrow(AuthError);
      expect(() => assertPermission(csAuth, 'request_materials')).toThrow(AuthError);
      expect(() => assertPermission(csAuth, 'manage_users')).toThrow(AuthError);
    });

    it('should allow basic permissions for OPERATOR profile but block delete_case and export_data', () => {
      const auth = { email: 'op@example.com', profile: 'OPERATOR' };
      expect(() => assertPermission(auth, 'view_overall')).not.toThrow();
      expect(() => assertPermission(auth, 'create_case')).not.toThrow();
      expect(() => assertPermission(auth, 'update_status')).not.toThrow();
      expect(() => assertPermission(auth, 'delete_case')).toThrow(AuthError);
      expect(() => assertPermission(auth, 'export_data')).toThrow(AuthError);
    });

    it('should reject all permissions for unknown profile', () => {
      const unknownAuth = { email: 'unknown@example.com', profile: 'NON_EXISTENT_ROLE' };
      expect(() => assertPermission(unknownAuth, 'view_overall')).toThrow(AuthError);
      expect(() => assertPermission(unknownAuth, 'create_case')).toThrow(AuthError);
      expect(() => assertPermission(unknownAuth, 'manage_users')).toThrow(AuthError);
    });
  });
});
