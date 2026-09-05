import { describe, it, expect } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('LINE Webhook Route Handler', () => {
  it('returns HTTP 200 on LINE platform verification request (empty events array)', async () => {
    const payload = JSON.stringify({
      destination: 'Udfd1ad9ee3d4a9ba1642ca02640b5495',
      events: [],
    });

    const req = new NextRequest('http://localhost:3000/api/notifications/line', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: payload,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.processedEvents).toBe(0);
  });
});
