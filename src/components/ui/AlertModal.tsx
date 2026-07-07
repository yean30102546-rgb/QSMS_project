import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../../contexts/NotificationContext';
import { AlertCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react';

export const AlertModal: React.FC = () => {
  const { alert, closeAlert } = useNotification();

  return (
    <AnimatePresence>
      {alert && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (alert.type !== 'error' && alert.type !== 'confirm') closeAlert();
            }}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
          >
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center text-center gap-4">
                {/* Icon */}
                <div className={`p-4 rounded-full ${
                  alert.type === 'error' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                  alert.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                  alert.type === 'confirm' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' :
                  'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                }`}>
                  {alert.type === 'error' && <AlertCircle className="w-8 h-8" />}
                  {alert.type === 'warning' && <AlertTriangle className="w-8 h-8" />}
                  {alert.type === 'confirm' && <HelpCircle className="w-8 h-8" />}
                  {alert.type === 'info' && <Info className="w-8 h-8" />}
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {alert.type === 'error' ? 'เกิดข้อผิดพลาด' :
                   alert.type === 'warning' ? 'คำเตือน' :
                   alert.type === 'confirm' ? 'ยืนยันการดำเนินการ' : 'ข้อมูล'}
                </h3>

                {/* Message */}
                <p className="text-zinc-600 dark:text-zinc-400">
                  {alert.message}
                </p>
              </div>
            </div>

            {/* Action */}
            <div className={`p-4 sm:px-8 sm:pb-8 flex ${alert.type === 'confirm' ? 'gap-3 justify-end' : 'justify-center'}`}>
              {alert.type === 'confirm' && (
                <button
                  onClick={() => {
                    alert.onCancel?.();
                    closeAlert();
                  }}
                  className="px-6 py-2.5 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 focus:ring-zinc-500"
                >
                  ยกเลิก
                </button>
              )}
              <button
                onClick={() => {
                  alert.onConfirm?.();
                  closeAlert();
                }}
                className={`${alert.type === 'confirm' ? 'px-6 py-2.5' : 'w-full py-3 px-4'} rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  alert.type === 'error' 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500' 
                    : alert.type === 'warning'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500'
                    : alert.type === 'confirm'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500'
                    : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white focus:ring-zinc-900 dark:focus:ring-zinc-100'
                }`}
              >
                ตกลง
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
