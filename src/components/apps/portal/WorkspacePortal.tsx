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
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';

const RagApp = dynamic(() => import('../../../modules/rag/RagApp').then(mod => mod.RagApp), { ssr: false });

import type { User } from '../../../services/auth';
import type { PortalAppDefinition } from '../../../modules/platform/types';

interface WorkspacePortalProps {
  user: User | null;
  apps: PortalAppDefinition[];
  onOpenApp: (route: PortalAppDefinition['route']) => void;
  onLogout: () => void;
  onLogin?: () => void;
}

export function WorkspacePortal({
  user,
  apps,
  onOpenApp,
  onLogout,
  onLogin,
}: WorkspacePortalProps) {
  const isGuest = !user;
  const greetingName = user?.name || 'ผู้เยี่ยมชม';
  const [isRagOpen, setIsRagOpen] = useState(false);

  // Preview Stats State
  const [reworkStats, setReworkStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    awaitingValuation: 0,
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

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch('/api/rework', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fetchPublicOverview' })
        });
        const resJson = await response.json();
        if (resJson.success && resJson.data) {
          const { rework, roster } = resJson.data;
          setReworkStats({
            total: rework.total,
            pending: rework.pending,
            inProgress: rework.inProgress,
            awaitingValuation: rework.awaitingValuation,
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
      } catch (err) {
        console.error('Failed to fetch public stats overview:', err);
      }
    };
    fetchOverview();
  }, []);

  return (
    <div className="apple-shell flex min-h-screen flex-col overflow-y-auto bg-slate-50">
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

          {isGuest ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onLogin}
              className="rounded-xl bg-[#1d1d1f] px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-black"
            >
              เข้าสู่ระบบ
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-black/5 bg-white/60 px-4 py-2 text-sm font-semibold text-[#1d1d1f] shadow-sm backdrop-blur-md transition-colors hover:bg-white"
            >
              ออกจากระบบ
            </motion.button>
          )}
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
                  <p className="mt-3 text-xl font-semibold tracking-[-0.02em] text-[#1d1d1f]">{user?.role?.toUpperCase() || 'USER'}</p>
                  <p className="mt-1 text-sm leading-6 text-[#515154]">{user?.email || 'เข้าสู่ระบบด้วยสิทธิ์ Platform'}</p>
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

        <section className="grid gap-6 lg:grid-cols-2">
          {apps.filter(app => {
            const isRestrictedRole = user?.role === 'OPERATOR';
            return !(app.id === 'roster' && isRestrictedRole);
          }).map((app, index) => {
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
                    <p className={`text-sm font-medium ${app.accent === 'blue' ? 'text-slate-500' : app.accent === 'purple' ? 'text-purple-600' : 'text-amber-600'}`}>
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
                          ข้อมูลจริงล่าสุด (Live): คืบหน้า ({reworkStats.hasData ? `${reworkStats.completed}/${reworkStats.total}` : '--/--'} เสร็จ)
                        </span>
                        <span className="text-emerald-600 font-semibold">{reworkStats.hasData ? `${reworkStats.completionRate}%` : '--%'}</span>
                      </div>

                      {/* Proportional Segmented Progress Bar */}
                      <div className="relative flex h-3.5 w-full overflow-hidden rounded-full bg-slate-200/50 shadow-inner">
                        {!reworkStats.hasData ? (
                          <div className="h-full w-full bg-slate-300/40 animate-pulse" />
                        ) : reworkStats.total === 0 ? (
                          <div className="h-full w-full bg-slate-200 flex items-center justify-center text-[9px] font-medium text-slate-500">
                            ไม่มีเคสในระบบ
                          </div>
                        ) : (
                          <>
                            {reworkStats.pending > 0 && (
                              <div
                                style={{ width: `${(reworkStats.pending / reworkStats.total) * 100}%` }}
                                className="h-full bg-amber-400 transition-all duration-500 hover:brightness-95"
                                title={`รอดำเนินการ: ${reworkStats.pending} เคส`}
                              />
                            )}
                            {reworkStats.inProgress > 0 && (
                              <div
                                style={{ width: `${(reworkStats.inProgress / reworkStats.total) * 100}%` }}
                                className="h-full bg-sky-400 transition-all duration-500 hover:brightness-95"
                                title={`กำลังดำเนินการ: ${reworkStats.inProgress} เคส`}
                              />
                            )}
                            {reworkStats.awaitingValuation > 0 && (
                              <div
                                style={{ width: `${(reworkStats.awaitingValuation / reworkStats.total) * 100}%` }}
                                className="h-full bg-violet-400 transition-all duration-500 hover:brightness-95"
                                title={`รอประเมินราคา: ${reworkStats.awaitingValuation} เคส`}
                              />
                            )}
                            {reworkStats.completed > 0 && (
                              <div
                                style={{ width: `${(reworkStats.completed / reworkStats.total) * 100}%` }}
                                className="h-full bg-emerald-500 transition-all duration-500 hover:brightness-95"
                                title={`เสร็จสิ้น: ${reworkStats.completed} เคส`}
                              />
                            )}
                          </>
                        )}
                      </div>

                      {/* Legend Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4 mt-0.5 px-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          <span className="text-slate-500">รอดำเนินการ:</span>
                          <span className="font-semibold text-slate-800">{reworkStats.hasData ? reworkStats.pending : '--'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                          <span className="h-2 w-2 rounded-full bg-sky-400" />
                          <span className="text-slate-500">กำลังดำเนินการ:</span>
                          <span className="font-semibold text-slate-800">{reworkStats.hasData ? reworkStats.inProgress : '--'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                          <span className="h-2 w-2 rounded-full bg-violet-400" />
                          <span className="text-slate-500">รอประเมินราคา:</span>
                          <span className="font-semibold text-slate-800">{reworkStats.hasData ? reworkStats.awaitingValuation : '--'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-500">เสร็จสิ้น:</span>
                          <span className="font-semibold text-slate-800">{reworkStats.hasData ? reworkStats.completed : '--'}</span>
                        </div>
                      </div>
                    </div>
                  ) : app.id === 'roster' ? (
                    <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                      {/* Top Stats: Present vs Leave */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col justify-center rounded-2xl bg-emerald-50 p-3.5 border border-emerald-100 shadow-sm">
                          <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                            <Users2 size={14} className="text-emerald-600" />
                            <span className="text-xs font-medium">บุคลากรพร้อมปฏิบัติงาน</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-emerald-800 leading-none">
                              {rosterStats.hasData ? rosterStats.staffPresentCount : '--'}
                            </span>
                            {rosterStats.hasData && (
                              <span className="text-xs font-medium text-emerald-600/80">
                                / {rosterStats.totalEmployees}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-center rounded-2xl bg-white p-3.5 border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-1.5 text-slate-500 mb-1.5">
                            <CalendarDays size={14} />
                            <span className="text-xs font-medium">ลาพักวันนี้</span>
                          </div>

                          {/* Leave Breakdown */}
                          {!rosterStats.hasData ? (
                            <div className="text-lg font-bold text-slate-400">--</div>
                          ) : rosterStats.onLeaveCount === 0 ? (
                            <div className="text-sm font-medium text-slate-400 mt-1">ไม่มีผู้ลาพัก</div>
                          ) : (
                            <div className="flex gap-2">
                              {rosterStats.leaveSummary.sick > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-xs font-medium border border-rose-100">
                                  <span>ป่วย:</span>
                                  <span>{rosterStats.leaveSummary.sick}</span>
                                </div>
                              )}
                              {rosterStats.leaveSummary.business > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-xs font-medium border border-amber-100">
                                  <span>กิจ:</span>
                                  <span>{rosterStats.leaveSummary.business}</span>
                                </div>
                              )}
                              {rosterStats.leaveSummary.vacation > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-50 text-violet-600 text-xs font-medium border border-violet-100">
                                  <span>พักผ่อน:</span>
                                  <span>{rosterStats.leaveSummary.vacation}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Retention Rate Bar */}
                      <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-white p-3.5 border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center px-1">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-medium text-slate-500">อัตราการมาทำงานสะสม (Live)</span>
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {rosterStats.hasData ? `${rosterStats.retentionRate}%` : '--%'}
                          </span>
                        </div>

                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200/60 shadow-inner">
                          {rosterStats.hasData && (
                            <div
                              className="h-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-1000 ease-out"
                              style={{ width: `${rosterStats.retentionRate}%` }}
                            />
                          )}
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
                      if (app.route === 'rag') {
                        setIsRagOpen(true);
                      } else {
                        onOpenApp(app.route);
                      }
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition shadow-lg ${isActive
                        ? 'bg-[#1d1d1f] text-white shadow-black/20 hover:bg-black'
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


      {/* RAG Chat Modal */}
      <RagApp user={user} open={isRagOpen} onOpenChange={setIsRagOpen} />
    </div>
  );
}
