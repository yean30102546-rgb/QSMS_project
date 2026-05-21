'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface AppleProgressBarProps {
  progress: number;
  label?: string;
  statusText?: string;
  isComplete?: boolean;
}

export function AppleProgressBar({ progress, label = 'Saving Rework Case', statusText, isComplete }: AppleProgressBarProps) {
  return (
    <div className="w-full py-2">
      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex flex-col items-center justify-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={28} strokeWidth={3} />
            </div>
            <div className="text-center">
              <h3 className="text-[17px] font-bold text-slate-900 leading-none">Successfully Saved</h3>
              <p className="text-[13px] text-slate-500 mt-1 font-medium">Data is now live in both Supabase and Sheets.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3"
          >
            <div className="flex justify-between items-end px-1">
              <div>
                <span className="text-[14px] font-bold text-slate-900 tracking-tight block mb-0.5">{label}</span>
                <span className="text-[11px] font-medium text-slate-500">{statusText || 'Processing...'}</span>
              </div>
              <span className="text-[12px] font-mono font-bold text-slate-900">{Math.round(progress)}%</span>
            </div>
            <div className="relative h-[4px] w-full overflow-hidden rounded-full bg-black/5 backdrop-blur-sm">
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{ background: 'linear-gradient(90deg, #1d1d1f, #434343)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="absolute top-0 left-0 w-[120px] h-full animate-sweep blur-md" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
