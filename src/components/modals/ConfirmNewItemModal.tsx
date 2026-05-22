/**
 * Confirm New Item Alert Dialog
 * Minimal, smooth animations for fast responsive feel:
 * - Quick fade-in backdrop (0.2s)
 * - Fast slide-up modal (0.25s)
 * - Instant content display (no staggered delays)
 * - GPU-optimized for smooth 60fps
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ConfirmNewItemModalProps {
  isOpen: boolean;
  itemNumber: string;
  onConfirm: (itemName: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmNewItemModal({
  isOpen,
  itemNumber,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmNewItemModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [errorText, setErrorText] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewItemName('');
      setErrorText('');
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    const trimmedName = newItemName.trim();
    if (!trimmedName) {
      setErrorText('กรุณากรอกชื่อ Item Name');
      return;
    }
    
    setIsProcessing(true);
    setErrorText('');
    try {
      await onConfirm(trimmedName);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop - quick fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/40 z-40 will-change-opacity"
          />

          {/* Container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none will-change-transform"
          >
            {/* Modal - slide-up quickly */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pointer-events-auto w-full max-w-sm will-change-transform"
            >
              <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200/80">
                {/* Alert Content - no animation delays */}
                <div className="p-6 space-y-4">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-3">
                    <AlertCircle 
                      size={24} 
                      className="text-amber-600 flex-shrink-0 mt-0.5"
                    />
                    <div className="flex-1">
                      <h2 className="text-base font-bold text-slate-900">
                        ไม่พบรหัสในระบบ
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">
                        รหัส <span className="font-mono font-bold text-slate-900">{itemNumber}</span> ไม่มีในฐานข้อมูล
                      </p>
                    </div>
                  </div>

                  {/* Message & Input */}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      โปรดระบุชื่อ Item Name เพื่อบันทึกลงฐานข้อมูล:
                    </p>
                    <input
                      type="text"
                      autoFocus
                      value={newItemName}
                      onChange={(e) => {
                        setNewItemName(e.target.value);
                        if (e.target.value.trim()) setErrorText('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirm();
                        }
                      }}
                      placeholder="กรอกชื่อ Item Name..."
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errorText ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-slate-300 focus:ring-amber-200 focus:border-amber-400'
                      }`}
                    />
                    {errorText && (
                      <p className="text-xs text-red-500 mt-1">{errorText}</p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={onCancel}
                      disabled={isProcessing || isLoading}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ยกเลิก
                    </button>
                    <motion.button
                      onClick={handleConfirm}
                      disabled={isProcessing || isLoading}
                      whileHover={{ y: -1 }}
                      whileTap={{ y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 active:bg-amber-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                    >
                      {isProcessing || isLoading ? (
                        <>
                          <motion.div 
                            className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="text-xs">กำลังบันทึก...</span>
                        </>
                      ) : (
                        <>บันทึกใหม่</>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
