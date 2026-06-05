import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({ isOpen, onClose }) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center pointer-events-auto border border-red-100"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <AlertTriangle size={40} />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                ข้อมูลขัดแย้งกัน <br/>
                <span className="text-lg text-red-500 font-bold">(Identity Conflict)</span>
              </h3>
              
              <div className="bg-red-50/50 rounded-xl p-4 mb-8 border border-red-100/50">
                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                  รหัสสินค้า และ บาร์โค้ด ที่คุณกรอกเป็นของสินค้าคนละชนิดกัน <br/>
                  <span className="font-bold text-red-600">กรุณาตรวจสอบและแก้ไขให้ถูกต้อง</span>
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-xl transition-all shadow-lg active:scale-[0.98] active:shadow-md"
              >
                ตกลง (รับทราบ)
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
