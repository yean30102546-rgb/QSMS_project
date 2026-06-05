/**
 * Authentication Service
 * Handles Google OAuth, Firebase, and Role-Based Access Control
 * 
 * ⚠️ IMPORTANT: Replace hardcoded credentials with secure backends
 * Current implementation includes fallback for small organizations (<20 users)
 */

import { AUTH_CONFIG, ROLE_PERMISSIONS, UserRole, AUTH_ERROR_MESSAGES } from '../config/auth.config';

// Storage keys
const TOKEN_KEY = 'qsms_token';
const USER_KEY = 'qsms_user';
const ROLE_KEY = 'qsms_role';
const TOKEN_EXPIRY_KEY = 'qsms_token_expiry';
const REFRESH_TOKEN_KEY = 'qsms_refresh_token';
const GAS_AUTH_URL = '';

export interface User {
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    refreshToken?: string;
    user: User;
    expiresIn: number;
  };
  error?: string;
}

export interface ValidateTokenResponse {
  success: boolean;
  valid: boolean;
  user?: User;
  error?: string;
}

export interface PermissionCheckResponse {
  hasPermission: boolean;
  reason?: string;
}

interface GoogleCredentialResponse {
  credential?: string;
}

let cachedUser: User | null = null;
let cachedIsAuth: boolean = false;

export async function restoreSession(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      cachedUser = null;
      cachedIsAuth = false;
      return false;
    }
    const result = await res.json();
    if (result.success && result.data?.user) {
      const rawRole = result.data.user.role || UserRole.OPERATOR;
      cachedUser = {
        ...result.data.user,
        role: rawRole.toUpperCase() as UserRole,
      };
      cachedIsAuth = true;
      return true;
    }
    cachedUser = null;
    cachedIsAuth = false;
    return false;
  } catch {
    cachedUser = null;
    cachedIsAuth = false;
    return false;
  }
}

export function getCurrentUser(): User | null {
  return cachedUser;
}

export function getCurrentUserRole(): UserRole | null {
  return cachedUser?.role || null;
}

export function getToken(): string | null {
  // Token is HTTP-Only, frontend cannot access it
  return null;
}

export function isAuthenticated(): boolean {
  return cachedIsAuth;
}

export function hasPermission(permission: string): PermissionCheckResponse {
  const role = getCurrentUserRole();

  if (!role) {
    return {
      hasPermission: false,
      reason: AUTH_ERROR_MESSAGES.SESSION_EXPIRED,
    };
  }

  const permissions = ROLE_PERMISSIONS[role] || [];

  if (!permissions.includes(permission)) {
    return {
      hasPermission: false,
      reason: AUTH_ERROR_MESSAGES.UNAUTHORIZED,
    };
  }

  return { hasPermission: true };
}

export async function loginWithGoogle(credentialResponse: GoogleCredentialResponse): Promise<AuthResponse> {
  void credentialResponse;
  return {
    success: false,
    error: 'Google login is disabled.',
  };
}

export async function loginWithPassword(userId: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: userId,
        password,
      }),
    });

    if (!response.ok) {
      return { success: false, error: 'Cannot connect to authentication service' };
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Password invalid' };
    }

    const rawRole = result.data.user.role || UserRole.OPERATOR;
    cachedUser = {
      ...result.data.user,
      role: rawRole.toUpperCase() as UserRole,
    };
    cachedIsAuth = true;

    return {
      success: true,
      data: {
        token: '', // No token needed client side
        user: cachedUser,
        expiresIn: result.data.expiresIn,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResponse> {
  return {
    success: false,
    error: 'Email/password login is not supported. Use PIN login instead.',
  };
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    console.error('Logout error:', err);
  }
  cachedUser = null;
  cachedIsAuth = false;
  
  // Clear any legacy storage just in case
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function validateToken(token: string): Promise<ValidateTokenResponse> {
  // Always true if we reach here and isAuthenticated is true
  return {
    success: true,
    valid: cachedIsAuth,
  };
}

export async function refreshToken(): Promise<AuthResponse> {
  return {
    success: false,
    error: 'Token refresh is not available. Please login again.',
  };
}

export function getAuthHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  };
}
