import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

afterEach(() => vi.unstubAllGlobals());

describe('GET /api/proxy-image', () => {
  it('rejects an untrusted host without making an outbound request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(new Request(
      'http://localhost/api/proxy-image?url=' + encodeURIComponent('http://127.0.0.1/admin')
    ));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('proxies an allowlisted image and blocks redirects', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      headers: { 'content-type': 'image/png', 'content-length': '3' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const imageUrl = 'https://drive.google.com/thumbnail?id=test-image&sz=w1200';
    const response = await GET(new Request(
      'http://localhost/api/proxy-image?url=' + encodeURIComponent(imageUrl)
    ));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(new URL(imageUrl), expect.objectContaining({ redirect: 'error' }));
  });

  it('rejects responses that are not safe image types', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html/>', {
      headers: { 'content-type': 'text/html' },
    })));

    const response = await GET(new Request(
      'http://localhost/api/proxy-image?url=' + encodeURIComponent('https://drive.google.com/thumbnail?id=test-image')
    ));

    expect(response.status).toBe(415);
  });
});
