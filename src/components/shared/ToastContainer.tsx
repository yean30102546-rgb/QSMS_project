/**
 * ToastContainer Component
 * แสดง Toast notifications มุมขวาล่างของหน้าจอ
 *
 * วิธีใช้ (ใน App.tsx):
 *   const { toasts, addToast, removeToast } = useToast();
 *   <ToastContainer toasts={toasts} onDismiss={removeToast} />
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info, Loader } from 'lucide-react';
import type { Toast, ToastType } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

/** สไตล์ตาม type */
const TOAST_STYLES: Record<ToastType, { bg: string; icon: React.ReactNode; border: string }> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircle size={18} className="text-emerald-600" />,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: <AlertCircle size={18} className="text-red-600" />,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <Info size={18} className="text-blue-600" />,
  },
  loading: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    icon: <Loader size={18} className="text-slate-600 animate-spin" />,
  },
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg ${style.bg} ${style.border} max-w-sm`}
            >
              {style.icon}
              <p className="text-sm font-semibold text-foreground flex-1">{toast.message}</p>
              {toast.type !== 'loading' && (
                <button
                  type="button"
                  onClick={() => onDismiss(toast.id)}
                  className="text-muted hover:text-foreground transition-colors p-0.5"
                >
                  <X size={14} />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
