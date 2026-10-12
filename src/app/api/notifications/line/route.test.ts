import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const payload = JSON.stringify({ destination: 'test-destination', events: [] });
const secret = 'test-line-channel-secret';

function makeRequest(signature?: string): NextRequest {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (signature) headers.set('x-line-signature', signature);

  return new NextRequest('http://localhost:3000/api/notifications/line', {
    method: 'POST',
    headers,
    body: payload,
  });
}

afterEach(() => vi.unstubAllEnvs());

describe('LINE Webhook Route Handler', () => {
  it('accepts a valid signature for an empty verification event', async () => {
    vi.stubEnv('LINE_CHANNEL_SECRET', secret);
    const signature = createHmac('sha256', secret).update(payload).digest('base64');

    const response = await POST(makeRequest(signature));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true, processedEvents: 0 });
  });

  it('rejects requests with an invalid signature', async () => {
    vi.stubEnv('LINE_CHANNEL_SECRET', secret);

    const response = await POST(makeRequest('invalid-signature'));

    expect(response.status).toBe(401);
  });

  it('fails closed when the channel secret is not configured', async () => {
    vi.stubEnv('LINE_CHANNEL_SECRET', '');

    const response = await POST(makeRequest());

    expect(response.status).toBe(503);
  });
});
