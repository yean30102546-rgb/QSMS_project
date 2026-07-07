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

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Image as ImageIcon, AlertCircle, Eye, Trash2, Maximize2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageEditor } from './ImageEditor';
import {
  validateImageFile,
  compressImage,
  formatFileSize,
  calculateCompressionRatio,
} from '../../utils/imageCompressionUtils';

interface ImageUploadProps {
  itemIndex: number;
  onImagesSelected: (files: File[]) => void;
  onImagesCompressed?: (compressedFiles: File[]) => void;
  onUrlsChange?: (urls: string[]) => void;
  currentImages?: File[];
  initialImageUrls?: string[];
  maxImages?: number;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

interface ImageWithStatus {
  id: string;
  file?: File;
  preview: string;
  status: 'pending' | 'validating' | 'compressing' | 'complete' | 'error';
  progress: number;
  error?: string;
  compressedFile?: File;
  originalSize?: number;
  compressedSize?: number;
  isUrlOnly?: boolean;
}

export function ImageUpload({
  itemIndex,
  onImagesSelected,
  onImagesCompressed,
  onUrlsChange,
  currentImages = [],
  initialImageUrls = [],
  maxImages = 5,
  maxSizeMB = 0.5,
  maxWidthOrHeight = 1280,
}: ImageUploadProps) {
  const [imageItems, setImageItems] = useState<ImageWithStatus[]>(() => {
    // Initialize with URLs if available
    return initialImageUrls.map(url => ({
      id: `img-url-${Math.random().toString(36).substr(2, 9)}`,
      preview: url,
      status: 'complete',
      progress: 100,
      isUrlOnly: true
    }));
  });
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<{ id: string; preview: string; name: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onImagesSelectedRef = useRef(onImagesSelected);
  const onImagesCompressedRef = useRef(onImagesCompressed);

  useEffect(() => {
    onImagesSelectedRef.current = onImagesSelected;
  }, [onImagesSelected]);

  useEffect(() => {
    onImagesCompressedRef.current = onImagesCompressed;
  }, [onImagesCompressed]);

  useEffect(() => {
    const filesForParent = imageItems
      .filter((item) => item.status !== 'error')
      .map((item) => item.compressedFile || item.file);
    onImagesSelectedRef.current(filesForParent);
    onImagesCompressedRef.current?.(filesForParent);
  }, [imageItems]);

  const prevCurrentImagesLenRef = useRef(currentImages.length);

  useEffect(() => {
    if (prevCurrentImagesLenRef.current > 0 && currentImages.length === 0) {
      setImageItems([]);
      setUploadingIndex(null);
    }
    prevCurrentImagesLenRef.current = currentImages.length;
  }, [currentImages.length]);

  const processImage = useCallback(
    async (file: File, id: string) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setImageItems((prev) =>
          prev.map((item) =>
            item.id === id
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
        prev.map((item) =>
          item.id === id ? { ...item, status: 'compressing', progress: 10 } : item
        )
      );

      const result = await compressImage(
        file,
        { maxSizeMB, maxWidthOrHeight },
        (progress) => {
          setImageItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, progress } : item
            )
          );
        }
      );

      if (result.success && result.compressedFile) {
        setImageItems((prev) =>
          prev.map((item) =>
            item.id === id
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
          prev.map((item) =>
            item.id === id
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
    },
    [maxSizeMB, maxWidthOrHeight]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      const available = maxImages - imageItems.length;
      const filesToAdd = newFiles.slice(0, available);

      if (filesToAdd.length === 0) return;

      const newImageItems: ImageWithStatus[] = filesToAdd.map((file) => ({
        id: `img-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: '',
        status: 'pending',
        progress: 0,
        originalSize: file.size,
      }));

      setImageItems((prev) => [...prev, ...newImageItems]);

      newImageItems.forEach((item) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          setImageItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, preview } : i
            )
          );
          processImage(item.file, item.id);
        };
        reader.readAsDataURL(item.file);
      });

      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [imageItems.length, maxImages, processImage]
  );

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
  };

  /**
   * Handle paste event (Ctrl+V)
   */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
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

  // Global paste handler for the item card
  useEffect(() => {
    const card = containerRef.current?.closest('.glass-card') as HTMLElement;
    if (!card) return;

    const handleCardPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

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
    };

    card.addEventListener('paste', handleCardPaste);
    return () => card.removeEventListener('paste', handleCardPaste);
  }, [handleFiles, imageItems.length, maxImages]);

  const removeImage = (id: string) => {
    setImageItems(prev => {
      const removedItem = prev.find(item => item.id === id);
      const newItems = prev.filter(item => item.id !== id);

      // If it was a URL image, we need to notify the parent
      if (removedItem?.isUrlOnly && onUrlsChange) {
        const remainingUrls = newItems
          .filter(item => item.isUrlOnly)
          .map(item => item.preview);
        onUrlsChange(remainingUrls);
      }

      return newItems;
    });
  };

  const handleSaveAnnotatedImage = (editedFile: File) => {
    if (!editingImage) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newPreview = e.target?.result as string;
      setImageItems((prev) =>
        prev.map((item) =>
          item.id === editingImage.id
            ? {
              ...item,
              file: editedFile,
              compressedFile: editedFile,
              preview: newPreview,
              status: 'complete',
              progress: 100,
              originalSize: editedFile.size,
              compressedSize: editedFile.size,
            }
            : item
        )
      );
      setEditingImage(null);
    };
    reader.readAsDataURL(editedFile);
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Header with Apple Style Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">
            รูปภาพประกอบ
          </label>
          {imageItems.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
              {imageItems.length} / {maxImages}
            </span>
          )}
        </div>
      </div>

      {/* Modern Upload Area - Apple Minimalist */}
      {imageItems.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group h-24 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-1.5 overflow-hidden ${isDragging
              ? 'border-accent bg-accent/5 scale-[0.99] shadow-inner'
              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <div className={`p-2 rounded-full transition-colors duration-300 ${isDragging ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500'}`}>
            <Upload size={18} />
          </div>
          <p className="text-xs font-semibold text-slate-400 group-hover:text-slate-500">
            {isDragging ? 'Drop to upload' : 'Add Photos'}
          </p>
          <p className="text-xs text-slate-400 font-medium">PNG, JPG up to {maxSizeMB}MB</p>
        </div>
      )}

      {/* Minimalist Gallery */}
      <div className="grid grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {imageItems.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="relative aspect-square group rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm"
            >
              {item.preview ? (
                <img
                  src={item.preview}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Status & Actions Overlay */}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                {item.status === 'complete' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(item.preview)}
                      className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                      title="ดูรูปขยาย"
                    >
                      <Maximize2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingImage({ id: item.id, preview: item.preview, name: item.file?.name || 'image.jpg' })}
                      className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                      title="วาด/เน้นข้อบกพร่อง"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(item.id)}
                      className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                      title="ลบรูปภาพ"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {item.status === 'compressing' && (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-xs text-white font-semibold">Compressing</span>
                  </div>
                )}

                {item.status === 'error' && (
                  <div className="flex flex-col items-center gap-1">
                    <AlertCircle size={18} className="text-red-400" />
                    <button type="button" onClick={() => removeImage(item.id)} className="text-xs text-white font-semibold underline">Remove</button>
                  </div>
                )}
              </div>

              {/* Progress Indicator (Bottom Bar) */}
              {item.status === 'compressing' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    className="h-full bg-accent"
                  />
                </div>
              )}

              {/* Compression Success Tag */}
              {item.status === 'complete' && !item.isUrlOnly && item.originalSize && (
                <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-emerald-500/90 text-[10px] text-white font-semibold pointer-events-none">
                  -{calculateCompressionRatio(item.originalSize, item.compressedSize || 0)}%
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Full Screen Lightbox Preview */}
      {mounted && createPortal(
        <AnimatePresence>
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 md:p-12"
              onClick={() => setPreviewUrl(null)}
            >
              <motion.button
                type="button"
                onClick={() => setPreviewUrl(null)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
              >
                <X size={20} />
              </motion.button>

              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                src={previewUrl}
                alt="Fullscreen Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Full Screen Image Editor Overlay */}
      {mounted && createPortal(
        <AnimatePresence>
          {editingImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[105]"
            >
              <ImageEditor
                imageSrc={editingImage.preview}
                originalFileName={editingImage.name}
                onCancel={() => setEditingImage(null)}
                onSave={handleSaveAnnotatedImage}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

export default ImageUpload;

