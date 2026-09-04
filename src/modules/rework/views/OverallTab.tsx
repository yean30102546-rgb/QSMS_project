import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, Filter, RefreshCw, Search, SlidersHorizontal, X } from 'lucide-react';

import { useOverallFilters } from '@/src/hooks/useOverallFilters';
import { useReworkData } from '@/src/contexts/ReworkDataContext';
import { useNotification } from '@/src/contexts/NotificationContext';
import { updateCase, deleteCase, type ReworkCase } from '@/src/services/api';
import { CaseListTable } from '@/src/modules/rework/components/CaseListTable';
import { Pagination } from '@/src/components/shared/Pagination';
import { Tooltip } from '@/src/components/ui/Tooltip';
import { UpdateModal } from '@/src/modules/rework/components/UpdateModal';
import { CaseUpdateView } from '@/src/modules/rework/views/CaseUpdateView';

interface OverallTabProps {
  userRole?: string;
  userName?: string;
  onFocusModeChange?: (isFocus: boolean) => void;
}

export function OverallTab({
  userRole = 'Admin',
  onFocusModeChange,
}: OverallTabProps) {
  const { showToast, showAlert } = useNotification();
  const {
    cases,
    isLoadingCases,
    caseError,
    searchQuery,
    setSearchQuery,
    loadCases,
    stats,
    updateCasesLocally,
  } = useReworkData();

  const [activeView, setActiveView] = useState<'list' | 'update'>('list');
  const [selectedCase, setSelectedCase] = useState<ReworkCase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);

  React.useEffect(() => {
    if (onFocusModeChange) {
      onFocusModeChange(activeView === 'update');
    }
  }, [activeView, onFocusModeChange]);

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

  const openUpdateModal = (caseItem: ReworkCase) => {
    setSelectedCase(caseItem);
    setActiveView('update');
  };

  const handleUpdateCase = async (
    caseId: string,
    updates: Partial<ReworkCase> & { deleteItemIds?: string[]; newOrFiles?: File[] }
  ) => {
    try {
      setIsModalLoading(true);
      const result = await updateCase(caseId, updates);
      if (result.success) {
        updateCasesLocally((prevCases) =>
          prevCases.map((c) => {
            if (c.id === caseId) {
              const { newOrFiles, deleteItemIds, ...cleanUpdates } = updates;
              const updatedCase = { ...c, ...cleanUpdates };

              if (cleanUpdates.items || deleteItemIds) {
                let updatedItems = cleanUpdates.items ? [...cleanUpdates.items] : [...c.items];
                if (deleteItemIds && deleteItemIds.length > 0) {
                  updatedItems = updatedItems.filter((item) => !deleteItemIds.includes(item.uid || item.id));
                }
                updatedCase.items = updatedItems;
              }
              return updatedCase;
            }
            return c;
          }),
        );

        setIsModalOpen(false);
        loadCases(); // Trigger background sync
      } else {
        console.error('Update failed:', result.error);
        showAlert(`บันทึกไม่สำเร็จ: ${result.error}`, 'error');
      }
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    try {
      setIsModalLoading(true);
      const result = await deleteCase(caseId);
      if (result.success) {
        updateCasesLocally((prevCases) => prevCases.filter((c) => c.id !== caseId));
        setIsModalOpen(false);
        setSelectedCase(null);
        setActiveView('list');
        showToast('ลบรายการเรียบร้อยแล้ว', 'success');
        loadCases();
      } else {
        showAlert(`ไม่สามารถลบรายการได้: ${result.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showAlert(`เกิดข้อผิดพลาดในการลบ: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsModalLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 1. Main Case List Table (Instant Enterprise Viewport with Parallax Depth) */}
      <motion.div 
        animate={{
          x: activeView === 'update' ? -32 : 0,
          opacity: activeView === 'update' ? 0.35 : 1,
          scale: activeView === 'update' ? 0.985 : 1,
        }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        className={`h-full flex-col overflow-hidden bg-transparent transform-gpu will-change-transform ${
          activeView === 'update' ? 'pointer-events-none' : 'flex'
        }`}
        aria-hidden={activeView === 'update'}
      >
        <div className="flex-shrink-0 border-b border-slate-200 bg-white px-0 py-4 sm:py-5 md:py-6 shadow-xs">
          <div className="px-4 sm:px-6 md:px-8 lg:px-10">
            <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {new Date().toLocaleDateString('th-TH', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  สวัสดี {
                    userRole.toLowerCase() === 'admin' ? 'ผู้ดูแลระบบ' :
                    userRole.toLowerCase() === 'qsms' ? 'แผนก QSMS' :
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
                    className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 active:scale-95 shadow-xs cursor-pointer"
                  >
                    <RefreshCw size={15} className={isLoadingCases ? 'animate-spin' : ''} />
                  </button>
                </Tooltip>
              </div>
            </header>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4">
              <StatCard label="จำนวนงานทั้งหมด" value={stats.total.toString()} variant="total" />
              <StatCard
                label="รอดำเนินการ & เบิกของ"
                value={((stats.pendingAnalysis || 0) + (stats.awaitingMaterials || 0) + (stats.pending || 0)).toString()}
                trend={stats.total > 0 ? `${Math.round((((stats.pendingAnalysis || 0) + (stats.awaitingMaterials || 0) + (stats.pending || 0)) / stats.total) * 100)}%` : undefined}
                variant="pending"
              />
              <StatCard
                label="กำลังดำเนินการ"
                value={(stats.inProgress || 0).toString()}
                variant="progress"
              />
              <StatCard
                label="เสร็จสิ้น"
                value={stats.completed.toString()}
                trend={`${Math.round(stats.completionRate || 0)}%`}
                variant="completed"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-100/60 pb-24 sm:pb-6">
          <div className="px-4 py-4 sm:px-6 sm:py-5 md:px-8 lg:px-10">
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight text-slate-800 md:text-base">
                      รายการงาน Rework ทั้งหมด
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-200 text-slate-700">
                      {filteredCases.length} เคส
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="ค้นหารหัสเคส, สินค้า, ลูกค้า..."
                        className="w-full appearance-none rounded-md border border-slate-300 bg-white py-1.5 pl-8.5 pr-3 text-xs font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors shadow-2xs cursor-pointer ${
                        showFilters || hasActiveFilters
                          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <SlidersHorizontal size={13} />
                      <span>ตัวกรอง</span>
                      {activeFilterCount > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FDE68A] text-[10px] font-bold text-[#78350F]">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 1-Click Workflow Stage Swimlane Bar */}
                <div className="overflow-x-auto pb-1 pt-0.5 scrollbar-hide -mx-1 px-1">
                  <div className="flex items-center gap-2 min-w-max">
                    {[
                      {
                        id: 'all',
                        label: 'ทั้งหมด',
                        subLabel: 'TOTAL',
                        statuses: [] as (ReworkCase['status'])[],
                        count: cases.length,
                        activeClass: 'bg-[#92400E] text-white border-[#92400E] shadow-sm',
                      },
                      {
                        id: 'stage-1',
                        stepNumber: 1,
                        label: 'รอวิเคราะห์',
                        subLabel: 'QSMS',
                        statuses: ['Pending Analysis'] as (ReworkCase['status'])[],
                        count: statusCounts['Pending Analysis'] || 0,
                        activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm',
                      },
                      {
                        id: 'stage-2',
                        stepNumber: 2,
                        label: 'รอเบิกภาชนะ',
                        subLabel: 'WPK',
                        statuses: ['Awaiting Materials'] as (ReworkCase['status'])[],
                        count: statusCounts['Awaiting Materials'] || 0,
                        activeClass: 'bg-orange-600 text-white border-orange-600 shadow-sm',
                      },
                      {
                        id: 'stage-3',
                        stepNumber: 3,
                        label: 'กำลังซ่อม',
                        subLabel: 'PDF',
                        statuses: ['Pending', 'In-Progress'] as (ReworkCase['status'])[],
                        count: (statusCounts['Pending'] || 0) + (statusCounts['In-Progress'] || 0),
                        activeClass: 'bg-sky-600 text-white border-sky-600 shadow-sm',
                      },
                      {
                        id: 'stage-4',
                        stepNumber: 4,
                        label: 'ติดปัญหา Defend',
                        subLabel: 'BLOCKED',
                        statuses: ['Blocked'] as (ReworkCase['status'])[],
                        count: statusCounts['Blocked'] || 0,
                        activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm',
                      },
                      {
                        id: 'stage-5',
                        stepNumber: 5,
                        label: 'เสร็จสิ้น',
                        subLabel: '100%',
                        statuses: ['Completed'] as (ReworkCase['status'])[],
                        count: statusCounts['Completed'] || 0,
                        activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
                      },
                    ].map((stage) => {
                      const isActive = stage.id === 'all'
                        ? statusFilter.length === 0
                        : stage.statuses.some((s) => statusFilter.includes(s));

                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => {
                            if (stage.id === 'all') {
                              setStatusFilter([]);
                            } else {
                              const isExactMatch =
                                stage.statuses.length === statusFilter.length &&
                                stage.statuses.every((s) => statusFilter.includes(s));
                              if (isExactMatch) {
                                setStatusFilter([]);
                              } else {
                                setStatusFilter(stage.statuses);
                              }
                            }
                          }}
                          className={`group relative flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
                            isActive
                              ? stage.activeClass
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {stage.stepNumber && (
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                                isActive
                                  ? 'bg-white/25 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {stage.stepNumber}
                            </span>
                          )}
                          <div className="flex flex-col items-start leading-tight">
                            <span className="text-[11px] font-bold whitespace-nowrap">{stage.label}</span>
                            {stage.subLabel && (
                              <span
                                className={`text-[8px] tracking-wider uppercase font-medium ${
                                  isActive ? 'text-white/80' : 'text-slate-400'
                                }`}
                              >
                                {stage.subLabel}
                              </span>
                            )}
                          </div>
                          <span
                            className={`ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold font-mono ${
                              isActive
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                            }`}
                          >
                            {stage.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-lg border border-slate-300 bg-white p-5 shadow-xs"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-100 text-amber-900 font-bold">
                          <Filter size={14} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">ตัวกรองขั้นสูง</h4>
                          <p className="text-[11px] text-slate-500">เลือกเงื่อนไขเพื่อคัดกรองรายการเคส</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="flex h-7 w-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">แหล่งที่มา (Source)</label>
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueSources.map((source) => {
                            const isSelected = sourceFilter.includes(source);
                            return (
                              <button
                                key={source}
                                onClick={() => {
                                  if (isSelected) setSourceFilter(sourceFilter.filter((s) => s !== source));
                                  else setSourceFilter([...sourceFilter, source]);
                                }}
                                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors border shadow-xs ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {source}
                              </button>
                            );
                          })}
                          {uniqueSources.length === 0 && <span className="text-xs text-slate-400 italic">ไม่มีข้อมูล</span>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">ประเภท Defect (Reason)</label>
                        <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1.5">
                          {uniqueReasons.map((reason) => {
                            const isSelected = reasonFilter.includes(reason);
                            return (
                              <button
                                key={reason}
                                onClick={() => {
                                  if (isSelected) setReasonFilter(reasonFilter.filter((r) => r !== reason));
                                  else setReasonFilter([...reasonFilter, reason]);
                                }}
                                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors border shadow-xs ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {reason}
                              </button>
                            );
                          })}
                          {uniqueReasons.length === 0 && <span className="text-xs text-slate-400 italic">ไม่มีข้อมูล</span>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">ผู้รับผิดชอบ (Responsible)</label>
                        <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1.5">
                          {uniqueResponsible.map((responsible) => {
                            const isSelected = responsibleFilter.includes(responsible);
                            return (
                              <button
                                key={responsible}
                                onClick={() => {
                                  if (isSelected) setResponsibleFilter(responsibleFilter.filter((r) => r !== responsible));
                                  else setResponsibleFilter([...responsibleFilter, responsible]);
                                }}
                                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors border shadow-xs ${
                                  isSelected
                                    ? 'bg-slate-800 text-white border-slate-900 font-bold'
                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {responsible}
                              </button>
                            );
                          })}
                          {uniqueResponsible.length === 0 && <span className="text-xs text-slate-400 italic">ไม่มีข้อมูล</span>}
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2 lg:col-span-3">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                          <Calendar size={13} /> ช่วงเวลา (Date Range)
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <input
                              type="date"
                              value={dateFromFilter}
                              onChange={(e) => setDateFromFilter(e.target.value)}
                              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs"
                            />
                            <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-slate-500">เริ่มต้น</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-400">→</span>
                          <div className="relative flex-1">
                            <input
                              type="date"
                              value={dateToFilter}
                              onChange={(e) => setDateToFilter(e.target.value)}
                              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs"
                            />
                            <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-slate-500">สิ้นสุด</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <p className="text-xs text-slate-600">
                          พบ <span className="font-bold text-slate-900">{filteredCases.length}</span> รายการ จากทั้งหมด {cases.length} รายการ
                        </p>
                        <button
                          onClick={clearAllFilters}
                          className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 shadow-xs cursor-pointer"
                        >
                          <X size={13} /> ล้างตัวกรองทั้งหมด
                        </button>
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
                    className="flex flex-wrap items-center gap-1.5 px-1"
                  >
                    <span className="text-[11px] font-semibold text-slate-500">กรอง:</span>
                    {statusFilter.map((s) => (
                      <span key={`tag-s-${s}`} className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                        {s === 'Pending Analysis'
                          ? 'รอวิเคราะห์'
                          : s === 'Awaiting Materials'
                            ? 'รอเบิกภาชนะ'
                            : s === 'Pending'
                              ? 'รอดำเนินการ'
                              : s === 'In-Progress'
                                ? 'กำลังดำเนินการ'
                                : s === 'Blocked'
                                  ? 'ติดปัญหา Defend'
                                  : 'เสร็จสิ้น'}
                        <button type="button" onClick={() => removeFilter('status', s)} className="hover:text-amber-950 cursor-pointer"><X size={11} /></button>
                      </span>
                    ))}
                    {sourceFilter.map((s) => (
                      <span key={`tag-src-${s}`} className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                        {s}
                        <button onClick={() => removeFilter('source', s)} className="hover:text-slate-950 cursor-pointer"><X size={11} /></button>
                      </span>
                    ))}
                    {reasonFilter.map((r) => (
                      <span key={`tag-r-${r}`} className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                        {r}
                        <button onClick={() => removeFilter('reason', r)} className="hover:text-slate-950 cursor-pointer"><X size={11} /></button>
                      </span>
                    ))}
                    {responsibleFilter.map((r) => (
                      <span key={`tag-rsp-${r}`} className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
                        {r}
                        <button onClick={() => removeFilter('responsible', r)} className="hover:text-slate-950 cursor-pointer"><X size={11} /></button>
                      </span>
                    ))}
                    {(dateFromFilter || dateToFilter) && (
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        {dateFromFilter || '...'} → {dateToFilter || '...'}
                        <button onClick={() => removeFilter('date')} className="hover:text-emerald-950 cursor-pointer"><X size={11} /></button>
                      </span>
                    )}
                    <button onClick={clearAllFilters} className="ml-1 text-xs font-semibold text-red-600 underline hover:text-red-800 cursor-pointer">
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
      </motion.div>

      {/* Backdrop Dim Overlay */}
      <AnimatePresence>
        {activeView === 'update' && (
          <motion.div
            key="update-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={() => {
              setActiveView('list');
              setSelectedCase(null);
            }}
            className="absolute inset-0 z-20 bg-slate-900/15 backdrop-blur-[1px] transform-gpu will-change-opacity cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* 2. CaseUpdateView (Enterprise Slide-Over Viewport) */}
      <AnimatePresence>
        {activeView === 'update' && selectedCase && (
          <motion.div
            key="case-update-viewport"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 z-30 bg-slate-50 flex flex-col overflow-hidden transform-gpu will-change-transform shadow-[-24px_0_48px_rgba(0,0,0,0.16)] border-l border-slate-200"
          >
            <CaseUpdateView
              key="update"
              caseData={selectedCase}
              onBack={() => {
                setActiveView('list');
                setSelectedCase(null);
              }}
              onSuccess={() => {
                setActiveView('list');
                setSelectedCase(null);
                loadCases();
              }}
              onSaveSuccess={() => {
                loadCases();
              }}
              onDelete={handleDeleteCase}
              isAdmin={userRole.toLowerCase() === 'qsms' || userRole.toLowerCase() === 'admin'}
              isOperator={userRole.toLowerCase() === 'operator'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legacy update modal for other actions if any remain */}
      <UpdateModal
        isOpen={isModalOpen}
        caseData={selectedCase}
        isLoading={isModalLoading}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCase(null);
        }}
        onUpdate={handleUpdateCase}
        onDelete={handleDeleteCase}
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  variant?: 'total' | 'pending' | 'progress' | 'completed';
}

function StatCard({ label, value, trend, variant = 'total' }: StatCardProps) {
  const dotColor =
    variant === 'total' ? 'bg-slate-400' :
    variant === 'pending' ? 'bg-amber-400' :
    variant === 'progress' ? 'bg-sky-400' :
    'bg-emerald-400';

  const badgeStyle =
    variant === 'total' ? 'bg-slate-100 text-slate-700 border-slate-200' :
    variant === 'pending' ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' :
    variant === 'progress' ? 'bg-sky-50 text-sky-700 border-sky-200' :
    'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-300 hover:shadow-xs">
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 truncate">
          {label}
        </p>
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900">{value}</h3>
        {trend && (
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold font-mono border ${badgeStyle}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
