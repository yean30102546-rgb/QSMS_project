/**
 * Image Compression Utility
 * Handles client-side image compression and validation
 */

interface CompressionConfig {
  maxSizeMB: number;
  maxWidthOrHeight: number;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface CompressionResult {
  success: boolean;
  compressedFile?: File;
  originalSize: number;
  compressedSize?: number;
  error?: string;
}

const DEFAULT_CONFIG: CompressionConfig = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1280,
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

let imageCompressionLoader: Promise<typeof import('browser-image-compression').default> | null = null;

async function loadImageCompression() {
  if (!imageCompressionLoader) {
    imageCompressionLoader = import('browser-image-compression').then((mod) => mod.default);
  }

  return imageCompressionLoader;
}

export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Only JPEG and PNG are allowed.`,
    };
  }

  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'Invalid file extension. Only .jpg, .jpeg, and .png are allowed.',
    };
  }

  const maxInitialSizeMB = 10;
  if (file.size > maxInitialSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File size too large. Maximum initial size is ${maxInitialSizeMB}MB.`,
    };
  }

  return { valid: true };
}

export async function compressImage(
  file: File,
  config: Partial<CompressionConfig> = {},
  onProgress?: (progress: number) => void,
): Promise<CompressionResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return {
        success: false,
        originalSize: file.size,
        error: validation.error,
      };
    }

    const imageCompression = await loadImageCompression();
    const originalSize = file.size;
    onProgress?.(10);

    const compressedFile = await imageCompression(file, {
      maxSizeMB: mergedConfig.maxSizeMB,
      maxWidthOrHeight: mergedConfig.maxWidthOrHeight,
      useWebWorker: true,
      onProgress: (progress) => {
        onProgress?.(10 + Math.floor(progress * 0.8));
      },
    });

    onProgress?.(95);

    return {
      success: true,
      compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
    };
  } catch (error) {
    return {
      success: false,
      originalSize: file.size,
      error: error instanceof Error ? error.message : 'Unknown compression error',
    };
  }
}

export async function compressMultipleImages(
  files: File[],
  config: Partial<CompressionConfig> = {},
  onProgress?: (progress: number) => void,
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const fileProgress = (i / files.length) * 100;

    const result = await compressImage(files[i], config, (progress) => {
      const overallProgress = fileProgress + progress / files.length;
      onProgress?.(Math.floor(overallProgress));
    });

    results.push(result);
  }

  onProgress?.(100);
  return results;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * 100 * 10) / 10;
}
