import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getCurrentUser,
  getCurrentUserRole,
  getToken,
  isAuthenticated,
  hasPermission,
  logout,
  loginWithPassword,
  validateToken,
} from './auth'
import { UserRole } from '../config/auth.config'

describe('Auth Service', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  describe('getCurrentUser', () => {
    it('should return null if no user stored', () => {
      expect(getCurrentUser()).toBeNull()
    })

    it('should return user object if stored in sessionStorage', () => {
      const mockUser = { email: 'test@example.com', name: 'Test User', role: UserRole.OPERATOR }
      sessionStorage.setItem('qsms_user', JSON.stringify(mockUser))
      expect(getCurrentUser()).toEqual(mockUser)
    })
  })

  describe('getCurrentUserRole', () => {
    it('should return null if no role stored', () => {
      expect(getCurrentUserRole()).toBeNull()
    })

    it('should return role if stored', () => {
      sessionStorage.setItem('qsms_role', 'operator')
      expect(getCurrentUserRole()).toBe('operator')
    })
  })

  describe('isAuthenticated', () => {
    it('should return false if token is missing', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('should return false if token is expired', () => {
      sessionStorage.setItem('qsms_token', 'mock_token')
      sessionStorage.setItem('qsms_token_expiry', (Date.now() - 1000).toString()) // Expired 1s ago
      expect(isAuthenticated()).toBe(false)
    })

    it('should return true if token is not expired', () => {
      sessionStorage.setItem('qsms_token', 'mock_token')
      sessionStorage.setItem('qsms_token_expiry', (Date.now() + 10000).toString()) // Expired in 10s
      expect(isAuthenticated()).toBe(true)
    })
  })

  describe('hasPermission', () => {
    it('should return false if not logged in', () => {
      const result = hasPermission('rework:create')
      expect(result.hasPermission).toBe(false)
      expect(result.reason).toContain('session has expired')
    })

    it('should check role permissions correctly', () => {
      // Mock operator role which might only have view permissions
      sessionStorage.setItem('qsms_role', 'operator')
      const result = hasPermission('rework:edit_cost')
      expect(result.hasPermission).toBe(false)
    })
  })

  describe('logout', () => {
    it('should clear all storage keys', () => {
      sessionStorage.setItem('qsms_token', 'tok')
      sessionStorage.setItem('qsms_user', '{}')
      sessionStorage.setItem('qsms_role', 'operator')
      
      logout()
      
      expect(sessionStorage.getItem('qsms_token')).toBeNull()
      expect(sessionStorage.getItem('qsms_user')).toBeNull()
      expect(sessionStorage.getItem('qsms_role')).toBeNull()
    })
  })

  describe('validateToken', () => {
    it('should fail validation for empty token', async () => {
      const result = await validateToken('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('No token provided')
    })

    it('should validate correctly formatted non-expired token', async () => {
      // Create a mock base64 token payload
      const mockPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }
      const base64Payload = btoa(JSON.stringify(mockPayload))
      const token = `header.${base64Payload}.signature`

      const result = await validateToken(token)
      expect(result.valid).toBe(true)
    })
  })

  describe('loginWithPassword', () => {
    it('should call fetch and store auth data on success', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'header.payload.signature',
          expiresIn: 3600,
          user: {
            email: 'qsms@example.com',
            name: 'QSMS Operator',
            role: 'operator'
          }
        }
      }

      // Mock global fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await loginWithPassword('QSMS', '123456')
      expect(result.success).toBe(true)
      expect(result.data?.token).toBe('header.payload.signature')
      expect(sessionStorage.getItem('qsms_token')).toBe('header.payload.signature')
      expect(sessionStorage.getItem('qsms_role')).toBe('OPERATOR')
    })

    it('should return failure if credentials invalid', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials'
      }

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
      vi.stubGlobal('fetch', mockFetch)

      const result = await loginWithPassword('INVALID', 'wrong')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
      expect(sessionStorage.getItem('qsms_token')).toBeNull()
    })
  })
})
