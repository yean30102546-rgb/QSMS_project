'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldCheck,
  User,
  Package,
  Wrench,
  UserCheck,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
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

interface RoleDetails {
  title: string;
  desc: string;
  icon: React.ReactNode;
  colorClass: string;
  badgeLabel: string;
  permissions: PermissionItem[];
}

export function PermissionsModal({
  isOpen,
  onClose,
  userName,
  userRole,
}: PermissionsModalProps) {
  const roleRaw = String(userRole || '').trim();
  const roleUpper = roleRaw.toUpperCase();

  // Get role label, description, icon, and permission checklist
  const getRoleDetails = (): RoleDetails => {
    if (!roleUpper || roleUpper === 'GUEST') {
      return {
        title: 'ผู้ใช้งานทั่วไป (Guest User)',
        desc: 'ยังไม่ได้เข้าสู่ระบบหรือไม่มีสิทธิ์ใช้งาน โปรดเข้าสู่ระบบเพื่อดำเนินการ',
        icon: <HelpCircle className="w-8 h-8 text-slate-500" />,
        colorClass: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
        badgeLabel: 'GUEST',
        permissions: [
          { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: false },
          { text: 'สร้างเคส Rework ใหม่เข้าระบบ', allowed: false },
          { text: 'เข้าชม Dashboard วิเคราะห์ข้อมูลสถิติ', allowed: false },
          { text: 'จัดการข้อมูลผู้ใช้งานและสิทธิ์', allowed: false },
        ],
      };
    }

    switch (roleUpper) {
      case UserRole.ADMIN:
        return {
          title: 'สิทธิ์ผู้ดูแลระบบสูงสุด (System Administrator)',
          desc: 'มีอำนาจการควบคุมระบบสูงสุด สามารถจัดการผู้ใช้งาน, สเปกแบบแปลน Drawing & Master, คลังเอกสาร DocAI RAG และข้อมูล Rework ทั้งหมดในองค์กร',
          icon: <Shield className="w-8 h-8 text-indigo-600 animate-pulse" />,
          colorClass: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
          badgeLabel: 'ADMIN',
          permissions: [
            { text: 'จัดการบัญชีผู้ใช้และกำหนดสิทธิ์', allowed: true },
            { text: 'จัดการแบบแปลน Drawing และ Item Master', allowed: true },
            { text: 'จัดการคลังเอกสาร DocAI RAG', allowed: true },
            { text: 'เข้าชม Dashboard วิเคราะห์ข้อมูลสถิติ', allowed: true },
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: true },
            { text: 'สร้างเคส Rework ใหม่เข้าระบบ', allowed: true },
            { text: 'แก้ไขข้อมูลรายละเอียดเคสย้อนหลัง', allowed: true },
            { text: 'ลบเคสออกจากฐานข้อมูลถาวร', allowed: true },
            { text: 'อัปเดตสถานะการดำเนินงาน', allowed: true },
            { text: 'บันทึกการวิเคราะห์ปัญหาคุณภาพ', allowed: true },
            { text: 'กำหนดรายการขอเบิกวัสดุและภาชนะ', allowed: true },
            { text: 'จ่ายวัสดุและภาชนะ', allowed: true },
            { text: 'บันทึกยอดซ่อมและแจ้งปัญหาหน้างาน', allowed: true },
            { text: 'ส่งออกรายงานข้อมูล (Excel / PDF)', allowed: true },
          ],
        };

      case UserRole.QSMS:
        return {
          title: 'สิทธิ์ฝ่ายควบคุมคุณภาพ (QSMS Quality Admin)',
          desc: 'วิเคราะห์ปัญหาคุณภาพ (Defect Analysis), ตรวจสอบรูปหลักฐาน, กำหนดสเปกภาชนะและเบิกจ่าย, จัดการ RAG และปิดงานเคส Rework',
          icon: <ShieldCheck className="w-8 h-8 text-emerald-600" />,
          colorClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          badgeLabel: 'QSMS',
          permissions: [
            { text: 'เข้าชม Dashboard วิเคราะห์ข้อมูลสถิติ', allowed: true },
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: true },
            { text: 'สร้างเคส Rework ใหม่เข้าระบบ', allowed: true },
            { text: 'แก้ไขข้อมูลรายละเอียดเคสย้อนหลัง', allowed: true },
            { text: 'ลบเคสออกจากฐานข้อมูลถาวร', allowed: true },
            { text: 'บันทึกการวิเคราะห์ปัญหาคุณภาพ', allowed: true },
            { text: 'กำหนดรายการขอเบิกวัสดุและภาชนะ', allowed: true },
            { text: 'จัดการแบบแปลน Drawing และ Item Master', allowed: true },
            { text: 'จัดการคลังเอกสาร DocAI RAG', allowed: true },
            { text: 'ตรวจรับและปิดเคส Rework', allowed: true },
            { text: 'ส่งออกรายงานข้อมูล (Excel / PDF)', allowed: true },
            { text: 'จัดการบัญชีผู้ใช้งานระบบ', allowed: false },
          ],
        };

      case UserRole.WFG:
        return {
          title: 'สิทธิ์ฝ่ายคลังสินค้าสำเร็จรูป (Warehouse Finished Goods)',
          desc: 'รับผิดชอบตรวจสอบและเปิดเคสของเสียภายในคลังสินค้า (RW Cases), แจ้งขอเบิกวัสดุ และติดตามสถานะภาพรวม',
          icon: <Package className="w-8 h-8 text-cyan-600" />,
          colorClass: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
          badgeLabel: 'WFG',
          permissions: [
            { text: 'เปิดเคสของเสียภายในโรงงาน (เคส RW)', allowed: true },
            { text: 'เข้าชม Dashboard วิเคราะห์ข้อมูลสถิติ', allowed: true },
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: true },
            { text: 'แจ้งขอเบิกวัสดุและภาชนะ', allowed: true },
            { text: 'อัปเดตสถานะการดำเนินงาน', allowed: true },
            { text: 'ส่งออกรายงานข้อมูล (Excel / PDF)', allowed: true },
            { text: 'บันทึกยอดซ่อมหน้างาน', allowed: false },
            { text: 'แก้ไขข้อมูลหรือลบเคสย้อนหลัง', allowed: false },
            { text: 'จัดการบัญชีผู้ใช้และระบบ', allowed: false },
          ],
        };

      case UserRole.CS:
        return {
          title: 'สิทธิ์ฝ่ายบริการลูกค้า (Customer Service)',
          desc: 'รับผิดชอบเปิดเคสรับคืนจากลูกค้าภายนอก (RT Cases) พร้อมแนบเอกสารอ้างอิง และติดตามสถานะความคืบหน้า',
          icon: <UserCheck className="w-8 h-8 text-sky-600" />,
          colorClass: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
          badgeLabel: 'CS',
          permissions: [
            { text: 'เปิดเคสเคลมรับคืนจากลูกค้า (เคส RT)', allowed: true },
            { text: 'เข้าชม Dashboard วิเคราะห์ข้อมูลสถิติ', allowed: true },
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: true },
            { text: 'อัปเดตสถานะการดำเนินงาน', allowed: true },
            { text: 'ส่งออกรายงานข้อมูล (Excel / PDF)', allowed: true },
            { text: 'แจ้งขอเบิกวัสดุและภาชนะ', allowed: false },
            { text: 'แก้ไขข้อมูลหรือลบเคสย้อนหลัง', allowed: false },
            { text: 'จัดการบัญชีผู้ใช้และระบบ', allowed: false },
          ],
        };

      case UserRole.WPK:
        return {
          title: 'สิทธิ์ฝ่ายคลังและบรรจุภัณฑ์ (Warehouse & Packaging)',
          desc: 'รับผิดชอบจ่ายภาชนะและอะไหล่ (Material Issuing), เปิดเคส และส่งต่องานไปยังฝ่ายผลิต',
          icon: <Package className="w-8 h-8 text-amber-600" />,
          colorClass: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
          badgeLabel: 'WPK',
          permissions: [
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: true },
            { text: 'ยืนยันจ่ายวัสดุและภาชนะ', allowed: true },
            { text: 'สร้างเคส Rework ใหม่เข้าระบบ', allowed: true },
            { text: 'ส่งออกรายงานข้อมูล (Excel / PDF)', allowed: true },
            { text: 'บันทึกยอดกล่องที่ซ่อมเสร็จ', allowed: false },
            { text: 'แจ้งปัญหาติดขัดหน้างาน', allowed: false },
            { text: 'แก้ไขข้อมูลหรือลบเคสย้อนหลัง', allowed: false },
            { text: 'จัดการบัญชีผู้ใช้และระบบ', allowed: false },
          ],
        };

      case UserRole.PDF:
        return {
          title: 'สิทธิ์ฝ่ายผลิตและช่างซ่อม (Production & Defect Repair)',
          desc: 'รับผิดชอบดำเนินการซ่อม, บันทึกยอดกล่องที่ซ่อมเสร็จ, บันทึกวิธีแก้ไข (Resolution) และแจ้งปัญหาติดขัด (Defend Mode)',
          icon: <Wrench className="w-8 h-8 text-emerald-600" />,
          colorClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
          badgeLabel: 'PDF',
          permissions: [
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: true },
            { text: 'บันทึกยอดกล่องที่ซ่อมเสร็จ', allowed: true },
            { text: 'แจ้งปัญหาติดขัดหน้างาน (Defend)', allowed: true },
            { text: 'อัปเดตสถานะการดำเนินงาน', allowed: true },
            { text: 'บันทึกวิธีแก้ไขปัญหา', allowed: true },
            { text: 'ปิดเคสที่ซ่อมเสร็จ', allowed: true },
            { text: 'ส่งออกรายงานข้อมูล (Excel / PDF)', allowed: true },
            { text: 'แจ้งขอเบิกวัสดุและภาชนะ', allowed: false },
            { text: 'จ่ายวัสดุและภาชนะ', allowed: false },
            { text: 'แก้ไขข้อมูลหรือลบเคสย้อนหลัง', allowed: false },
            { text: 'จัดการบัญชีผู้ใช้และระบบ', allowed: false },
          ],
        };

      case UserRole.OPERATOR:
        return {
          title: 'สิทธิ์ผู้ปฏิบัติงานฝ่ายผลิต (Production Operator)',
          desc: 'รับผิดชอบบันทึกปัญหา ตรวจสอบรายการ และจัดการขั้นตอนการแก้ไข Rework หน้างาน',
          icon: <User className="w-8 h-8 text-blue-500" />,
          colorClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          badgeLabel: 'OPERATOR',
          permissions: [
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: true },
            { text: 'สร้างเคส Rework ใหม่เข้าระบบ', allowed: true },
            { text: 'อัปเดตสถานะการดำเนินงาน', allowed: true },
            { text: 'บันทึกวิธีแก้ไขปัญหา', allowed: true },
            { text: 'บันทึกยอดกล่องที่ซ่อมเสร็จ', allowed: true },
            { text: 'แจ้งปัญหาติดขัดหน้างาน', allowed: true },
            { text: 'เข้าชม Dashboard วิเคราะห์ข้อมูลสถิติ', allowed: false },
            { text: 'แก้ไขข้อมูลรายละเอียดเคสย้อนหลัง', allowed: false },
            { text: 'ลบเคสออกจากฐานข้อมูลถาวร', allowed: false },
            { text: 'จัดการบัญชีผู้ใช้และระบบ', allowed: false },
          ],
        };

      default:
        return {
          title: 'บทบาทไม่รู้จักในระบบ (Unknown Role)',
          desc: `บทบาท "${roleUpper}" ไม่ได้รับการลงทะเบียนในระบบ RBAC ของ QSMS โปรดติดต่อผู้ดูแลระบบเพื่อตรวจสอบและกำหนดสิทธิ์ที่ถูกต้อง`,
          icon: <AlertTriangle className="w-8 h-8 text-rose-500" />,
          colorClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
          badgeLabel: roleUpper,
          permissions: [
            { text: 'ดูรายการเคส Rework ทั้งหมด', allowed: false },
            { text: 'สร้างเคส Rework ใหม่เข้าระบบ', allowed: false },
            { text: 'อัปเดตสถานะการดำเนินงาน', allowed: false },
            { text: 'เข้าชม Dashboard วิเคราะห์ข้อมูลสถิติ', allowed: false },
            { text: 'จัดการข้อมูลผู้ใช้งานและระบบ', allowed: false },
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-6 md:p-8 shadow-2xl flex flex-col max-h-[85vh] z-10"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-black transition-colors cursor-pointer"
              aria-label="ปิดหน้าต่างสิทธิ์"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl shadow-xs shrink-0">
                {details.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight truncate max-w-[220px] sm:max-w-none">
                    {userName || 'ผู้ใช้งาน'}
                  </h2>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-xs font-black uppercase tracking-wider ${details.colorClass}`}>
                    {details.badgeLabel}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 leading-snug">{details.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium mb-5 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {details.desc}
            </p>

            {/* Permissions List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-2">
                ขอบเขตการเข้าถึง (Permissions Detail)
              </h3>
              {details.permissions.map((p, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                    p.allowed
                      ? 'bg-emerald-500/5 border-emerald-500/15 text-slate-800'
                      : 'bg-red-500/5 border-red-500/15 text-slate-600'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {p.allowed ? (
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    ) : (
                      <XCircle size={15} className="text-rose-500" />
                    )}
                  </div>
                  <span className="text-xs font-semibold leading-normal">{p.text}</span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-black/10 cursor-pointer"
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
