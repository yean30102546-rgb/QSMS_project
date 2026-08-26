'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Clock3,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Users2,
  CalendarDays,
  Activity,
  FileText,
  CheckCircle2,
  MessageSquarePlus
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
    <div className="apple-shell flex h-full w-full flex-col overflow-y-auto custom-scrollbar bg-slate-50">
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col px-5 py-6 md:px-8 lg:px-12">
        <header className="mb-10 flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm border border-slate-200 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-[#1d1d1f]">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h2 className="text-sm font-medium text-slate-500">Central Control</h2>
              <h1 className="text-lg font-semibold tracking-[-0.02em] text-[#1d1d1f]">ศูนย์ควบคุมกลาง</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                if (onOpenFeedback) {
                  onOpenFeedback();
                } else if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-feedback-modal'));
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition-colors"
              title="ส่งความคิดเห็นหรือรายงานปัญหาการใช้งานระบบ"
            >
              <MessageSquarePlus size={16} className="text-blue-600" />
              <span className="hidden sm:inline">แบบสอบถาม & ข้อเสนอแนะ</span>
              <span className="sm:hidden">ฟีดแบ็ค</span>
            </motion.button>

            {isGuest ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onLogin}
                className="rounded-xl bg-[#1d1d1f] px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition-colors hover:bg-black"
              >
                เข้าสู่ระบบ
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-black/5 bg-white/60 px-4 py-2 text-xs sm:text-sm font-semibold text-[#1d1d1f] shadow-sm backdrop-blur-md transition-colors hover:bg-white"
              >
                ออกจากระบบ
              </motion.button>
            )}
          </div>
        </header>

        <section className="mb-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="rounded-3xl bg-white px-6 py-8 shadow-sm border border-slate-200 md:px-10 md:py-12"
          >
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600">
              <Sparkles size={16} className="text-blue-500" />
              Welcome to the Workspace
            </div>
            <h2 className="max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-0.03em] text-[#1d1d1f] md:text-5xl">
              สวัสดีคุณ{greetingName}, ยินดีต้อนรับสู่ระบบงานกลาง
            </h2>
            <p className="mt-5 max-w-2xl text-[17px] leading-7 text-[#515154]">
              เลือกใช้งานโมดูลที่ต้องการผ่านศูนย์กลางควบคุมนี้ ระบบ Rework พร้อมใช้งานเต็มรูปแบบ
              และ Roster กำลังถูกพัฒนาเป็นลำดับถัดไป เพื่อการบริหารจัดการที่ครบวงจร
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: 'easeOut' }}
            className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-200"
          >
            <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
              <h3 className="text-sm font-medium text-slate-500">โปรไฟล์ของคุณ</h3>
              {isGuest ? (
                <>
                  <p className="mt-3 text-xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">GUEST (ผู้มาเยือน)</p>
                  <p className="mt-1 text-sm leading-6 text-[#515154]">เข้าสู่ระบบเพื่อใช้งานระบบแบบเต็มรูปแบบ</p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">{user?.role?.toUpperCase() || 'USER'}</p>
                      <p className="mt-0.5 text-xs leading-5 text-[#515154]">{user?.email || 'เข้าสู่ระบบด้วยสิทธิ์ Platform'}</p>
                    </div>
                    {(user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'QSMS') && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => onOpenApp('admin')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
                      >
                        <ShieldCheck size={14} />
                        <span>Admin Console</span>
                      </motion.button>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
                <div className="mb-2 flex items-center gap-2 text-slate-700">
                  <ShieldCheck size={16} />
                  <span className="text-sm font-semibold">ความปลอดภัย</span>
                </div>
                <p className="text-sm leading-6 text-[#515154]">ระบบรักษาความปลอดภัยด้วย Token ชั่วคราว และการแยกสิทธิ์ตามบทบาท</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
                <div className="mb-2 flex items-center gap-2 text-slate-700">
                  <Clock3 size={16} />
                  <span className="text-sm font-semibold">สถานะระบบ</span>
                </div>
                <p className="text-sm leading-6 text-[#515154]">โมดูล Rework เปิดใช้งานแล้ว โมดูล Roster กำลังอยู่ในขั้นตอนเตรียมการ</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. ASYMMETRIC OPERATIONAL LAYOUT (Phase 1: Operational Hierarchy) */}
        <section className="grid gap-6 lg:grid-cols-12 items-stretch">
          {/* ========================================================================= */}
          {/* PRIMARY HERO CARD: QSMS REWORK (Spans 7 cols on Desktop)                  */}
          {/* ========================================================================= */}
          <motion.article
            whileHover={{ y: -2 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 md:p-8 shadow-sm transition-all"
          >
            <div>
              {/* Header: Subtitle + Live Contextual Badge */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                    <Activity size={14} />
                    <span>โมดูลหลัก (Core Operation)</span>
                  </div>
                  <h3 className="mt-2 text-3xl font-bold tracking-tight text-[#1d1d1f]">
                    QSMS Rework
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  {reworkStats.hasData && reworkStats.inProgress > 0
                    ? `กำลังทำ ${reworkStats.inProgress} เคส`
                    : 'ระบบพร้อมทำงาน'}
                </span>
              </div>

              {/* Progress & Live Operational Metrics */}
              <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    ความคืบหน้ารวม ({reworkStats.hasData ? `${reworkStats.completed}/${reworkStats.total}` : '--/--'} เคส)
                  </span>
                  <span className="text-emerald-600 font-bold text-sm font-mono tabular-nums">
                    {reworkStats.hasData ? `${reworkStats.completionRate}%` : '--%'}
                  </span>
                </div>

                {/* Segmented Progress Bar with Interactive Click & Hover */}
                <div className="relative flex h-3.5 w-full overflow-hidden rounded-full bg-slate-200/60 shadow-inner">
                  {!reworkStats.hasData ? (
                    <div className="h-full w-full bg-slate-300/40 animate-pulse" />
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
                          className="h-full bg-sky-400 hover:brightness-110 cursor-pointer transition-all"
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
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleDirectFilterJump('Pending')}
                    className="group/stat flex flex-col items-center justify-center p-2 rounded-xl hover:bg-amber-50/80 transition-all text-center focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    title="คลิกเพื่อดูกลุ่มเคสรอดำเนินการทันที"
                  >
                    <span className="text-[11px] font-semibold text-amber-700 flex items-center justify-center gap-1 group-hover/stat:text-amber-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      รอดำเนินการ
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-slate-800 font-mono tabular-nums">
                      {reworkStats.hasData ? reworkStats.pending : '--'}
                    </span>
                    <span className="text-[9px] text-amber-700 font-semibold opacity-0 group-hover/stat:opacity-100 transition-opacity">
                      กรองกลุ่มนี้ ↗
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleDirectFilterJump('In-Progress')}
                    className="group/stat flex flex-col items-center justify-center p-2 rounded-xl hover:bg-sky-50/80 transition-all text-center focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer border-x border-slate-200/80"
                    title="คลิกเพื่อดูกลุ่มเคสที่กำลังทำทันที"
                  >
                    <span className="text-[11px] font-semibold text-sky-700 flex items-center justify-center gap-1 group-hover/stat:text-sky-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      กำลังทำ
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-slate-800 font-mono tabular-nums">
                      {reworkStats.hasData ? reworkStats.inProgress : '--'}
                    </span>
                    <span className="text-[9px] text-sky-700 font-semibold opacity-0 group-hover/stat:opacity-100 transition-opacity">
                      กรองกลุ่มนี้ ↗
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleDirectFilterJump('Completed')}
                    className="group/stat flex flex-col items-center justify-center p-2 rounded-xl hover:bg-emerald-50/80 transition-all text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                    title="คลิกเพื่อดูกลุ่มเคสที่เสร็จสิ้นแล้วทันที"
                  >
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center justify-center gap-1 group-hover/stat:text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      เสร็จสิ้น
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-slate-800 font-mono tabular-nums">
                      {reworkStats.hasData ? reworkStats.completed : '--'}
                    </span>
                    <span className="text-[9px] text-emerald-700 font-semibold opacity-0 group-hover/stat:opacity-100 transition-opacity">
                      กรองกลุ่มนี้ ↗
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Description & Key Feature Badges */}
              <p className="mt-5 text-sm text-slate-600 leading-relaxed">
                ระบบบันทึก ตรวจสอบ และติดตามงานสินค้าทำใหม่ — ตรวจนับความคืบหน้าระดับกล่อง และส่งออกรายงานพร้อมภาพหลักฐาน
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/60">
                  Hybrid Case ID
                </span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/60">
                  Two-Way Verification
                </span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/60">
                  Dynamic Auto-Status
                </span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/60">
                  Excel & Evidence
                </span>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                เข้าสู่พื้นที่การทำงานหลัก
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => onOpenApp('rework')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d1d1f] hover:bg-black text-white px-7 py-3 text-sm font-semibold shadow-md transition-all"
              >
                <span>เปิดใช้งาน Rework</span>
                <ArrowRight size={16} />
              </motion.button>
            </div>
          </motion.article>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: SECONDARY MODULES (Spans 5 cols on Desktop)                 */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Top Right: Drawing & Master Storage (If not Operator) */}
            {user?.role !== 'OPERATOR' && (
              <motion.article
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-amber-600">
                        Engineering Vault
                      </p>
                      <h3 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f]">
                        Drawing & Master Storage
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                      {storageStats.hasData ? `${storageStats.totalDrawings} Drawings` : 'คลังเอกสาร'}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    จัดเก็บแบบแปลนลูกค้าและ Master Sheets พร้อมระบบ Gemini OCR สกัด Metadata
                  </p>

                  {/* Storage Stats Deck */}
                  <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block">Drawing ทั้งหมด</span>
                        <span className="text-xl font-bold text-slate-800 font-mono tabular-nums">
                          {storageStats.hasData ? `${storageStats.totalDrawings} ไฟล์` : '--'}
                        </span>
                      </div>
                      <div className="border-l border-slate-200">
                        <span className="text-[11px] font-medium text-slate-500 block">ทำ Master แล้ว</span>
                        <span className="text-xl font-bold text-emerald-600 font-mono tabular-nums">
                          {storageStats.hasData ? storageStats.completedMasters : '--'}
                        </span>
                      </div>
                    </div>

                    {/* Coverage Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                      <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span>Master Coverage</span>
                        <span className="font-bold text-indigo-600 font-mono tabular-nums">
                          {storageStats.hasData ? `${storageStats.coverageRate}%` : '--%'}
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                        {storageStats.hasData && (
                          <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${storageStats.coverageRate}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">สิทธิ์ QSMS Admin</span>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => onOpenApp('storage')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-[#1d1d1f] shadow-xs transition-all"
                  >
                    <span>เปิดคลังเอกสาร</span>
                    <ArrowRight size={14} />
                  </motion.button>
                </div>
              </motion.article>
            )}

            {/* Bottom Right Split: DocAI RAG & Presentation Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {/* DocAI Card */}
              <motion.article
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-600">AI Assistant</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200/60">
                      Online
                    </span>
                  </div>
                  <h4 className="mt-2 text-lg font-bold tracking-tight text-[#1d1d1f]">
                    DocAI RAG
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    สืบค้นคู่มือเทคนิคและแนวทางแก้ไขงานผ่านเวกเตอร์ AI
                  </p>

                  {/* Quick-Prompt Trigger Bar */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onOpenRag}
                    className="mt-3 w-full flex items-center justify-between gap-2 rounded-xl bg-slate-50 hover:bg-purple-50/60 p-2 text-xs text-slate-500 hover:text-purple-700 border border-slate-200/80 transition-all cursor-pointer text-left"
                    title="คลิกเพื่อเปิดค้นหาด่วน"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Sparkles size={12} className="text-purple-600 shrink-0" />
                      <span className="truncate">"ค้นหาสเปกน้ำมัน..."</span>
                    </div>
                    <ArrowRight size={12} className="text-purple-600 shrink-0" />
                  </motion.button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onOpenRag}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 px-3 py-2 text-xs font-semibold transition-all border border-purple-200/60"
                  >
                    <span>ถาม AI Assistant</span>
                    <ArrowRight size={13} />
                  </motion.button>
                </div>
              </motion.article>

              {/* Presentation Card */}
              <motion.article
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-600">คู่มือแนะนำ</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200/60">
                      22 Slides
                    </span>
                  </div>
                  <h4 className="mt-2 text-lg font-bold tracking-tight text-[#1d1d1f]">
                    Presentation Deck
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    สไลด์นำเสนอระบบและจำลองการใช้งานแบบ Interactive
                  </p>

                  {/* Quick Interactive Demo Trigger */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => onOpenApp('guide')}
                    className="mt-3 w-full flex items-center justify-between gap-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 p-2 text-xs text-slate-500 hover:text-blue-700 border border-slate-200/80 transition-all cursor-pointer text-left"
                    title="คลิกเพื่อเปิดพรีวิวแบบ Interactive"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Sparkles size={12} className="text-blue-600 shrink-0" />
                      <span className="truncate">"Live Sandbox Demo"</span>
                    </div>
                    <ArrowRight size={12} className="text-blue-600 shrink-0" />
                  </motion.button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => onOpenApp('guide')}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 text-xs font-semibold transition-all border border-slate-200"
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
