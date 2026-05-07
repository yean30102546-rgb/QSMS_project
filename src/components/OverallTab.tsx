import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, Filter, Plus, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';

import { useOverallFilters } from '../hooks/useOverallFilters';
import type { ReworkCase } from '../services/api';
import { CaseListTable } from './CaseListTable';
import { Pagination } from './Pagination';
import { Tooltip } from './Tooltip';

interface OverallStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

interface OverallTabProps {
  cases: ReworkCase[];
  isLoadingCases: boolean;
  caseError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadCases: () => void;
  openUpdateModal: (caseItem: ReworkCase) => void;
  stats: OverallStats;
}

export function OverallTab({
  cases,
  isLoadingCases,
  caseError,
  searchQuery,
  setSearchQuery,
  loadCases,
  openUpdateModal,
  stats,
}: OverallTabProps) {
  const {
    activeFilterCount,
    clearAllFilters,
    currentPage,
    dateFromFilter,
    dateToFilter,
    filteredCases,
    hasActiveFilters,
    itemsPerPage,
    paginatedCases,
    reasonFilter,
    removeFilter,
    responsibleFilter,
    setCurrentPage,
    setDateFromFilter,
    setDateToFilter,
    setReasonFilter,
    setResponsibleFilter,
    setShowFilters,
    setSourceFilter,
    setStatusFilter,
    showFilters,
    sourceFilter,
    statusCounts,
    statusFilter,
    toggleStatusFilter,
    totalPages,
    uniqueReasons,
    uniqueResponsible,
    uniqueSources,
  } = useOverallFilters(cases, searchQuery);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg">
      <div className="flex-shrink-0 space-y-12 overflow-hidden border-b border-border px-0 py-8">
        <div className="px-8 md:px-10 lg:px-12">
          <header className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-muted">
                {new Date().toLocaleDateString('th-TH', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <h1 className="text-3xl font-medium tracking-tight text-foreground">สวัสดีตอนเช้า Admin</h1>
            </div>
            <div className="flex gap-2">
              <Tooltip text="รีเฟรชข้อมูลจากฐานข้อมูล">
                <button
                  onClick={loadCases}
                  disabled={isLoadingCases}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw size={20} className={isLoadingCases ? 'animate-spin' : ''} />
                </button>
              </Tooltip>

            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <StatCard label="จำนวนงานทั้งหมด (Total)" value={stats.total.toString()} />
            <StatCard
              label="รอดำเนินการ (Pending)"
              value={stats.pending.toString()}
              trend={`${Math.round((stats.pending / (stats.total || 1)) * 100)}%`}
            />
            <StatCard label="กำลังดำเนินการ (In-Progress)" value={stats.inProgress.toString()} />
            <StatCard label="เสร็จสิ้น (Completed)" value={stats.completed.toString()} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide bg-bg">
        <div className="px-8 py-8 md:px-10 lg:px-12">
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-semibold italic tracking-tight text-foreground underline decoration-accent/20 underline-offset-4">
                  รายการงาน Rework ล่าสุด
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                    <input
                      type="text"
                      placeholder="ค้นหา ID, ชื่อสินค้า..."
                      className="w-56 rounded-xl border border-border bg-white py-2 pl-9 pr-4 text-xs font-medium transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      showFilters || hasActiveFilters
                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                        : 'border border-border bg-white text-foreground hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <SlidersHorizontal size={14} />
                    ตัวกรองขั้นสูง
                    {activeFilterCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] font-black text-accent">
                        {activeFilterCount}
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-muted">สถานะ:</span>
                {(['all', 'Pending', 'In-Progress', 'Completed'] as const).map((status) => {
                  const isAll = status === 'all';
                  const isActive = isAll ? statusFilter.length === 0 : statusFilter.includes(status);
                  const count = isAll ? cases.length : statusCounts[status] || 0;
                  const thaiLabel =
                    isAll
                      ? 'ทั้งหมด'
                      : status === 'Pending'
                        ? 'รอดำเนินการ'
                        : status === 'In-Progress'
                          ? 'กำลังทำ'
                          : 'เสร็จสิ้น';

                  const activeColors = isAll
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                    : status === 'Pending'
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                      : status === 'In-Progress'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';

                  return (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (isAll) {
                          setStatusFilter([]);
                        } else {
                          toggleStatusFilter(status);
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                        isActive
                          ? activeColors
                          : 'border border-border bg-white text-muted hover:bg-slate-50 hover:text-foreground'
                      }`}
                    >
                      {thaiLabel}
                      <span className={`text-[10px] font-black ${isActive ? 'opacity-80' : 'opacity-50'}`}>{count}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-xl shadow-slate-200/20 backdrop-blur-xl"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                        <Filter size={16} className="text-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">ตัวกรองขั้นสูง</h4>
                        <p className="text-[10px] text-muted">เลือกเงื่อนไขเพื่อกรองข้อมูล</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-slate-100 hover:text-foreground"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">แหล่งที่มา (Source)</label>
                      <div className="flex flex-wrap gap-2">
                        {uniqueSources.map((source) => {
                          const isSelected = sourceFilter.includes(source);
                          return (
                            <motion.button
                              key={source}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (isSelected) setSourceFilter(sourceFilter.filter((s) => s !== source));
                                else setSourceFilter([...sourceFilter, source]);
                              }}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                isSelected ? 'bg-accent text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {source}
                            </motion.button>
                          );
                        })}
                        {uniqueSources.length === 0 && <span className="text-xs italic text-muted">ไม่มีข้อมูล</span>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">ประเภท Defect (Reason)</label>
                      <div className="max-h-28 overflow-y-auto flex flex-wrap gap-2">
                        {uniqueReasons.map((reason) => {
                          const isSelected = reasonFilter.includes(reason);
                          return (
                            <motion.button
                              key={reason}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (isSelected) setReasonFilter(reasonFilter.filter((r) => r !== reason));
                                else setReasonFilter([...reasonFilter, reason]);
                              }}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                isSelected ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {reason}
                            </motion.button>
                          );
                        })}
                        {uniqueReasons.length === 0 && <span className="text-xs italic text-muted">ไม่มีข้อมูล</span>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">ผู้รับผิดชอบ (Responsible)</label>
                      <div className="max-h-28 overflow-y-auto flex flex-wrap gap-2">
                        {uniqueResponsible.map((responsible) => {
                          const isSelected = responsibleFilter.includes(responsible);
                          return (
                            <motion.button
                              key={responsible}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (isSelected) setResponsibleFilter(responsibleFilter.filter((r) => r !== responsible));
                                else setResponsibleFilter([...responsibleFilter, responsible]);
                              }}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                                isSelected ? 'bg-violet-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {responsible}
                            </motion.button>
                          );
                        })}
                        {uniqueResponsible.length === 0 && <span className="text-xs italic text-muted">ไม่มีข้อมูล</span>}
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-2 lg:col-span-3">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
                        <Calendar size={12} /> ช่วงเวลา (Date Range)
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input
                            type="date"
                            value={dateFromFilter}
                            onChange={(e) => setDateFromFilter(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                          <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-bold text-muted">เริ่มต้น</span>
                        </div>
                        <span className="text-xs font-bold text-muted">→</span>
                        <div className="relative flex-1">
                          <input
                            type="date"
                            value={dateToFilter}
                            onChange={(e) => setDateToFilter(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                          <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-bold text-muted">สิ้นสุด</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <p className="text-xs text-muted">
                        พบ <span className="font-bold text-accent">{filteredCases.length}</span> รายการ จากทั้งหมด {cases.length} รายการ
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={clearAllFilters}
                        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100"
                      >
                        <X size={14} /> ล้างตัวกรองทั้งหมด
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {hasActiveFilters && !showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex flex-wrap items-center gap-2 px-1"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">กรอง:</span>
                  {statusFilter.map((s) => (
                    <span key={`tag-s-${s}`} className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                      {s === 'Pending' ? 'รอดำเนินการ' : s === 'In-Progress' ? 'กำลังทำ' : 'เสร็จสิ้น'}
                      <button onClick={() => removeFilter('status', s)} className="hover:text-amber-900"><X size={10} /></button>
                    </span>
                  ))}
                  {sourceFilter.map((s) => (
                    <span key={`tag-src-${s}`} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                      {s}
                      <button onClick={() => removeFilter('source', s)} className="hover:text-blue-900"><X size={10} /></button>
                    </span>
                  ))}
                  {reasonFilter.map((r) => (
                    <span key={`tag-r-${r}`} className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700">
                      {r}
                      <button onClick={() => removeFilter('reason', r)} className="hover:text-orange-900"><X size={10} /></button>
                    </span>
                  ))}
                  {responsibleFilter.map((r) => (
                    <span key={`tag-rsp-${r}`} className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                      {r}
                      <button onClick={() => removeFilter('responsible', r)} className="hover:text-violet-900"><X size={10} /></button>
                    </span>
                  ))}
                  {(dateFromFilter || dateToFilter) && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      {dateFromFilter || '...'} → {dateToFilter || '...'}
                      <button onClick={() => removeFilter('date')} className="hover:text-emerald-900"><X size={10} /></button>
                    </span>
                  )}
                  <button onClick={clearAllFilters} className="ml-1 text-[10px] font-bold text-red-500 underline underline-offset-2 hover:text-red-700">
                    ล้างทั้งหมด
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <CaseListTable
              cases={paginatedCases}
              isLoading={isLoadingCases}
              error={caseError}
              isEmpty={cases.length === 0}
              isFilterEmpty={filteredCases.length === 0}
              onRowClick={openUpdateModal}
              onRetry={loadCases}
              onClearFilters={clearAllFilters}
              searchQuery={searchQuery}
              hasActiveFilters={hasActiveFilters}
              skeletonCount={itemsPerPage}
            />
          </div>
        </div>
      </div>

      {filteredCases.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredCases.length}
          isFiltered={hasActiveFilters}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
}

function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="stat-card rounded-2xl border border-border bg-white p-6">
      <p className="mb-3 text-[10px] font-bold uppercase leading-none tracking-[0.1em] text-muted">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <h3 className="text-[28px] font-bold leading-none tracking-tighter text-foreground">{value}</h3>
        {trend && (
          <span className="rounded-full border border-border bg-slate-50 px-2 py-0.5 text-[9px] font-bold uppercase leading-none tracking-widest text-muted">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
