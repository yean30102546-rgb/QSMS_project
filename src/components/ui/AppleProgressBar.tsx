import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface AppleProgressBarProps {
  progress: number;
  label?: string;
  isComplete?: boolean;
}

export function AppleProgressBar({ progress, label = 'กำลังบันทึกข้อมูล...', isComplete }: AppleProgressBarProps) {
  return (
    <div className="w-full py-2">
      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-sm font-bold text-slate-900">บันทึกสำเร็จ!</span>
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-3"
          >
            <div className="flex justify-between items-center px-1">
              <span className="text-[13px] font-bold text-slate-900 tracking-tight uppercase">{label}</span>
              <span className="text-[13px] font-mono font-bold text-slate-400">{Math.round(progress)}%</span>
            </div>
            <div className="relative h-[6px] w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50">
              <motion.div
                className="h-full bg-slate-900 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
              />
            </div>
            <p className="text-[11px] text-center text-slate-400 font-medium">กรุณาอย่าปิดหน้าต่างนี้จนกว่าจะเสร็จสิ้น</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
