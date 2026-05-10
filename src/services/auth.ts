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
const GAS_AUTH_URL = String(process.env.REACT_APP_GAS_WEB_APP_URL || '').trim();

function ensureGasAuthUrl(): string {
  if (!GAS_AUTH_URL.includes('script.google.com/macros/s') || !GAS_AUTH_URL.endsWith('/exec')) {
    throw new Error('REACT_APP_GAS_WEB_APP_URL is not configured with a valid Google Apps Script /exec URL.');
  }
  return GAS_AUTH_URL;
}

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

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
  try {
    const userJson = sessionStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}

/**
 * Get current user's role
 */
export function getCurrentUserRole(): UserRole | null {
  try {
    return (sessionStorage.getItem(ROLE_KEY) as UserRole) || null;
  } catch {
    return null;
  }
}

/**
 * Get stored JWT token
 */
export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Check if user is authenticated and token is valid
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  const expiryStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiryStr) {
    return false;
  }

  const expiry = parseInt(expiryStr, 10);
  return Date.now() < expiry;
}

/**
 * Check if user has specific permission
 */
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

/**
 * Login with Google OAuth (Recommended for small organizations)
 * Requires Firebase setup or Google OAuth credentials
 * @param credentialResponse - Response from Google OAuth library
 */
export async function loginWithGoogle(credentialResponse: GoogleCredentialResponse): Promise<AuthResponse> {
  void credentialResponse;
  return {
    success: false,
    error: 'Google login is disabled until tokens are verified by the GAS backend.',
  };

  try {
    // Extract JWT from Google's credential response
    const googleToken = credentialResponse.credential;

    if (!googleToken) {
      return {
        success: false,
        error: 'No Google token received',
      };
    }

    // Decode the JWT (in production: verify with backend)
    // Google JWT structure: header.payload.signature
    const parts = googleToken.split('.');
    if (parts.length !== 3) {
      return {
        success: false,
        error: 'Invalid Google token format',
      };
    }

    // Decode payload (add padding if needed)
    const payload = parts[1];
    const decodedPayload = JSON.parse(
      atob(payload + '='.repeat((4 - (payload.length % 4)) % 4))
    );

    const { email, name, picture } = decodedPayload;

    if (!email) {
      return {
        success: false,
        error: 'Email is required for authentication',
      };
    }

    // TODO: Verify Google token with backend
    // POST to /api/auth/verify-google-token

    // For now, accept any Google user and assign role
    // In production: validate against company domain & fetch user role from backend
    const user: User = {
      email,
      name: name || 'Google User',
      role: UserRole.WFG, // Default role - fetch from backend in production
      avatar: picture,
    };

    // Generate token (in production: receive from backend)
    const token = generateSecureToken(email, 'GOOGLE');
    const expiresIn = AUTH_CONFIG.tokenExpiryHours * 3600; // Convert to seconds

    // Store securely
    storeAuthData(token, user, expiresIn);

    console.log('✅ Google login successful:', email);

    return {
      success: true,
      data: {
        token,
        user,
        expiresIn,
      },
    };
  } catch (error) {
    console.error('❌ Google authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Google authentication failed',
    };
  }
}

/**
 * Login with a password for an allowed user profile
 */
export async function loginWithPassword(userId: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(ensureGasAuthUrl(), {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'loginWithPassword',
        profile: userId,
        password,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Cannot connect to authentication service',
      };
    }

    const result = (await response.json()) as AuthResponse;
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Password invalid',
      };
    }

    const user: User = {
      ...result.data.user,
      role: result.data.user.role || UserRole.WFG,
    };

    storeAuthData(result.data.token, user, result.data.expiresIn);
    return {
      success: true,
      data: {
        token: result.data.token,
        user,
        expiresIn: result.data.expiresIn,
      },
    };

    /*
     * Legacy local PIN auth removed. GAS now owns PIN validation and token issuing.
    if (pin !== account.pin) {
      return {
        success: false,
        error: 'PIN ไม่ถูกต้อง',
      };
    }

    const user: User = {
      email: account.email,
      name: account.name,
      role: account.role,
      department: account.department,
    };

    const token = generateSecureToken(account.email, userId);
    const expiresIn = AUTH_CONFIG.tokenExpiryHours * 3600;

    storeAuthData(token, user, expiresIn);

    return {
      success: true,
      data: {
        token,
        user,
        expiresIn,
      },
    };
     */
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

/**
 * Traditional login with email + password
 * Email/password login is currently disabled in favor of secure PIN login.
 */
export async function loginWithEmail(email: string, password: string): Promise<AuthResponse> {
  return {
    success: false,
    error: 'Email/password login is not supported. Use PIN login instead.',
  };
}

/**
 * Logout user and clear session
 */
export function logout(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Generate a secure JWT-like token
 * In production: This should come from backend
 */
function generateSecureToken(email: string, profile?: string): string {
  void email;
  void profile;
  throw new Error('Client-side token signing is disabled. Use GAS-issued tokens only.');
}

/**
 * Store authentication data securely
 */
function storeAuthData(token: string, user: User, expiresInSeconds: number): void {
  const expiryTime = Date.now() + (expiresInSeconds * 1000);

  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  sessionStorage.setItem(ROLE_KEY, user.role);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Validate token on backend (call before making API requests)
 * Returns user info if valid, null if expired or invalid
 * In production: verify with backend API
 */
export async function validateToken(token: string): Promise<ValidateTokenResponse> {
  try {
    if (!token) {
      return {
        success: false,
        valid: false,
        error: 'No token provided',
      };
    }

    // Basic JWT validation (check format)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return {
        success: false,
        valid: false,
        error: 'Invalid token format',
      };
    }

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (parts[1].length % 4)) % 4))
    );
    if (payload.exp && Date.now() >= Number(payload.exp) * 1000) {
      return {
        success: false,
        valid: false,
        error: AUTH_ERROR_MESSAGES.SESSION_EXPIRED,
      };
    }

    return {
      success: true,
      valid: true,
    };
  } catch (error) {
    return {
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

/**
 * Refresh token before expiry
 */
export async function refreshToken(): Promise<AuthResponse> {
  return {
    success: false,
    error: 'Token refresh is not available. Please login again.',
  };

  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: 'No user session found',
      };
    }

    // In production: call backend refresh endpoint
    // const response = await fetch('/api/auth/refresh', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${getToken()}` },
    // });

    const user = currentUser;
    const token = generateSecureToken(user.email, user.name);
    const expiresIn = AUTH_CONFIG.tokenExpiryHours * 3600;

    storeAuthData(token, user, expiresIn);

    return {
      success: true,
      data: {
        token,
        user,
        expiresIn,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed',
    };
  }
}

/**
 * Add token to request headers for API calls
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}
