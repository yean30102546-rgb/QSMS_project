import React from 'react';
import { motion } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';

interface RosterDialogsProps {
  activeLeaveDialog: { dateKey: string; leaveType: 'sick' | 'business' } | null;
  onCloseLeaveDialog: () => void;
  leaveNoteInput: string;
  setLeaveNoteInput: (val: string) => void;
  onConfirmLeave: () => void;
}

export function RosterDialogs({
  activeLeaveDialog,
  onCloseLeaveDialog,
  leaveNoteInput,
  setLeaveNoteInput,
  onConfirmLeave,
}: RosterDialogsProps) {
  return (
    <>
      <Dialog open={!!activeLeaveDialog} onOpenChange={(open) => !open && onCloseLeaveDialog()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">
              {activeLeaveDialog?.leaveType === 'sick' ? '🤒 ระบุหมายเหตุลาป่วย' : '💼 ระบุหมายเหตุลากิจ'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center text-xs text-[#6e6e73]">
              วันที่ {activeLeaveDialog?.dateKey}
            </div>
            <div className="space-y-2">
              <label htmlFor="leave-note-input" className="text-xs font-semibold text-[#1d1d1f]">
                หมายเหตุการลา (ระบุสั้นๆ)
              </label>
              <input
                id="leave-note-input"
                type="text"
                value={leaveNoteInput}
                onChange={(e) => setLeaveNoteInput(e.target.value)}
                placeholder="เช่น ไปโรงพยาบาล, ติดธุระครอบครัว"
                className="w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-slate-950 transition-all bg-[#f5f5f7]"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onCloseLeaveDialog}
              className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
            >
              ยกเลิก
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onConfirmLeave}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${
                activeLeaveDialog?.leaveType === 'sick'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              บันทึกการลา
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
