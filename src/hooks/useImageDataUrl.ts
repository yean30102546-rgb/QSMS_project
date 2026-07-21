import { useEffect, useState } from 'react';

import { fetchImageDataUrl } from '../services/api';
import { extractGoogleDriveFileId } from '../utils/imageUrls';

export function useImageDataUrl(imageUrl: string) {
  const initialUrl = String(imageUrl || '').trim();
  const shouldFetchFromApi = Boolean(initialUrl) && Boolean(extractGoogleDriveFileId(initialUrl)) && !initialUrl.startsWith('data:');
  const [dataUrl, setDataUrl] = useState<string>(initialUrl || '');
  const [isLoading, setIsLoading] = useState(shouldFetchFromApi);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const normalizedUrl = String(imageUrl || '').trim();

    if (!normalizedUrl) {
      setDataUrl('');
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!extractGoogleDriveFileId(normalizedUrl) || normalizedUrl.startsWith('data:')) {
      setDataUrl('');
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchImageDataUrl(normalizedUrl)
      .then((nextDataUrl) => {
        if (!cancelled) {
          setDataUrl(nextDataUrl);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Image load failed');
          setDataUrl('');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return { dataUrl, isLoading, error };
}
