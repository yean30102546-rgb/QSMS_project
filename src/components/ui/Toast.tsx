import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../../contexts/NotificationContext';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`
                pointer-events-auto flex items-center gap-3 p-4 pr-12 min-w-[300px] max-w-[400px]
                bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 dark:border-zinc-800
                shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                rounded-2xl overflow-hidden relative
              `}
            >
              {/* Left Accent Bar */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  isSuccess ? 'bg-emerald-500' :
                  isError ? 'bg-rose-500' :
                  isWarning ? 'bg-amber-500' :
                  'bg-blue-500'
                }`}
              />
              
              {/* Icon */}
              <div className={`shrink-0 ${
                isSuccess ? 'text-emerald-500' :
                isError ? 'text-rose-500' :
                isWarning ? 'text-amber-500' :
                'text-blue-500'
              }`}>
                {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                {isError && <XCircle className="w-5 h-5" />}
                {isWarning && <AlertTriangle className="w-5 h-5" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5" />}
              </div>
              
              {/* Message */}
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {toast.message}
              </p>

              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
