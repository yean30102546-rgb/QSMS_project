import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, AlertCircle, Clock, Search, RefreshCw, Plus, ChevronLeft, ChevronRight, X, Filter, Calendar, SlidersHorizontal } from 'lucide-react';
import { filterCasesByMultipleCriteria, FilterOptions } from '../utils/helpers';

interface OverallTabProps {
  cases: any[];
  isLoadingCases: boolean;
  caseError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadCases: () => void;
  openUpdateModal: (caseItem: any) => void;
  stats: any;
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
  const ITEMS_PER_PAGE = 10; // ✅ Locked: Always show 10 cases per page
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [reasonFilter, setReasonFilter] = useState<string[]>([]);
  const [responsibleFilter, setResponsibleFilter] = useState<string[]>([]);
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Get unique values for filters
  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    cases.forEach(c => sources.add(c.source));
    return Array.from(sources).sort();
  }, [cases]);

  const uniqueReasons = useMemo(() => {
    const reasons = new Set<string>();
    cases.forEach(c => {
      if (c.items && c.items[0]?.reason) {
        reasons.add(c.items[0].reason);
      }
    });
    return Array.from(reasons).sort();
  }, [cases]);

  const uniqueResponsible = useMemo(() => {
    const responsible = new Set<string>();
    cases.forEach(c => {
      if (c.items && c.items[0]?.responsible) {
        responsible.add(c.items[0].responsible);
      }
    });
    return Array.from(responsible).sort();
  }, [cases]);

  // Apply filters using comprehensive filter function
  const filteredCases = useMemo(() => {
    return filterCasesByMultipleCriteria(cases, {
      status: statusFilter.length > 0 ? statusFilter : undefined,
      source: sourceFilter.length > 0 ? sourceFilter : undefined,
      reason: reasonFilter.length > 0 ? reasonFilter : undefined,
      responsible: responsibleFilter.length > 0 ? responsibleFilter : undefined,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      query: searchQuery || undefined,
    });
  }, [cases, statusFilter, sourceFilter, reasonFilter, responsibleFilter, dateFromFilter, dateToFilter, searchQuery]);

  const hasActiveFilters = statusFilter.length > 0 || sourceFilter.length > 0 || 
                          reasonFilter.length > 0 || responsibleFilter.length > 0 || 
                          dateFromFilter || dateToFilter;

  // นับจำนวนตัวกรองที่ใช้งานอยู่
  const activeFilterCount = [statusFilter, sourceFilter, reasonFilter, responsibleFilter].filter(f => f.length > 0).length + (dateFromFilter || dateToFilter ? 1 : 0);

  // ฟังก์ชันสำหรับลบตัวกรองทีละตัว
  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'status':
        if (value) setStatusFilter(statusFilter.filter(s => s !== value));
        else setStatusFilter([]);
        break;
      case 'source':
        if (value) setSourceFilter(sourceFilter.filter(s => s !== value));
        else setSourceFilter([]);
        break;
      case 'reason':
        if (value) setReasonFilter(reasonFilter.filter(r => r !== value));
        else setReasonFilter([]);
        break;
      case 'responsible':
        if (value) setResponsibleFilter(responsibleFilter.filter(r => r !== value));
        else setResponsibleFilter([]);
        break;
      case 'date':
        setDateFromFilter('');
        setDateToFilter('');
        break;
    }
  };

  // ล้างตัวกรองทั้งหมด
  const clearAllFilters = () => {
    setStatusFilter([]);
    setSourceFilter([]);
    setReasonFilter([]);
    setResponsibleFilter([]);
    setDateFromFilter('');
    setDateToFilter('');
  };

  // สลับการเลือก Status (Quick Filter)
  const toggleStatusFilter = (status: string) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  const getDeadlineStatus = (caseDate: string, status: string) => {
    if (status === 'Completed') return null;

    const daysSince = Math.floor((Date.now() - new Date(caseDate).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince > 30) return 'danger'; // Over 30 days
    if (daysSince > 7) return 'warning'; // Over 7 days
    return null;
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'เมื่อวาน';
    } else if (diffDays < 7) {
      return `${diffDays} วันที่แล้ว`;
    } else {
      return date.toLocaleDateString('th-TH', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // นับจำนวน case ตาม status สำหรับ Quick Filter
  const statusCounts = useMemo(() => ({
    Pending: cases.filter(c => c.status === 'Pending').length,
    'In-Progress': cases.filter(c => c.status === 'In-Progress').length,
    Completed: cases.filter(c => c.status === 'Completed').length,
  }), [cases]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCases = filteredCases.slice(startIndex, endIndex);

  // Reset to page 1 when search query or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter.length, sourceFilter.length, reasonFilter.length, responsibleFilter.length, dateFromFilter, dateToFilter]);

  // ✅ Prevent Auto Scroll: เก็บ scroll position ไว้ ไม่ให้หน้าดีดขึ้นเมื่อเปลี่ยนหน้า
  const handlePageChange = (newPage: number) => {
    // ไม่ต้อง scroll — แค่เปลี่ยนหน้าอย่างเดียว
    setCurrentPage(newPage);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-bg">
      {/* ✅ HEADER & STATS - Fixed at Top (Non-Scrollable) */}
      <div className="flex-shrink-0 space-y-12 px-0 py-8 border-b border-border overflow-hidden">
        <div className="px-8 md:px-10 lg:px-12">
          <header className="flex justify-between items-end mb-8">
            <div>
              <p className="text-sm text-muted font-medium mb-1">
                {new Date().toLocaleDateString('th-TH', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <h1 className="text-3xl font-medium tracking-tight text-foreground">
                สวัสดีตอนเช้า Admin
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadCases}
                disabled={isLoadingCases}
                className="w-10 h-10 border border-border rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all text-foreground disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw size={20} className={isLoadingCases ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-10 h-10 border border-border rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all text-foreground"
              >
                <Plus size={20} />
              </button>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      {/* ✅ CONTENT AREA - Scrollable in Middle (Flexible) */}
      <div className="flex-1 overflow-y-auto scrollbar-hide bg-bg">
        <div className="px-8 md:px-10 lg:px-12 py-8">
          {/* Cases List */}
          <div className="space-y-6">

            {/* ===== TOOLBAR: Search + Quick Status Filters + Advanced Filter Toggle ===== */}
            <div className="flex flex-col gap-4">
              {/* Row 1: Title + Search + Filter Toggle */}
              <div className="flex justify-between items-center px-1">
                <h3 className="text-base font-semibold text-foreground italic underline decoration-accent/20 underline-offset-4 tracking-tight">
                  รายการงาน Rework ล่าสุด
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                    <input
                      type="text"
                      placeholder="ค้นหา ID, ชื่อสินค้า..."
                      className="pl-9 pr-4 py-2 bg-white border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-medium w-56 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      showFilters || hasActiveFilters
                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                        : 'bg-white border border-border text-foreground hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <SlidersHorizontal size={14} />
                    ตัวกรองขั้นสูง
                    {activeFilterCount > 0 && (
                      <span className="bg-white/90 text-accent text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Row 2: Quick Status Filter Pills (แสดงเสมอ) */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest mr-1">สถานะ:</span>
                {(['all', 'Pending', 'In-Progress', 'Completed'] as const).map((status) => {
                  const isAll = status === 'all';
                  const isActive = isAll ? statusFilter.length === 0 : statusFilter.includes(status);
                  const count = isAll ? cases.length : statusCounts[status] || 0;
                  const thaiLabel = isAll ? 'ทั้งหมด' : status === 'Pending' ? 'รอดำเนินการ' : status === 'In-Progress' ? 'กำลังทำ' : 'เสร็จสิ้น';
                  
                  // สีตาม status
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
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                        isActive
                          ? activeColors
                          : 'bg-white border border-border text-muted hover:bg-slate-50 hover:text-foreground'
                      }`}
                    >
                      {thaiLabel}
                      <span className={`text-[10px] font-black ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                        {count}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* ===== ADVANCED FILTER PANEL (เปิด/ปิดได้) ===== */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-xl shadow-slate-200/20"
                >
                  {/* Header ของ Panel */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Filter size={16} className="text-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">ตัวกรองขั้นสูง</h4>
                        <p className="text-[10px] text-muted">เลือกเงื่อนไขเพื่อกรองข้อมูล</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-muted hover:text-foreground transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Source Filter - Pill Chips */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-[0.15em]">
                        📦 แหล่งที่มา (Source)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {uniqueSources.map(source => {
                          const isSelected = sourceFilter.includes(source);
                          return (
                            <motion.button
                              key={source}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (isSelected) setSourceFilter(sourceFilter.filter(s => s !== source));
                                else setSourceFilter([...sourceFilter, source]);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isSelected ? 'bg-accent text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {source}
                            </motion.button>
                          );
                        })}
                        {uniqueSources.length === 0 && <span className="text-xs text-muted italic">ไม่มีข้อมูล</span>}
                      </div>
                    </div>

                    {/* Reason Filter - Pill Chips */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-[0.15em]">
                        ⚠️ ประเภท Defect (Reason)
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                        {uniqueReasons.map(reason => {
                          const isSelected = reasonFilter.includes(reason);
                          return (
                            <motion.button
                              key={reason}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (isSelected) setReasonFilter(reasonFilter.filter(r => r !== reason));
                                else setReasonFilter([...reasonFilter, reason]);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isSelected ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {reason}
                            </motion.button>
                          );
                        })}
                        {uniqueReasons.length === 0 && <span className="text-xs text-muted italic">ไม่มีข้อมูล</span>}
                      </div>
                    </div>

                    {/* Responsible Filter - Pill Chips */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-[0.15em]">
                        👤 ผู้รับผิดชอบ (Responsible)
                      </label>
                      <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                        {uniqueResponsible.map(responsible => {
                          const isSelected = responsibleFilter.includes(responsible);
                          return (
                            <motion.button
                              key={responsible}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (isSelected) setResponsibleFilter(responsibleFilter.filter(r => r !== responsible));
                                else setResponsibleFilter([...responsibleFilter, responsible]);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isSelected ? 'bg-violet-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {responsible}
                            </motion.button>
                          );
                        })}
                        {uniqueResponsible.length === 0 && <span className="text-xs text-muted italic">ไม่มีข้อมูล</span>}
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-3 md:col-span-2 lg:col-span-3">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-[0.15em] flex items-center gap-1.5">
                        <Calendar size={12} /> ช่วงเวลา (Date Range)
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                          <input
                            type="date"
                            value={dateFromFilter}
                            onChange={(e) => setDateFromFilter(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                          />
                          <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] text-muted font-bold">เริ่มต้น</span>
                        </div>
                        <span className="text-muted text-xs font-bold">→</span>
                        <div className="flex-1 relative">
                          <input
                            type="date"
                            value={dateToFilter}
                            onChange={(e) => setDateToFilter(e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                          />
                          <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] text-muted font-bold">สิ้นสุด</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clear All + Result Count */}
                  {hasActiveFilters && (
                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <p className="text-xs text-muted">
                        พบ <span className="font-bold text-accent">{filteredCases.length}</span> รายการ จากทั้งหมด {cases.length} รายการ
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={clearAllFilters}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all text-xs font-bold"
                      >
                        <X size={14} /> ล้างตัวกรองทั้งหมด
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ===== ACTIVE FILTER TAGS (แสดงเมื่อมีตัวกรองแต่ panel ปิดอยู่) ===== */}
            <AnimatePresence>
              {hasActiveFilters && !showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 flex-wrap px-1"
                >
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">กรอง:</span>
                  {statusFilter.map(s => (
                    <span key={`tag-s-${s}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      {s === 'Pending' ? 'รอดำเนินการ' : s === 'In-Progress' ? 'กำลังทำ' : 'เสร็จสิ้น'}
                      <button onClick={() => removeFilter('status', s)} className="hover:text-amber-900"><X size={10} /></button>
                    </span>
                  ))}
                  {sourceFilter.map(s => (
                    <span key={`tag-src-${s}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                      {s}
                      <button onClick={() => removeFilter('source', s)} className="hover:text-blue-900"><X size={10} /></button>
                    </span>
                  ))}
                  {reasonFilter.map(r => (
                    <span key={`tag-r-${r}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                      {r}
                      <button onClick={() => removeFilter('reason', r)} className="hover:text-orange-900"><X size={10} /></button>
                    </span>
                  ))}
                  {responsibleFilter.map(r => (
                    <span key={`tag-rsp-${r}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold">
                      {r}
                      <button onClick={() => removeFilter('responsible', r)} className="hover:text-violet-900"><X size={10} /></button>
                    </span>
                  ))}
                  {(dateFromFilter || dateToFilter) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      📅 {dateFromFilter || '...'} → {dateToFilter || '...'}
                      <button onClick={() => removeFilter('date')} className="hover:text-emerald-900"><X size={10} /></button>
                    </span>
                  )}
                  <button onClick={clearAllFilters} className="text-[10px] text-red-500 font-bold hover:text-red-700 ml-1 underline underline-offset-2">
                    ล้างทั้งหมด
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ===== LOADING / ERROR / EMPTY / DATA STATES ===== */}
            {isLoadingCases ? (
              /* ✅ Skeleton Screen: แสดง placeholder ระหว่างโหลดเพื่อให้ UI นิ่ง */
              <div className="glass-card p-0 bg-white" style={{ minHeight: '640px' }}>
                <div className="divide-y divide-slate-100 p-2">
                  {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                    <div key={i} className="flex items-center py-4 px-4 gap-4 animate-pulse">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded-lg w-3/5" />
                        <div className="h-3 bg-slate-100 rounded-lg w-2/5" />
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="h-3 bg-slate-200 rounded-lg w-12 ml-auto" />
                        <div className="h-2 bg-slate-100 rounded-lg w-16 ml-auto" />
                      </div>
                      <div className="h-6 bg-slate-200 rounded-full w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ) : caseError ? (
              <div className="glass-card p-6 bg-white border border-red-200 bg-red-50">
                <div className="flex items-start gap-4">
                  <AlertCircle className="text-red-500 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-red-700">Error loading data</p>
                    <p className="text-sm text-red-600 mt-1">{caseError}</p>
                    <button
                      onClick={loadCases}
                      className="text-sm font-semibold text-red-700 hover:text-red-800 mt-3 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            ) : cases.length === 0 ? (
              <div className="glass-card p-12 bg-white text-center">
                <Package size={40} className="text-muted/30 mx-auto mb-4" />
                <p className="text-muted font-medium">No cases found</p>
                <p className="text-sm text-muted mt-1">
                  {searchQuery ? 'Try adjusting your search' : 'Start by adding a new case'}
                </p>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="glass-card p-12 bg-white text-center">
                <Package size={40} className="text-muted/30 mx-auto mb-4" />
                <p className="text-muted font-medium">No cases match your filters</p>
                <p className="text-sm text-muted mt-1">Try adjusting your filter settings</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 text-sm text-accent font-semibold hover:underline"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                )}
              </div>
            ) : (
              /* ✅ DATA LIST: ใช้ min-height เพื่อให้ Pagination ตรึงอยู่ที่เดิม */
              <div className="glass-card p-0 bg-white flex flex-col" style={{ minHeight: '640px' }}>
                <div className="flex-1 border-t border-border" style={{ overflowAnchor: 'none' }}>
                  <div className="divide-y divide-[#f1f1f1] p-2">
                    <div ref={itemsContainerRef}>
                      {paginatedCases.map((item) => {
                        const deadlineStatus = getDeadlineStatus(item.date, item.status);
                        return (
                          <div
                            key={item.id}
                            onClick={() => openUpdateModal(item)}
                            className={`flex items-center py-4 px-4 hover:bg-slate-50/50 transition-colors group rounded-lg cursor-pointer ${
                              deadlineStatus === 'warning' ? 'bg-orange-50 border-l-4 border-orange-400' :
                              deadlineStatus === 'danger' ? 'bg-red-50 border-l-4 border-red-400' : ''
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-foreground">
                                  {item.items[0]?.itemName || 'N/A'}
                                </div>
                                {deadlineStatus === 'warning' && (
                                  <div className="flex items-center gap-1 text-orange-600 text-xs">
                                    <Clock size={12} />
                                    <span>7 วัน</span>
                                  </div>
                                )}
                                {deadlineStatus === 'danger' && (
                                  <div className="flex items-center gap-1 text-red-600 text-xs">
                                    <AlertCircle size={12} />
                                    <span>เกิน 30 วัน</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-[12px] text-muted mt-1">
                                {formatTimestamp(item.date)} &bull; Source:{' '}
                                <span className="font-bold">{item.source}</span> &bull;{' '}
                                <span className="font-mono text-accent">{item.id}</span>
                              </div>
                            </div>
                            <div className="mr-8 text-right">
                              <p className="text-xs font-bold text-foreground">
                                {item.items[0]?.amount || 0} Box
                              </p>
                              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                                {item.items[0]?.reason || 'N/A'}
                              </p>
                            </div>
                            <StatusPill status={item.status} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ PAGINATION - แสดงเสมอเมื่อมีข้อมูล ไม่กระโดดเมื่อ filter */}
      {cases.length > 0 && (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-t border-border bg-slate-50/50">
          <div className="text-xs text-muted font-medium">
            {totalPages > 0 ? `หน้า ${currentPage} จาก ${totalPages}` : 'ไม่มีข้อมูล'} ({filteredCases.length} รายการ{hasActiveFilters ? ' (filtered)' : ''})
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-border hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Previous page"
            >
              <ChevronLeft size={16} className="text-foreground" />
            </motion.button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <motion.button
                    key={pageNum}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      pageNum === currentPage
                        ? 'bg-accent text-white'
                        : 'border border-border hover:bg-white'
                    }`}
                  >
                    {pageNum}
                  </motion.button>
                );
              })}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Next page"
            >
              <ChevronRight size={16} className="text-foreground" />
            </motion.button>
          </div>
        </div>
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
    <div className="stat-card bg-white p-6 rounded-2xl border border-border">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted mb-3 leading-none">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <h3 className="text-[28px] font-bold tracking-tighter text-foreground leading-none">
          {value}
        </h3>
        {trend && (
          <span className="text-[9px] text-muted font-bold uppercase tracking-widest bg-slate-50 px-2 py-0.5 border border-border rounded-full leading-none">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

interface StatusPillProps {
  status: 'Pending' | 'In-Progress' | 'Completed';
}

function StatusPill({ status }: StatusPillProps) {
  const styles: Record<string, string> = {
    Pending: 'bg-[#fef9c3] text-amber-700 border-amber-200',
    'In-Progress': 'bg-[#f4f4f5] text-foreground border-border',
    Completed: 'bg-[#f0fdf4] text-emerald-700 border-emerald-200',
  };

  const thaiLabels: Record<string, string> = {
    Pending: 'รอดำเนินการ',
    'In-Progress': 'กำลังดำเนินการ',
    Completed: 'เสร็จสิ้น',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
        styles[status] || styles['Pending']
      }`}
    >
      {thaiLabels[status] || status}
    </span>
  );
}