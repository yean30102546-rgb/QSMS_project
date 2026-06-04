import React from 'react';
import { ImageOff } from 'lucide-react';

import { useImageDataUrl } from '../../hooks/useImageDataUrl';
import { toDisplayImageUrl } from '../../utils/imageUrls';

interface DriveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  fallbackToDriveUrl?: boolean;
}

export function DriveImage({ src, fallbackToDriveUrl = true, className, alt = '', ...props }: DriveImageProps) {
  const { dataUrl, isLoading, error } = useImageDataUrl(src);
  const resolvedSrc = dataUrl || (fallbackToDriveUrl ? toDisplayImageUrl(src) : '');

  if (!resolvedSrc && (error || !isLoading)) {
    return (
      <div className={`${className || ''} flex flex-col items-center justify-center gap-1 text-slate-300 bg-slate-50`}>
        <ImageOff size={22} />
        <span className="text-xs">โหลดไม่ได้</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && !dataUrl && (
        <div className={`${className || ''} flex items-center justify-center bg-slate-50 text-slate-300`}>
          <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
        </div>
      )}
      {resolvedSrc && (
        <img
          {...props}
          src={resolvedSrc}
          alt={alt}
          className={`${className || ''} ${isLoading && !dataUrl ? 'hidden' : ''}`}
        />
      )}
    </>
  );
}
