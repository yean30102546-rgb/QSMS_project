/**
 * Update Modal Component
 * Fast, smooth modal for updating case status
 * Optimized animations for 60fps performance
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { ReworkCase } from '../services/api';
import { formatThaiDate } from '../utils/helpers';

interface UpdateModalProps {
  isOpen: boolean;
  caseData: ReworkCase | null;
  isLoading: boolean;
  onClose: () => void;
  onUpdate: (caseId: string, updates: Partial<ReworkCase>) => Promise<void>;
}

export function UpdateModal({
  isOpen,
  caseData,
  isLoading,
  onClose,
  onUpdate,
}: UpdateModalProps) {
  const [caseStatus, setCaseStatus] = React.useState<'Pending' | 'In-Progress' | 'Completed'>(
    caseData?.status || 'Pending'
  );

  // Fix layout shift by managing body overflow
  React.useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (caseData) {
      setCaseStatus(caseData.status);
    }
  }, [caseData]);

  const handleUpdate = async () => {
    if (!caseData) return;
    
    await onUpdate(caseData.id, { 
      status: caseStatus,
    });
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop - quick fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 will-change-opacity"
          />

          {/* Modal - slide-up quickly */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none will-change-transform"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pointer-events-auto w-full max-w-2xl will-change-transform"
            >
              <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200/80">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 flex items-center justify-between border-b border-slate-200">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">อัปเดตสถานะงาน</h2>
                    <p className="text-sm text-muted mt-1">{caseData?.id}</p>
                  </div>
                  <motion.button
                    onClick={onClose}
                    disabled={isLoading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="p-2 hover:bg-white rounded-lg disabled:opacity-50 will-change-transform"
                  >
                    <X size={20} className="text-foreground" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="px-8 py-6 space-y-8">
                  {/* Case Info */}
                  {caseData && (
                    <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                            แหล่งที่มา
                          </p>
                          <p className="text-base font-semibold text-foreground">{caseData.source}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                            วันที่
                          </p>
                          <p className="text-base font-semibold text-foreground">{formatThaiDate(caseData.date)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                            จำนวนรายการ
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {caseData.items.length} items
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                            สถานะปัจจุบัน
                          </p>
                          <StatusBadge status={caseData.status} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Update Section - Case Level */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">
                      สถานะ Case ทั้งหมด *
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {(['Pending', 'In-Progress', 'Completed'] as const).map((status) => (
                        <motion.button
                          key={status}
                          onClick={() => setCaseStatus(status)}
                          disabled={isLoading}
                          whileHover={{ y: -2 }}
                          whileTap={{ y: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`p-4 rounded-xl border-2 font-semibold disabled:opacity-50 transition-colors duration-200 will-change-transform ${
                            caseStatus === status
                              ? 'border-accent bg-accent/5 text-accent'
                              : 'border-slate-200 text-muted hover:border-accent/50'
                          }`}
                        >
                          {status === 'Pending' && (
                            <AlertCircle size={20} className="mx-auto mb-2" />
                          )}
                          {status === 'In-Progress' && (
                            <Clock size={20} className="mx-auto mb-2" />
                          )}
                          {status === 'Completed' && (
                            <CheckCircle2 size={20} className="mx-auto mb-2" />
                          )}
                          <div className="text-xs">{status}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-8 py-6 flex gap-4 border-t border-slate-200">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 active:bg-slate-200 transition-colors duration-200 disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <motion.button
                    onClick={handleUpdate}
                    disabled={isLoading || !caseData}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-black active:bg-black transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2 will-change-transform"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      'บันทึกการเปลี่ยนแปลง'
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatusBadge({ status }: { status: 'Pending' | 'In-Progress' | 'Completed' }) {
  const styles = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'In-Progress': 'bg-slate-100 text-slate-700 border-slate-300',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
      {status}
    </span>
  );
}
