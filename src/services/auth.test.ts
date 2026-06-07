import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCurrentUser,
  getCurrentUserRole,
  getToken,
  isAuthenticated,
  hasPermission,
  logout,
  loginWithPassword,
  validateToken,
  restoreSession,
} from './auth';
import { UserRole } from '../config/auth.config';

describe('Auth Service', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    // Reset internal state of the module by logging out
    // Stub fetch in case logout calls it
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    }));
    await logout();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentUser & restoreSession', () => {
    it('should return null if not logged in / restoreSession fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false
      }));
      const restored = await restoreSession();
      expect(restored).toBe(false);
      expect(getCurrentUser()).toBeNull();
    });

    it('should return user object if restoreSession succeeds', async () => {
      const mockUser = { email: 'test@example.com', name: 'Test User', role: 'operator' };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { user: mockUser } })
      }));
      const restored = await restoreSession();
      expect(restored).toBe(true);
      expect(getCurrentUser()).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.OPERATOR,
      });
    });
  });

  describe('getCurrentUserRole', () => {
    it('should return null if no role stored', () => {
      expect(getCurrentUserRole()).toBeNull();
    });

    it('should return role if logged in', async () => {
      const mockUser = { email: 'test@example.com', name: 'Test User', role: 'finance' };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { user: mockUser } })
      }));
      await restoreSession();
      expect(getCurrentUserRole()).toBe(UserRole.FINANCE);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false if not authenticated', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return true if restoreSession succeeded', async () => {
      const mockUser = { email: 'test@example.com', name: 'Test User', role: 'operator' };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { user: mockUser } })
      }));
      await restoreSession();
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should return false if not logged in', () => {
      const result = hasPermission('view_dashboard');
      expect(result.hasPermission).toBe(false);
      expect(result.reason).toContain('session has expired');
    });

    it('should check role permissions correctly', async () => {
      const mockUser = { email: 'test@example.com', name: 'Test User', role: 'operator' };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { user: mockUser } })
      }));
      await restoreSession();
      // Operator should have view_overall but NOT fill_valuation
      expect(hasPermission('view_overall').hasPermission).toBe(true);
      expect(hasPermission('fill_valuation').hasPermission).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear cached state', async () => {
      const mockUser = { email: 'test@example.com', name: 'Test User', role: 'operator' };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { user: mockUser } })
      }));
      await restoreSession();
      expect(isAuthenticated()).toBe(true);

      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', fetchMock);
      await logout();

      expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      expect(isAuthenticated()).toBe(false);
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('loginWithPassword', () => {
    it('should call fetch and store auth data on success', async () => {
      const mockResponse = {
        success: true,
        data: {
          expiresIn: 3600,
          user: {
            email: 'qsms@example.com',
            name: 'QSMS Operator',
            role: 'operator'
          }
        }
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await loginWithPassword('qsms', 'Qsms123');
      expect(result.success).toBe(true);
      expect(result.data?.user.role).toBe(UserRole.OPERATOR);
      expect(isAuthenticated()).toBe(true);
      expect(getCurrentUser()?.name).toBe('QSMS Operator');
    });

    it('should return failure if credentials invalid', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials'
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await loginWithPassword('INVALID', 'wrong');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(isAuthenticated()).toBe(false);
    });
  });
});
