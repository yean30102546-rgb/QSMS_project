'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, XCircle, Shield, User, Landmark, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../../config/auth.config';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userRole: string;
}

interface PermissionItem {
  text: string;
  allowed: boolean;
}

export function PermissionsModal({
  isOpen,
  onClose,
  userName,
  userRole,
}: PermissionsModalProps) {
  const roleUpper = String(userRole || '').toUpperCase();

  // Get role label, description, and icon
  const getRoleDetails = () => {
    switch (roleUpper) {
      case UserRole.QSMS:
        return {
          title: 'สิทธิ์ผู้ดูแลระบบคุณภาพ (QSMS Admin)',
          desc: 'มีอำนาจการควบคุมระบบสูงสุด สามารถจัดการเคส Rework และดูสถิติทั้งหมดในองค์กรได้',
          icon: <Shield className="w-8 h-8 text-emerald-500 animate-pulse" />,
          colorClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          permissions: [
            { text: 'เข้าชม Dashboard วิเคราะห์ข้อมูลสถิติ', allowed: true },
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: true },
            { text: 'สร้างเคส Rework ใหม่เข้าระบบ', allowed: true },
            { text: 'แก้ไขข้อมูลรายละเอียดเคสย้อนหลัง', allowed: true },
            { text: 'ลบเคสออกจากฐานข้อมูลถาวร', allowed: true },
            { text: 'อัปเดตสถานะการดำเนินงาน (Status)', allowed: true },
            { text: 'บันทึกวิธีแก้ไขปัญหา (Resolution)', allowed: true },
            { text: 'กรอกประเมินราคาค่า Rework (Valuation)', allowed: true },
            { text: 'ส่งออกรายงานข้อมูล (Export to Excel/PDF)', allowed: true },
          ],
        };
      case UserRole.OPERATOR:
        return {
          title: 'สิทธิ์ผู้ปฏิบัติงานฝ่ายผลิต (Production Operator)',
          desc: 'รับผิดชอบบันทึกปัญหาและจัดการขั้นตอนการแก้ไข Rework หน้างาน',
          icon: <User className="w-8 h-8 text-blue-500" />,
          colorClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          permissions: [
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: true },
            { text: 'สร้างเคส Rework ใหม่เข้าระบบ', allowed: true },
            { text: 'อัปเดตสถานะการดำเนินงาน (Status)', allowed: true },
            { text: 'บันทึกวิธีแก้ไขปัญหา (Resolution)', allowed: true },
            { text: 'เข้าชม Dashboard วิเคราะห์สถิติหลัก', allowed: false },
            { text: 'แก้ไขข้อมูลรายละเอียดเคสย้อนหลัง', allowed: false },
            { text: 'ลบเคสออกจากฐานข้อมูลถาวร', allowed: false },
            { text: 'กรอกประเมินราคาค่า Rework (Valuation)', allowed: false },
          ],
        };
      case UserRole.FINANCE:
        return {
          title: 'สิทธิ์ฝ่ายบัญชีและการเงิน (Finance & Valuation)',
          desc: 'รับผิดชอบการประเมินมูลค่าและตรวจสอบค่าใช้จ่าย Rework ของเคสที่เสร็จสิ้น',
          icon: <Landmark className="w-8 h-8 text-amber-500" />,
          colorClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          permissions: [
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: true },
            { text: 'กรอกประเมินราคาค่า Rework (Valuation)', allowed: true },
            { text: 'สร้างเคส Rework ใหม่เข้าระบบ', allowed: false },
            { text: 'อัปเดตสถานะการดำเนินงาน (Status)', allowed: false },
            { text: 'บันทึกวิธีแก้ไขปัญหา (Resolution)', allowed: false },
            { text: 'ลบเคสออกจากฐานข้อมูลถาวร', allowed: false },
          ],
        };
      default:
        return {
          title: 'ไม่ระบุสิทธิ์ (Guest User)',
          desc: 'สิทธิ์การใช้งานทั่วไป โปรดติดต่อเจ้าหน้าที่ดูแลระบบเพื่อขออนุมัติสิทธิ์',
          icon: <HelpCircle className="w-8 h-8 text-slate-500" />,
          colorClass: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
          permissions: [
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: false },
            { text: 'สร้างเคส Rework ใหม่เข้าระบบ', allowed: false },
          ],
        };
    }
  };

  const details = getRoleDetails();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 "
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white/90 p-6 md:p-8 shadow-2xl  flex flex-col max-h-[85vh]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-black transition-colors"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                {details.icon}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">{userName || 'ผู้ใช้งาน'}</h2>
                  <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-black uppercase tracking-wider ${details.colorClass}`}>
                    {roleUpper || 'UNKNOWN'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800">{details.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium mb-6 leading-relaxed bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
              {details.desc}
            </p>

            {/* Permissions List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">ขอบเขตการเข้าถึง (Permissions Detail)</h3>
              {details.permissions.map((p, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    p.allowed
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-800'
                      : 'bg-red-500/5 border-red-500/10 text-slate-400'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {p.allowed ? (
                      <CheckCircle2 size={15} className="text-emerald-500" />
                    ) : (
                      <XCircle size={15} className="text-red-400" />
                    )}
                  </div>
                  <span className="text-xs font-semibold leading-normal">{p.text}</span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-850 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-black/10"
              >
                ตกลง
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
