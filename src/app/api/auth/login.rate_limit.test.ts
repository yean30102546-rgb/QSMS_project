import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateToken: vi.fn(),
  from: vi.fn(),
  single: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
}));

vi.mock('@/src/lib/serverAuth', () => ({
  generateToken: mocks.generateToken,
}));

vi.mock('@/src/lib/supabaseServer', () => ({
  supabaseServer: {
    from: mocks.from,
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
  }),
}));

import { POST } from './login/route';

describe('POST /api/auth/login rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({
      select: mocks.select.mockReturnValue({
        eq: mocks.eq.mockReturnValue({
          single: mocks.single,
        }),
      }),
    });
  });

  it('rejects after 5 consecutive failed login attempts with HTTP 429', async () => {
    const testUsername = `user_rate_limit_${Date.now()}`;
    // Simulate user not found / bad credentials
    mocks.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: testUsername, password: 'wrongpassword' }),
      });
      const res = await POST(request);
      expect(res.status).toBe(401);
    }

    // 6th attempt should be blocked by rate limiter
    const request6 = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: testUsername, password: 'wrongpassword' }),
    });
    const res6 = await POST(request6);
    expect(res6.status).toBe(429);
    const body6 = await res6.json();
    expect(body6.success).toBe(false);
    expect(body6.error).toContain('คุณระบุรหัสผ่านผิดเกิน 5 ครั้ง');
  });
});

