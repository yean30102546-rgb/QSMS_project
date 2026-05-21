import React from 'react';
import { motion } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { AppleProgressBar } from '@/src/components/ui/AppleProgressBar';

interface RosterDialogsProps {
  activeLeaveDialog: { dateKey: string; leaveType: 'sick' | 'business' | 'vacation' } | null;
  onCloseLeaveDialog: () => void;
  leaveNoteInput: string;
  setLeaveNoteInput: (val: string) => void;
  onConfirmLeave: () => void;
  isSavingProgress: boolean;
  progress: number;
  isComplete: boolean;
  // Delete Employee
  deleteConfirmation: { id: string; name: string } | null;
  onCloseDeleteDialog: () => void;
  onConfirmDelete: () => void;
}

export function RosterDialogs({
  activeLeaveDialog,
  onCloseLeaveDialog,
  leaveNoteInput,
  setLeaveNoteInput,
  onConfirmLeave,
  isSavingProgress,
  progress,
  isComplete,
  deleteConfirmation,
  onCloseDeleteDialog,
  onConfirmDelete,
}: RosterDialogsProps) {
  return (
    <>
      {/* Leave Dialog */}
      <Dialog open={!!activeLeaveDialog} onOpenChange={(open) => !open && onCloseLeaveDialog()}>
        <DialogContent className="sm:max-w-[400px] rounded-[28px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              {activeLeaveDialog?.leaveType === 'sick'
                ? '🤒 ระบุหมายเหตุลาป่วย'
                : activeLeaveDialog?.leaveType === 'business'
                  ? '💼 ระบุหมายเหตุลากิจ'
                  : '🏖️ ระบุหมายเหตุลาพักร้อน'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-center text-xs font-bold uppercase tracking-wider text-black/40">
              วันที่ {activeLeaveDialog?.dateKey}
            </div>
            <div className="space-y-2">
              <input
                id="leave-note-input"
                type="text"
                value={leaveNoteInput}
                onChange={(e) => setLeaveNoteInput(e.target.value)}
                placeholder="ระบุเหตุผลสั้นๆ..."
                className="w-full rounded-2xl border border-black/5 px-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-black/5 transition-all bg-black/5"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-center">
            {isSavingProgress ? (
              <div className="flex-1 py-2">
                <AppleProgressBar progress={progress} isComplete={isComplete} />
              </div>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onCloseLeaveDialog}
                  className="flex-1 rounded-2xl bg-black/5 hover:bg-black/10 py-3 text-sm font-bold text-black/60 transition-colors"
                >
                  ยกเลิก
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onConfirmLeave}
                  className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white shadow-lg transition-all ${
                    activeLeaveDialog?.leaveType === 'sick'
                      ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700'
                      : activeLeaveDialog?.leaveType === 'business'
                        ? 'bg-amber-600 shadow-amber-600/20 hover:bg-amber-700'
                        : 'bg-violet-600 shadow-violet-600/20 hover:bg-violet-700'
                  }`}
                >
                  บันทึกการลา
                </motion.button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Professional Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && onCloseDeleteDialog()}>
        <DialogContent className="sm:max-w-[400px] rounded-[32px] border-none shadow-2xl p-8 bg-white/98 backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight text-[#1d1d1f]">ยืนยันการลบพนักงาน</DialogTitle>
            </DialogHeader>
            <p className="mt-4 text-[15px] leading-relaxed text-[#515154]">
              คุณแน่ใจหรือไม่ว่าต้องการลบรายชื่อพนักงาน <br />
              <strong className="text-[#1d1d1f] font-bold">"{deleteConfirmation?.name}"</strong> <br />
              ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
          </div>
          <DialogFooter className="mt-8 flex flex-col gap-2 sm:flex-col sm:space-x-0">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={onConfirmDelete}
              className="w-full rounded-2xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
            >
              ลบข้อมูลพนักงาน
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={onCloseDeleteDialog}
              className="w-full rounded-2xl bg-black/5 py-3.5 text-sm font-bold text-[#1d1d1f]/60 hover:bg-black/10 transition-all"
            >
              ยกเลิก
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
