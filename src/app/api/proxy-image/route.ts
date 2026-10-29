import { NextResponse } from 'next/server';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function isAllowedImageUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    const configuredHosts = [
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_RAG_SUPABASE_URL,
    ].flatMap((configuredUrl) => {
      if (!configuredUrl) return [];
      try {
        return [new URL(configuredUrl).hostname];
      } catch {
        return [];
      }
    });
    const allowedHosts = new Set([
      'drive.google.com',
      'lh3.googleusercontent.com',
      'res.cloudinary.com',
      ...configuredHosts,
    ]);

    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443') ||
      !allowedHosts.has(url.hostname)
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceUrl = searchParams.get('url');

  if (!sourceUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  const imageUrl = isAllowedImageUrl(sourceUrl);
  if (!imageUrl) {
    return new NextResponse('Unsupported image host', { status: 400 });
  }

  try {
    let response: Response;
    try {
      response = await fetch(imageUrl, {
        headers: { 'User-Agent': 'QSMS image proxy' },
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      });
    } catch (fetchError) {
      // If drive.google.com fails due to HTTP 302 redirect, safely fetch directly from Google's static CDN (lh3)
      const driveMatch = sourceUrl.match(/[?&]id=([^&]+)/) || sourceUrl.match(/\/d\/([^/?]+)/);
      if (driveMatch && (imageUrl.hostname === 'drive.google.com' || imageUrl.hostname === 'lh3.googleusercontent.com')) {
        const directLh3Url = new URL(`https://lh3.googleusercontent.com/d/${encodeURIComponent(driveMatch[1])}=w1600`);
        response = await fetch(directLh3Url, {
          headers: { 'User-Agent': 'QSMS image proxy' },
          redirect: 'error',
          signal: AbortSignal.timeout(15000),
        });
      } else {
        throw fetchError;
      }
    }

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: 502 });
    }

    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return new NextResponse('Unsupported image type', { status: 415 });
    }
    if (contentLength > MAX_IMAGE_BYTES) {
      return new NextResponse('Image is too large', { status: 413 });
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return new NextResponse('Image is too large', { status: 413 });
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return new NextResponse('Failed to fetch image', { status: 502 });
  }
}
