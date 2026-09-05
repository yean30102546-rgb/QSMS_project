'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Clock3,
  LayoutGrid,
  ShieldCheck,
  Users2,
  CalendarDays,
  Activity,
  FileText,
  CheckCircle2,
  MessageSquarePlus,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';

import type { User } from '../../../services/auth';
import type { PortalAppDefinition } from '../../../modules/platform/types';

interface WorkspacePortalProps {
  user: User | null;
  apps: PortalAppDefinition[];
  onOpenApp: (route: PortalAppDefinition['route']) => void;
  onLogout: () => void;
  onLogin?: () => void;
  onOpenRag?: () => void;
  onOpenFeedback?: () => void;
}

export function WorkspacePortal({
  user,
  apps,
  onOpenApp,
  onLogout,
  onLogin,
  onOpenRag,
  onOpenFeedback,
}: WorkspacePortalProps) {
  const isGuest = !user;
  const greetingName = user?.name || 'ผู้เยี่ยมชม';

  // Preview Stats State
  const [reworkStats, setReworkStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    completionRate: 0,
    hasData: false,
  });
  const [rosterStats, setRosterStats] = useState({
    totalEmployees: 0,
    staffPresentCount: 0,
    onLeaveCount: 0,
    leaveSummary: { sick: 0, business: 0, vacation: 0 },
    retentionRate: 0,
    hasData: false,
  });
  const [storageStats, setStorageStats] = useState({
    totalDrawings: 0,
    completedMasters: 0,
    missingMasters: 0,
    coverageRate: 0,
    hasData: false,
  });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch('/api/rework', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fetchPublicOverview' })
        });
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          const resJson = await response.json();
          if (resJson.success && resJson.data) {
            const { rework, roster } = resJson.data;
            setReworkStats({
              total: rework.total,
              pending: rework.pending,
              inProgress: rework.inProgress,
              completed: rework.completed,
              completionRate: rework.completionRate,
              hasData: true
            });
            setRosterStats({
              totalEmployees: roster.totalEmployees,
              staffPresentCount: roster.staffPresentCount,
              onLeaveCount: roster.onLeaveCount,
              leaveSummary: roster.leaveSummary,
              retentionRate: roster.retentionRate,
              hasData: true
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch public stats overview:', err);
      }
    };
    fetchOverview();

    const fetchStorageOverview = async () => {
      try {
        const res = await fetch('/api/drawings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_overview_stats' }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const resJson = await res.json();
          if (resJson.success && resJson.data) {
            setStorageStats({
              totalDrawings: resJson.data.totalDrawings,
              completedMasters: resJson.data.completedMasters,
              missingMasters: resJson.data.missingMasters,
              coverageRate: resJson.data.coverageRate,
              hasData: true
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch storage stats overview:', err);
      }
    };
    fetchStorageOverview();
  }, []);

  const handleDirectFilterJump = (status: 'Pending' | 'In-Progress' | 'Completed') => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rework_initial_status_filter', status);
    }
    onOpenApp('rework');
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto custom-scrollbar bg-slate-100/70">
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col px-4 py-6 md:px-8 lg:px-10">
        <header className="mb-6 flex items-center justify-between rounded-xl bg-white px-5 py-3.5 shadow-xs border border-slate-200 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold shadow-xs">
              <LayoutGrid size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">QSMS Operations Portal</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500">ระบบศูนย์กลางติดตามและจัดการงาน Rework</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={() => {
                if (onOpenFeedback) {
                  onOpenFeedback();
                } else if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-feedback-modal'));
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
              title="ส่งความคิดเห็นหรือรายงานปัญหาการใช้งานระบบ"
            >
              <MessageSquarePlus size={15} className="text-amber-600" />
              <span className="hidden sm:inline">ข้อเสนอแนะ & ฟีดแบ็ค</span>
              <span className="sm:hidden">ฟีดแบ็ค</span>
            </motion.button>

            {isGuest ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={onLogin}
                className="rounded-lg bg-[#FEF3C7] hover:bg-[#FDE68A] border border-[#FDE68A] px-4 py-1.5 text-xs sm:text-sm font-medium text-[#92400E] shadow-2xs transition-colors"
              >
                เข้าสู่ระบบ
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50"
              >
                ออกจากระบบ
              </motion.button>
            )}
          </div>
        </header>

        <section className="mb-8 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="rounded-xl bg-white p-6 shadow-xs border border-slate-200/90 md:p-8"
          >
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium text-[#92400E] bg-[#FEF9E7] px-2.5 py-1 rounded-md border border-[#FDE68A]">
              <ShieldCheck size={14} className="text-amber-600" />
              <span>QSMS Operations Control Center</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              สวัสดีคุณ{greetingName}, ยินดีต้อนรับสู่ระบบงานกลาง
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              เลือกใช้งานโมดูลที่ต้องการผ่านศูนย์กลางควบคุมนี้ ระบบ Rework พร้อมใช้งานเต็มรูปแบบ
              เพื่อการบันทึก ตรวจสอบความถูกต้อง และติดตามผลการแก้ไขงานสินค้าแบบครบวงจร
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
            className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-xs border border-slate-200"
          >
            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">สถานะผู้ใช้งาน</span>
              {isGuest ? (
                <>
                  <p className="mt-1 text-base font-semibold text-slate-800">GUEST (ผู้มาเยือน)</p>
                  <p className="mt-0.5 text-xs text-slate-500">เข้าสู่ระบบเพื่อใช้งานระบบแบบเต็มรูปแบบ</p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <p className="text-base font-semibold text-slate-800">{user?.role?.toUpperCase() || 'USER'}</p>
                      <p className="text-xs text-slate-500">{user?.email || 'เข้าสู่ระบบด้วยสิทธิ์ Platform'}</p>
                    </div>
                    {(user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'QSMS') && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => onOpenApp('admin')}
                        className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-white shadow-xs hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <ShieldCheck size={13} />
                        <span>Admin Console</span>
                      </motion.button>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-700 mb-1">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span className="text-xs font-medium">ความปลอดภัย</span>
                </div>
                <p className="text-xs text-slate-500">ระบบรักษาความปลอดภัยด้วย Token และการแบ่งสิทธิ์ตามบทบาท</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-700 mb-1">
                  <Clock3 size={14} className="text-amber-600" />
                  <span className="text-xs font-medium">สถานะระบบ</span>
                </div>
                <p className="text-xs text-slate-500">Rework Module พร้อมใช้งานปกติ ข้อมูลอัปเดตแบบเรียลไทม์</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. ASYMMETRIC OPERATIONAL LAYOUT */}
        <section className="grid gap-6 lg:grid-cols-12 items-stretch">
          {/* PRIMARY HERO CARD: QSMS REWORK (Spans 7 cols on Desktop) */}
          <motion.article
            whileHover={{ y: -2 }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:col-span-7 flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-6 md:p-7 shadow-xs transition-all"
          >
            <div>
              {/* Header: Subtitle + Live Contextual Badge */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#92400E]">
                    <Activity size={14} className="text-amber-600" />
                    <span>โมดูลปฏิบัติการหลัก (Core Operation)</span>
                  </div>
                  <h3 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
                    QSMS Rework Management
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-medium text-[#92400E] border border-[#FDE68A]">
                  <span className="inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  {reworkStats.hasData && reworkStats.inProgress > 0
                    ? `กำลังทำ ${reworkStats.inProgress} เคส`
                    : 'ระบบพร้อมทำงาน'}
                </span>
              </div>

              {/* Progress & Live Operational Metrics */}
              <div className="mt-5 flex flex-col gap-3 rounded-lg bg-slate-50 p-4 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    ความคืบหน้ารวม ({reworkStats.hasData ? `${reworkStats.completed}/${reworkStats.total}` : '--/--'} เคส)
                  </span>
                  <span className="text-[#92400E] font-semibold text-sm font-mono tabular-nums">
                    {reworkStats.hasData ? `${reworkStats.completionRate}%` : '--%'}
                  </span>
                </div>

                {/* Segmented Progress Bar with Interactive Click & Hover */}
                <div className="relative flex h-3 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner">
                  {!reworkStats.hasData ? (
                    <div className="h-full w-full bg-slate-300 animate-pulse" />
                  ) : reworkStats.total === 0 ? (
                    <div className="h-full w-full bg-slate-200 flex items-center justify-center text-[10px] font-medium text-slate-500">
                      ไม่มีเคสในระบบ
                    </div>
                  ) : (
                    <>
                      {reworkStats.pending > 0 && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(reworkStats.pending / reworkStats.total) * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          onClick={() => handleDirectFilterJump('Pending')}
                          className="h-full bg-amber-400 hover:brightness-110 cursor-pointer transition-all"
                          title={`รอดำเนินการ: ${reworkStats.pending} เคส (${Math.round((reworkStats.pending / reworkStats.total) * 100)}%) — คลิกเพื่อเปิด`}
                        />
                      )}
                      {reworkStats.inProgress > 0 && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(reworkStats.inProgress / reworkStats.total) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                          onClick={() => handleDirectFilterJump('In-Progress')}
                          className="h-full bg-sky-500 hover:brightness-110 cursor-pointer transition-all"
                          title={`กำลังดำเนินการ: ${reworkStats.inProgress} เคส (${Math.round((reworkStats.inProgress / reworkStats.total) * 100)}%) — คลิกเพื่อเปิด`}
                        />
                      )}
                      {reworkStats.completed > 0 && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(reworkStats.completed / reworkStats.total) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                          onClick={() => handleDirectFilterJump('Completed')}
                          className="h-full bg-emerald-500 hover:brightness-110 cursor-pointer transition-all"
                          title={`เสร็จสิ้น: ${reworkStats.completed} เคส (${Math.round((reworkStats.completed / reworkStats.total) * 100)}%) — คลิกเพื่อเปิด`}
                        />
                      )}
                    </>
                  )}
                </div>

                {/* 3 Clickable Metric Boxes with Direct Filter Jumping */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => handleDirectFilterJump('Pending')}
                    className="group/stat flex flex-col items-center justify-center p-2 rounded-lg hover:bg-amber-50 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    title="คลิกเพื่อดูกลุ่มเคสรอดำเนินการทันที"
                  >
                    <span className="text-[11px] font-medium text-amber-800 flex items-center justify-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      รอดำเนินการ
                    </span>
                    <span className="text-xl md:text-2xl font-semibold text-slate-800 font-mono tabular-nums">
                      {reworkStats.hasData ? reworkStats.pending : '--'}
                    </span>
                    <span className="text-[9px] text-amber-700 font-medium opacity-0 group-hover/stat:opacity-100 transition-opacity inline-flex items-center gap-0.5">
                      <span>กรองกลุ่มนี้</span>
                      <ArrowUpRight size={10} />
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => handleDirectFilterJump('In-Progress')}
                    className="group/stat flex flex-col items-center justify-center p-2 rounded-lg hover:bg-sky-50 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer border-x border-slate-200"
                    title="คลิกเพื่อดูกลุ่มเคสที่กำลังทำทันที"
                  >
                    <span className="text-[11px] font-medium text-sky-800 flex items-center justify-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      กำลังทำ
                    </span>
                    <span className="text-xl md:text-2xl font-semibold text-slate-800 font-mono tabular-nums">
                      {reworkStats.hasData ? reworkStats.inProgress : '--'}
                    </span>
                    <span className="text-[9px] text-sky-700 font-medium opacity-0 group-hover/stat:opacity-100 transition-opacity inline-flex items-center gap-0.5">
                      <span>กรองกลุ่มนี้</span>
                      <ArrowUpRight size={10} />
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => handleDirectFilterJump('Completed')}
                    className="group/stat flex flex-col items-center justify-center p-2 rounded-lg hover:bg-emerald-50 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                    title="คลิกเพื่อดูกลุ่มเคสที่เสร็จสิ้นแล้วทันที"
                  >
                    <span className="text-[11px] font-medium text-emerald-800 flex items-center justify-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      เสร็จสิ้น
                    </span>
                    <span className="text-xl md:text-2xl font-semibold text-slate-800 font-mono tabular-nums">
                      {reworkStats.hasData ? reworkStats.completed : '--'}
                    </span>
                    <span className="text-[9px] text-emerald-700 font-medium opacity-0 group-hover/stat:opacity-100 transition-opacity inline-flex items-center gap-0.5">
                      <span>กรองกลุ่มนี้</span>
                      <ArrowUpRight size={10} />
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Description & Key Feature Badges */}
              <p className="mt-4 text-xs text-slate-600 leading-relaxed">
                ระบบบันทึก ตรวจสอบ และติดตามงานสินค้าทำใหม่ — ตรวจนับความคืบหน้าระดับกล่อง และส่งออกรายงานพร้อมภาพหลักฐาน
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
                  Hybrid Case ID
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
                  Two-Way Verification
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
                  Dynamic Auto-Status
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
                  Excel & Evidence
                </span>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                เข้าสู่พื้นที่การทำงานหลัก
              </span>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => onOpenApp('rework')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border border-[#FDE68A] px-6 py-2.5 text-sm font-medium shadow-2xs transition-colors"
              >
                <span>เปิดใช้งาน Rework</span>
                <ArrowRight size={16} />
              </motion.button>
            </div>
          </motion.article>

          {/* RIGHT COLUMN: SECONDARY MODULES */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Top Right: Drawing & Master Storage (If not Operator) */}
            {user?.role !== 'OPERATOR' && (
              <motion.article
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-[#92400E]">
                        Engineering Vault
                      </p>
                      <h3 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">
                        Drawing & Master Storage
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 border border-slate-200">
                      {storageStats.hasData ? `${storageStats.totalDrawings} Drawings` : 'คลังเอกสาร'}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    จัดเก็บแบบแปลนลูกค้าและ Master Sheets พร้อมระบบ Gemini OCR สกัด Metadata
                  </p>

                  {/* Storage Stats Deck */}
                  <div className="mt-3 flex flex-col gap-2.5 rounded-lg bg-slate-50 p-3.5 border border-slate-200">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block">Drawing ทั้งหมด</span>
                        <span className="text-lg font-semibold text-slate-800 font-mono tabular-nums">
                          {storageStats.hasData ? `${storageStats.totalDrawings} ไฟล์` : '--'}
                        </span>
                      </div>
                      <div className="border-l border-slate-200">
                        <span className="text-[11px] font-medium text-slate-500 block">ทำ Master แล้ว</span>
                        <span className="text-lg font-semibold text-emerald-600 font-mono tabular-nums">
                          {storageStats.hasData ? storageStats.completedMasters : '--'}
                        </span>
                      </div>
                    </div>

                    {/* Coverage Progress Bar */}
                    <div className="space-y-1 pt-1.5 border-t border-slate-200">
                      <div className="flex justify-between text-[11px] font-medium text-slate-600">
                        <span>Master Coverage</span>
                        <span className="font-semibold text-[#92400E] font-mono tabular-nums">
                          {storageStats.hasData ? `${storageStats.coverageRate}%` : '--%'}
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        {storageStats.hasData && (
                          <div
                            className="h-full bg-amber-400 transition-all duration-500"
                            style={{ width: `${storageStats.coverageRate}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">สิทธิ์ QSMS Admin</span>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => onOpenApp('storage')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition-colors"
                  >
                    <span>เปิดคลังเอกสาร</span>
                    <ArrowRight size={13} />
                  </motion.button>
                </div>
              </motion.article>
            )}

            {/* Bottom Right Split: DocAI RAG & Presentation Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {/* DocAI Card */}
              <motion.article
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#92400E]">AI Assistant</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-medium text-[#92400E] border border-[#FDE68A]">
                      Online
                    </span>
                  </div>
                  <h4 className="mt-1.5 text-base font-semibold tracking-tight text-slate-900">
                    DocAI Assistant
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    สืบค้นคู่มือเทคนิคและแนวทางแก้ไขงานผ่านเวกเตอร์ AI
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={onOpenRag}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] px-3 py-1.5 text-xs font-medium transition-colors border border-[#FDE68A]"
                  >
                    <span>ถาม AI Assistant</span>
                    <ArrowRight size={13} />
                  </motion.button>
                </div>
              </motion.article>

              {/* Presentation Card */}
              <motion.article
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">คู่มือแนะนำ</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                      Deck
                    </span>
                  </div>
                  <h4 className="mt-1.5 text-base font-semibold tracking-tight text-slate-900">
                    Presentation Deck
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    สไลด์นำเสนอระบบและจำลองการใช้งานแบบ Interactive
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={() => onOpenApp('guide')}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-medium transition-colors border border-slate-200"
                  >
                    <span>เปิดคู่มือสไลด์</span>
                    <ArrowRight size={13} />
                  </motion.button>
                </div>
              </motion.article>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
