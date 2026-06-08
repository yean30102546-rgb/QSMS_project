import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2, Clock, LayoutGrid, ShieldCheck, Sparkles,
  ArrowRight, Search, Plus, Filter, AlertCircle, FileText,
  Package, Trash2, PenTool, ExternalLink, X, Users2, CalendarDays, Clock3,
  LayoutDashboard, ArrowLeft, HelpCircle, RefreshCw, SlidersHorizontal, Calendar,
  Eye, EyeOff, Lock, UserCircle2, ChevronLeft
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent } from '@/src/components/ui/card';

import { MainLayout } from '../../../components/layout/MainLayout';
import { ReworkDataProvider } from '../../../contexts/ReworkDataContext';
import { MockAddCaseTab } from './MockAddCaseTab';
import { DashboardTab } from '../../../components/tabs/DashboardTab';

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

// 0.5 Mock Login (Simplified clone of Login.tsx)
export function MockLogin({ onNavigate }: { onNavigate?: () => void }) {
  const [username, setUsername] = useState('OPERATOR_DEMO');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onNavigate) onNavigate();
    }, 800);
  };

  return (
    <div className="w-full h-full relative overflow-y-auto bg-gradient-to-br from-[#F5F5F7] via-[#FFFFFF] to-[#E8E8ED] flex items-center justify-center p-8 pointer-events-auto">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.05),transparent_70%)]" />
        <div className="absolute -right-24 bottom-6 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.04),transparent_70%)]" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[980px] overflow-hidden rounded-[36px] bg-white/30 backdrop-blur-md shadow-2xl shadow-blue-900/5 border border-white/40"
      >
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-white/60 bg-white/40 backdrop-blur-xl px-7 py-10 text-[#1d1d1f] md:px-10 lg:border-b-0 lg:border-r lg:border-r-black/5">
            <div className="mb-8 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-sm flex items-center justify-center text-white font-bold text-xl">
                Q
              </div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#1d1d1f]/70">Central Workspace</div>
            </div>
            <h1 className="max-w-lg text-4xl font-semibold leading-[1.04] tracking-[-0.03em] md:text-5xl text-[#1d1d1f]">
              One login for Rework and upcoming Roster operations.
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-7 text-[#515154]">
              เข้าสู่ระบบครั้งเดียว แล้วเลือกใช้งานแต่ละ webapp ผ่าน Central Control ได้ทันที
              โดยรักษา workflow เดิมของ Rework ให้ทำงานต่อเนื่อง
            </p>
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-black/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-black/60">
              Platform session secured
            </div>
          </div>

          <div className="bg-white/80 px-6 py-8 md:px-9 md:py-10">
            <button
              type="button"
              className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
            >
              <ChevronLeft size={14} />
              ย้อนกลับสู่หน้าหลัก
            </button>

            <div className="mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6e6e73]">Sign in</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">เข้าสู่ Central Control</h2>
              <p className="mt-2 text-sm leading-6 text-[#5d5d63]">
                ใช้ profile และ password เดิมของระบบเพื่อเข้าสู่ Portal
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <UserCircle2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full rounded-2xl py-3.5 pl-11 pr-4 text-[15px] bg-white border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              <div className="relative group">
                <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7a80] group-focus-within:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-2xl py-3.5 pl-11 pr-11 text-[15px] bg-white border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a7a80] hover:text-[#1d1d1f] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 pb-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-300 bg-white group-hover:border-blue-400 transition-colors">
                    <CheckCircle2 size={12} className="text-white opacity-0 transition-opacity" />
                  </div>
                  <span className="text-sm text-[#515154] group-hover:text-[#1d1d1f] transition-colors">จดจำฉันไว้ในระบบ</span>
                </label>
                <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  ลืมรหัสผ่าน?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#0071e3] px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#0077ED] active:scale-[0.98] disabled:opacity-70 disabled:hover:bg-[#0071e3]"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    <>
                      เข้าสู่ระบบ
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

// 1. Mock Portal (Exact Clone of WorkspacePortal.tsx)
export function MockPortal({ onNavigate }: { onNavigate?: () => void }) {
  const isGuest = false;
  const greetingName = 'สมชาย';
  const user = { role: 'OPERATOR', email: 'operator@sfc.com' };

  // Preview Stats State
  const reworkStats = {
    total: 120,
    pending: 15,
    inProgress: 40,
    awaitingValuation: 20,
    completed: 45,
    completionRate: 37,
    hasData: true,
  };
  const rosterStats = {
    totalEmployees: 45,
    staffPresentCount: 42,
    onLeaveCount: 3,
    leaveSummary: { sick: 1, business: 1, vacation: 1 },
    retentionRate: 93,
    hasData: true,
  };

  const apps = [
    {
      id: 'rework',
      title: 'ระบบ Rework',
      subtitle: 'Rework Management',
      description: 'ระบบบันทึกและติดตามสถานะงาน Rework พร้อมประเมินค่าใช้จ่าย',
      route: 'rework',
      status: 'active',
      accent: 'blue',
    },
    {
      id: 'roster',
      title: 'ระบบจัดการกำลังพล',
      subtitle: 'Roster Management',
      description: 'จัดการกะการทำงานและตรวจสอบสถานะการเข้างาน',
      route: 'roster',
      status: 'upcoming',
      accent: 'amber',
    }
  ];

  return (
    <div className="apple-shell flex h-full flex-col overflow-y-auto bg-slate-50 relative pointer-events-auto">
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
                <p className="text-sm leading-6 text-[#515154]">โมดูล Rework เปิดใช้งานแล้ว โมดูล Roster กำลังอยู่ในขั้นตอนเตรียมการ</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2 pb-12">
          {apps.map((app, index) => {
            const isActive = app.status === 'active';
            const accentClasses =
              app.accent === 'blue'
                ? 'bg-white border-slate-200 shadow-sm'
                : 'bg-amber-50/50 border-amber-100 shadow-sm';

            return (
              <motion.article
                key={app.id}
                whileHover={isActive ? { y: -2 } : {}}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 + index * 0.08 }}
                className={`relative flex flex-col overflow-hidden rounded-3xl border p-7 transition-all ${accentClasses}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm font-medium ${app.accent === 'blue' ? 'text-slate-500' : 'text-amber-600'}`}>
                      {app.subtitle}
                    </p>
                    <h3 className="mt-3 text-[32px] font-semibold leading-[1.06] text-[#1d1d1f]">
                      {app.title}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${isActive ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                      }`}
                  >
                    {isActive ? 'พร้อมใช้งาน' : 'เร็วๆ นี้'}
                  </span>
                </div>

                {/* App Preview Section */}
                {isActive && (
                  app.id === 'rework' ? (
                    <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant/80 px-1">
                        <span className="font-medium text-slate-500 flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          ข้อมูลจริงล่าสุด (Live): คืบหน้า ({reworkStats.completed}/{reworkStats.total} เสร็จ)
                        </span>
                        <span className="text-emerald-600 font-semibold">{reworkStats.completionRate}%</span>
                      </div>

                      {/* Proportional Segmented Progress Bar */}
                      <div className="relative flex h-3.5 w-full overflow-hidden rounded-full bg-slate-200/50 shadow-inner">
                        <div style={{ width: `${(reworkStats.pending / reworkStats.total) * 100}%` }} className="h-full bg-amber-400" />
                        <div style={{ width: `${(reworkStats.inProgress / reworkStats.total) * 100}%` }} className="h-full bg-sky-400" />
                        <div style={{ width: `${(reworkStats.awaitingValuation / reworkStats.total) * 100}%` }} className="h-full bg-violet-400" />
                        <div style={{ width: `${(reworkStats.completed / reworkStats.total) * 100}%` }} className="h-full bg-emerald-500" />
                      </div>

                      {/* Legend Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4 mt-0.5 px-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          <span className="text-slate-500">รอ:</span>
                          <span className="font-semibold text-slate-800">{reworkStats.pending}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                          <span className="h-2 w-2 rounded-full bg-sky-400" />
                          <span className="text-slate-500">กำลัง:</span>
                          <span className="font-semibold text-slate-800">{reworkStats.inProgress}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                          <span className="h-2 w-2 rounded-full bg-violet-400" />
                          <span className="text-slate-500">ประเมิน:</span>
                          <span className="font-semibold text-slate-800">{reworkStats.awaitingValuation}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-500">เสร็จ:</span>
                          <span className="font-semibold text-slate-800">{reworkStats.completed}</span>
                        </div>
                      </div>
                    </div>
                  ) : app.id === 'roster' ? (
                    <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col justify-center rounded-2xl bg-emerald-50 p-3.5 border border-emerald-100 shadow-sm">
                          <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                            <Users2 size={14} className="text-emerald-600" />
                            <span className="text-xs font-medium">บุคลากรพร้อม</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-emerald-800 leading-none">{rosterStats.staffPresentCount}</span>
                            <span className="text-xs font-medium text-emerald-600/80">/ {rosterStats.totalEmployees}</span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center rounded-2xl bg-white p-3.5 border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-1.5 text-slate-500 mb-1.5">
                            <CalendarDays size={14} />
                            <span className="text-xs font-medium">ลาพักวันนี้</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-xs font-medium border border-rose-100">
                              <span>ป่วย: {rosterStats.leaveSummary.sick}</span>
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-xs font-medium border border-amber-100">
                              <span>กิจ: {rosterStats.leaveSummary.business}</span>
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 text-xs font-medium border border-violet-100">
                              <span>พัก: {rosterStats.leaveSummary.vacation}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null
                )}

                <p className="mt-5 flex-1 max-w-xl text-[16px] leading-7 text-[#515154]">
                  {app.description}
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs font-medium text-[#7a7a80]">
                    {isActive ? 'เปิดใช้งานโมดูลโปรดักชั่นล่าสุด' : 'โมดูลกำลังถูกติดตั้งในระบบ'}
                  </div>
                  <motion.button
                    whileHover={isActive ? { scale: 1.02 } : {}}
                    whileTap={isActive ? { scale: 0.98 } : {}}
                    type="button"
                    disabled={!isActive}
                    onClick={() => {
                      if (isActive && app.id === 'rework' && onNavigate) {
                        onNavigate();
                      }
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition shadow-lg ${isActive
                      ? 'bg-[#1d1d1f] text-white shadow-black/20 hover:bg-black cursor-pointer'
                      : 'cursor-not-allowed bg-white/50 text-[#9d9da3] ring-1 ring-black/5'
                      }`}
                  >
                    {isActive ? 'เริ่มใช้งาน' : 'พรีวิว'}
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              </motion.article>
            );
          })}
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
                  <p className="mb-1 text-xs font-medium text-slate-500 uppercase tracking-wider">วันศุกร์, 21 มิ.ย.</p>
                  <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f] md:text-3xl">สวัสดี ผู้ใช้งานระบบ</h1>
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
                  { label: "รอประเมินราคา", value: "20" },
                  { label: "เสร็จสิ้น", value: "45" },
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
                    <button className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold bg-white/45 border border-white/45 text-slate-600 shadow-sm hover:bg-white/60">รอประเมินราคา <span className="opacity-65 text-[10px]">20</span></button>
                    <button className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold bg-white/45 border border-white/45 text-slate-600 shadow-sm hover:bg-white/60">เสร็จสิ้น <span className="opacity-65 text-[10px]">45</span></button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100 p-2">

                    {/* Row 1 (Awaiting Valuation) */}
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
                      <div className="mr-6 text-right shrink-0">
                        <p className="text-sm font-semibold text-[#1d1d1f]">120 กล่อง</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">ฝารั่ว, ฉลากขาด</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-violet-100/90 text-violet-950 border-violet-300/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-600 mr-1.5 animate-pulse" />รอประเมินราคา
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
                      <div className="mr-6 text-right shrink-0">
                        <p className="text-sm font-semibold text-[#1d1d1f]">45 กล่อง</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">คราบสกปรก</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-sky-100/90 text-sky-950 border-sky-300/70">กำลังดำเนินการ</span>
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
                      <div className="mr-6 text-right shrink-0">
                        <p className="text-sm font-semibold text-[#1d1d1f]">20 กล่อง</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">ฝารั่ว</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-amber-100/90 text-amber-900 border-amber-300/70">รอดำเนินการ</span>
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
                      <div className="mr-6 text-right shrink-0">
                        <p className="text-sm font-semibold text-[#1d1d1f]">10 กล่อง</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">สีถลอก</p>
                      </div>
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-amber-100/90 text-amber-900 border-amber-300/70">รอดำเนินการ</span>
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

