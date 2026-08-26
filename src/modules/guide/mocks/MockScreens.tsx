import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2, Clock, LayoutGrid, ShieldCheck, Sparkles,
  ArrowRight, Search, Plus, Filter, AlertCircle, FileText,
  Package, Trash2, PenTool, ExternalLink, X, Users2, CalendarDays, Clock3,
  LayoutDashboard, ArrowLeft, HelpCircle, RefreshCw, SlidersHorizontal, Calendar,
  Eye, EyeOff, Lock, UserCircle2, ChevronLeft, FileSpreadsheet, Activity,
  Save, Camera, Edit3, Check, Copy, ChevronDown, Bot, Send, Smartphone, Zap, CheckCheck,
  RotateCcw, RotateCw, ZoomIn, ZoomOut, Layers, Link2, Database, Upload, Pencil,
  ShieldAlert, Download, UploadCloud, ThumbsUp, ThumbsDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent } from '@/src/components/ui/card';

import { MainLayout } from '../../../components/layout/MainLayout';
import { ReworkDataProvider } from '../../../contexts/ReworkDataContext';
import { MockAddCaseTab } from './MockAddCaseTab';
import { DashboardTab } from '@/src/modules/rework/views/DashboardTab';
import { MobileFastTrackApp } from '@/src/modules/rework/views/MobileFastTrackApp';
import type { ReworkCase } from '../../../services/api';
import { UserRole } from '@/src/config/auth.config';

