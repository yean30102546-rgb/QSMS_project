/**
 * Improved Image Upload Component
 * Handles client-side compression, validation, and upload progress
 * 
 * Features:
 * - Image compression using browser-image-compression
 * - File validation (JPEG, PNG only)
 * - Upload progress tracking with visual feedback
 * - Drag & drop support
 * - Preview gallery
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  validateImageFile,
  compressImage,
  formatFileSize,
  calculateCompressionRatio,
} from '../utils/imageCompressionUtils';

interface ImageUploadProps {
  itemIndex: number;
  onImagesSelected: (files: File[]) => void;
  onImagesCompressed?: (compressedFiles: File[]) => void;
  currentImages?: File[];
  maxImages?: number;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

interface ImageWithStatus {
  file: File;
  preview: string;
  status: 'pending' | 'validating' | 'compressing' | 'complete' | 'error';
  progress: number;
  error?: string;
  compressedFile?: File;
  originalSize: number;
  compressedSize?: number;
}

export function ImageUpload({
  itemIndex,
  onImagesSelected,
  onImagesCompressed,
  currentImages = [],
  maxImages = 5,
  maxSizeMB = 0.5,
  maxWidthOrHeight = 1280,
}: ImageUploadProps) {
  const [imageItems, setImageItems] = useState<ImageWithStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onImagesSelectedRef = useRef(onImagesSelected);
  const onImagesCompressedRef = useRef(onImagesCompressed);

  useEffect(() => {
    onImagesSelectedRef.current = onImagesSelected;
  }, [onImagesSelected]);

  useEffect(() => {
    onImagesCompressedRef.current = onImagesCompressed;
  }, [onImagesCompressed]);

  // Keep parent list aligned with what is currently shown.
  useEffect(() => {
    const filesForParent = imageItems
      .filter((item) => item.status !== 'error')
      .map((item) => item.compressedFile || item.file);
    onImagesSelectedRef.current(filesForParent);
    onImagesCompressedRef.current?.(filesForParent);
  }, [imageItems]);

  const prevCurrentImagesLenRef = useRef(currentImages.length);

  // Allow parent reset/clear to clear local gallery.
  useEffect(() => {
    // Only clear if parent explicitly cleared the array (changed from > 0 to 0)
    // This prevents the race condition where imageItems is populated but currentImages hasn't caught up yet
    if (prevCurrentImagesLenRef.current > 0 && currentImages.length === 0) {
      setImageItems([]);
      setUploadingIndex(null);
    }
    prevCurrentImagesLenRef.current = currentImages.length;
  }, [currentImages.length]);

  /**
   * Process and compress a single image
   */
  const processImage = useCallback(
    async (file: File, index: number) => {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setImageItems((prev) =>
          prev.map((item, i) =>
            i === index
              ? {
                ...item,
                status: 'error',
                error: validation.error,
                progress: 0,
              }
              : item
          )
        );
        return;
      }

      setImageItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
              ...item,
              status: 'compressing',
              progress: 10,
            }
            : item
        )
      );

      setUploadingIndex(index);

      // Compress image
      const result = await compressImage(
        file,
        { maxSizeMB, maxWidthOrHeight },
        (progress) => {
          setImageItems((prev) =>
            prev.map((item, i) =>
              i === index
                ? {
                  ...item,
                  progress,
                }
                : item
            )
          );
        }
      );

      if (result.success && result.compressedFile) {
        setImageItems((prev) =>
          prev.map((item, i) =>
            i === index
              ? {
                ...item,
                status: 'complete',
                progress: 100,
                compressedFile: result.compressedFile,
                compressedSize: result.compressedSize,
              }
              : item
          )
        );
      } else {
        setImageItems((prev) =>
          prev.map((item, i) =>
            i === index
              ? {
                ...item,
                status: 'error',
                error: result.error || 'Compression failed',
                progress: 0,
              }
              : item
          )
        );
      }

      setUploadingIndex(null);
    },
    [maxSizeMB, maxWidthOrHeight]
  );

  /**
   * Handle file selection (drag & drop or click)
   */
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      const available = maxImages - imageItems.length;
      const filesToAdd = newFiles.slice(0, available);

      if (filesToAdd.length === 0) {
        if (imageItems.length >= maxImages) {
          console.warn(`Maximum ${maxImages} images allowed`);
        }
        return;
      }

      // Create ImageWithStatus items for each file
      const startIndex = imageItems.length;
      const newImageItems: ImageWithStatus[] = filesToAdd.map((file) => ({
        file,
        preview: '', // Will be set after FileReader
        status: 'pending',
        progress: 0,
        originalSize: file.size,
      }));

      setImageItems((prev) => [...prev, ...newImageItems]);

      // Create previews and auto-compress
      filesToAdd.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageIndex = startIndex + idx;
          setImageItems((prev) =>
            prev.map((item, i) =>
              i === imageIndex
                ? {
                  ...item,
                  preview: e.target?.result as string,
                }
                : item
            )
          );

          // Auto-compress after preview is created
          processImage(file, imageIndex);
        };
        reader.readAsDataURL(file);
      });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [imageItems.length, maxImages, processImage]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  /**
   * Handle paste event (Ctrl+V)
   */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      // Don't stop propagation to allow other handlers if needed, 
      // but prevent default if we actually find images
      const items = e.clipboardData.items;
      let hasImages = false;
      const files: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            files.push(file);
            hasImages = true;
          }
        }
      }

      if (hasImages) {
        e.preventDefault();
        const available = maxImages - imageItems.length;
        if (available <= 0) return;

        const filesToAdd = files.slice(0, available);
        const dataTransfer = new DataTransfer();
        filesToAdd.forEach(file => dataTransfer.items.add(file));
        handleFiles(dataTransfer.files);
      }
    },
    [handleFiles, imageItems.length, maxImages]
  );

  const removeImage = (index: number) => {
    const newItems = imageItems.filter((_, i) => i !== index);
    setImageItems(newItems);
  };

  const retryCompress = (index: number) => {
    const item = imageItems[index];
    processImage(item.file, index);
  };

  // Calculate overall statistics
  const completedCount = imageItems.filter((item) => item.status === 'complete').length;
  const errorCount = imageItems.filter((item) => item.status === 'error').length;
  const totalOriginalSize = imageItems.reduce((sum, item) => sum + item.originalSize, 0);
  const totalCompressedSize = imageItems.reduce(
    (sum, item) => sum + (item.compressedSize || 0),
    0
  );
  const totalCompressionRatio =
    totalOriginalSize > 0
      ? calculateCompressionRatio(totalOriginalSize, totalCompressedSize)
      : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">
          รูปภาพประกอบ (ทำให้ได้สูงสุด {maxImages} ไฟล์)
        </label>
        <span className="text-[10px] text-muted font-semibold">
          {imageItems.length}/{maxImages}
        </span>
      </div>

      {/* Upload Area */}
      {imageItems.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onPaste={handlePaste}
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          className={`border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center transition-all cursor-pointer group outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent ${isDragging
            ? 'border-accent bg-accent/5'
            : 'border-border hover:bg-slate-100 bg-slate-50'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload
            size={20}
            className={`${isDragging ? 'text-accent' : 'text-muted group-hover:text-accent'} mb-2 transition-colors`}
          />
          <span className="text-[10px] text-muted font-bold uppercase tracking-widest text-center px-4">
            {isDragging ? 'Drop images here' : 'Drop images, click, or Ctrl+V to paste'}
          </span>
          <span className="text-[9px] text-muted mt-1">
            PNG, JPG (max {maxSizeMB}MB, {maxWidthOrHeight}x{maxWidthOrHeight}px)
          </span>
        </div>
      )}

      {/* Statistics */}
      {imageItems.length > 0 && (
        <div className="grid grid-cols-3 gap-3 text-[9px]">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="font-bold text-blue-700">{completedCount}</div>
            <div className="text-blue-600">Compressed</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <div className="font-bold text-yellow-700">{imageItems.length - completedCount - errorCount}</div>
            <div className="text-yellow-600">Processing</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <div className="font-bold text-red-700">{errorCount}</div>
            <div className="text-red-600">Failed</div>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {imageItems.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-3">
            <AnimatePresence>
              {imageItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-border relative">
                    <img
                      src={item.preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Status Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {item.status === 'complete' ? (
                        <div className="text-white text-2xl">✅</div>
                      ) : item.status === 'error' ? (
                        <div className="text-white text-2xl">❌</div>
                      ) : item.status === 'compressing' ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : null}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeImage(idx)}
                    disabled={uploadingIndex === idx}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={14} />
                  </button>

                  {/* Size Info */}
                  <div className="mt-1 text-[8px] text-muted text-center">
                    <div>
                      {formatFileSize(item.originalSize)}
                      {item.compressedSize && ` → ${formatFileSize(item.compressedSize)}`}
                    </div>
                    {item.compressedSize && (
                      <div className="text-emerald-600 font-semibold">
                        -{calculateCompressionRatio(item.originalSize, item.compressedSize)}%
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty slots */}
            {imageItems.length < maxImages &&
              [...Array(maxImages - imageItems.length)].map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="aspect-square rounded-lg border border-dashed border-border bg-slate-50 flex items-center justify-center"
                >
                  <ImageIcon size={20} className="text-muted/30" />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Error Messages */}
      <AnimatePresence>
        {imageItems.some((item) => item.status === 'error') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" />
              <span className="text-xs font-bold text-red-700">Compression errors detected</span>
            </div>
            {imageItems.map(
              (item, idx) =>
                item.status === 'error' && (
                  <div key={idx} className="text-xs text-red-600 bg-white rounded p-2 flex items-start justify-between">
                    <div>
                      <span className="font-semibold">{item.file.name}:</span> {item.error}
                    </div>
                    <button
                      onClick={() => retryCompress(idx)}
                      className="text-red-700 hover:text-red-900 font-semibold ml-2 flex-shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compression Summary */}
      {completedCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-emerald-50 border border-emerald-200 rounded-lg p-3"
        >
          <div className="text-xs text-emerald-700">
            <span className="font-semibold">✓ Compression Summary:</span> {completedCount} files
            compressed • Reduced by <span className="font-bold">{totalCompressionRatio}%</span> (
            {formatFileSize(totalOriginalSize)} → {formatFileSize(totalCompressedSize)})
          </div>
        </motion.div>
      )}

      {/* Max Images Reached */}
      {imageItems.length === maxImages && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-amber-50 border border-amber-200 rounded-lg p-3"
        >
          <div className="text-[10px] text-amber-700 font-semibold">
            ✓ ถึงจำนวนภาพสูงสุดแล้ว ({maxImages} files)
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default ImageUpload;
