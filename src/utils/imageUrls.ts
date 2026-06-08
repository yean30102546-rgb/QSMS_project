const DRIVE_FILE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([^/]+)/,
  /drive\.google\.com\/open\?id=([^&]+)/,
  /drive\.google\.com\/uc\?(?:.*&)?id=([^&]+)/,
  /drive\.google\.com\/thumbnail\?id=([^&]+)/,
  /lh3\.googleusercontent\.com\/d\/([^/?]+)/,
];

export function extractGoogleDriveFileId(url: string): string | null {
  const normalizedUrl = String(url || '').trim();
  for (const pattern of DRIVE_FILE_ID_PATTERNS) {
    const match = normalizedUrl.match(pattern);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}

export function toDisplayImageUrl(url: string, size = 1200): string {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${size}`;
}

export function toCorsProxyUrl(url: string): string {
  const normalizedUrl = String(url || '').trim();
  if (normalizedUrl.includes('corsproxy.io/?')) {
    return normalizedUrl;
  }
  return `https://corsproxy.io/?${encodeURIComponent(normalizedUrl)}`;
}

export function toInternalProxyUrl(url: string): string {
  const normalizedUrl = String(url || '').trim();
  if (normalizedUrl.startsWith('/api/proxy-image')) {
    return normalizedUrl;
  }
  return `/api/proxy-image?url=${encodeURIComponent(normalizedUrl)}`;
}

