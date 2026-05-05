/**
 * Image Compression Utility
 * Handles client-side image compression and validation
 */

import imageCompression from 'browser-image-compression';

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

interface CompressionProgress {
  progress: number; // 0-100
  status: 'idle' | 'validating' | 'compressing' | 'complete' | 'error';
}

/**
 * Default compression configuration
 */
const DEFAULT_CONFIG: CompressionConfig = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1280,
};

/**
 * Allowed image types
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

/**
 * Validate image file type and size
 * @param file - The file to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): ValidationResult {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Only JPEG and PNG are allowed.`,
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file extension. Only .jpg, .jpeg, and .png are allowed.`,
    };
  }

  // Check initial file size (before compression)
  const maxInitialSizeMB = 10;
  if (file.size > maxInitialSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File size too large. Maximum initial size is ${maxInitialSizeMB}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Compress a single image file
 * @param file - The file to compress
 * @param config - Compression configuration
 * @param onProgress - Callback for progress updates (0-100)
 * @returns Compression result
 */
export async function compressImage(
  file: File,
  config: Partial<CompressionConfig> = {},
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return {
        success: false,
        originalSize: file.size,
        error: validation.error,
      };
    }

    const originalSize = file.size;
    onProgress?.(10);

    // Start compression
    const compressedFile = await imageCompression(file, {
      maxSizeMB: mergedConfig.maxSizeMB,
      maxWidthOrHeight: mergedConfig.maxWidthOrHeight,
      useWebWorker: true,
      onProgress: (progress) => {
        // progress is 0-100
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

/**
 * Compress multiple images
 * @param files - Array of files to compress
 * @param config - Compression configuration
 * @param onProgress - Callback for overall progress (0-100)
 * @returns Array of compression results
 */
export async function compressMultipleImages(
  files: File[],
  config: Partial<CompressionConfig> = {},
  onProgress?: (progress: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const fileProgress = (i / files.length) * 100;

    const result = await compressImage(
      files[i],
      config,
      (progress) => {
        const overallProgress = fileProgress + (progress / files.length);
        onProgress?.(Math.floor(overallProgress));
      }
    );

    results.push(result);
  }

  onProgress?.(100);
  return results;
}

/**
 * Convert file size from bytes to human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate compression ratio
 * @param originalSize - Original file size in bytes
 * @param compressedSize - Compressed file size in bytes
 * @returns Compression ratio as percentage (e.g., 45.5 for 45.5%)
 */
export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number
): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * 100 * 10) / 10;
}