// Apple Progress Bar Mock (From UpdateModal)
function AppleProgressBar({ progress, statusText, isComplete }: { progress: number, statusText: string, isComplete: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-slate-500">{statusText}</span>
      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      {isComplete && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
    </div>
  );
}

// 0.5 Mock Login (Exact authentic replica of Login.tsx)
export function MockLogin({ onNavigate }: { onNavigate?: () => void }) {
  const [username, setUsername] = useState('OPERATOR_DEMO');
  const [password, setPassword] = useState('••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onNavigate) onNavigate();
    }, 600);
  };

  return (
    <div className="w-full h-full min-h-[720px] relative overflow-y-auto bg-gradient-to-br from-[#F5F5F7] via-[#FFFFFF] to-[#E8E8ED] flex items-center justify-center p-6 md:p-10 pointer-events-auto">
      {/* Background Soft Blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-indigo-400/15 blur-3xl" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[940px] overflow-hidden rounded-[32px] bg-white/40 backdrop-blur-xl shadow-2xl shadow-blue-950/10 border border-white/60"
      >
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Hero Side */}
          <div className="border-b border-white/60 bg-white/40 backdrop-blur-xl px-8 py-10 text-[#1d1d1f] md:px-10 lg:border-b-0 lg:border-r lg:border-r-black/5 flex flex-col justify-between">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md flex items-center justify-center text-white font-bold text-lg">
                  Q
                </div>
                <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#1d1d1f]/70 font-sans">Central Workspace</div>
              </div>
              <h1 className="max-w-lg text-3xl md:text-4xl font-bold leading-[1.1] tracking-tight text-[#1d1d1f]">
                One login for all QSMS enterprise operations.
              </h1>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#515154] font-thai">
                เข้าสู่ระบบครั้งเดียว แล้วเลือกใช้งานแต่ละ webapp ผ่าน Central Control ได้ทันที
                โดยรักษา workflow เดิมของ Rework ให้ทำงานต่อเนื่อง
              </p>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-black/60 self-start">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Platform session secured
            </div>
          </div>

          {/* Right Form Side */}
          <div className="bg-white/85 px-7 py-8 md:px-9 md:py-10 flex flex-col justify-between">
            <div>
              <button
                type="button"
                className="mb-5 inline-flex items-center gap-1 text-xs font-semibold text-[#6e6e73] hover:text-[#1d1d1f] transition-colors font-thai"
              >
                <ChevronLeft size={14} />
                ย้อนกลับสู่ศูนย์ควบคุม
              </button>

              <div className="mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0071e3]">Sign in</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d1d1f] font-thai">เข้าสู่ Central Control</h2>
                <p className="mt-1 text-xs leading-5 text-[#5d5d63] font-thai">
                  ใช้ profile และ password เดิมของระบบเพื่อเข้าสู่ Portal
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="relative group">
                  <UserCircle2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="glass-input w-full rounded-2xl py-3 pl-11 pr-4 text-sm bg-white/70 border border-black/10 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                  />
                </div>

                <div className="relative group">
                  <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="glass-input w-full rounded-2xl py-3 pl-11 pr-11 text-sm bg-white/70 border border-black/10 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a7a80] hover:text-[#1d1d1f] transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between px-1 py-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-[#6e6e73] group-hover:text-[#1d1d1f] transition-colors font-thai">จดจำชื่อผู้ใช้งาน</span>
                  </label>
                  <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors font-thai">
                    ลืมรหัสผ่าน?
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="apple-btn-primary mt-1 inline-flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold rounded-2xl shadow-lg shadow-black/10 disabled:opacity-55"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                      กำลังเข้าสู่ระบบ...
                    </>
                  ) : (
                    <>
                      เข้าสู่ระบบ
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </form>
            </div>

            <div className="mt-6 border-t border-[#e8e8ed] pt-4 flex flex-col gap-2">
              <p className="text-xs text-[#6e6e73] font-thai">
                ยังไม่มีบัญชีผู้ใช้งาน? ติดต่อผู้ดูแลระบบ (Admin)
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

// 1. Mock Portal (Exact Replica of current WorkspacePortal.tsx)
export function MockPortal({ onNavigate }: { onNavigate?: () => void }) {
  const greetingName = 'สมชาย';
  const user = { role: 'OPERATOR', email: 'operator@sfc.com' };

  // Preview Stats State
  const reworkStats = {
    total: 120,
    pending: 15,
    inProgress: 40,
    completed: 65,
    completionRate: 54,
    hasData: true,
  };
  const storageStats = {
    totalDrawings: 84,
    completedMasters: 63,
    missingMasters: 21,
    coverageRate: 75,
    hasData: true,
  };

  const handleAction = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <div className="apple-shell flex h-full flex-col overflow-y-auto custom-scrollbar bg-slate-50 relative pointer-events-auto">
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="rounded-xl border border-black/5 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1d1d1f] shadow-sm backdrop-blur-md transition-colors hover:bg-white"
          >
            ออกจากระบบ
          </motion.button>
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
              เลือกใช้งานโมดูลที่ต้องการผ่านศูนย์กลางควบคุมนี้ เพื่อการบริหารจัดการคุณภาพและคลังเอกสารมาตรฐานอย่างครบวงจร
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
              <p className="mt-3 text-xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">{user.role}</p>
              <p className="mt-1 text-sm leading-6 text-[#515154]">{user.email}</p>
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
                <p className="text-sm leading-6 text-[#515154]">โมดูลทั้งหมดทำงานปกติ เชื่อมต่อฐานข้อมูล Supabase และ Cloudinary เรียบร้อย</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. ASYMMETRIC OPERATIONAL LAYOUT (Current Phase 1/2 Spec) */}
        <section className="grid gap-6 lg:grid-cols-12 items-stretch pb-12">
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
                  กำลังทำ {reworkStats.inProgress} เคส
                </span>
              </div>

              {/* Progress & Live Operational Metrics */}
              <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    ความคืบหน้ารวม ({reworkStats.completed}/{reworkStats.total} เคส)
                  </span>
                  <span className="text-emerald-600 font-bold text-sm font-mono tabular-nums">
                    {reworkStats.completionRate}%
                  </span>
                </div>

                {/* Segmented Progress Bar */}
                <div className="relative flex h-3.5 w-full overflow-hidden rounded-full bg-slate-200/60 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(reworkStats.pending / reworkStats.total) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    onClick={handleAction}
                    className="h-full bg-amber-400 hover:brightness-110 cursor-pointer transition-all"
                    title={`รอดำเนินการ: ${reworkStats.pending} เคส`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(reworkStats.inProgress / reworkStats.total) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                    onClick={handleAction}
                    className="h-full bg-sky-400 hover:brightness-110 cursor-pointer transition-all"
                    title={`กำลังดำเนินการ: ${reworkStats.inProgress} เคส`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(reworkStats.completed / reworkStats.total) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                    onClick={handleAction}
                    className="h-full bg-emerald-500 hover:brightness-110 cursor-pointer transition-all"
                    title={`เสร็จสิ้น: ${reworkStats.completed} เคส`}
                  />
                </div>

                {/* 3 Metric Grid with Tabular Numbers */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleAction}
                    className="group/stat flex flex-col items-center justify-center p-2 rounded-xl hover:bg-amber-50/80 transition-all text-center focus:outline-none cursor-pointer"
                  >
                    <span className="text-[11px] font-semibold text-amber-700 flex items-center justify-center gap-1 group-hover/stat:text-amber-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      รอดำเนินการ
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-slate-800 font-mono tabular-nums">
                      {reworkStats.pending}
                    </span>
                    <span className="text-[9px] text-amber-700 font-semibold opacity-0 group-hover/stat:opacity-100 transition-opacity">
                      กรองกลุ่มนี้ ↗
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleAction}
                    className="group/stat flex flex-col items-center justify-center p-2 rounded-xl hover:bg-sky-50/80 transition-all text-center focus:outline-none cursor-pointer border-x border-slate-200/80"
                  >
                    <span className="text-[11px] font-semibold text-sky-700 flex items-center justify-center gap-1 group-hover/stat:text-sky-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      กำลังทำ
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-slate-800 font-mono tabular-nums">
                      {reworkStats.inProgress}
                    </span>
                    <span className="text-[9px] text-sky-700 font-semibold opacity-0 group-hover/stat:opacity-100 transition-opacity">
                      กรองกลุ่มนี้ ↗
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleAction}
                    className="group/stat flex flex-col items-center justify-center p-2 rounded-xl hover:bg-emerald-50/80 transition-all text-center focus:outline-none cursor-pointer"
                  >
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center justify-center gap-1 group-hover/stat:text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      เสร็จสิ้น
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-slate-800 font-mono tabular-nums">
                      {reworkStats.completed}
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
                onClick={handleAction}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d1d1f] hover:bg-black text-white px-7 py-3 text-sm font-semibold shadow-md transition-all cursor-pointer"
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
            {/* Top Right: Drawing & Master Storage */}
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
                    {storageStats.totalDrawings} Drawings
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
                        {storageStats.totalDrawings} ไฟล์
                      </span>
                    </div>
                    <div className="border-l border-slate-200">
                      <span className="text-[11px] font-medium text-slate-500 block">ทำ Master แล้ว</span>
                      <span className="text-xl font-bold text-emerald-600 font-mono tabular-nums">
                        {storageStats.completedMasters}
                      </span>
                    </div>
                  </div>

                  {/* Coverage Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Master Coverage</span>
                      <span className="font-bold text-indigo-600 font-mono tabular-nums">
                        {storageStats.coverageRate}%
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/60">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${storageStats.coverageRate}%` }}
                      />
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
                  onClick={handleAction}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-[#1d1d1f] shadow-xs transition-all cursor-pointer"
                >
                  <span>เปิดคลังเอกสาร</span>
                  <ArrowRight size={14} />
                </motion.button>
              </div>
            </motion.article>

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
                    onClick={handleAction}
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
                    onClick={handleAction}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 px-3 py-2 text-xs font-semibold transition-all border border-purple-200/60 cursor-pointer"
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
                      17 Slides
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
                    onClick={handleAction}
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
                    onClick={handleAction}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 text-xs font-semibold transition-all border border-slate-200 cursor-pointer"
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

// 2. Mock Overall (Exact Clone of MainLayout + OverallTab)
export function MockOverall({ onNavigate }: { onNavigate?: () => void }) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="flex h-full w-full overflow-hidden bg-gradient-to-br from-[#F5F5F7] via-[#FFFFFF] to-[#E8E8ED] text-[#1d1d1f] font-sans pointer-events-auto">
      {/* Sidebar (MainLayout) */}
      <aside className="hidden md:flex w-[260px] flex-col border-r border-slate-200 bg-white px-5 py-8 shadow-sm z-40">
        <div className="mb-14 flex items-center gap-3 px-2">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 border border-slate-200 p-1">
            <div className="w-full h-full bg-slate-200 rounded animate-pulse" /> {/* Placeholder for logo */}
          </div>
          <div>
            <h1 className="text-[16px] font-bold tracking-wider text-[#1d1d1f] uppercase leading-tight">QSMS REWORK</h1>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <button className="sidebar-item mb-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 bg-blue-50 text-blue-600">
            <LayoutDashboard size={16} /> <span>ภาพรวม (Overall)</span>
          </button>
          <button className="sidebar-item mb-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            <Plus size={16} /> <span>เพิ่มงานใหม่ (Add Case)</span>
          </button>
          <button className="sidebar-item mb-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            <ArrowLeft size={16} /> <span>กลับหน้าพอร์ทัล</span>
          </button>
          <button className="sidebar-item mb-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            <HelpCircle size={16} /> <span>คู่มือการใช้งาน</span>
          </button>
        </nav>
        <div className="mt-8 border-t border-slate-200 pt-8">
          <div className="group flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-3.5 py-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs uppercase">S</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 truncate leading-tight mb-0.5">สมชาย</p>
              <span className="inline-flex rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">OPERATOR</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content (OverallTab) */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-transparent">
        <div className="flex h-full flex-col overflow-hidden bg-transparent">
          <div className="flex-shrink-0 border-b border-white/20 bg-white/20 backdrop-blur-md px-0 py-6 md:py-8 lg:py-10 shadow-sm shadow-black/5">
            <div className="px-4 md:px-10 lg:px-12">
              <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {new Date().toLocaleDateString('th-TH', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f] md:text-3xl">สวัสดี OPERATOR</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/40 text-[#1d1d1f] transition-all hover:bg-white/80 shadow-sm">
                    <RefreshCw size={18} />
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-5">
                {[
                  { label: "จำนวนงานทั้งหมด", value: "120" },
                  { label: "รอดำเนินการ", value: "15", trend: "13%" },
                  { label: "กำลังดำเนินการ", value: "40" },
                  { label: "เสร็จสิ้น", value: "65" },
                ].map((s, i) => (
                  <div key={i} className="rounded-xl border border-white/45 bg-white/45 backdrop-blur-md p-4 md:p-6 shadow-sm hover:bg-white/70 hover:shadow-md transition-all">
                    <p className="mb-2 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-slate-500 md:mb-3 md:text-[10px]">{s.label}</p>
                    <div className="flex items-end justify-between gap-2">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight text-[#1d1d1f] md:text-3xl">{s.value}</h3>
                      {s.trend && (
                        <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[8px] font-semibold uppercase leading-none tracking-widest text-blue-600 md:px-2 md:text-[9px]">
                          {s.trend}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide bg-transparent">
            <div className="px-4 py-6 md:px-10 lg:px-12">
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                    <h3 className="text-sm font-semibold tracking-tight text-[#1d1d1f] md:text-base">รายการงาน Rework ล่าสุด</h3>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="relative w-full sm:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input type="text" placeholder="ค้นหา..." className="w-full appearance-none rounded-xl border border-white/60 bg-white/90 py-2.5 pl-9 pr-4 text-xs font-medium text-[#1d1d1f] focus:bg-white outline-none shadow-sm" />
                      </div>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold border border-white/45 bg-white/45 text-slate-600 hover:bg-white/60 hover:text-[#1d1d1f] shadow-sm"
                      >
                        <SlidersHorizontal size={14} /> ตัวกรอง
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-1 pb-2 overflow-x-auto scrollbar-hide">
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-slate-500">สถานะ:</span>
                    <button className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold bg-[#1d1d1f] text-white shadow-md border border-transparent">ทั้งหมด <span className="opacity-90 text-[10px]">120</span></button>
                    <button className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold bg-white/45 border border-white/45 text-slate-600 shadow-sm hover:bg-white/60">รอดำเนินการ <span className="opacity-65 text-[10px]">15</span></button>
                    <button className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold bg-white/45 border border-white/45 text-slate-600 shadow-sm hover:bg-white/60">กำลังดำเนินการ <span className="opacity-65 text-[10px]">40</span></button>
                    <button className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold bg-white/45 border border-white/45 text-slate-600 shadow-sm hover:bg-white/60">เสร็จสิ้น <span className="opacity-65 text-[10px]">45</span></button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100 p-2">

                    {/* Row 1 (Completed) */}
                    <div onClick={onNavigate} className="group flex cursor-pointer items-center rounded-lg px-4 py-4 hover:bg-slate-50 active:scale-[0.99]">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-bold text-[#1d1d1f]">เคสตัวอย่างสำหรับ Guide (คลิกเพื่อดูหน้าแก้ไข)</div>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200 font-mono">RT084-2026</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
                          <span className="font-semibold text-slate-700">Gallon 5L (+2 รายการ)</span>
                          <span>&bull;</span>
                          <div className="flex items-center gap-1"><Calendar size={11} /><span className="font-semibold">21 มิ.ย. 69</span></div>
                          <span>&bull;</span>
                          <span>เมื่อวาน</span>
                          <span>&bull;</span>
                          <span>แหล่งที่มา: <span className="font-semibold text-slate-700">Customer</span></span>
                          <span>&bull;</span>
                          <span className="font-semibold text-violet-600">PTT OR</span>
                        </div>
                      </div>
                      <div className="mr-2 sm:mr-6 text-right shrink-0 min-w-[100px] sm:min-w-[130px] flex flex-col items-end">
                        <p className="text-sm font-bold text-[#1d1d1f]">120 กล่อง</p>
                        <div className="w-full mt-1 mb-0.5">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] font-medium text-slate-500">120/120</span>
                            <span className="text-[10px] font-bold text-[#1d1d1f]">100%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500 bg-emerald-500" style={{ width: '100%' }} />
                          </div>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate max-w-full">ฝารั่ว, ฉลากขาด</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-emerald-100/90 text-emerald-950 border-emerald-300/70 shadow-sm shadow-emerald-500/5">
                        เสร็จสิ้น
                      </span>
                    </div>

                    {/* Row 2 (In-Progress) */}
                    <div className="group flex cursor-pointer items-center rounded-lg px-4 py-4 hover:bg-slate-50 active:scale-[0.99]">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-bold text-[#1d1d1f]">เคสผลิตภายใน</div>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200 font-mono">RW112-2026</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
                          <span className="font-semibold text-slate-700">Bottle 1L</span>
                          <span>&bull;</span>
                          <div className="flex items-center gap-1"><Calendar size={11} /><span className="font-semibold">20 มิ.ย. 69</span></div>
                          <span>&bull;</span>
                          <span>2 วันที่แล้ว</span>
                          <span>&bull;</span>
                          <span>แหล่งที่มา: <span className="font-semibold text-slate-700">SFC</span></span>
                        </div>
                      </div>
                      <div className="mr-2 sm:mr-6 text-right shrink-0 min-w-[100px] sm:min-w-[130px] flex flex-col items-end">
                        <p className="text-sm font-bold text-[#1d1d1f]">45 กล่อง</p>
                        <div className="w-full mt-1 mb-0.5">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] font-medium text-slate-500">25/45</span>
                            <span className="text-[10px] font-bold text-[#1d1d1f]">55%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500 bg-sky-500" style={{ width: '55%' }} />
                          </div>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate max-w-full">คราบสกปรก</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-sky-100/90 text-sky-950 border-sky-300/70 shadow-sm shadow-sky-500/5">กำลังดำเนินการ</span>
                    </div>

                    {/* Row 3 (Pending - Warning) */}
                    <div className="group flex cursor-pointer items-center rounded-lg px-4 py-4 hover:bg-slate-50 active:scale-[0.99] bg-amber-50/50">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-bold text-[#1d1d1f]">งานค้างเตือน</div>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200 font-mono">RT099-2026</span>
                          <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <Clock size={12} /><span>7 วัน</span>
                          </div>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
                          <span className="font-semibold text-slate-700">Gallon 5L</span>
                          <span>&bull;</span>
                          <div className="flex items-center gap-1"><Calendar size={11} /><span className="font-semibold">14 มิ.ย. 69</span></div>
                          <span>&bull;</span>
                          <span>7 วันที่แล้ว</span>
                          <span>&bull;</span>
                          <span>แหล่งที่มา: <span className="font-semibold text-slate-700">Customer</span></span>
                        </div>
                      </div>
                      <div className="mr-2 sm:mr-6 text-right shrink-0 min-w-[100px] sm:min-w-[130px] flex flex-col items-end">
                        <p className="text-sm font-bold text-[#1d1d1f]">20 กล่อง</p>
                        <div className="w-full mt-1 mb-0.5">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] font-medium text-slate-500">0/20</span>
                            <span className="text-[10px] font-bold text-[#1d1d1f]">0%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500 bg-[#1d1d1f]" style={{ width: '0%' }} />
                          </div>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate max-w-full">ฝารั่ว</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-amber-100/90 text-amber-900 border-amber-300/70 shadow-sm shadow-amber-500/5">รอดำเนินการ</span>
                    </div>

                    {/* Row 4 (Pending - Danger) */}
                    <div className="group flex cursor-pointer items-center rounded-lg px-4 py-4 hover:bg-slate-50 active:scale-[0.99] bg-red-50/50">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-bold text-[#1d1d1f]">RT055-2026</div>
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200 font-mono">RT055-2026</span>
                          <div className="flex items-center gap-1 text-xs font-semibold text-red-600">
                            <AlertCircle size={12} /><span>เกิน 30 วัน</span>
                          </div>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
                          <span className="font-semibold text-slate-700">Cap Type B</span>
                          <span>&bull;</span>
                          <div className="flex items-center gap-1"><Calendar size={11} /><span className="font-semibold">05 พ.ค. 69</span></div>
                          <span>&bull;</span>
                          <span>48 วันที่แล้ว</span>
                          <span>&bull;</span>
                          <span>แหล่งที่มา: <span className="font-semibold text-slate-700">Customer</span></span>
                        </div>
                      </div>
                      <div className="mr-2 sm:mr-6 text-right shrink-0 min-w-[100px] sm:min-w-[130px] flex flex-col items-end">
                        <p className="text-sm font-bold text-[#1d1d1f]">10 กล่อง</p>
                        <div className="w-full mt-1 mb-0.5">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-[10px] font-medium text-slate-500">0/10</span>
                            <span className="text-[10px] font-bold text-[#1d1d1f]">0%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500 bg-[#1d1d1f]" style={{ width: '0%' }} />
                          </div>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate max-w-full">สีถลอก</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-red-100/90 text-red-950 border-red-300/70 shadow-sm shadow-red-500/5">รอดำเนินการ</span>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// 3. Mock Update Modal (CaseUpdateView layout with Sidebar & Interactive Simulation)
export function MockUpdateModal({
  onNavigate,
  simulationTrigger,
  onSimulationComplete
}: {
  onNavigate?: () => void;
  simulationTrigger?: number;
  onSimulationComplete?: () => void;
}) {
  const [simStep, setSimStep] = useState<number>(0);
  const [completedItem1, setCompletedItem1] = useState<number>(0);
  const [completedItem2, setCompletedItem2] = useState<number>(0);
  const [globalInputVal, setGlobalInputVal] = useState<string>('');
  const [missingBoxesVal, setMissingBoxesVal] = useState<number>(2);
  const [statusVal, setStatusVal] = useState<'Pending' | 'In-Progress' | 'Completed'>('Pending');
  const [isMaxPressed, setIsMaxPressed] = useState<boolean>(false);
  const [isEditingItem1, setIsEditingItem1] = useState<boolean>(false);
  const [item1Photos, setItem1Photos] = useState<Array<{ id: string; label: string; previewColor: string; iconType: string }>>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isObstaclesOpen, setIsObstaclesOpen] = useState<boolean>(true);
  const [isExportingSim, setIsExportingSim] = useState<boolean>(false);
  const [exportProgressSim, setExportProgressSim] = useState<string>('');
  const [showExportToast, setShowExportToast] = useState<boolean>(false);
  const [isExportBtnGlowing, setIsExportBtnGlowing] = useState<boolean>(false);
  const [showExcelPreviewModal, setShowExcelPreviewModal] = useState<boolean>(false);

  const totalBoxes = 13;
  const globalCompleted = completedItem1 + completedItem2;
  const completionPercentage = Math.round((globalCompleted / totalBoxes) * 100);

  // Manual Photo toggle
  const handleToggleAddPhoto = () => {
    if (item1Photos.length >= 2) {
      setItem1Photos([]);
    } else {
      setItem1Photos([
        { id: 'p1', label: 'ฝารั่วซึม', previewColor: 'from-amber-100 to-amber-200', iconType: 'leak' },
        { id: 'p2', label: 'ป้าย Lot No.', previewColor: 'from-blue-100 to-slate-200', iconType: 'label' }
      ]);
    }
  };

  const handleTriggerExport = () => {
    if (isExportingSim) return;
    setIsExportingSim(true);
    setExportProgressSim('กำลังดึงรูปภาพหลักฐานและจัดโครงสร้างตาราง Excel...');
    setTimeout(() => {
      setIsExportingSim(false);
      setShowExportToast(true);
      setShowExcelPreviewModal(true);
      setTimeout(() => setShowExportToast(false), 3500);
    }, 1600);
  };

  const prevSimTriggerRef = useRef(simulationTrigger);
  useEffect(() => {
    if (!simulationTrigger || simulationTrigger <= 0 || simulationTrigger === prevSimTriggerRef.current) {
      prevSimTriggerRef.current = simulationTrigger;
      return;
    }
    prevSimTriggerRef.current = simulationTrigger;

    let isCancelled = false;

    const runStepSim = async () => {
      // ----------------------------------------------------
      // Step 1: Initial Review (Pending, 0/13, Blocker: 2, No Photos)
      // ----------------------------------------------------
      setSimStep(1);
      setCompletedItem1(0);
      setCompletedItem2(0);
      setGlobalInputVal('');
      setMissingBoxesVal(2);
      setStatusVal('Pending');
      setIsMaxPressed(false);
      setItem1Photos([]);
      setIsUploadingPhoto(false);
      setIsExportBtnGlowing(false);
      setIsExportingSim(false);
      setShowExportToast(false);
      setShowExcelPreviewModal(false);

      await new Promise(r => setTimeout(r, 1200));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 2: Simulate Evidence Photo Upload
      // ----------------------------------------------------
      setSimStep(2);
      setIsUploadingPhoto(true);

      await new Promise(r => setTimeout(r, 700));
      if (isCancelled) return;

      setIsUploadingPhoto(false);
      setItem1Photos([
        { id: 'p1', label: 'ฝารั่วซึม', previewColor: 'from-amber-100 to-amber-200', iconType: 'leak' },
        { id: 'p2', label: 'ป้าย Lot No.', previewColor: 'from-blue-100 to-slate-200', iconType: 'label' }
      ]);

      await new Promise(r => setTimeout(r, 1400));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 3: Highlight Global Progress & Click Max Button
      // ----------------------------------------------------
      setSimStep(3);
      setIsMaxPressed(true);

      await new Promise(r => setTimeout(r, 600));
      if (isCancelled) return;

      setGlobalInputVal('13');

      await new Promise(r => setTimeout(r, 1100));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 4: Distribute Progress to Items (1/1 & 12/12)
      // ----------------------------------------------------
      setSimStep(4);
      setIsMaxPressed(false);
      setCompletedItem1(1);
      setCompletedItem2(12);
      setStatusVal('In-Progress');

      await new Promise(r => setTimeout(r, 1600));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 5: Dynamic Auto-Status Completed & Clear Blockers
      // ----------------------------------------------------
      setSimStep(5);
      setStatusVal('Completed');
      setMissingBoxesVal(0);

      await new Promise(r => setTimeout(r, 1800));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 6: Highlight Export Button & Trigger Excel Generation
      // ----------------------------------------------------
      setSimStep(6);
      setIsExportBtnGlowing(true);

      await new Promise(r => setTimeout(r, 1000));
      if (isCancelled) return;

      setIsExportBtnGlowing(false);
      setIsExportingSim(true);
      setExportProgressSim('กำลังดึงรูปภาพหลักฐานและจัดโครงสร้างตาราง Excel...');

      await new Promise(r => setTimeout(r, 1200));
      if (isCancelled) return;

      setExportProgressSim('บีบอัดรูปภาพและฝังลงในเซลล์รายงาน (Row Height: 120px)...');

      await new Promise(r => setTimeout(r, 1100));
      if (isCancelled) return;

      setIsExportingSim(false);
      setShowExportToast(true);
      setShowExcelPreviewModal(true);

      await new Promise(r => setTimeout(r, 3200));
      if (isCancelled) return;

      setShowExportToast(false);
      setSimStep(0);
      if (onSimulationComplete) {
        onSimulationComplete();
      }
    };

    runStepSim();

    return () => {
      isCancelled = true;
    };
  }, [simulationTrigger, onSimulationComplete]);

  const handleAction = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#F5F5F7] text-[#1d1d1f] font-sans pointer-events-auto">
      {/* Sidebar (MainLayout) */}
      <aside className="hidden lg:flex w-[240px] flex-col border-r border-slate-200 bg-white px-5 py-6 shadow-sm shrink-0 z-40 justify-between">
        <div>
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="w-9 h-9 flex items-center justify-center overflow-hidden rounded-lg bg-red-50 border border-red-200 p-1">
              <span className="text-red-600 font-bold text-xs">SFC</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-[#1d1d1f] uppercase leading-tight">QSMS REWORK</h1>
            </div>
          </div>
          <nav className="space-y-1">
            <button className="sidebar-item mb-1.5 flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all duration-200 bg-blue-50 text-blue-600">
              <LayoutDashboard size={15} /> <span>ภาพรวม (Overall)</span>
            </button>
            <button className="sidebar-item mb-1.5 flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800">
              <Plus size={15} /> <span>เพิ่มงานใหม่ (Add Case)</span>
            </button>
            <button className="sidebar-item mb-1.5 flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800">
              <ChevronLeft size={15} /> <span>กลับหน้าพอร์ทัล</span>
            </button>
            <button className="sidebar-item mb-1.5 flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800">
              <HelpCircle size={15} /> <span>คู่มือการใช้งาน</span>
            </button>
            <button className="sidebar-item mb-1.5 flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800">
              <Bot size={15} /> <span>DocAI Assistant</span>
            </button>
            <button className="sidebar-item mb-1.5 flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800">
              <Activity size={15} /> <span>แดชบอร์ด (Dashboard)</span>
            </button>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
              O
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">Ome</p>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.2 rounded">QSMS</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Top Header Bar */}
        <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleAction}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 cursor-pointer"
              title="ย้อนกลับ"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <h1 className="text-base font-bold text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                  <PenTool size={16} className="text-blue-600 shrink-0" />
                  <span>จัดการงาน Rework</span>
                </h1>
                <motion.span
                  animate={simStep === 5 ? { scale: [1, 1.12, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider whitespace-nowrap shrink-0 transition-all duration-500 ${
                    statusVal === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/30'
                      : statusVal === 'In-Progress'
                      ? 'bg-sky-100 text-sky-800 border-sky-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />
                  {statusVal === 'Completed'
                    ? 'เสร็จสิ้น (COMPLETED)'
                    : statusVal === 'In-Progress'
                    ? 'กำลังดำเนินการ (IN-PROGRESS)'
                    : 'รอดำเนินการ (PENDING)'}
                </motion.span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-mono whitespace-nowrap">
                <span>RT147 2026</span>
                <Copy size={11} className="text-slate-400 cursor-pointer hover:text-slate-600" />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Export to Excel Button with Live Simulation / Click Feedback */}
            <motion.button
              type="button"
              onClick={handleTriggerExport}
              animate={isExportBtnGlowing || simStep === 6 ? {
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 0 0 rgba(16, 185, 129, 0)',
                  '0 0 16px rgba(16, 185, 129, 0.6)',
                  '0 0 0 rgba(16, 185, 129, 0)'
                ]
              } : {}}
              transition={{ repeat: Infinity, duration: 1 }}
              className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all border flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isExportBtnGlowing || simStep === 6
                  ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-400'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
              }`}
            >
              <FileSpreadsheet size={13} className={isExportBtnGlowing || simStep === 6 ? 'text-white' : 'text-emerald-600'} />
              <span>ส่งออก Excel</span>
            </motion.button>

            <button
              type="button"
              className="whitespace-nowrap shrink-0 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-all border border-red-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} /> <span>ลบเคสนี้</span>
            </button>
            <button
              type="button"
              onClick={handleAction}
              className="whitespace-nowrap shrink-0 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
            >
              <span>บันทึกร่าง (Draft)</span>
            </button>
            <button
              type="button"
              onClick={handleAction}
              className="whitespace-nowrap shrink-0 px-4 py-1.5 text-xs font-bold text-white bg-[#1d1d1f] hover:bg-black rounded-full shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={13} /> <span>บันทึกและเสร็จสิ้น</span>
            </button>
          </div>
        </header>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {/* SECTION 1: Overall Progress */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-600" />
                  ความคืบหน้าการทำงานรวม (Overall Progress)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  ยอดเสร็จสิ้นปัจจุบัน: <span className="font-bold text-blue-600">{globalCompleted}</span> จากทั้งหมด <span className="font-bold">{totalBoxes}</span> กล่อง ({completionPercentage}%)
                </p>
              </div>

              {/* Quick Global Progress Input */}
              <div className={`flex items-center gap-2 p-1.5 rounded-xl transition-all duration-300 ${simStep === 3 ? 'bg-blue-50 ring-2 ring-blue-400' : ''}`}>
                <input
                  type="number"
                  min="0"
                  max={totalBoxes}
                  placeholder="ระบุยอดรวมที่เสร็จแล้ว..."
                  className="w-44 border border-slate-200 bg-slate-50 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  value={globalInputVal || (globalCompleted > 0 ? globalCompleted : '')}
                  readOnly
                />
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                    isMaxPressed
                      ? 'bg-blue-600 text-white scale-105 shadow-md shadow-blue-500/20'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  เสร็จทั้งหมด
                </button>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <motion.div
                initial={false}
                animate={{ width: `${Math.min(100, completionPercentage)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full rounded-full transition-colors duration-500 ${
                  completionPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
              />
            </div>
          </div>

          {/* SECTION 2: Material Shortage Blockers Banner (Collapsible Accordion) */}
          <div className="bg-[#fff9eb] border border-amber-200/80 rounded-2xl overflow-hidden shadow-sm transition-all">
            {/* Accordion Header Toggle */}
            <button
              type="button"
              onClick={() => setIsObstaclesOpen(!isObstaclesOpen)}
              className="w-full px-5 py-3 flex items-center justify-between gap-3 text-left hover:bg-amber-100/50 transition-colors cursor-pointer select-none"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700">
                  <AlertCircle size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-amber-900">
                      รายงานอุปสรรค / วัสดุที่ขาดในกระบวนการ Rework
                    </h4>
                    <span className="text-[10px] text-amber-700/80 font-medium hidden sm:inline">
                      (รายละเอียดเพิ่มเติม / ไม่บังคับ)
                    </span>
                  </div>
                  {missingBoxesVal > 0 && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.2 rounded border border-amber-300">
                        มีบันทึกวัสดุที่ขาด: กล่อง {missingBoxesVal} ใบ
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold">
                <span>{isObstaclesOpen ? 'ย่อซ่อน' : 'คลิกเพื่อระบุ'}</span>
                <motion.div animate={{ rotate: isObstaclesOpen ? 180 : 0 }}>
                  <ChevronDown size={15} />
                </motion.div>
              </div>
            </button>

            {/* Collapsible Fields */}
            <AnimatePresence initial={false}>
              {isObstaclesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 pt-1 border-t border-amber-200/60 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-amber-700 font-medium">
                      <span>กรอกจำนวนวัสดุที่ขาดเพื่อให้ทีมที่เกี่ยวข้องเตรียมความพร้อม</span>
                      <span>(จะล้างข้อมูลอัตโนมัติเมื่อเคสเสร็จสิ้น 100%)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-amber-800 mb-1">ขาดกล่อง (ใบ)</label>
                        <input
                          type="number"
                          readOnly
                          value={missingBoxesVal}
                          className="w-full border border-amber-200 bg-white rounded-lg py-1.5 px-3 text-xs font-semibold text-amber-900 focus:outline-none shadow-2xs"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-amber-800 mb-1">ขาดแกลลอน (ใบ)</label>
                        <input
                          type="number"
                          readOnly
                          value={0}
                          className="w-full border border-amber-200 bg-white rounded-lg py-1.5 px-3 text-xs font-semibold text-amber-900 focus:outline-none shadow-2xs"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-amber-800 mb-1">ขาดน้ำมัน (ลิตร/ถัง)</label>
                        <input
                          type="number"
                          readOnly
                          value={0}
                          className="w-full border border-amber-200 bg-white rounded-lg py-1.5 px-3 text-xs font-semibold text-amber-900 focus:outline-none shadow-2xs"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SECTION 3: Item Workspace */}
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200 text-slate-800">
            <Package size={17} className="text-blue-600" />
            <span className="text-sm font-bold">รายการสินค้า (9)</span>
          </div>

          {/* Item 1 Card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
            {/* Header */}
            <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center flex-wrap gap-2">
                <span className={`w-2 h-2 rounded-full ${completedItem1 >= 1 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1">
                  <span>รายการที่ 1: PTT LIMITED SLIP GEAR OIL 80W-90 NP (10/1L)(404261) (404261)</span>
                  <span className="text-slate-500 font-mono">({completedItem1} / 1 กล่อง)</span>
                </span>
                {item1Photos.length > 0 ? (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-400/20"
                  >
                    <CheckCircle2 size={11} className="text-emerald-600" />
                    <span>แนบรูปแล้ว ({item1Photos.length})</span>
                  </motion.span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertCircle size={10} className="text-amber-600" />
                    <span>ยังไม่แนบรูปหลักฐาน</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingItem1(!isEditingItem1)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  <Edit3 size={11} className="text-slate-500" />
                  <span>แก้ไขข้อมูล</span>
                </button>
                <div className="h-3.5 w-[1px] bg-slate-200 mx-1 hidden sm:block" />
                <label className="text-xs font-semibold text-slate-500">ยอดเสร็จ:</label>
                <input
                  type="number"
                  readOnly
                  value={completedItem1 || ''}
                  className="w-16 border border-slate-200 bg-white rounded-lg py-0.5 px-2 text-xs font-bold text-center focus:outline-none"
                />
                <button
                  type="button"
                  className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 size={11} />
                  เสร็จแล้ว
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Left data card */}
                <div className="flex-1 space-y-2.5 min-w-0">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      ชื่อสินค้า / ITEM NAME
                    </span>
                    <p className="text-xs font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80">
                      PTT LIMITED SLIP GEAR OIL 80W-90 NP (10/1L)(404261)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">รหัสสินค้า / CODE</span>
                      <span className="text-xs font-bold text-blue-600 mt-0.5 block font-mono">404261</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">ลูกค้า / CUSTOMER</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 block">OR</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">จำนวนทั้งหมด</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 block">1 ลัง/กล่อง</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">BATCH NO.</span>
                      <span className="text-xs font-semibold text-slate-800 mt-0.5 block font-mono">09/05/2026</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">MOLD</span>
                      <span className="text-xs font-semibold text-slate-800 mt-0.5 block font-mono">9</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">LINE</span>
                      <span className="text-xs font-semibold text-slate-500 italic mt-0.5 block">ไม่ได้ระบุ</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">อาการเสีย / รายละเอียดการวิเคราะห์</span>
                    <p className="text-xs font-medium text-slate-800">
                      รั่วซึมฝายอด 1 ขวด
                    </p>
                  </div>
                </div>

                {/* Right photo box */}
                <div className={`lg:w-[240px] shrink-0 rounded-xl p-3.5 border transition-all duration-500 ${
                  simStep === 2
                    ? 'bg-blue-50/70 border-blue-400 ring-4 ring-blue-500/25 shadow-md shadow-blue-500/10'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Camera size={12} className={item1Photos.length > 0 ? 'text-emerald-600' : 'text-slate-400'} /> รูปภาพหลักฐานหลังวิเคราะห์
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full transition-colors ${
                        item1Photos.length > 0
                          ? 'text-emerald-700 bg-emerald-100 border border-emerald-200'
                          : 'text-slate-600 bg-slate-200'
                      }`}>
                        {item1Photos.length} รูป
                      </span>
                    </div>

                    {isUploadingPhoto ? (
                      <div className="h-24 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/60 flex flex-col items-center justify-center text-blue-600 animate-pulse">
                        <RefreshCw size={18} className="animate-spin mb-1 text-blue-500" />
                        <span className="text-[10px] font-bold">กำลังอัปโหลดรูปภาพ...</span>
                      </div>
                    ) : item1Photos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-1.5">
                        {item1Photos.map((photo, pIdx) => (
                          <motion.div
                            key={photo.id}
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3, delay: pIdx * 0.1 }}
                            className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-br shadow-2xs flex flex-col items-center justify-center p-1"
                          >
                            <div className={`w-full h-full rounded bg-gradient-to-br ${photo.previewColor} flex flex-col items-center justify-center text-slate-700`}>
                              <Camera size={16} className="text-slate-600 mb-0.5" />
                              <span className="text-[8px] font-bold text-slate-800 tracking-tight text-center leading-none px-0.5 truncate w-full">
                                {photo.label}
                              </span>
                            </div>
                            <div className="absolute top-0.5 right-0.5 bg-blue-600 text-white text-[8px] px-1 py-0.2 rounded font-black tracking-wider leading-none shadow-2xs">
                              NEW
                            </div>
                          </motion.div>
                        ))}
                        {/* Slot 3: Upload button */}
                        <div
                          onClick={handleToggleAddPhoto}
                          className="aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/40 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          <Plus size={16} />
                          <span className="text-[9px] font-semibold">เพิ่มรูป</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={handleToggleAddPhoto}
                        className="h-24 rounded-lg border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer group"
                      >
                        <Plus size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-semibold text-slate-500 group-hover:text-blue-600">+ เพิ่มรูป</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Item Bottom Bar */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-slate-400">
                <button type="button" className="p-1 hover:text-red-500 transition-colors">
                  <Trash2 size={13} />
                </button>
                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 cursor-pointer hover:text-slate-800">
                  <span>กรอกรายละเอียดเพิ่มเติม (สภาพถุง, ผู้รับผิดชอบ)</span>
                  <ChevronDown size={12} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Overlay in Simulation */}
        <AnimatePresence>
          {isExportingSim && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-5 max-w-xs w-full text-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileSpreadsheet size={22} className="text-emerald-600 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">กำลังเตรียมเอกสาร Excel...</h4>
                  <p className="text-xs text-slate-500 font-thai leading-relaxed">{exportProgressSim}</p>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '15%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.2, ease: 'easeInOut' }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Download Success Toast in Simulation */}
        <AnimatePresence>
          {showExportToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-900 text-white rounded-2xl shadow-2xl border border-emerald-700/80 font-sans max-w-md"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold font-mono text-emerald-300">ดาวน์โหลดสำเร็จ (Download Complete)</div>
                <div className="text-xs text-white font-thai mt-0.5">บันทึกไฟล์ QSMS_Rework_RT147-2026.xlsx พร้อมรูปภาพหลักฐานแล้ว</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Excel Spreadsheet Form Preview Modal */}
        <AnimatePresence>
          {showExcelPreviewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExcelPreviewModal(false)}
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden text-left"
              >
                {/* Excel Ribbon Window Bar */}
                <div className="bg-[#107C41] px-5 py-3 text-white flex items-center justify-between shrink-0 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs">
                      <FileSpreadsheet size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono tracking-tight flex items-center gap-2">
                        <span>QSMS_Rework_RT147-2026.xlsx</span>
                        <span className="px-1.5 py-0.2 text-[10px] bg-emerald-800/80 rounded font-sans text-emerald-200">ตัวอย่างเอกสารส่งออกจริง</span>
                      </div>
                      <div className="text-[10px] text-emerald-100 font-thai">Microsoft Excel Spreadsheet (.xlsx) • ฝังรูปภาพหลักฐานในเซลล์</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowExcelPreviewModal(false)}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white cursor-pointer"
                      title="ปิดหน้าต่างตัวอย่าง (Close Preview)"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Spreadsheet Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 bg-slate-100/70 space-y-4">
                  {/* Paper Canvas */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-5">
                    {/* Header in Excel */}
                    <div className="flex items-start justify-between border-b-2 border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center font-bold text-red-600 text-sm">
                          SFC
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            รายงานการแก้ไขงาน (Rework Report)
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            ระบบบริหารจัดการคุณภาพ • Quality Management System
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          เสร็จสิ้น (COMPLETED)
                        </span>
                        <p className="text-xs font-mono text-slate-500 mt-1 font-semibold">
                          รหัสเคส: RT147-2026
                        </p>
                      </div>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">แหล่งที่มา (Source)</span>
                        <span className="font-bold text-slate-800">SFC</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">วันที่รายงาน</span>
                        <span className="font-bold text-slate-800">19 ส.ค. 2026</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">จำนวนรายการ</span>
                        <span className="font-bold text-slate-800">2 รายการ</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">ยอดผลิตสำเร็จ</span>
                        <span className="font-bold text-emerald-600 font-mono">13 / 13 กล่อง (100%)</span>
                      </div>
                    </div>

                    {/* Excel Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-[#107C41] text-white font-bold text-[11px]">
                            <th className="py-2.5 px-3 border border-emerald-800 text-center w-12">ลำดับ</th>
                            <th className="py-2.5 px-3 border border-emerald-800 w-24">รหัสสินค้า</th>
                            <th className="py-2.5 px-3 border border-emerald-800 min-w-[200px]">ชื่อสินค้า / รายการ</th>
                            <th className="py-2.5 px-3 border border-emerald-800 w-24 text-center">Batch No.</th>
                            <th className="py-2.5 px-3 border border-emerald-800 w-28">สาเหตุ</th>
                            <th className="py-2.5 px-3 border border-emerald-800 text-center w-24">ยอดผลิตเสร็จ</th>
                            <th className="py-2.5 px-3 border border-emerald-800 text-center w-52 bg-emerald-800">
                              รูปภาพหลักฐาน (ฝังในเซลล์)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {/* Item 1 */}
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 border border-slate-200 text-center font-bold text-slate-700">1</td>
                            <td className="py-3 px-3 border border-slate-200 font-mono font-bold text-blue-600">404261</td>
                            <td className="py-3 px-3 border border-slate-200 font-medium text-slate-900">
                              PTT LIMITED SLIP GEAR OIL 80W-90 NP (10/1L)
                              <div className="text-[10px] text-slate-400 mt-0.5">ลูกค้า: OR | Mold: 9</div>
                            </td>
                            <td className="py-3 px-3 border border-slate-200 font-mono text-center text-slate-700">09/05/2026</td>
                            <td className="py-3 px-3 border border-slate-200 text-amber-700 font-medium">รั่ว:ฝารั่วซึม</td>
                            <td className="py-3 px-3 border border-slate-200 text-center font-bold text-emerald-700 font-mono">
                              1 / 1 ลัง
                            </td>
                            <td className="py-2 px-3 border border-slate-200 bg-emerald-50/30">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-20 h-16 rounded border border-amber-300 bg-amber-100 flex flex-col items-center justify-center p-1 shadow-2xs">
                                  <Camera size={14} className="text-amber-700 mb-0.5" />
                                  <span className="text-[8px] font-bold text-amber-900 text-center leading-none truncate w-full">ฝารั่วซึม</span>
                                </div>
                                <div className="w-20 h-16 rounded border border-blue-300 bg-blue-100 flex flex-col items-center justify-center p-1 shadow-2xs">
                                  <Camera size={14} className="text-blue-700 mb-0.5" />
                                  <span className="text-[8px] font-bold text-blue-900 text-center leading-none truncate w-full">ป้าย Lot No.</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                          {/* Item 2 */}
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 border border-slate-200 text-center font-bold text-slate-700">2</td>
                            <td className="py-3 px-3 border border-slate-200 font-mono font-bold text-blue-600">404262</td>
                            <td className="py-3 px-3 border border-slate-200 font-medium text-slate-900">
                              DYNAMIC PREMIER 15W-40 (6L)
                              <div className="text-[10px] text-slate-400 mt-0.5">ลูกค้า: SFC | Line: 2</div>
                            </td>
                            <td className="py-3 px-3 border border-slate-200 font-mono text-center text-slate-700">11/05/2026</td>
                            <td className="py-3 px-3 border border-slate-200 text-amber-700 font-medium">เปื้อน:กล่องชำรุด</td>
                            <td className="py-3 px-3 border border-slate-200 text-center font-bold text-emerald-700 font-mono">
                              12 / 12 ลัง
                            </td>
                            <td className="py-2 px-3 border border-slate-200 bg-emerald-50/30">
                              <div className="flex items-center justify-center">
                                <div className="w-20 h-16 rounded border border-slate-300 bg-slate-100 flex flex-col items-center justify-center p-1 shadow-2xs">
                                  <Camera size={14} className="text-slate-600 mb-0.5" />
                                  <span className="text-[8px] font-bold text-slate-800 text-center leading-none truncate w-full">กล่องชำรุด</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-300">
                            <td colSpan={5} className="py-2.5 px-3 text-right">รวมยอดผลิตสำเร็จทั้งหมด:</td>
                            <td className="py-2.5 px-3 text-center text-emerald-700 font-mono text-xs">13 / 13 กล่อง (100%)</td>
                            <td className="py-2.5 px-3 text-center text-[10px] text-slate-500 font-thai">หลักฐานครบ 3 รูป</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 font-thai">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>รูปภาพหลักฐานฝังลงในเซลล์ Excel อัตโนมัติ (Row Height: 120px) เปิดอ่านได้แบบออฟไลน์ 100%</span>
                  </div>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setShowExcelPreviewModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                    >
                      ปิดตัวอย่าง (Close Preview)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExcelPreviewModal(false);
                        setShowExportToast(true);
                        setTimeout(() => setShowExportToast(false), 3000);
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#107C41] hover:bg-emerald-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>ดาวน์โหลดไฟล์ .xlsx</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// 3.5 Mock Mobile FastTrack (Interactive Simulation + Live Sync to Desktop Form)
export function MockMobileFastTrack({
  onNavigate,
  simulationTrigger,
  onSimulationComplete
}: {
  onNavigate?: () => void;
  simulationTrigger?: number;
  onSimulationComplete?: () => void;
}) {
  const [simStep, setSimStep] = useState<number>(0);
  const [phoneSource, setPhoneSource] = useState<'SFC' | 'Customer'>('SFC');
  const [phoneCaseId, setPhoneCaseId] = useState<string>('012');
  const [phoneTab, setPhoneTab] = useState<'entry' | 'queue'>('entry');
  const [phoneItemNumber, setPhoneItemNumber] = useState<string>('');
  const [phoneItemCode, setPhoneItemCode] = useState<string>('');
  const [phoneItemName, setPhoneItemName] = useState<string>('');
  const [phoneAmount, setPhoneAmount] = useState<number>(1);
  const [phoneReason, setPhoneReason] = useState<string>('รั่ว:รั่วซึมฝายอด');
  const [phonePhotos, setPhonePhotos] = useState<Array<{ id: string; label: string; watermark: string; previewColor: string }>>([]);
  const [phoneQueue, setPhoneQueue] = useState<Array<{ id: string; itemNumber: string; itemCode: string; itemName: string; amount: number; reason: string; photosCount: number }>>([]);
  const [phoneToast, setPhoneToast] = useState<string | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isDesktopPopulated, setIsDesktopPopulated] = useState<boolean>(false);

  const resetPhoneForm = () => {
    setPhoneItemNumber('');
    setPhoneItemCode('');
    setPhoneItemName('');
    setPhoneAmount(1);
    setPhoneReason('รั่ว:รั่วซึมฝายอด');
    setPhonePhotos([]);
  };

  // Manual Photo Capture
  const handleTakePhoto = () => {
    if (phonePhotos.length > 0) {
      setPhonePhotos([]);
    } else {
      setPhonePhotos([
        {
          id: 'ft-p1',
          label: 'ฝารั่วซึม',
          watermark: '📍 Plant 1, Line 3 | 18 ส.ค. 2569 14:00',
          previewColor: 'from-amber-100 to-amber-200'
        }
      ]);
    }
  };

  // Manual Queue Add
  const handleAddToQueue = () => {
    const currentNum = phoneItemNumber || '61653013A700A';
    const currentCode = phoneItemCode || '404261';
    const currentName = phoneItemName || 'PTT LIMITED SLIP GEAR OIL 80W-90 NP (10/1L)(404261)';
    const currentPhotos = phonePhotos.length > 0 ? phonePhotos : [
      {
        id: 'ft-p1',
        label: 'ฝารั่วซึม',
        watermark: '📍 Plant 1, Line 3 | 18 ส.ค. 2569 14:00',
        previewColor: 'from-amber-100 to-amber-200'
      }
    ];

    const newItem = {
      id: `queue-${Date.now()}`,
      itemNumber: currentNum,
      itemCode: currentCode,
      itemName: currentName,
      amount: phoneAmount || 1,
      reason: phoneReason || 'รั่ว:รั่วซึมฝายอด',
      photosCount: currentPhotos.length
    };

    setPhoneQueue([...phoneQueue, newItem]);
    resetPhoneForm();
    setPhoneToast('บันทึกไอเทมลงคิวแล้ว ✓');
    setTimeout(() => setPhoneToast(null), 2500);
  };

  // Manual Submit All to Desktop
  const handleSubmitAll = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setIsDesktopPopulated(true);
      setPhoneQueue([]);
      setPhoneTab('entry');
      setPhoneToast('ส่งข้อมูลเข้าเคสหลักสำเร็จ! ✨');
      setTimeout(() => setPhoneToast(null), 3000);
    }, 800);
  };

  // Automated Simulation Timeline
  const prevSimTriggerRef = useRef(simulationTrigger);
  useEffect(() => {
    if (!simulationTrigger || simulationTrigger <= 0 || simulationTrigger === prevSimTriggerRef.current) {
      prevSimTriggerRef.current = simulationTrigger;
      return;
    }
    prevSimTriggerRef.current = simulationTrigger;

    let isCancelled = false;

    const runSim = async () => {
      // ----------------------------------------------------
      // Step 1: Initial State & Bind Case Number
      // ----------------------------------------------------
      setSimStep(1);
      setIsDesktopPopulated(false);
      setPhoneTab('entry');
      setPhoneSource('SFC');
      setPhoneCaseId('012');
      setPhoneItemNumber('');
      setPhoneItemCode('');
      setPhoneItemName('');
      setPhonePhotos([]);
      setPhoneQueue([]);
      setPhoneToast(null);

      await new Promise(r => setTimeout(r, 1200));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 2: Auto-Fill Item Details & Verification
      // ----------------------------------------------------
      setSimStep(2);
      setPhoneItemNumber('61653013A700A');
      setPhoneToast('กำลังค้นหาข้อมูลจาก Item Master...');

      await new Promise(r => setTimeout(r, 800));
      if (isCancelled) return;

      setPhoneItemCode('404261');
      setPhoneItemName('PTT LIMITED SLIP GEAR OIL 80W-90 NP (10/1L)(404261)');
      setPhoneAmount(1);
      setPhoneReason('รั่ว:รั่วซึมฝายอด');
      setPhoneToast('พบข้อมูลสินค้าและตรวจสอบถูกต้องแล้ว ✓');

      await new Promise(r => setTimeout(r, 1500));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 3: Camera Capture & Auto-Watermark
      // ----------------------------------------------------
      setSimStep(3);
      setPhoneToast(null);
      setIsTakingPhoto(true);

      await new Promise(r => setTimeout(r, 700));
      if (isCancelled) return;

      setIsTakingPhoto(false);
      setPhonePhotos([
        {
          id: 'ft-p1',
          label: 'ฝารั่วซึม',
          watermark: '📍 Plant 1, Line 3 | 18 ส.ค. 2569 14:00',
          previewColor: 'from-amber-100 to-amber-200'
        }
      ]);
      setPhoneToast('ถ่ายรูป & ประทับลายน้ำอัตโนมัติสำเร็จ ✓');

      await new Promise(r => setTimeout(r, 1600));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 4: Add to Queue
      // ----------------------------------------------------
      setSimStep(4);
      const queuedItem = {
        id: 'q-1',
        itemNumber: '61653013A700A',
        itemCode: '404261',
        itemName: 'PTT LIMITED SLIP GEAR OIL 80W-90 NP (10/1L)(404261)',
        amount: 1,
        reason: 'รั่ว:รั่วซึมฝายอด',
        photosCount: 1
      };
      setPhoneQueue([queuedItem]);
      resetPhoneForm();
      setPhoneToast('บันทึกไอเทมลงคิวแล้ว (1 รายการ) ✓');

      await new Promise(r => setTimeout(r, 1600));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 5: Switch to Queue Tab & Sync to Desktop Form
      // ----------------------------------------------------
      setSimStep(5);
      setPhoneTab('queue');
      setPhoneToast('กำลังส่งข้อมูลเข้าเคสหลัก...');
      setIsSyncing(true);

      await new Promise(r => setTimeout(r, 1000));
      if (isCancelled) return;

      setIsSyncing(false);
      setIsDesktopPopulated(true);
      setPhoneQueue([]);
      setPhoneTab('entry');
      setPhoneToast('ถ่ายโอนข้อมูลเข้าฟอร์มหลักสำเร็จ! ✨');

      await new Promise(r => setTimeout(r, 3000));
      if (isCancelled) return;

      setSimStep(0);
      setPhoneToast(null);
      if (onSimulationComplete) {
        onSimulationComplete();
      }
    };

    runSim();

    return () => {
      isCancelled = true;
    };
  }, [simulationTrigger, onSimulationComplete]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-100 flex items-center justify-center pointer-events-auto select-none">
      <div className="flex flex-row items-center justify-center gap-6 xl:gap-8 w-[1150px] max-w-none transform scale-[0.52] md:scale-[0.68] xl:scale-[0.82] origin-center">
        
        {/* ========================================================================= */}
        {/* 1. MOBILE PHONE FRAME (iPhone Style) */}
        {/* ========================================================================= */}
        <div
          className={`bg-[#1d1d1f] rounded-[55px] p-3.5 shadow-2xl relative flex-shrink-0 transition-all duration-500 ${
            isSyncing ? 'ring-4 ring-blue-500/40 shadow-blue-500/20' : ''
          }`}
          style={{ width: '420px', height: '880px', transform: 'translateZ(0)' }}
        >
          {/* Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-[80] flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/50 mr-3" />
            <div className="w-2 h-2 rounded-full bg-blue-500/80 animate-pulse" />
          </div>

          {/* Screen Content */}
          <div className="w-full h-full bg-slate-50 rounded-[44px] overflow-hidden relative flex flex-col pt-8">
            
            {/* Phone Header */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                  <Package size={18} />
                </div>
                <div>
                  <h1 className="text-sm font-black leading-tight text-slate-900">Fast-Track</h1>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">ASSISTANT</p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPhoneTab('entry')}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                    phoneTab === 'entry' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => setPhoneTab('queue')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                    phoneTab === 'queue' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>คิว</span>
                  {phoneQueue.length > 0 && (
                    <motion.span
                      initial={{ scale: 0.5 }}
                      animate={{ scale: [1, 1.25, 1] }}
                      className="bg-blue-600 text-white text-[9px] min-w-[16px] h-4 rounded-full flex items-center justify-center font-black"
                    >
                      {phoneQueue.length}
                    </motion.span>
                  )}
                </button>
              </div>
            </header>

            {/* Notification Toast in Phone */}
            <AnimatePresence>
              {phoneToast && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-20 left-4 right-4 z-50 bg-slate-900/95 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 backdrop-blur-sm"
                >
                  <Sparkles size={14} className="text-amber-400 shrink-0" />
                  <span className="truncate">{phoneToast}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab 1: Entry Form */}
            {phoneTab === 'entry' ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                
                {/* Source & Case Binding Card */}
                <div className={`p-4 bg-white border rounded-2xl shadow-xs space-y-3 transition-all duration-300 ${
                  simStep === 1 ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SOURCE</span>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setPhoneSource('SFC')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                          phoneSource === 'SFC' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        SFC
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhoneSource('Customer')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                          phoneSource === 'Customer' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        Customer
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">หมายเลขเคส (Optional)</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                      <span className="bg-slate-200/70 px-3 py-2 text-xs font-mono font-bold text-slate-600 select-none">
                        {phoneSource === 'Customer' ? 'RT' : 'RW'}
                      </span>
                      <input
                        type="text"
                        value={phoneCaseId}
                        onChange={(e) => setPhoneCaseId(e.target.value)}
                        placeholder="012"
                        className="flex-1 px-3 py-2 bg-transparent text-xs font-mono font-bold text-slate-800 outline-none"
                      />
                      <span className="bg-slate-200/70 px-3 py-2 text-xs font-mono font-bold text-slate-600 select-none">
                        -2026
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400">ระบุเฉพาะตัวเลขตรงกลาง (เช่น 012)</p>
                  </div>
                </div>

                {/* Item Details Form */}
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                    <h2 className="text-xs font-bold text-slate-800">ข้อมูลไอเทม</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">ITEM NUMBER</label>
                      <input
                        type="text"
                        value={phoneItemNumber}
                        onChange={(e) => setPhoneItemNumber(e.target.value)}
                        placeholder="61653013A700A"
                        className={`w-full px-2.5 py-2 bg-slate-50 border rounded-lg text-xs font-mono font-bold text-slate-800 outline-none transition-all ${
                          simStep === 2 ? 'border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/30' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">ITEM CODE</label>
                      <input
                        type="text"
                        value={phoneItemCode}
                        onChange={(e) => setPhoneItemCode(e.target.value)}
                        placeholder="404261"
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">ชื่อสินค้า (ITEM NAME)</label>
                    <textarea
                      rows={2}
                      value={phoneItemName}
                      onChange={(e) => setPhoneItemName(e.target.value)}
                      placeholder="PTT LIMITED SLIP GEAR OIL..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">จำนวน (QTY)</label>
                      <input
                        type="number"
                        value={phoneAmount}
                        onChange={(e) => setPhoneAmount(parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">สาเหตุและรูปแบบ</label>
                      <div className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 truncate">
                        {phoneReason}
                      </div>
                    </div>
                  </div>

                  {/* Photo Uploader with Watermark */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">รูปถ่ายหลักฐาน</label>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-full border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[8px] font-bold text-blue-600 uppercase tracking-tight">Auto-Watermark</span>
                      </div>
                    </div>

                    {isTakingPhoto ? (
                      <div className="h-24 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/70 flex flex-col items-center justify-center text-blue-600 animate-pulse">
                        <Camera size={22} className="animate-bounce mb-1" />
                        <span className="text-[10px] font-bold">กำลังประทับลายน้ำและบันทึกภาพ...</span>
                      </div>
                    ) : phonePhotos.length > 0 ? (
                      <div className="space-y-2">
                        {phonePhotos.map((p) => (
                          <motion.div
                            key={p.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-amber-50 to-orange-100 p-3 shadow-2xs"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <Camera size={13} className="text-amber-700" />
                                {p.label}
                              </span>
                              <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded shadow-2xs">
                                WATERMARKED
                              </span>
                            </div>
                            {/* Watermark text stamp */}
                            <div className="bg-black/60 backdrop-blur-xs text-white rounded-md p-1.5 text-[8px] font-mono leading-tight">
                              <p className="font-bold">{p.watermark}</p>
                              <p className="text-slate-300 text-[7px] mt-0.5">QSMS SECURE AUDIT TRAIL</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div
                        onClick={handleTakePhoto}
                        className={`h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400 transition-all cursor-pointer group ${
                          simStep === 3
                            ? 'border-blue-400 bg-blue-50/50 ring-2 ring-blue-500/20'
                            : 'border-slate-300 bg-slate-50 hover:border-blue-400'
                        }`}
                      >
                        <Camera size={20} className="mb-0.5 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-600">+ แตะเพื่อถ่ายรูป / แนบไฟล์</span>
                      </div>
                    )}
                  </div>

                  {/* Add to Queue Button */}
                  <button
                    type="button"
                    onClick={handleAddToQueue}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      simStep === 4
                        ? 'bg-blue-600 text-white scale-[1.02] shadow-blue-500/30 ring-2 ring-blue-400'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Plus size={14} />
                    บันทึกไอเทมลงคิว
                  </button>
                </div>
              </div>
            ) : (
              /* Tab 2: Queue Review */
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-700">รายการในคิว ({phoneQueue.length})</span>
                  <span className="text-[10px] font-semibold text-slate-400">พร้อมส่งเข้าเคสหลัก</span>
                </div>

                {phoneQueue.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Package size={28} className="mx-auto text-slate-300" />
                    <p className="text-xs font-medium">ยังไม่มีรายการในคิว</p>
                  </div>
                ) : (
                  phoneQueue.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">รายการที่ {idx + 1}</span>
                        <span className="text-[10px] font-bold text-blue-600 font-mono">{item.amount} กล่อง</span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 leading-snug">{item.itemName}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                        <span>Code: <b className="font-mono text-slate-700">{item.itemCode}</b></span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={10} /> รูปภาพพร้อม ({item.photosCount})
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}

                {phoneQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSubmitAll}
                    className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 ${
                      simStep === 5 || isSyncing
                        ? 'bg-emerald-600 text-white scale-[1.02] shadow-emerald-500/30 ring-2 ring-emerald-400'
                        : 'bg-[#1d1d1f] hover:bg-black text-white'
                    }`}
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        กำลังส่งข้อมูลเข้าสู่ Desktop...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Submit All Items (สร้าง CASE ทั้งหมด {phoneQueue.length} รายการ)
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Bottom Status / Home Indicator */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-center">
              <div className="w-28 h-1 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SYNC BEAM CONNECTOR (Center visual link) */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-2 px-1">
          <motion.div
            animate={isSyncing ? { scale: [1, 1.25, 1], x: [0, 8, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className={`p-3 rounded-full border transition-all duration-300 ${
              isSyncing
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/40 ring-4 ring-blue-400/30'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            <Zap size={22} className={isSyncing ? 'text-amber-300 animate-pulse' : ''} />
          </motion.div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            {isSyncing ? 'SYNCING...' : 'LIVE SYNC'}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* 3. DESKTOP ADDCSETAB WORKSPACE (Right side) */}
        {/* ========================================================================= */}
        <div
          className={`flex-shrink-0 w-[640px] bg-white rounded-[45px] shadow-2xl overflow-hidden relative border transition-all duration-500 ${
            isDesktopPopulated
              ? 'border-emerald-300 ring-4 ring-emerald-500/20'
              : 'border-slate-200'
          }`}
          style={{ height: '880px', transform: 'translateZ(0)' }}
        >
          <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 space-y-5">
            
            {/* Sync Notification Banner */}
            <AnimatePresence>
              {isDesktopPopulated && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCheck size={18} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold">รับข้อมูลถ่ายโอนจาก Fast-Track Mobile สำเร็จ!</p>
                      <p className="text-[10px] text-emerald-700">ข้อมูลสินค้าและรูปภาพที่มีลายน้ำถูกโหลดลงฟอร์มหลักเรียบร้อย</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md uppercase">
                    READY
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop Header */}
            <div>
              <h1 className="text-xl font-bold text-slate-900">บันทึกงาน Rework ใหม่</h1>
              <p className="text-xs text-slate-500 mt-0.5">เพิ่มข้อมูลยอดสินค้าที่ชำรุด/ความเสียหายเพื่อบันทึกเข้าสู่ระบบ</p>
            </div>

            {/* Case Info Meta */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  แหล่งที่มาของรายงาน (SOURCE) *
                </label>
                <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800">
                  {isDesktopPopulated ? phoneSource : 'SFC'}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  หมายเลขเคส (CASE ID) *
                </label>
                <div className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono font-bold text-blue-600 flex items-center justify-between">
                  <span>{phoneSource === 'Customer' ? 'RT' : 'RW'} {isDesktopPopulated ? phoneCaseId : '012'} - 2026</span>
                  {isDesktopPopulated && <CheckCircle2 size={14} className="text-emerald-500" />}
                </div>
              </div>
            </div>

            {/* Item 1 Section */}
            <div className="border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs bg-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isDesktopPopulated ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  รายการที่ 1
                </span>
                {isDesktopPopulated ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> ตรวจสอบแล้ว (Item Master)
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400 italic">
                    รอข้อมูลจาก Fast-Track...
                  </span>
                )}
              </div>

              {/* Grid Fields */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">ลูกค้า (CUSTOMER)</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {isDesktopPopulated ? 'OR' : '-'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">ITEM NUMBER</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block font-mono">
                    {isDesktopPopulated ? '61653013A700A' : '-'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">ITEM CODE</span>
                  <span className="text-xs font-bold text-blue-600 mt-0.5 block font-mono">
                    {isDesktopPopulated ? '404261' : '-'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">ชื่อรายการ (ITEM NAME)</span>
                <p className="text-xs font-bold text-slate-900">
                  {isDesktopPopulated ? 'PTT LIMITED SLIP GEAR OIL 80W-90 NP (10/1L)(404261)' : '-'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">จำนวน (QTY)</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {isDesktopPopulated ? '1 กล่อง' : '-'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">สาเหตุหลัก</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {isDesktopPopulated ? 'รั่ว' : '-'}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">รูปแบบความเสียหาย</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {isDesktopPopulated ? 'รั่วซึมฝายอด' : '-'}
                  </span>
                </div>
              </div>

              {/* Photo Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">รูปภาพหลักฐานที่ถ่ายโอนมา</span>
                {isDesktopPopulated ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 border border-slate-200 flex flex-col items-center justify-center p-1 text-slate-700 shadow-2xs">
                      <Camera size={16} />
                      <span className="text-[8px] font-bold">ฝารั่วซึม</span>
                    </div>
                    <div className="flex-1 text-[10px] text-slate-600 font-mono">
                      <p className="font-bold text-slate-800">✓ ฝังลายน้ำ Auto-Watermark</p>
                      <p className="text-slate-500">📍 Plant 1, Line 3 | 18 ส.ค. 2569 14:00</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-16 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                    ยังไม่มีรูปภาพ
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                บันทึกแบบร่าง
              </button>
              <button
                type="button"
                className={`px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isDesktopPopulated
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Save size={14} />
                บันทึกเคสเข้าระบบ
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// 4. Mock Add Case (Exact Clone of MainLayout + AddCaseTab)
export function MockAddCase({
  onNavigate,
  preset,
  simulationTrigger,
  onSimulationComplete
}: {
  onNavigate?: () => void;
  preset?: 'empty' | 'ptt-or' | 'cross-link' | 'with-item';
  simulationTrigger?: number;
  onSimulationComplete?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overall' | 'add' | 'dashboard'>('add');

  return (
    <div className="h-full w-full relative pointer-events-auto">
      <ReworkDataProvider>
        <MainLayout
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'overall' && onNavigate) onNavigate();
            else setActiveTab(tab as 'overall' | 'add' | 'dashboard');
          }}
          onLogout={() => { }}
          onBackToPortal={() => { }}
          userName="สมชาย"
          userRole={UserRole.OPERATOR}
          onOpenTutorial={() => { }}
        >
          <div className="flex-1 overflow-x-hidden overflow-y-auto w-full h-full">
            <div className="p-8 md:p-10 lg:p-12 w-full max-w-[1200px] mx-auto">
              <MockAddCaseTab
                preset={preset}
                simulationTrigger={simulationTrigger}
                onSimulationComplete={onSimulationComplete}
              />
            </div>
          </div>
        </MainLayout>
      </ReworkDataProvider>
    </div>
  );
}

// 5. Mock Dashboard
export function MockDashboard({ onNavigate }: { onNavigate?: () => void }) {
  const [activeTab, setActiveTab] = useState<'overall' | 'add' | 'dashboard'>('dashboard');

  return (
    <div className="h-full w-full relative pointer-events-auto">
      <ReworkDataProvider>
        <MainLayout
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'overall' && onNavigate) onNavigate();
            else setActiveTab(tab as 'overall' | 'add' | 'dashboard');
          }}
          onLogout={() => { }}
          onBackToPortal={() => { }}
          userName="สมชาย (แดชบอร์ด)"
          userRole={UserRole.QSMS}
          onOpenTutorial={() => { }}
        >
          <div className="flex-1 overflow-x-hidden overflow-y-auto w-full h-full">
            <div className="p-8 md:p-10 lg:p-12 w-full max-w-[1400px] mx-auto">
              <DashboardTab />
            </div>
          </div>
        </MainLayout>
      </ReworkDataProvider>
    </div>
  );
}

// 6. Mock Drawing & Master Storage (100% Authentic StorageApp & DocumentInspectionPanel)
export function MockDrawingMaster({
  onNavigate,
  simulationTrigger,
  onSimulationComplete
}: {
  onNavigate?: () => void;
  simulationTrigger?: number;
  onSimulationComplete?: () => void;
}) {
  const [simStep, setSimStep] = useState<number>(0);
  const [sidebarTab, setSidebarTab] = useState<'documents' | 'gap_analysis'>('documents');
  const [tableTab, setTableTab] = useState<'drawing' | 'master' | 'link'>('drawing');
  const [selectedDocId, setSelectedDocId] = useState<string | null>('dwg-1');
  const [rotation, setRotation] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [aiExtractedData, setAiExtractedData] = useState<Record<string, string> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Authentic Documents matching Supabase Storage & Master Data
  const sampleDrawings: Array<{
    id: string;
    type: 'drawing';
    drawing_number: string;
    file_name: string;
    revision: string;
    customer_name: string;
    item_code: string | null;
    item_number: string | null;
    part_name: string;
    issue_date: string;
    package_size: string;
    file_size: string;
    linked_id: string | null;
  }> = [
    {
      id: 'dwg-1',
      type: 'drawing',
      drawing_number: 'DWG-40001234-A',
      file_name: 'DWG-40001234-A.pdf',
      revision: '02',
      customer_name: 'PTT OR',
      item_code: '40001234',
      item_number: null,
      part_name: 'Gallon 5L Cap Seal Spec',
      issue_date: '2026-03-15',
      package_size: '5L Gallon (Cap: 45mm)',
      file_size: '1.4 MB',
      linked_id: 'mst-1'
    },
    {
      id: 'dwg-2',
      type: 'drawing' as const,
      drawing_number: 'DWG-404261-B',
      file_name: 'DWG-404261-B.pdf',
      revision: '01',
      customer_name: 'PTT OR',
      item_code: '404261',
      item_number: null,
      part_name: '1L Gear Oil Bottle Cap',
      issue_date: '2026-01-20',
      package_size: '1L Bottle',
      file_size: '980 KB',
      linked_id: 'mst-2'
    },
    {
      id: 'dwg-3',
      type: 'drawing' as const,
      drawing_number: 'DWG-40005512-C',
      file_name: 'DWG-40005512-C.pdf',
      revision: '03',
      customer_name: 'CP Chem',
      item_code: '40005512',
      item_number: null,
      part_name: 'Drum 200L Steel Bung Plug',
      issue_date: '2025-11-04',
      package_size: '200L Drum',
      file_size: '2.8 MB',
      linked_id: null
    }
  ];

  const sampleMasters = [
    {
      id: 'mst-1',
      type: 'master' as const,
      drawing_number: 'MST-61653013A700A',
      file_name: 'MST-61653013A700A.pdf',
      revision: '01',
      customer_name: 'SFC Internal',
      item_code: '40001234',
      item_number: '61653013A700A',
      part_name: 'Lube Oil Container Production Spec',
      oil_group: 'Automotive Lubricant (API SN/CF)',
      pallet_type: 'Plastic Pallet 1100x1100 mm',
      boxes_per_pallet: 'ตามความเหมาะสม',
      isNormalized: true,
      shelf_life: '24 Months',
      file_size: '2.1 MB',
      linked_id: 'dwg-1'
    },
    {
      id: 'mst-2',
      type: 'master' as const,
      drawing_number: 'MST-61653014B800A',
      file_name: 'MST-61653014B800A.pdf',
      revision: '03',
      customer_name: 'SFC Internal',
      item_code: '404261',
      item_number: '61653014B800A',
      part_name: 'Gear Oil Bottle Standard Spec',
      oil_group: 'Heavy Duty Gear Oil 80W-90',
      pallet_type: 'Wooden Pallet 1000x1200 mm',
      boxes_per_pallet: '24',
      isNormalized: false,
      shelf_life: '36 Months',
      file_size: '1.8 MB',
      linked_id: 'dwg-2'
    }
  ];

  const allDocuments = [...sampleDrawings, ...sampleMasters];
  const selectedDoc = allDocuments.find(d => d.id === selectedDocId) || null;
  const linkedDoc = selectedDoc?.linked_id ? allDocuments.find(d => d.id === selectedDoc.linked_id) : null;

  // Rotation Helpers
  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    setToastMessage(`หมุนเอกสาร ${nextRot}° (บันทึกทิศทางแล้ว)`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Automated Simulation Timeline
  const prevSimTriggerRef = useRef(simulationTrigger);
  useEffect(() => {
    if (!simulationTrigger || simulationTrigger <= 0 || simulationTrigger === prevSimTriggerRef.current) {
      prevSimTriggerRef.current = simulationTrigger;
      return;
    }
    prevSimTriggerRef.current = simulationTrigger;

    let isCancelled = false;

    const runSim = async () => {
      // ----------------------------------------------------
      // Step 1: Open AI Upload Modal & Drop PDF
      // ----------------------------------------------------
      setSimStep(1);
      setSelectedDocId(null);
      setSidebarTab('documents');
      setTableTab('drawing');
      setIsUploadOpen(true);
      setIsAiProcessing(false);
      setAiExtractedData(null);
      setRotation(0);
      setToastMessage(null);

      await new Promise(r => setTimeout(r, 1400));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 2: Gemini 3.1 Flash Vision OCR Processing
      // ----------------------------------------------------
      setSimStep(2);
      setIsAiProcessing(true);
      setToastMessage('Gemini 3.1 Flash กำลังประมวลผล OCR และสกัด Metadata...');

      await new Promise(r => setTimeout(r, 1800));
      if (isCancelled) return;

      setIsAiProcessing(false);
      setAiExtractedData({
        drawing_number: 'DWG-40001234-A',
        revision: '02',
        customer_name: 'PTT OR',
        item_code: '40001234',
        part_name: 'Gallon 5L Cap Seal Spec',
        issue_date: '2026-03-15',
        package_size: '5L Gallon (Cap: 45mm)'
      });
      setToastMessage('สกัดข้อมูลสำเร็จ 7 ฟิลด์ (Drawing Schema) ✓');

      await new Promise(r => setTimeout(r, 1600));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 3: Open Document Inspection Panel (Side-by-Side)
      // ----------------------------------------------------
      setSimStep(3);
      setIsUploadOpen(false);
      setSelectedDocId('dwg-1');
      setTableTab('drawing');
      setToastMessage('เปิดแผงตรวจทานแบบแปลน (Document Inspection Workspace)');

      await new Promise(r => setTimeout(r, 1600));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 4: PDF Rotation Toolbar (90° Landscape)
      // ----------------------------------------------------
      setSimStep(4);
      setToastMessage('กดปุ่มหมุน PDF 90° เพื่อปรับทิศทางแบบแปลนให้อ่านง่าย');

      await new Promise(r => setTimeout(r, 800));
      if (isCancelled) return;

      setRotation(90);
      setToastMessage('หมุนแบบแปลน 90° สำเร็จ และจำทิศทางลง localStorage ✓');

      await new Promise(r => setTimeout(r, 2000));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 5: Switch to Linked Master Specification
      // ----------------------------------------------------
      setSimStep(5);
      setSidebarTab('documents');
      setTableTab('master');
      setSelectedDocId('mst-1');
      setRotation(0);
      setToastMessage('สลับไปดู Master Sheet: ตรวจจับ "ตามความเหมาะสม" (Normalized) ✨');

      await new Promise(r => setTimeout(r, 2600));
      if (isCancelled) return;

      // ----------------------------------------------------
      // Step 6: Gap Analysis Tab (Missing Master & Export)
      // ----------------------------------------------------
      setSimStep(6);
      setSidebarTab('gap_analysis');
      setToastMessage('สลับมาดู Gap Analysis: ตรวจพบ Drawing ที่ยังไม่มี Master Sheet 1 รายการ ⚠️');

      await new Promise(r => setTimeout(r, 2400));
      if (isCancelled) return;

      setToastMessage('จำลองส่งออกรายงาน Gap_Analysis_Report.xlsx สำเร็จ ✓');

      await new Promise(r => setTimeout(r, 2000));
      if (isCancelled) return;

      setSimStep(0);
      setToastMessage(null);
      if (onSimulationComplete) {
        onSimulationComplete();
      }
    };

    runSim();

    return () => {
      isCancelled = true;
    };
  }, [simulationTrigger, onSimulationComplete]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 font-sans overflow-hidden pointer-events-auto text-slate-800 select-none relative">
      
      {/* ========================================================================= */}
      {/* 1. AUTHENTIC TOP HEADER (StorageApp.tsx) */}
      {/* ========================================================================= */}
      <header className="z-10 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl md:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="group flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Drawing & Master Storage</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                GEMINI 3.1 OCR
              </span>
            </h1>
            <p className="text-[10px] text-slate-500">
              Supabase RAG Engineering File Vault
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative hidden md:flex items-center">
            <div className="absolute left-3 text-slate-400">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              placeholder="Search by item code, number, drawing no, part..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-56 lg:w-72 rounded-full border border-slate-200 bg-slate-100/60 pl-8 pr-4 text-xs outline-none transition-all focus:border-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600"
            title="Refresh Data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-white transition-all shadow-xs active:scale-95 cursor-pointer ${
              simStep === 1
                ? 'bg-indigo-700 ring-2 ring-indigo-400 scale-105 shadow-indigo-500/30'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </header>

      {/* Floating Simulation Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-indigo-400/40 backdrop-blur-md"
          >
            <Sparkles size={15} className="text-amber-400 shrink-0 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE: SIDEBAR + DOCUMENT LIST / INSPECTION PANEL */}
      {/* ========================================================================= */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar Tabs (StorageApp.tsx) */}
        <div className="w-48 shrink-0 border-r border-slate-200 bg-white/60 p-3 hidden md:flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setSidebarTab('documents')}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              sidebarTab === 'documents'
                ? 'bg-slate-200/80 text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="h-3.5 w-3.5 text-slate-700" />
            <span>All Documents</span>
          </button>
          <button
            type="button"
            onClick={() => setSidebarTab('gap_analysis')}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              sidebarTab === 'gap_analysis'
                ? 'bg-slate-200/80 text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            <span>Gap Analysis</span>
          </button>
        </div>

        {/* Main Workspace Area (DocumentList.tsx or GapAnalysis.tsx) */}
        <main className="relative flex-1 overflow-hidden p-3 md:p-4">
          {sidebarTab === 'gap_analysis' ? (
            <div className="w-full h-full flex flex-col gap-3.5 overflow-y-auto custom-scrollbar">
              {/* Alert Header Box (GapAnalysis.tsx) */}
              <div className="shrink-0 rounded-xl border border-amber-200 bg-amber-50/90 p-4 flex gap-4 justify-between items-start shadow-xs">
                <div className="flex gap-3.5">
                  <div className="shrink-0 mt-0.5">
                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-900 flex items-center gap-2">
                      <span>Missing Master Documents (1)</span>
                      <span className="bg-amber-200/80 text-amber-900 text-[10px] px-2 py-0.2 rounded-full font-mono">
                        Action Required
                      </span>
                    </h3>
                    <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed max-w-2xl">
                      แบบแปลนลูกค้าต่อไปนี้ยังไม่มีไฟล์ Master Sheet ภายในที่จับคู่ตรงกันในระบบ กรุณาสร้างและอัปโหลดไฟล์ Master เพื่อความถูกต้องในการผลิต
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setToastMessage('ส่งออกรายงาน Gap_Analysis_Report_2026-08-18.xlsx สำเร็จ ✓');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Report</span>
                </button>
              </div>

              {/* Gap Analysis Table */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">รายการแบบแปลนที่ยังขาด Master Specification</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono">
                      1 Item Missing
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Auto-scanned via Supabase Cross-Relations</span>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Customer Drawing</th>
                        <th className="px-4 py-3">Part Name</th>
                        <th className="px-4 py-3">Expected Link</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="font-mono">DWG-40005512-C</span>
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-mono">
                                  Rev.03
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500">CP Chem &bull; 2.8 MB</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          Drum 200L Steel Bung Plug
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold">
                            Item Code: 40005512
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            Master Missing
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUploadOpen(true);
                              setToastMessage('จำลองอัปโหลด Master Sheet สำหรับ DWG-40005512-C');
                              setTimeout(() => setToastMessage(null), 2500);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Upload Master</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col min-h-0">
            
            {/* Top Sub-tabs (Drawing / Master / Link Overview + Filter button) */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-5 bg-slate-50/60 shrink-0">
              <div className="flex flex-wrap -mb-px">
                <button
                  type="button"
                  onClick={() => setTableTab('drawing')}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all -mb-px cursor-pointer ${
                    tableTab === 'drawing'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Customer Drawings ({sampleDrawings.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTableTab('master')}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all -mb-px cursor-pointer ${
                    tableTab === 'master'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Master Specifications ({sampleMasters.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTableTab('link')}
                  className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all -mb-px cursor-pointer ${
                    tableTab === 'link'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Link Overview (2)</span>
                </button>
              </div>

              <div className="py-2 flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Split Container: Table (Left) + Inspection Panel (Right) */}
            <div className="flex flex-row items-stretch flex-1 overflow-hidden divide-x divide-slate-200">
              
              {/* Document Table (Left) */}
              <div className={`overflow-y-auto custom-scrollbar flex-1 ${selectedDoc ? 'w-1/2 hidden md:block' : 'w-full'}`}>
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">{tableTab === 'drawing' ? 'Drawing No.' : 'Master Doc No.'}</th>
                      <th className="px-4 py-3">Part Name</th>
                      <th className="px-4 py-3">{tableTab === 'drawing' ? 'Customer' : 'Identifiers'}</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(tableTab === 'drawing' ? sampleDrawings : sampleMasters).map((doc) => {
                      const isSelected = selectedDocId === doc.id;
                      const isDwg = doc.type === 'drawing';

                      return (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDocId(isSelected ? null : doc.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/80 border-l-4 border-l-blue-600 font-semibold'
                              : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                isDwg ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {isDwg ? <FileText className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span className="font-mono">{doc.drawing_number}</span>
                                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-mono">
                                    Rev.{doc.revision}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">{doc.file_size}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800 max-w-[140px] truncate">
                            {doc.part_name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-slate-700">
                              {isDwg ? doc.customer_name : doc.item_number}
                            </span>
                            {doc.item_code && (
                              <span className="text-[10px] text-blue-600 font-mono block">
                                Code: {doc.item_code}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-blue-600 font-bold text-xs hover:underline">
                              ตรวจทาน ➔
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Document Inspection Panel (Right 50%) */}
              {selectedDoc ? (
                <div className="w-full md:w-1/2 flex flex-col bg-white overflow-hidden shadow-xs">
                  
                  {/* Inspection Header */}
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        selectedDoc.type === 'drawing' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {selectedDoc.type === 'drawing' ? <FileText className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xs font-bold text-slate-900 font-mono">
                            {selectedDoc.drawing_number}
                          </h2>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                            Rev.{selectedDoc.revision}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{selectedDoc.file_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Rotate PDF Button */}
                      <button
                        type="button"
                        onClick={handleRotate}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          simStep === 4 || rotation !== 0
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="หมุนเอกสาร 90 องศา"
                      >
                        <RotateCw size={12} className={rotation !== 0 ? 'animate-spin-once' : ''} />
                        <span>หมุน {rotation}°</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDocId(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Inspection Body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    
                    {/* PDF Blueprint Canvas Box */}
                    <div className="w-full h-48 bg-slate-950 rounded-xl overflow-hidden shadow-inner flex items-center justify-center relative p-3 border border-slate-200">
                      <div
                        className="w-full h-full bg-slate-900 rounded-lg p-2 flex flex-col justify-between transition-transform duration-500 border border-slate-700/80 relative text-slate-300 overflow-hidden"
                        style={{ transform: `rotate(${rotation}deg)` }}
                      >
                        {/* Grid lines */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:14px_14px] opacity-40 pointer-events-none" />
                        
                        <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 relative z-10 text-[8px] font-mono text-slate-400">
                          <span>PDF BLUEPRINT PREVIEW &bull; SCALE 1:1</span>
                          <span className="text-amber-400 font-bold">{selectedDoc.drawing_number}</span>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                          <div className="w-16 h-16 rounded-full border-2 border-dashed border-indigo-400 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full border border-indigo-300 bg-indigo-950/60 flex items-center justify-center">
                              <span className="text-[7px] font-bold text-indigo-200">Ø45mm</span>
                            </div>
                          </div>
                          <span className="text-[8px] font-mono text-slate-300 mt-1 font-bold">
                            {selectedDoc.part_name}
                          </span>
                        </div>

                        <div className="border border-slate-700 bg-slate-950/90 rounded p-1 text-[7px] font-mono flex items-center justify-between relative z-10 text-slate-400">
                          <span>CLIENT: <b className="text-slate-200">{selectedDoc.customer_name}</b></span>
                          <span className="text-emerald-400">Auto-saved orientation: {rotation}°</span>
                        </div>
                      </div>
                    </div>

                    {/* Linked Document Status Card (Item Code Link) */}
                    {selectedDoc.item_code && (
                      <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                            <Link2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-black text-blue-600 tracking-wider">
                              Linked Document Status (Code: {selectedDoc.item_code})
                            </div>
                            <div className="text-xs font-semibold text-slate-800 mt-0.5">
                              {linkedDoc ? (
                                <span className="flex items-center gap-1 text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  พบ {linkedDoc.type === 'master' ? 'Master Specification' : 'Customer Drawing'} : {linkedDoc.drawing_number}
                                </span>
                              ) : (
                                <span className="text-amber-600">ยังไม่มีเอกสารคู่ขนาน</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {linkedDoc && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDocId(linkedDoc.id);
                              setTableTab(linkedDoc.type === 'master' ? 'master' : 'drawing');
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                          >
                            สลับไปดู {linkedDoc.type === 'master' ? 'Master' : 'Drawing'} ➔
                          </button>
                        )}
                      </div>
                    )}

                    {/* Metadata Specifications (Decoupled Schemas) */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <span>Metadata Specifications</span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            {selectedDoc.type === 'drawing' ? '7 Drawing Fields' : '8 Master Fields'}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditMode(!isEditMode)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>{isEditMode ? 'ดูข้อมูล' : 'แก้ไขข้อมูล'}</span>
                        </button>
                      </div>

                      {/* Fields Grid */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                            {selectedDoc.type === 'drawing' ? 'Drawing No.' : 'Master Doc No.'}
                          </label>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 text-xs">
                            {selectedDoc.drawing_number}
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Revision</label>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800 text-xs">
                            Rev.{selectedDoc.revision}
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Item Code</label>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-blue-600 text-xs">
                            {selectedDoc.item_code || '-'}
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">
                            {selectedDoc.type === 'drawing' ? 'Customer Name' : 'Item Number (Formula)'}
                          </label>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800 text-xs">
                            {selectedDoc.type === 'drawing' ? selectedDoc.customer_name : selectedDoc.item_number}
                          </div>
                        </div>

                        {selectedDoc.type === 'drawing' ? (
                          <div className="col-span-2 space-y-0.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Package Size</label>
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs">
                              {selectedDoc.package_size}
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Boxes Per Pallet Normalization */}
                            <div className={`col-span-2 space-y-0.5 ${simStep === 5 ? 'ring-2 ring-emerald-500 rounded-lg p-0.5' : ''}`}>
                              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                                <span>Boxes Per Pallet</span>
                                <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-black">
                                  NORMALIZED
                                </span>
                              </label>
                              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-between">
                                <span>{selectedDoc.boxes_per_pallet}</span>
                                <span className="text-[9px] text-emerald-700 font-medium">ตรวจจับข้อความและบันทึกตรง</span>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Oil Group</label>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs truncate">
                                {selectedDoc.oil_group}
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Shelf Life</label>
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs">
                                {selectedDoc.shelf_life}
                              </div>
                            </div>
                          </>
                        )}

                        <div className="col-span-2 space-y-0.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Part Name</label>
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-xs">
                            {selectedDoc.part_name}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setToastMessage('บันทึกข้อมูลเข้า Master Storage สำเร็จ! ✨');
                          setTimeout(() => setToastMessage(null), 2500);
                        }}
                        className="mt-3 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Save size={13} />
                        <span>บันทึกการเปลี่ยนแปลง</span>
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mb-2 stroke-1" />
                  <p className="text-xs font-semibold text-slate-600">คลิกเลือกรายการเอกสารจากตาราง</p>
                  <p className="text-[10px] text-slate-400">เพื่อเปิดแผงตรวจทานคู่ขนาน Side-by-Side</p>
                </div>
              )}
            </div>

          </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. AI UPLOAD & OCR EXTRACTION MODAL SIMULATION (UploadModal.tsx) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isUploadOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 15 }}
              className="w-[500px] bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Upload size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Upload Engineering Documents</h3>
                    <p className="text-[10px] text-slate-500">Gemini 3.1 Flash AI Vision OCR Extraction</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-xl p-5 text-center space-y-1.5">
                <FileText className="w-9 h-9 text-indigo-600 mx-auto animate-bounce" />
                <p className="text-xs font-bold text-slate-900">DWG-40001234-A.pdf</p>
                <p className="text-[10px] text-slate-500 font-mono">1.4 MB &bull; Ready for AI Extraction</p>
              </div>

              {/* AI Processing Status */}
              {isAiProcessing ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-600">
                    <Sparkles size={15} className="animate-spin text-amber-500" />
                    <span>Gemini 3.1 Flash กำลังประมวลผล OCR...</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5 }}
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono">Analyzing Blueprint Schematics & Text Layers</p>
                </div>
              ) : aiExtractedData ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" /> AI OCR Extracted 7 Fields
                    </span>
                    <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded uppercase font-black">
                      READY
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono pt-1 text-slate-700">
                    <div className="bg-white p-1 rounded border border-emerald-100">
                      Doc: <b className="text-slate-900">{aiExtractedData.drawing_number}</b>
                    </div>
                    <div className="bg-white p-1 rounded border border-emerald-100">
                      Code: <b className="text-blue-600">{aiExtractedData.item_code}</b>
                    </div>
                    <div className="bg-white p-1 rounded border border-emerald-100">
                      Customer: <b className="text-slate-900">{aiExtractedData.customer_name}</b>
                    </div>
                    <div className="bg-white p-1 rounded border border-emerald-100">
                      Rev: <b className="text-slate-900">{aiExtractedData.revision}</b>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    setSelectedDocId('dwg-1');
                    setTableTab('drawing');
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1"
                >
                  <span>ยืนยันและเปิดแผงตรวจทาน</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// =============================================================================
// 7. Mock DocAI RAG Engine (100% Authentic Replica of QSMS Assistant Screenshot)
// =============================================================================
interface MockDocItem {
  id: string;
  filename: string;
  pages: number;
  size: string;
  created_at: string;
}

const RAG_WELCOME_TEXT = `สวัสดีครับ ผมคือ QSMS Enterprise AI Assistant ยินดีให้บริการครับ

ผมสามารถช่วยคุณสืบค้นและวิเคราะห์ข้อมูลสดจากทุกโมดูลในระบบ:
1. 📊 สถิติเคส Rework & รายการสินค้าชำรุด (รั่ว/เปื้อน)
2. 📦 สเปกสินค้ากลาง (Item Master / พาเลท / กลุ่มน้ำมัน)
3. 📐 แบบแปลนวิศวกรรม & Master Sheets (Drawing No / Revision)
4. 📖 คู่มือการปฏิบัติงาน & เอกสารเทคนิค RAG PDF

พิมพ์คำถามของคุณได้เลยครับ!`;

const REWORK_SUMMARY_ANSWER = `สรุปข้อมูลงาน Rework ในปัจจุบันมีรายละเอียดดังนี้ครับ

จำนวนรายการ Rework ทั้งหมด: 80 รายการ

รายละเอียดของข้อบกพร่องที่พบ:
- รั่ว (Leak): 68 รายการ
- เปื้อน (Stain): 3 รายการ

สถานะการดำเนินงานปัจจุบัน:
- อยู่ระหว่างรอดำเนินการ (Pending): 12 รายการ
- กำลังดำเนินการ (In-Progress): 6 รายการ
- ดำเนินการเสร็จสิ้น (Completed): 5 รายการ

หากต้องการให้ผมเจาะจงข้อมูลส่วนใดเพิ่มเติม เช่น รายละเอียดของรหัสสินค้าที่มีปัญหามากที่สุด หรือต้องการให้สรุปข้อมูลในมุมมองอื่น สามารถแจ้งได้ทันทีครับ`;

const LEAK_CAUSE_ANSWER = `จากการวิเคราะห์ข้อมูลทางสถิติและคู่มือวิศวกรรม (rework_standard_v2.pdf):

สาเหตุหลักที่ทำให้สินค้าเกิดการรั่ว (68 รายการ) ได้แก่:
1. **เกลียวฝาปีน (Cross-Threading)**: พบ 42 รายการ เกิดจากแรงกดขันฝาเครื่องจักรคลาดเคลื่อน
2. **ซีลยางฝาไม่แนบสนิท (Seal Incomplete)**: พบ 18 รายการ
3. **รอยแตกร้าวที่คอกัลลอน (Neck Fracture)**: พบ 8 รายการ

**แนวทางแก้ไข**: ปรับตั้งค่า Torque ขันฝาที่ 4.5 Nm และตรวจสอบรอยรั่วซึมก่อนปิดเคสทุกครั้งครับ`;

export function MockDocAIRAG({
  onNavigate,
  simulationTrigger,
  onSimulationComplete
}: {
  onNavigate?: () => void;
  simulationTrigger?: number;
  onSimulationComplete?: () => void;
}) {
  const [simStep, setSimStep] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const sampleDocs: MockDocItem[] = [
    {
      id: 'doc-1',
      filename: 'rework_standard_v2.pdf',
      pages: 14,
      size: '1.4 MB',
      created_at: '10 มี.ค. 2026 14:30'
    },
    {
      id: 'doc-2',
      filename: 'drawing_spec_4000.pdf',
      pages: 8,
      size: '980 KB',
      created_at: '18 ก.พ. 2026 09:15'
    },
    {
      id: 'doc-3',
      filename: 'ptt_or_quality_policy.pdf',
      pages: 22,
      size: '2.8 MB',
      created_at: '25 ม.ค. 2026 11:45'
    }
  ];

  const [chatList, setChatList] = useState<Array<{
    role: 'user' | 'model';
    text: string;
    chips?: string[];
  }>>([
    {
      role: 'model',
      text: RAG_WELCOME_TEXT
    },
    {
      role: 'user',
      text: 'สรุปงาน Rework'
    },
    {
      role: 'model',
      text: REWORK_SUMMARY_ANSWER,
      chips: ['สาเหตุหลักที่ทำให้สินค้าเกิดการรั่วคืออะไร?']
    }
  ]);

  // Automated Authentic Simulation matching Screenshot
  const prevSimTriggerRef = useRef(simulationTrigger);
  useEffect(() => {
    if (!simulationTrigger || simulationTrigger <= 0 || simulationTrigger === prevSimTriggerRef.current) {
      prevSimTriggerRef.current = simulationTrigger;
      return;
    }
    prevSimTriggerRef.current = simulationTrigger;

    let isCancelled = false;

    const runSim = async () => {
      // Step 1: Reset to Initial Welcome Screen
      setSimStep(1);
      setActiveTab('chat');
      setChatList([{ role: 'model', text: RAG_WELCOME_TEXT }]);
      setQuery('');
      setToastMessage('จำลองเริ่มการสนทนา: พิมพ์คำสั่ง "สรุปงาน Rework"');

      await new Promise(r => setTimeout(r, 1200));
      if (isCancelled) return;

      // Step 2: User Types "สรุปงาน Rework"
      setSimStep(2);
      setQuery('สรุปงาน Rework');

      await new Promise(r => setTimeout(r, 900));
      if (isCancelled) return;

      setChatList(prev => [...prev, { role: 'user', text: 'สรุปงาน Rework' }]);
      setQuery('');
      setIsLoading(true);
      setToastMessage('AI กำลังดึงสถิติสดย้อนหลังผ่าน get_rework_statistics()...');

      await new Promise(r => setTimeout(r, 1800));
      if (isCancelled) return;

      // Step 3: Assistant returns exact authentic response + Chip
      setSimStep(3);
      setIsLoading(false);
      setChatList(prev => [
        ...prev,
        {
          role: 'model',
          text: REWORK_SUMMARY_ANSWER,
          chips: ['สาเหตุหลักที่ทำให้สินค้าเกิดการรั่วคืออะไร?']
        }
      ]);
      setToastMessage('สรุปยอด Rework 80 เคส (รั่ว 68 / เปื้อน 3) จากฐานข้อมูลจริง ✓');

      await new Promise(r => setTimeout(r, 2200));
      if (isCancelled) return;

      // Step 4: Click Suggestion Chip "สาเหตุหลักที่ทำให้สินค้าเกิดการรั่วคืออะไร?"
      setSimStep(4);
      setChatList(prev => [...prev, { role: 'user', text: 'สาเหตุหลักที่ทำให้สินค้าเกิดการรั่วคืออะไร?' }]);
      setIsLoading(true);
      setToastMessage('คลิกชิปคำถามแนะนำ ➔ สืบค้นคู่มือเทคนิค rework_standard_v2.pdf');

      await new Promise(r => setTimeout(r, 1800));
      if (isCancelled) return;

      setIsLoading(false);
      setChatList(prev => [
        ...prev,
        {
          role: 'model',
          text: LEAK_CAUSE_ANSWER,
          chips: ['ค้นหาสเปกน้ำมัน 40001234', 'สรุปงาน Rework อีกครั้ง']
        }
      ]);
      setToastMessage('ตอบคำถามพร้อมวิเคราะห์สาเหตุเชิงลึกและค่า Torque 4.5 Nm ✨');

      await new Promise(r => setTimeout(r, 2500));
      if (isCancelled) return;

      // Step 5: Switch to Documents Tab
      setSimStep(5);
      setActiveTab('documents');
      setToastMessage('สลับมาดูแท็บ "เอกสาร" (คลังคู่มือ PDF & การนำเข้าเอกสาร)');

      await new Promise(r => setTimeout(r, 2500));
      if (isCancelled) return;

      setSimStep(0);
      setToastMessage(null);
      if (onSimulationComplete) {
        onSimulationComplete();
      }
    };

    runSim();

    return () => {
      isCancelled = true;
    };
  }, [simulationTrigger, onSimulationComplete]);

  const handleSendMessage = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || query;
    if (!textToSend.trim() || isLoading) return;

    setQuery('');
    setChatList(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsLoading(true);

    setTimeout(() => {
      let reply = '';
      let nextChips: string[] = [];

      if (textToSend.includes('รั่ว') || textToSend.includes('สาเหตุ')) {
        reply = LEAK_CAUSE_ANSWER;
        nextChips = ['สรุปงาน Rework', 'ค้นหาสเปกน้ำมัน 40001234'];
      } else if (textToSend.includes('สรุป') || textToSend.includes('rework')) {
        reply = REWORK_SUMMARY_ANSWER;
        nextChips = ['สาเหตุหลักที่ทำให้สินค้าเกิดการรั่วคืออะไร?'];
      } else {
        reply = `จากการสืบค้นคู่มือเทคนิคและฐานข้อมูลกลาง QSMS:\n\nสำหรับคำถาม "${textToSend}" ระบบได้ประมวลผลข้อมูลผ่าน Gemini AI และตรวจสอบพบสเปกมาตรฐานที่เกี่ยวข้องเรียบร้อยแล้วครับ หากต้องการข้อมูลเชิงลึกเพิ่มเติม สามารถสอบถามได้เลยครับ`;
        nextChips = ['สรุปงาน Rework', 'สาเหตุหลักที่ทำให้สินค้าเกิดการรั่วคืออะไร?'];
      }

      setChatList(prev => [
        ...prev,
        {
          role: 'model',
          text: reply,
          chips: nextChips
        }
      ]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100/60 p-2 sm:p-4 font-sans overflow-hidden pointer-events-auto text-slate-800 select-none relative">
      
      {/* Floating Simulation Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 border border-blue-400/40 backdrop-blur-md"
          >
            <Sparkles size={15} className="text-amber-400 shrink-0 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exact QSMS Assistant Panel Frame (Matching User's Screenshot & RagApp.tsx) */}
      <div className="w-full max-w-[460px] h-full max-h-[860px] bg-white rounded-2xl border border-slate-200/90 shadow-xl flex flex-col overflow-hidden">
        
        {/* Header (Exact 1:1) */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-blue-200/60 bg-blue-50 text-blue-600">
                <Bot size={20} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">QSMS Assistant</h2>
              <p className="text-xs text-blue-600 font-medium">Enterprise AI Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg relative">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`relative flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer z-10 ${
                  activeTab === 'chat' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {activeTab === 'chat' && (
                  <motion.div
                    layoutId="rag-active-pill"
                    className="absolute inset-0 bg-white shadow-xs rounded-md -z-10"
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                <Bot className="h-3.5 w-3.5" />
                <span>แชท</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`relative flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer z-10 ${
                  activeTab === 'documents' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {activeTab === 'documents' && (
                  <motion.div
                    layoutId="rag-active-pill"
                    className="absolute inset-0 bg-white shadow-xs rounded-md -z-10"
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
                <FileText className="h-3.5 w-3.5" />
                <span>เอกสาร</span>
              </button>
            </div>

            {activeTab === 'chat' && (
              <button
                type="button"
                onClick={() => {
                  setChatList([{ role: 'model', text: RAG_WELCOME_TEXT }]);
                  setToastMessage('ล้างประวัติการสนทนาเรียบร้อย');
                  setTimeout(() => setToastMessage(null), 2000);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                title="ล้างประวัติการแชท"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: CHAT STREAM (1:1 with Screenshot) */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4">
              
              {chatList.map((msg, i) => (
                <div key={i} className="flex flex-col w-full">
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    
                    {msg.role === 'model' && (
                      <div className="shrink-0 mt-auto mr-2">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full border border-blue-200/50 bg-blue-50 text-blue-600">
                          <Bot size={14} />
                        </div>
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] px-4 py-3 text-[13px] leading-relaxed font-thai shadow-2xs ${
                        msg.role === 'user'
                          ? 'bg-[#0f172a] text-white rounded-2xl rounded-br-xs font-semibold'
                          : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-xs font-normal'
                      }`}
                    >
                      <div className="whitespace-pre-line">{msg.text}</div>
                    </div>
                  </div>

                  {/* Suggestion Chips below model message */}
                  {msg.role === 'model' && msg.chips && msg.chips.length > 0 && (
                    <div className="mt-3 ml-9 flex flex-wrap gap-2">
                      {msg.chips.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => handleSendMessage(undefined, chip)}
                          className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer font-thai"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading Indicator from RagApp.tsx */}
              {isLoading && (
                <div className="flex justify-start origin-bottom">
                  <div className="shrink-0 mt-auto mr-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full border border-blue-200/50 bg-blue-50 text-blue-600">
                      <Bot size={14} />
                    </div>
                  </div>
                  <div className="rounded-2xl rounded-bl-xs bg-slate-100 px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-xs font-semibold text-blue-600 ml-1 font-thai">
                        กำลังค้นหาข้อมูลและสรุปคำตอบ...
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer Area (Exact 1:1) */}
            <div className="px-4 py-3 border-t border-slate-100 shrink-0 bg-white">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="พิมพ์ข้อความถึง QSMS Assistant..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20 focus:outline-none transition-all font-thai"
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#1d1d1f] hover:bg-black text-white shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
              <p className="text-center mt-2 text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-500" />
                <span>Powered by QSMS DocAI</span>
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: DOCUMENTS TAB (Exact 1:1 with RagApp.tsx) */}
        {activeTab === 'documents' && (
          <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4 bg-white">
            {/* Upload Area */}
            <div className="space-y-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">นำเข้าเอกสาร</h3>
                <p className="text-xs text-slate-400">อัปโหลด PDF หรือ Excel เพื่อสร้างชุดข้อมูล RAG</p>
              </div>
              <div
                onClick={() => {
                  setToastMessage('จำลองเลือกไฟล์ PDF สำหรับ Ingestion');
                  setTimeout(() => setToastMessage(null), 2000);
                }}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-100 transition"
              >
                <UploadCloud className="h-7 w-7 text-slate-600" />
                <span className="text-xs font-semibold text-slate-600">เลือกไฟล์ (.pdf, .xlsx, .jpg, .png)</span>
                <span className="text-xs text-slate-400">PDF ≤ 2MB | Excel ≤ 5MB | Image ≤ 5MB</span>
              </div>
            </div>

            {/* Document List */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">รายการเอกสาร ({sampleDocs.length} รายการ)</h3>
              <div className="space-y-2">
                {sampleDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/70 transition shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 font-mono">{doc.filename}</div>
                        <div className="text-[10px] text-slate-400">{doc.pages} หน้า &bull; {doc.size} &bull; {doc.created_at}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setToastMessage(`จำลองลบเอกสาร ${doc.filename}`);
                        setTimeout(() => setToastMessage(null), 2000);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      title="ลบเอกสาร"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