// 3. Mock Update Modal (True UI Style using Real Component)
import { UpdateModal } from '../../../components/modals/UpdateModal';
import { UserRole } from '../../../config/auth.config';

export function MockUpdateModal({ onNavigate }: { onNavigate?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setIsOpen(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Provide mock case data based on the original hardcoded mock
  const mockCaseData: any = {
    id: "RT084-2026",
    caseName: "RT084-2026",
    status: "Pending",
    source: "Customer",
    items: [
      {
        id: "item_1",
        itemName: "Gallon 5L",
        customerName: "",
        amount: 1,
        details: "",
        reason: "",
        reasonSubtype: "",
        responsible: "",
        responsibleSubtype: "",
        imageUrls: [],
      }
    ],
    materials: [],
    laborCount: 0,
    laborHours: 0,
    laborRate: 0,
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-transparent pointer-events-auto">
      <UpdateModal
        isOpen={isOpen}
        caseData={mockCaseData}
        isLoading={false}
        onClose={() => {}}
        onUpdate={async () => {
          // Simulate network delay for realistic presentation
          await new Promise(r => setTimeout(r, 1500));
          if (onNavigate) onNavigate();
        }}
        inline={true}
        userRoleOverride={UserRole.QSMS} // Admin role to enable all edit features
      />
    </div>
  );
}

// 4. Mock Add Case (Exact Clone of MainLayout + AddCaseTab)
export function MockAddCase({ onNavigate, preset }: { onNavigate?: () => void; preset?: 'empty' | 'ptt-or' | 'cross-link' | 'with-item' }) {
  const [activeTab, setActiveTab] = useState<'overall'|'add'|'dashboard'>('add');
  
  return (
    <div className="h-full w-full relative pointer-events-auto">
      <ReworkDataProvider>
        <MainLayout
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'overall' && onNavigate) onNavigate();
            else setActiveTab(tab as any);
          }}
          onLogout={() => {}}
          onBackToPortal={() => {}}
          userName="สมชาย"
          userRole={"OPERATOR" as any}
          onOpenTutorial={() => {}}
        >
          <div className="flex-1 overflow-x-hidden overflow-y-auto w-full h-full">
            <div className="p-8 md:p-10 lg:p-12 w-full max-w-[1200px] mx-auto">
              <MockAddCaseTab preset={preset} />
            </div>
          </div>
        </MainLayout>
      </ReworkDataProvider>
    </div>
  );
}

// 5. Mock Dashboard
export function MockDashboard({ onNavigate }: { onNavigate?: () => void }) {
  const [activeTab, setActiveTab] = useState<'overall'|'add'|'dashboard'>('dashboard');

  return (
    <div className="h-full w-full relative pointer-events-auto">
      <ReworkDataProvider>
        <MainLayout
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'overall' && onNavigate) onNavigate();
            else setActiveTab(tab as any);
          }}
          onLogout={() => {}}
          onBackToPortal={() => {}}
          userName="สมชาย (แดชบอร์ด)"
          userRole={"QSMS" as any}
          onOpenTutorial={() => {}}
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
