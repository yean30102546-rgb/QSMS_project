/**
 * Interactive Dashboard Component with Filters
 * Filters: Date Range, Defect Type (Reason), Status
 * All charts update reactively without page refresh
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingDown, TrendingUp, CheckCircle2, Clock, AlertCircle,
  Package, SlidersHorizontal, X, Calendar,
} from 'lucide-react';
import { ReworkCase } from '../services/api';

interface DashboardProps {
  cases: ReworkCase[];
  isLoading: boolean;
}

export function Dashboard({ cases, isLoading }: DashboardProps) {
  // ===== FILTER STATE =====
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [reasonFilter, setReasonFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ===== EXTRACT UNIQUE VALUES =====
  const uniqueReasons = useMemo(() => {
    const reasons = new Set<string>();
    cases.forEach(c => c.items?.forEach(item => { if (item.reason) reasons.add(item.reason); }));
    return Array.from(reasons).sort();
  }, [cases]);

  // ===== APPLY FILTERS =====
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(c.status)) return false;
      // Reason filter
      if (reasonFilter.length > 0) {
        const hasReason = c.items?.some(item => reasonFilter.includes(item.reason));
        if (!hasReason) return false;
      }
      // Date filter
      if (dateFrom || dateTo) {
        const caseDate = new Date(c.date);
        if (dateFrom && caseDate < new Date(dateFrom)) return false;
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (caseDate > toDate) return false;
        }
      }
      return true;
    });
  }, [cases, statusFilter, reasonFilter, dateFrom, dateTo]);

  const hasActiveFilters = statusFilter.length > 0 || reasonFilter.length > 0 || dateFrom || dateTo;
  const activeFilterCount = (statusFilter.length > 0 ? 1 : 0) + (reasonFilter.length > 0 ? 1 : 0) + (dateFrom || dateTo ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter([]);
    setReasonFilter([]);
    setDateFrom('');
    setDateTo('');
  };

  const toggleArrayFilter = (arr: string[], val: string, setter: (v: string[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  // ===== CALCULATE STATS FROM FILTERED DATA =====
  const stats = useMemo(() => {
    if (!filteredCases || filteredCases.length === 0) {
      return { total: 0, pending: 0, inProgress: 0, completed: 0, completionRate: 0, defectReasons: {} as Record<string, number>, sources: {} as Record<string, number> };
    }
    const defectReasons: Record<string, number> = {};
    const sources: Record<string, number> = {};
    let pending = 0, inProgress = 0, completed = 0;

    filteredCases.forEach(caseItem => {
      if (caseItem.status === 'Pending') pending++;
      else if (caseItem.status === 'In-Progress') inProgress++;
      else if (caseItem.status === 'Completed') completed++;
      sources[caseItem.source] = (sources[caseItem.source] || 0) + 1;
      caseItem.items?.forEach(item => {
        defectReasons[item.reason] = (defectReasons[item.reason] || 0) + 1;
      });
    });

    const total = filteredCases.length;
    return { total, pending, inProgress, completed, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0, defectReasons, sources };
  }, [filteredCases]);

  const defectReasonEntries = Object.entries(stats.defectReasons).sort(([, a], [, b]) => b - a).slice(0, 5);
  const sourceEntries = Object.entries(stats.sources).sort(([, a], [, b]) => b - a);
  const maxDefectCount = Math.max(1, ...defectReasonEntries.map(([, c]) => c));

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-border animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ===== FILTER TOOLBAR ===== */}
      <div className="flex flex-col gap-4">
        {/* Quick Status Pills + Filter Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest mr-1">สถานะ:</span>
            {([
              { key: 'all', label: 'ทั้งหมด', color: 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' },
              { key: 'Pending', label: 'รอดำเนินการ', color: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' },
              { key: 'In-Progress', label: 'กำลังทำ', color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' },
              { key: 'Completed', label: 'เสร็จสิ้น', color: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' },
            ] as const).map(({ key, label, color }) => {
              const isAll = key === 'all';
              const isActive = isAll ? statusFilter.length === 0 : statusFilter.includes(key);
              const count = isAll ? cases.length : cases.filter(c => c.status === key).length;
              return (
                <motion.button key={key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => isAll ? setStatusFilter([]) : toggleArrayFilter(statusFilter, key, setStatusFilter)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${isActive ? color : 'bg-white border border-border text-muted hover:bg-slate-50'}`}
                >
                  {label} <span className={`text-[10px] font-black ${isActive ? 'opacity-80' : 'opacity-50'}`}>{count}</span>
                </motion.button>
              );
            })}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${showFilters || hasActiveFilters ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-white border border-border text-foreground hover:bg-slate-50'}`}
          >
            <SlidersHorizontal size={14} /> ตัวกรองขั้นสูง
            {activeFilterCount > 0 && <span className="bg-white/90 text-accent text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">{activeFilterCount}</span>}
          </motion.button>
        </div>

        {/* Advanced Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-xl shadow-slate-200/20"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center"><SlidersHorizontal size={16} className="text-accent" /></div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">ตัวกรอง Dashboard</h4>
                    <p className="text-[10px] text-muted">เลือกเงื่อนไขเพื่อกรองข้อมูลในกราฟ</p>
                  </div>
                </div>
                <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-muted hover:text-foreground transition-colors"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reason Filter */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.15em]">⚠️ ประเภท Defect (Reason)</label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueReasons.map(reason => (
                      <motion.button key={reason} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => toggleArrayFilter(reasonFilter, reason, setReasonFilter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${reasonFilter.includes(reason) ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >{reason}</motion.button>
                    ))}
                    {uniqueReasons.length === 0 && <span className="text-xs text-muted italic">ไม่มีข้อมูล</span>}
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.15em] flex items-center gap-1.5"><Calendar size={12} /> ช่วงเวลา (Date Range)</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" />
                      <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] text-muted font-bold">เริ่มต้น</span>
                    </div>
                    <span className="text-muted text-xs font-bold">→</span>
                    <div className="flex-1 relative">
                      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" />
                      <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] text-muted font-bold">สิ้นสุด</span>
                    </div>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <p className="text-xs text-muted">พบ <span className="font-bold text-accent">{filteredCases.length}</span> รายการ จากทั้งหมด {cases.length} รายการ</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={clearAllFilters}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all text-xs font-bold">
                    <X size={14} /> ล้างตัวกรองทั้งหมด
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Tags (when panel closed) */}
        <AnimatePresence>
          {hasActiveFilters && !showFilters && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">กรอง:</span>
              {statusFilter.map(s => (
                <span key={`t-s-${s}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                  {s === 'Pending' ? 'รอดำเนินการ' : s === 'In-Progress' ? 'กำลังทำ' : 'เสร็จสิ้น'}
                  <button onClick={() => toggleArrayFilter(statusFilter, s, setStatusFilter)} className="hover:text-amber-900"><X size={10} /></button>
                </span>
              ))}
              {reasonFilter.map(r => (
                <span key={`t-r-${r}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                  {r}
                  <button onClick={() => toggleArrayFilter(reasonFilter, r, setReasonFilter)} className="hover:text-orange-900"><X size={10} /></button>
                </span>
              ))}
              {(dateFrom || dateTo) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  📅 {dateFrom || '...'} → {dateTo || '...'}
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="hover:text-emerald-900"><X size={10} /></button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-[10px] text-red-500 font-bold hover:text-red-700 ml-1 underline underline-offset-2">ล้างทั้งหมด</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== KEY METRICS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="งานทั้งหมด (Total)" value={stats.total.toString()} icon={<Package size={24} className="text-blue-500" />} bgColor="bg-blue-50" trend={`บันทึกแล้ว ${filteredCases.length}`} />
        <MetricCard label="รอดำเนินการ (Pending)" value={stats.pending.toString()} icon={<AlertCircle size={24} className="text-amber-500" />} bgColor="bg-amber-50" trend={`${Math.round((stats.pending / Math.max(stats.total, 1)) * 100)}% ของทั้งหมด`} />
        <MetricCard label="กำลังดำเนินการ (In-Progress)" value={stats.inProgress.toString()} icon={<Clock size={24} className="text-orange-500" />} bgColor="bg-orange-50" trend="กำลังจัดการอยู่" />
        <MetricCard label="อัตราเสร็จสิ้น (Completion)" value={`${stats.completionRate}%`} icon={<CheckCircle2 size={24} className="text-emerald-500" />} bgColor="bg-emerald-50" trend={`เสร็จแล้ว ${stats.completed} รายการ`} />
      </div>

      {/* ===== CHARTS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Defect Reasons Bar Chart */}
        <div className="bg-white rounded-2xl p-8 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">สาเหตุข้อบกพร่อง (Defect Reasons)</h3>
            <TrendingDown size={20} className="text-amber-500" />
          </div>
          {defectReasonEntries.length > 0 ? (
            <div className="space-y-4">
              {defectReasonEntries.map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">{reason}</p>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxDefectCount) * 100}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-amber-400 rounded-full" />
                    </div>
                  </div>
                  <span className="ml-4 text-sm font-bold text-foreground w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-8">ไม่มีข้อมูล (No data available)</p>
          )}
        </div>

        {/* Workload by Source */}
        <div className="bg-white rounded-2xl p-8 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">ปริมาณงานตามแหล่ง (Workload by Source)</h3>
            <TrendingUp size={20} className="text-blue-500" />
          </div>
          {sourceEntries.length > 0 ? (
            <div className="space-y-4">
              {sourceEntries.map(([source, count]) => {
                const percentage = Math.round((count / stats.total) * 100);
                return (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">{source}</p>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="h-full bg-blue-400 rounded-full" />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <span className="text-sm font-bold text-foreground block">{count}</span>
                      <span className="text-xs text-muted">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-8">ไม่มีข้อมูล (No data available)</p>
          )}
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-2xl p-8 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-6">สถานะงาน (Status Distribution)</h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: 'รอดำเนินการ (Pending)', count: stats.pending, color: 'amber' },
            { label: 'กำลังดำเนินการ (In-Progress)', count: stats.inProgress, color: 'orange' },
            { label: 'เสร็จสิ้น (Completed)', count: stats.completed, color: 'emerald' },
          ].map(({ label, count, color }) => {
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            const colorClasses: Record<string, string> = {
              amber: 'bg-amber-100 text-amber-700',
              orange: 'bg-orange-100 text-orange-700',
              emerald: 'bg-emerald-100 text-emerald-700',
            };
            return (
              <div key={label} className="text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${colorClasses[color]}`}>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs font-semibold">{percentage}%</div>
                  </div>
                </div>
                <p className="font-medium text-foreground text-sm">{label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===== MetricCard Sub-Component =====
interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  trend?: string;
}

function MetricCard({ label, value, icon, bgColor, trend }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-border">
      <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">{label}</p>
      <h3 className="text-3xl font-bold text-foreground mb-2">{value}</h3>
      {trend && <p className="text-xs text-muted font-medium">{trend}</p>}
    </div>
  );
}
