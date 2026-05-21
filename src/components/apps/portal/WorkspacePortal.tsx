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

import type { User } from '../../../services/auth';
import type { PortalAppDefinition } from '../../../modules/platform/types';
import { fetchAllCases } from '../../../services/api';
import { fetchRosterMonth } from '../../../services/rosterApi';

interface WorkspacePortalProps {
  user: User | null;
  apps: PortalAppDefinition[];
  onOpenApp: (route: PortalAppDefinition['route']) => void;
  onLogout: () => void;
}

export function WorkspacePortal({
  user,
  apps,
  onOpenApp,
  onLogout,
}: WorkspacePortalProps) {
  const greetingName = user?.name || 'User';
  
  // Preview Stats State
  const [reworkStats, setReworkStats] = useState({ pending: '--', inProgress: '--', efficiency: '92%' });
  const [rosterStats, setRosterStats] = useState({ employees: '--', todayActive: '12', status: 'ปกติ' });

  useEffect(() => {
    // Current Month Key for Roster (YYYY-MM)
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Fetch Rework Stats Preview
    const fetchRework = async () => {
      try {
        const response = await fetchAllCases();
        if (response.success && response.data) {
          const pending = response.data.filter(c => c.status === 'Pending' || c.status === 'Awaiting Valuation').length;
          const inProgress = response.data.filter(c => c.status === 'In-Progress').length;
          setReworkStats(prev => ({ 
            ...prev, 
            pending: pending.toString(), 
            inProgress: inProgress.toString() 
          }));
        }
      } catch (err) {
        console.error('Failed to fetch rework preview:', err);
      }
    };

    // Fetch Roster Stats Preview
    const fetchRoster = async () => {
      try {
        const response = await fetchRosterMonth(monthKey);
        if (response.success && response.data && response.data.employees) {
          setRosterStats(prev => ({ 
            ...prev, 
            employees: response.data!.employees.length.toString() 
          }));
        }
      } catch (err) {
        console.error('Failed to fetch roster preview:', err);
      }
    };

    fetchRework();
    fetchRoster();
  }, []);

  return (
    <div className="apple-shell flex min-h-screen flex-col overflow-y-auto bg-gradient-to-br from-[#F0F7FF] via-[#FFFFFF] to-[#F5F9FF]">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,102,204,0.1),transparent_70%)]" />
        <div className="absolute -right-24 bottom-6 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(61,89,124,0.1),transparent_70%)]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col px-5 py-6 md:px-8 lg:px-12">
        <header className="glass-panel mb-10 flex items-center justify-between rounded-[28px] px-5 py-4 shadow-xl shadow-blue-900/5 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
              <LayoutGrid size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600/70">Central Control</p>
              <h1 className="text-lg font-bold tracking-[-0.02em] text-[#1d1d1f]">ศูนย์ควบคุมกลาง</h1>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onLogout}
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
            className="glass-panel rounded-[36px] px-6 py-8 shadow-2xl shadow-blue-900/5 md:px-10 md:py-12"
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-600/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600/80">
              <Sparkles size={12} />
              Welcome to the Workspace
            </p>
            <h2 className="max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-0.03em] text-[#1d1d1f] md:text-5xl">
              สวัสดีคุณ {greetingName}, ยินดีต้อนรับสู่ระบบงานกลาง
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
            className="glass-panel flex flex-col gap-4 rounded-[36px] p-5 shadow-2xl shadow-blue-900/5"
          >
            <div className="rounded-[28px] bg-blue-600/10 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600/70">โปรไฟล์ของคุณ</p>
              <p className="mt-3 text-xl font-bold tracking-[-0.02em] text-[#1d1d1f]">{user?.role?.toUpperCase() || 'USER'}</p>
              <p className="mt-1 text-sm leading-6 text-[#515154]">{user?.email || 'เข้าสู่ระบบด้วยสิทธิ์ Platform'}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[28px] bg-white/40 p-5 border border-white/40">
                <div className="mb-2 flex items-center gap-2 text-blue-600">
                  <ShieldCheck size={16} />
                  <span className="text-sm font-bold">ความปลอดภัย</span>
                </div>
                <p className="text-sm leading-6 text-[#515154]">ระบบรักษาความปลอดภัยด้วย Token ชั่วคราว และการแยกสิทธิ์ตามบทบาท</p>
              </div>
              <div className="rounded-[28px] bg-white/40 p-5 border border-white/40">
                <div className="mb-2 flex items-center gap-2 text-blue-600">
                  <Clock3 size={16} />
                  <span className="text-sm font-bold">สถานะระบบ</span>
                </div>
                <p className="text-sm leading-6 text-[#515154]">โมดูล Rework เปิดใช้งานแล้ว โมดูล Roster กำลังอยู่ในขั้นตอนเตรียมการ</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {apps.map((app, index) => {
            const isActive = app.status === 'active';
            const accentClasses =
              app.accent === 'blue'
                ? 'bg-blue-50/50 border-blue-200/50 shadow-blue-900/5'
                : 'bg-amber-50/50 border-amber-200/50 shadow-amber-900/5';

            return (
              <motion.article
                key={app.id}
                whileHover={isActive ? { y: -4, scale: 1.005 } : {}}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 + index * 0.08 }}
                className={`glass-panel relative flex flex-col overflow-hidden rounded-[32px] border p-7 shadow-xl transition-all ${accentClasses}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-[11px] font-bold uppercase tracking-[0.22em] ${app.accent === 'blue' ? 'text-blue-600/70' : 'text-amber-600/70'}`}>
                      {app.subtitle === 'Modular Platform' ? 'โมดูลเสริม' : 'แกนหลักระบบ'}
                    </p>
                    <h3 className="mt-3 text-[32px] font-bold leading-[1.06] text-[#1d1d1f]">
                      {app.title === 'Rework Operations' ? 'ระบบจัดการงาน Rework' : 'ระบบตารางเวร ShiftHub'}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                      isActive ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    {isActive ? 'พร้อมใช้งาน' : 'เร็วๆ นี้'}
                  </span>
                </div>

                {/* App Preview Section */}
                {isActive && (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {app.id === 'rework' ? (
                      <>
                        <div className="rounded-2xl bg-white/50 p-3 shadow-sm border border-white/40">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">รอประเมิน</p>
                          <p className="mt-1 text-xl font-bold text-blue-600">{reworkStats.pending}</p>
                        </div>
                        <div className="rounded-2xl bg-white/50 p-3 shadow-sm border border-white/40">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">กำลังซ่อม</p>
                          <p className="mt-1 text-xl font-bold text-amber-600">{reworkStats.inProgress}</p>
                        </div>
                        <div className="rounded-2xl bg-white/50 p-3 shadow-sm border border-white/40">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ประสิทธิภาพ</p>
                          <p className="mt-1 text-xl font-bold text-green-600">{reworkStats.efficiency}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="rounded-2xl bg-white/50 p-3 shadow-sm border border-white/40">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">พนักงาน</p>
                          <div className="mt-1 flex items-center gap-1">
                            <Users2 size={14} className="text-blue-600" />
                            <p className="text-xl font-bold text-slate-800">{rosterStats.employees}</p>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white/50 p-3 shadow-sm border border-white/40">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">เวรวันนี้</p>
                          <div className="mt-1 flex items-center gap-1">
                            <CalendarDays size={14} className="text-amber-600" />
                            <p className="text-xl font-bold text-slate-800">{rosterStats.todayActive}</p>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white/50 p-3 shadow-sm border border-white/40">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">สถานะกะ</p>
                          <div className="mt-1 flex items-center gap-1">
                            <Activity size={14} className="text-green-600" />
                            <p className="text-xl font-bold text-green-600">{rosterStats.status}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <p className="mt-5 flex-1 max-w-xl text-[16px] leading-7 text-[#515154]">
                  {app.title === 'Rework Operations' 
                    ? 'ระบบติดตามและบันทึกงานซ่อมแซม พร้อม Dashboard รายงานผลและระบบ ItemMaster'
                    : 'ระบบบริหารจัดการตารางเวลาทำงานของพนักงาน และตารางเวรที่ปรับเปลี่ยนได้ตามต้องการ'}
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
                    onClick={() => onOpenApp(app.route)}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition shadow-lg ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
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
