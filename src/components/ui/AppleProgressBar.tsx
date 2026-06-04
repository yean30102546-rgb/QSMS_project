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
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            className="flex flex-col items-center justify-center gap-3 py-2"
          >
            <motion.div 
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.15 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] dark:shadow-[0_4px_16px_rgba(16,185,129,0.15)]"
            >
              <CheckCircle2 size={24} strokeWidth={3} />
            </motion.div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50 leading-none">Successfully Saved</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 font-medium">Data is now live in Supabase and Sheets.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3.5"
          >
            <div className="flex justify-between items-end px-0.5">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 tracking-tight block">{label}</span>
                <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 block">{statusText || 'Processing...'}</span>
              </div>
              <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800/80 shadow-[inset_0_1px_2.5px_rgba(0,0,0,0.08)] border border-slate-200/50 dark:border-zinc-700/20">
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{ background: 'linear-gradient(90deg, #007AFF, #00C7BE)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 90, damping: 16, mass: 0.7 }}
              >
                <div 
                  className="absolute top-0 left-0 w-[180px] h-full animate-sweep blur-md" 
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)' }} 
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
