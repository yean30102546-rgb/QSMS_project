import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  BookOpen, 
  LayoutDashboard, 
  PlusCircle, 
  RefreshCcw, 
  FileDown, 
  Lightbulb,
  Info,
  ChevronRight
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const sections = [
    {
      icon: <LayoutDashboard className="text-blue-500" size={20} />,
      title: 'หน้าแดชบอร์ด (Dashboard)',
      content: 'ติดตามภาพรวมสถิติ งานค้าง และแนวโน้มปัญหาผ่านกราฟที่โต้ตอบได้'
    },
    {
      icon: <BookOpen className="text-emerald-500" size={20} />,
      title: 'รายการงาน (Overall)',
      content: 'ค้นหาและกรองงานด้วยสถานะ (Pills) หรือตัวกรองขั้นสูงตามความต้องการ'
    },
    {
      icon: <PlusCircle className="text-purple-500" size={20} />,
      title: 'เพิ่มงานใหม่ (Add Case)',
      content: 'บันทึกงานใหม่พร้อมระบบ Auto-fill ข้อมูลสินค้าและการบีบอัดรูปภาพอัตโนมัติ'
    },
    {
      icon: <RefreshCcw className="text-amber-500" size={20} />,
      title: 'อัปเดตงาน (Update)',
      content: 'เปลี่ยนสถานะ จัดการรูปภาพ และบันทึกความคืบหน้าของงาน'
    },
    {
      icon: <FileDown className="text-rose-500" size={20} />,
      title: 'ส่งออกรายงาน (Export)',
      content: 'สร้างรายงานสรุปในรูปแบบ PNG (สำหรับ LINE) หรือ PDF (ทางการ) ได้ทันที'
    },
    {
      icon: <Lightbulb className="text-yellow-500" size={20} />,
      title: 'เคล็ดลับ (Tips)',
      content: 'วางเมาส์เหนือปุ่มเพื่อดูคำแนะนำ (Tooltip) และใช้ปุ่มสถานะด้านบนเพื่อการเข้าถึงที่เร็วขึ้น'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[70] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">คู่มือการใช้งานระบบ</h2>
                  <p className="text-xs text-slate-500 font-medium">QSMS Rework Management System Tutorial</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="mb-6 rounded-xl bg-blue-50/50 p-4 border border-blue-100">
                <div className="flex gap-3">
                  <Info className="text-blue-500 shrink-0" size={18} />
                  <p className="text-sm leading-relaxed text-blue-700">
                    ยินดีต้อนรับสู่ระบบจัดการงาน Rework! คู่มือนี้จะช่วยแนะนำฟังก์ชันหลักเพื่อให้คุณเริ่มต้นใช้งานได้อย่างมืออาชีพ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative flex flex-col gap-2 rounded-xl border border-slate-100 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/20 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-50 group-hover:bg-blue-50 transition-colors">
                        {section.icon}
                      </div>
                      <h3 className="font-semibold text-slate-700 text-sm">{section.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pl-11">
                      {section.content}
                    </p>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-200 opacity-0 group-hover:opacity-100 transition-all" size={14} />
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Lightbulb size={16} className="text-yellow-500" />
                  คุณทราบหรือไม่?
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-xs text-slate-600">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                    คุณสามารถกด Export PNG เพื่อส่งข้อมูลเข้ากลุ่ม LINE ได้อย่างรวดเร็ว
                  </li>
                  <li className="flex items-start gap-2 text-xs text-slate-600">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                    รหัสสินค้าที่เคยบันทึกไว้จะถูกจดจำเพื่อช่วยกรอกข้อมูลอัตโนมัติในครั้งต่อไป
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800 active:scale-95"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
