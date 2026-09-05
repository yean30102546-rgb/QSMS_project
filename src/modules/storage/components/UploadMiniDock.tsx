import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Maximize2, X, AlertCircle, Check } from 'lucide-react';
import { UploadItem } from '../hooks/useUploadQueue';

interface UploadMiniDockProps {
  items: UploadItem[];
  isQuotaPaused: boolean;
  onExpand: () => void;
  onCancel: () => void;
}

export function UploadMiniDock({ items, isQuotaPaused, onExpand, onCancel }: UploadMiniDockProps) {
  if (items.length === 0) return null;

  const totalItems = items.length;
  const processingCount = items.filter(i => i.status === 'parsing' || i.status === 'uploading').length;
  const completedCount = items.filter(i => i.status === 'success' || i.status === 'ready' || i.status === 'error').length;
  
  const isDone = processingCount === 0 && !isQuotaPaused;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className="fixed bottom-6 right-6 z-40 bg-white dark:bg-[#1c1c1e] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 p-4 flex items-center gap-4 w-[340px]"
    >
      <div className="h-10 w-10 shrink-0 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
        {isQuotaPaused ? (
          <AlertCircle className="h-5 w-5 text-amber-500" />
        ) : isDone ? (
          <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
          </div>
        ) : (
          <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {isQuotaPaused ? 'AI Service Paused' : isDone ? 'Processing Complete' : 'AI Processing in Progress'}
        </h4>
        <p className="text-xs text-slate-500 truncate mt-0.5">
          {completedCount} of {totalItems} files ready
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0 border-l border-slate-100 dark:border-white/10 pl-2">
        <button
          onClick={onExpand}
          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors"
          title="Expand workspace"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          onClick={onCancel}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
          title="Cancel queue"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
