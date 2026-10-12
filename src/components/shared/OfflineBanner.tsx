import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/src/hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-amber-600 text-white text-xs font-medium px-4 py-2 shadow-md relative z-[150] overflow-hidden"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <WifiOff className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
              <span className="truncate">
                คุณกำลังออฟไลน์ สัญญาณขาดหาย ข้อมูลที่บันทึกอาจยังไม่ซิงค์กับเซิร์ฟเวอร์
              </span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-700/80 hover:bg-amber-700 text-amber-50 text-[11px] font-semibold border border-amber-500/50 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>ลองเชื่อมต่อใหม่</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

