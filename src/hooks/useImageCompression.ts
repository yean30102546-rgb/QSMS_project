/**
 * useImageCompression Hook
 * Custom hook สำหรับบีบอัดรูปภาพ — แยก logic ออกจาก UI ให้โค้ดสะอาด
 *
 * วิธีใช้:
 *   const { compressFiles, progress, status, error } = useImageCompression();
 *   const compressed = await compressFiles(selectedFiles);
 */

import { useState, useCallback } from 'react';
import {
  compressImage,
  compressMultipleImages,
  validateImageFile,
  formatFileSize,
  calculateCompressionRatio,
} from '../utils/imageCompressionUtils';

// ===== TYPES =====

type CompressionStatus = 'idle' | 'validating' | 'compressing' | 'complete' | 'error';

interface UseImageCompressionReturn {
  /** บีบอัดหลายไฟล์พร้อมกัน */
  compressFiles: (files: File[]) => Promise<File[]>;
  /** บีบอัดไฟล์เดียว */
  compressSingleFile: (file: File) => Promise<File | null>;
  /** ตรวจสอบไฟล์ว่าถูกต้องหรือไม่ */
  validate: (file: File) => { valid: boolean; error?: string };
  /** ความคืบหน้า (0-100) */
  progress: number;
  /** สถานะปัจจุบัน */
  status: CompressionStatus;
  /** ข้อผิดพลาด (ถ้ามี) */
  error: string | null;
  /** รีเซ็ตสถานะ */
  reset: () => void;
}

// ===== HOOK =====

export function useImageCompression(): UseImageCompressionReturn {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<CompressionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // ตรวจสอบไฟล์
  const validate = useCallback((file: File) => {
    return validateImageFile(file);
  }, []);

  // บีบอัดไฟล์เดียว
  const compressSingleFile = useCallback(async (file: File): Promise<File | null> => {
    setStatus('validating');
    setError(null);
    setProgress(0);

    // ตรวจสอบก่อน
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setStatus('error');
      setError(validation.error || 'ไฟล์ไม่ถูกต้อง');
      return null;
    }

    setStatus('compressing');
    const result = await compressImage(file, {}, (p) => setProgress(p));

    if (!result.success || !result.compressedFile) {
      setStatus('error');
      setError(result.error || 'ไม่สามารถบีบอัดรูปภาพได้');
      return null;
    }

    setStatus('complete');
    setProgress(100);

    console.log(
      `✅ บีบอัดสำเร็จ: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize!)} (ลด ${calculateCompressionRatio(result.originalSize, result.compressedSize!)}%)`
    );

    return result.compressedFile;
  }, []);

  // บีบอัดหลายไฟล์
  const compressFiles = useCallback(async (files: File[]): Promise<File[]> => {
    setStatus('compressing');
    setError(null);
    setProgress(0);

    const results = await compressMultipleImages(files, {}, (p) => setProgress(p));

    const successFiles = results
      .filter((r) => r.success && r.compressedFile)
      .map((r) => r.compressedFile!);

    const failedCount = results.filter((r) => !r.success).length;

    if (failedCount > 0) {
      setError(`บีบอัดไม่สำเร็จ ${failedCount} จาก ${files.length} ไฟล์`);
    }

    setStatus(failedCount > 0 ? 'error' : 'complete');
    setProgress(100);

    return successFiles;
  }, []);

  // รีเซ็ต
  const reset = useCallback(() => {
    setProgress(0);
    setStatus('idle');
    setError(null);
  }, []);

  return {
    compressFiles,
    compressSingleFile,
    validate,
    progress,
    status,
    error,
    reset,
  };
}
