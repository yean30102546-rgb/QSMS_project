import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, Filter, Plus, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';

import { useOverallFilters } from '../../hooks/useOverallFilters';
import { CaseStatistics } from '../../utils/helpers';
import type { ReworkCase } from '../../services/api';
import { CaseListTable } from '../ui/CaseListTable';
import { Pagination } from '../ui/Pagination';
import { Tooltip } from '../ui/Tooltip';

interface OverallTabProps {
  cases: ReworkCase[];
  isLoadingCases: boolean;
  caseError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadCases: () => void;
  openUpdateModal: (caseItem: ReworkCase) => void;
  stats: CaseStatistics;
  userRole?: string;
  userName?: string;
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
  userRole = 'Admin',
  userName = 'User',
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
    <div className="flex h-full flex-col overflow-hidden bg-transparent">
      <div className="flex-shrink-0 border-b border-white/20 bg-white/20 backdrop-blur-md px-0 py-6 md:py-8 lg:py-10 shadow-sm shadow-primary/5">
        <div className="px-4 md:px-10 lg:px-12">
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-medium text-on-surface-variant/80 uppercase tracking-wider">
                {new Date().toLocaleDateString('th-TH', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-primary md:text-3xl">
                สวัสดี {
                  userRole.toLowerCase() === 'admin' ? 'ผู้ดูแลระบบ' :
                  userRole.toLowerCase() === 'qsms' ? 'แผนก QSMS' :
                  userRole.toLowerCase() === 'pdb' ? 'แผนก PDB' :
                  userRole.toLowerCase() === 'finance' ? 'แผนกการเงิน' :
                  userRole.toLowerCase() === 'management' ? 'ฝ่ายบริหาร' :
                  userRole.toUpperCase()
                }
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip text="รีเฟรชข้อมูล">
                <button
                  onClick={loadCases}
                  disabled={isLoadingCases}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/40 text-primary transition-all hover:bg-white/80 disabled:opacity-50 active:scale-95 shadow-sm"
                >
                  <RefreshCw size={18} className={isLoadingCases ? 'animate-spin' : ''} />
                </button>
              </Tooltip>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-5">
            <StatCard label="จำนวนงานทั้งหมด" value={stats.total.toString()} />
            <StatCard
              label="รอดำเนินการ"
              value={stats.pending.toString()}
              trend={`${Math.round((stats.pending / (stats.total || 1)) * 100)}%`}
            />
            <StatCard label="กำลังดำเนินการ" value={stats.inProgress.toString()} />
            <StatCard label="รอประเมินราคา" value={stats.awaitingValuation.toString()} />
            <StatCard label="เสร็จสิ้น" value={stats.completed.toString()} />
          </div>
        </div>
      </div>


      <div className="flex-1 overflow-y-auto scrollbar-hide bg-transparent">
        <div className="px-4 py-6 md:px-10 md:py-8 lg:px-12">
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                <h3 className="text-sm font-semibold tracking-tight text-primary md:text-base">
                  รายการงาน Rework ล่าสุด
                </h3>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/80" size={14} />
                    <input
                      type="text"
                      placeholder="ค้นหา..."
                      className="w-full rounded-xl border border-white/45 bg-white/45 backdrop-blur-sm py-2.5 pl-9 pr-4 text-xs font-medium text-primary transition-all placeholder:text-on-surface-variant/60 focus:bg-white/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:h-auto shadow-sm ${
                      showFilters || hasActiveFilters
                        ? 'bg-primary text-white shadow-md shadow-primary/25 border border-primary/20'
                        : 'border border-white/45 bg-white/45 text-on-surface-variant hover:bg-white/60 hover:text-primary'
                    }`}
                  >
                    <SlidersHorizontal size={14} />
                    ตัวกรอง
                    {activeFilterCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
                        {activeFilterCount}
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center gap-2 px-1 overflow-x-auto pb-2 scrollbar-hide">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/85">สถานะ:</span>
                {(['all', 'Pending', 'In-Progress', 'Awaiting Valuation', 'Completed'] as const).map((status) => {
                  const isAll = status === 'all';
                  const isActive = isAll ? statusFilter.length === 0 : statusFilter.includes(status);
                  const count = isAll ? cases.length : statusCounts[status] || 0;
                  const thaiLabel =
                    isAll
                      ? 'ทั้งหมด'
                      : status === 'Pending'
                        ? 'รอดำเนินการ'
                        : status === 'In-Progress'
                          ? 'กำลังดำเนินการ'
                          : status === 'Awaiting Valuation'
                            ? 'รอประเมินราคา'
                            : 'เสร็จสิ้น';

                  const activeColors = isAll
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : status === 'Pending'
                      ? 'bg-tertiary text-white shadow-md shadow-tertiary/20'
                      : status === 'In-Progress'
                        ? 'bg-[#7c98b3] text-white shadow-md shadow-[#7c98b3]/25'
                        : status === 'Awaiting Valuation'
                          ? 'bg-secondary text-white shadow-md shadow-secondary/20'
                          : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20';

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
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all border border-transparent shadow-sm ${
                        isActive
                          ? activeColors
                          : 'border-white/45 bg-white/45 text-on-surface-variant hover:bg-white/60 hover:text-primary'
                      }`}
                    >
                      {thaiLabel}
                      <span className={`text-[10px] font-bold ${isActive ? 'opacity-90' : 'opacity-65'}`}>{count}</span>
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
                  className="rounded-2xl border border-white/50 bg-white/85 p-6 shadow-xl shadow-primary/5 backdrop-blur-2xl"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Filter size={16} className="text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-primary">ตัวกรองขั้นสูง</h4>
                        <p className="text-[10px] text-on-surface-variant/80">เลือกเงื่อนไขเพื่อคัดกรองข้อมูล</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white/60 hover:text-primary"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">แหล่งที่มา (Source)</label>
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
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border shadow-sm ${
                                isSelected
                                  ? 'bg-primary text-white border-primary/20 shadow-primary/20'
                                  : 'border-white/50 bg-white/40 text-on-surface-variant hover:bg-white/60 hover:text-primary'
                              }`}
                            >
                              {source}
                            </motion.button>
                          );
                        })}
                        {uniqueSources.length === 0 && <span className="text-xs italic text-on-surface-variant/70">ไม่มีข้อมูล</span>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant">ประเภท Defect (Reason)</label>
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
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border shadow-sm ${
                                isSelected
                                  ? 'bg-tertiary text-white border-tertiary/20 shadow-tertiary/20'
                                  : 'border-white/50 bg-white/40 text-on-surface-variant hover:bg-white/60 hover:text-primary'
                              }`}
                            >
                              {reason}
                            </motion.button>
                          );
                        })}
                        {uniqueReasons.length === 0 && <span className="text-xs italic text-on-surface-variant/70">ไม่มีข้อมูล</span>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant">ผู้รับผิดชอบ (Responsible)</label>
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
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border shadow-sm ${
                                isSelected
                                  ? 'bg-secondary text-white border-secondary/20 shadow-secondary/20'
                                  : 'border-white/50 bg-white/40 text-on-surface-variant hover:bg-white/60 hover:text-primary'
                              }`}
                            >
                              {responsible}
                            </motion.button>
                          );
                        })}
                        {uniqueResponsible.length === 0 && <span className="text-xs italic text-on-surface-variant/70">ไม่มีข้อมูล</span>}
                      </div>
                    </div>

                    <div className="space-y-3 md:col-span-2 lg:col-span-3">
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
                        <Calendar size={12} /> ช่วงเวลา (Date Range)
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input
                            type="date"
                            value={dateFromFilter}
                            onChange={(e) => setDateFromFilter(e.target.value)}
                            className="w-full rounded-xl border border-white/45 bg-white/45 px-4 py-2.5 text-sm font-semibold transition-all focus:bg-white/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                          />
                          <span className="absolute -top-2 left-3 bg-white/95 backdrop-blur-sm px-1 text-[9px] font-semibold text-on-surface-variant">เริ่มต้น</span>
                        </div>
                        <span className="text-xs font-semibold text-on-surface-variant">→</span>
                        <div className="relative flex-1">
                          <input
                            type="date"
                            value={dateToFilter}
                            onChange={(e) => setDateToFilter(e.target.value)}
                            className="w-full rounded-xl border border-white/45 bg-white/45 px-4 py-2.5 text-sm font-semibold transition-all focus:bg-white/80 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                          />
                          <span className="absolute -top-2 left-3 bg-white/95 backdrop-blur-sm px-1 text-[9px] font-semibold text-on-surface-variant">สิ้นสุด</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4">
                      <p className="text-xs text-on-surface-variant/80">
                        พบ <span className="font-semibold text-primary">{filteredCases.length}</span> รายการ จากทั้งหมด {cases.length} รายการ
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={clearAllFilters}
                        className="flex items-center gap-1.5 rounded-xl border border-red-200/50 bg-red-50/50 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-100/60 shadow-sm"
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
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">กรอง:</span>
                  {statusFilter.map((s) => (
                    <span key={`tag-s-${s}`} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
                      {s === 'Pending' ? 'รอดำเนินการ' : s === 'In-Progress' ? 'กำลังดำเนินการ' : s === 'Awaiting Valuation' ? 'รอประเมินราคา' : 'เสร็จสิ้น'}
                      <button onClick={() => removeFilter('status', s)} className="hover:text-amber-900"><X size={10} /></button>
                    </span>
                  ))}
                  {sourceFilter.map((s) => (
                    <span key={`tag-src-${s}`} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                      {s}
                      <button onClick={() => removeFilter('source', s)} className="hover:text-blue-900"><X size={10} /></button>
                    </span>
                  ))}
                  {reasonFilter.map((r) => (
                    <span key={`tag-r-${r}`} className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-semibold text-orange-700">
                      {r}
                      <button onClick={() => removeFilter('reason', r)} className="hover:text-orange-900"><X size={10} /></button>
                    </span>
                  ))}
                  {responsibleFilter.map((r) => (
                    <span key={`tag-rsp-${r}`} className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                      {r}
                      <button onClick={() => removeFilter('responsible', r)} className="hover:text-violet-900"><X size={10} /></button>
                    </span>
                  ))}
                  {(dateFromFilter || dateToFilter) && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                      {dateFromFilter || '...'} → {dateToFilter || '...'}
                      <button onClick={() => removeFilter('date')} className="hover:text-emerald-900"><X size={10} /></button>
                    </span>
                  )}
                  <button onClick={clearAllFilters} className="ml-1 text-[10px] font-semibold text-red-500 underline underline-offset-2 hover:text-red-700">
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
    <motion.div
      whileHover={{ y: -2 }}
      className="stat-card rounded-xl border border-white/45 bg-white/45 backdrop-blur-md p-4 md:p-6 shadow-sm shadow-primary/5 hover:bg-white/70 hover:shadow-md transition-all duration-300"
    >
      <p className="mb-2 text-[9px] font-semibold uppercase leading-none tracking-[0.12em] text-on-surface-variant/70 md:mb-3 md:text-[10px]">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <h3 className="text-2xl font-semibold leading-none tracking-tight text-primary md:text-3xl">{value}</h3>
        {trend && (
          <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase leading-none tracking-widest text-primary md:px-2 md:text-[9px]">
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}
