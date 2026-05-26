const AUTH_SECRET = (
  process.env.AUTH_TOKEN_SECRET ||
  process.env.GAS_AUTH_TOKEN_SECRET ||
  ''
).trim();

const PROFILE_ALIASES: Record<string, string> = {
  WFG: 'OPERATOR',
  PDB: 'OPERATOR',
};

const PROFILE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'view_dashboard',
    'view_overall',
    'create_case',
    'edit_case',
    'delete_case',
    'update_status',
    'fill_resolution',
    'fill_valuation',
    'export_data',
  ],
  QSMS: [
    'view_dashboard',
    'view_overall',
    'create_case',
    'edit_case',
    'delete_case',
    'update_status',
    'fill_resolution',
    'fill_valuation',
    'export_data',
  ],
  OPERATOR: ['view_overall', 'create_case', 'update_status', 'fill_resolution', 'export_data'],
  FINANCE: ['view_overall', 'fill_valuation'],
};

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export interface AuthContext {
  email: string;
  profile: string;
}

interface TokenPayload {
  sub?: string;
  profile?: string;
  exp?: number;
  type?: string;
}

function normalizeProfile(profile: unknown): string {
  const upper = String(profile || '').trim().toUpperCase();
  return PROFILE_ALIASES[upper] || upper;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function signToken(unsignedToken: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsignedToken));
  return Buffer.from(signature).toString('base64url');
}

async function verifyToken(token: string): Promise<TokenPayload> {
  if (!AUTH_SECRET) {
    throw new AuthError('AUTH_TOKEN_SECRET is not configured on the Next.js server.', 500);
  }

  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw new AuthError('Invalid token format');
  }

  const payload = JSON.parse(decodeBase64Url(parts[1])) as TokenPayload;
  const expectedSignature = await signToken(`${parts[0]}.${parts[1]}`);
  if (!safeEqual(Buffer.from(parts[2]), Buffer.from(expectedSignature))) {
    throw new AuthError('Invalid token signature');
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || now > Number(payload.exp)) {
    throw new AuthError('Token expired');
  }

  if (payload.type && payload.type !== 'auth_token') {
    throw new AuthError('Invalid token type');
  }

  return payload;
}

export async function requireServerAuth(body: Record<string, unknown>): Promise<AuthContext> {
  const payload = await verifyToken(String(body.token || ''));
  const tokenEmail = String(payload.sub || '').trim().toLowerCase();
  const tokenProfile = normalizeProfile(payload.profile);
  const requestEmail = String(body.authEmail || '').trim().toLowerCase();
  const requestProfile = normalizeProfile(body.authProfile);

  if (!tokenEmail) {
    throw new AuthError('Token subject is missing');
  }

  if (!tokenProfile) {
    throw new AuthError('Authentication profile is required');
  }

  if (requestEmail && requestEmail !== tokenEmail) {
    console.warn(`⚠️ Email mismatch (allowed): token=${tokenEmail}, request=${requestEmail}`);
  }

  if (requestProfile && requestProfile !== tokenProfile) {
    throw new AuthError(`Authentication profile mismatch: token=${tokenProfile}, request=${requestProfile}`);
  }

  return {
    email: tokenEmail,
    profile: tokenProfile,
  };
}

export function assertPermission(auth: AuthContext, permission: string): void {
  const permissions = PROFILE_PERMISSIONS[auth.profile] || [];
  if (!permissions.includes(permission)) {
    throw new AuthError('You do not have permission to perform this action.', 403);
  }
}
