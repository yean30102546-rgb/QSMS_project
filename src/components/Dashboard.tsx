/**
 * Interactive Dashboard Component with Filters
 * Filters: Date Range, Defect Type (Reason), Status
 * All charts update reactively without page refresh
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingDown, TrendingUp, CheckCircle2, Clock, AlertCircle,
  Package, SlidersHorizontal, X, Calendar, Layers, Link2, ChevronLeft, ArrowRight, Banknote
} from 'lucide-react';
import { ReworkCase, ReworkItem } from '../services/api';

type CaseStatus = ReworkCase['status'];
type ViewMode = 'units' | 'defects';

interface DashboardProps {
  cases: ReworkCase[];
  isLoading: boolean;
}

export function Dashboard({ cases, isLoading }: DashboardProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CaseStatus[]>([]);
  const [reasonFilter, setReasonFilter] = useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // New States for Dual-View Analysis
  const [viewMode, setViewMode] = useState<ViewMode>('units');
  const [selectedMainReason, setSelectedMainReason] = useState<string | null>(null);

  // ===== EXTRACT UNIQUE VALUES =====
  const uniqueReasons = useMemo(() => {
    const reasons = new Set<string>();
    cases.forEach(c => c.items?.forEach(item => {
      const trimmedReason = String(item.reason || '').trim();
      if (trimmedReason) reasons.add(trimmedReason);
    }));
    return Array.from(reasons).sort();
  }, [cases]);

  const uniqueCustomers = useMemo(() => {
    const customers = new Set<string>();
    cases.forEach(c => c.items?.forEach(item => {
      const trimmedCustomer = String(item.customerName || '').trim();
      if (trimmedCustomer) customers.add(trimmedCustomer);
    }));
    return Array.from(customers).sort();
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
      // Customer filter
      if (customerFilter.length > 0) {
        const hasCustomer = c.items?.some(item => customerFilter.includes(String(item.customerName || '').trim()));
        if (!hasCustomer) return false;
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
  }, [cases, statusFilter, reasonFilter, customerFilter, dateFrom, dateTo]);

  const hasActiveFilters = statusFilter.length > 0 || reasonFilter.length > 0 || customerFilter.length > 0 || dateFrom || dateTo;
  const activeFilterCount = (statusFilter.length > 0 ? 1 : 0) + (reasonFilter.length > 0 ? 1 : 0) + (customerFilter.length > 0 ? 1 : 0) + (dateFrom || dateTo ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter([]);
    setReasonFilter([]);
    setCustomerFilter([]);
    setDateFrom('');
    setDateTo('');
  };

  const toggleArrayFilter = <T extends string>(arr: T[], val: T, setter: (v: T[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  // ===== CALCULATE STATS FROM FILTERED DATA =====
  const stats = useMemo(() => {
    const initialStats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      awaitingValuation: 0,
      completed: 0,
      completionRate: 0,
      linkedCount: 0, // Correlation KPI
      totalCost: 0,
      unitsByReason: {} as Record<string, number>,
      frequencyByReason: {} as Record<string, number>,
      subtypesByMainReason: {} as Record<string, Record<string, { units: number; frequency: number }>>,
      sources: {} as Record<string, number>
    };

    if (!filteredCases || filteredCases.length === 0) return initialStats;

    filteredCases.forEach(caseItem => {
      if (caseItem.status === 'Pending') initialStats.pending++;
      else if (caseItem.status === 'In-Progress') initialStats.inProgress++;
      else if (caseItem.status === 'Awaiting Valuation') initialStats.awaitingValuation++;
      else if (caseItem.status === 'Completed') initialStats.completed++;

      initialStats.totalCost += caseItem.reworkCost || 0;

      const source = String(caseItem.source || '').trim();
      if (source) {
        initialStats.sources[source] = (initialStats.sources[source] || 0) + 1;
      }

      caseItem.items?.forEach(item => {
        // Item-level filtering for stats accuracy
        if (reasonFilter.length > 0 && !reasonFilter.includes(item.reason)) return;
        if (customerFilter.length > 0 && !customerFilter.includes(String(item.customerName || '').trim())) return;

        const amount = item.amount || 0;
        const mainReason = String(item.reason || 'ไม่ระบุ').trim();
        
        // Count Correlation (Linkage)
        if (mainReason.includes('เปื้อน') && item.linkedSourceId) {
          initialStats.linkedCount++;
        }

        // Logic 1: Unit Count (By Quantity) - Sum of Amount per Main Reason
        initialStats.unitsByReason[mainReason] = (initialStats.unitsByReason[mainReason] || 0) + amount;

        // Logic 2: Defect Frequency (By Subtype) - Flatten Subtypes
        const subtypes = String(item.reasonSubtype || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

        // If no subtypes, count main reason once for frequency
        if (subtypes.length === 0) {
          initialStats.frequencyByReason[mainReason] = (initialStats.frequencyByReason[mainReason] || 0) + amount;
        } else {
          subtypes.forEach(st => {
            // Main Reason Frequency (total subtypes occurrences * amount)
            initialStats.frequencyByReason[mainReason] = (initialStats.frequencyByReason[mainReason] || 0) + amount;

            // Subtype specific counts
            if (!initialStats.subtypesByMainReason[mainReason]) {
              initialStats.subtypesByMainReason[mainReason] = {};
            }
            if (!initialStats.subtypesByMainReason[mainReason][st]) {
              initialStats.subtypesByMainReason[mainReason][st] = { units: 0, frequency: 0 };
            }
            // Units: How many items have this subtype? 
            // In Unit count mode, "1 item with 2 stains counts as 1 case of units"
            // But user said for Frequency: "Flatten Subtype... count separately (Box+5, Bottle+5)"
            // So for Subtype drill-down, both units and frequency use the amount.
            initialStats.subtypesByMainReason[mainReason][st].units += amount;
            initialStats.subtypesByMainReason[mainReason][st].frequency += amount;
          });
        }
      });
    });

    initialStats.total = filteredCases.length;
    initialStats.completionRate = initialStats.total > 0 ? Math.round((initialStats.completed / initialStats.total) * 100) : 0;
    
    return initialStats;
  }, [filteredCases]);

  // Chart Data preparation based on View Mode and Drill-down
  const chartData = useMemo(() => {
    if (selectedMainReason) {
      // Subtype View
      const subtypes = stats.subtypesByMainReason[selectedMainReason] || {};
      return Object.entries(subtypes)
        .map(([name, counts]) => ({
          name,
          value: viewMode === 'units' ? counts.units : counts.frequency
        }))
        .sort((a, b) => b.value - a.value);
    } else {
      // Main Reason View
      return Object.entries(viewMode === 'units' ? stats.unitsByReason : stats.frequencyByReason)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    }
  }, [selectedMainReason, viewMode, stats]);

  const maxChartValue = Math.max(1, ...chartData.map(d => d.value));
  const sourceEntries = Object.entries(stats.sources).sort(([, a], [, b]) => b - a);

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted mr-1">สถานะ:</span>
            {([
              { key: 'all', label: 'ทั้งหมด', color: 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' },
              { key: 'Pending', label: 'รอดำเนินการ', color: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' },
              { key: 'In-Progress', label: 'กำลังดำเนินการ', color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' },
              { key: 'Completed', label: 'เสร็จสิ้น', color: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' },
            ] as const).map(({ key, label, color }) => {
              const isAll = key === 'all';
              const isActive = isAll ? statusFilter.length === 0 : statusFilter.includes(key);
              const count = isAll ? cases.length : cases.filter(c => c.status === key).length;
              return (
                <motion.button key={key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => isAll ? setStatusFilter([]) : toggleArrayFilter(statusFilter, key, setStatusFilter)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${isActive ? color : 'bg-white border border-border text-muted hover:bg-slate-50'}`}
                >
                  {label} <span className={`text-[10px] font-black ${isActive ? 'opacity-80' : 'opacity-50'}`}>{count}</span>
                </motion.button>
              );
            })}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:w-auto ${showFilters || hasActiveFilters ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-white border border-border text-foreground hover:bg-slate-50'}`}
          >
            <SlidersHorizontal size={14} /> ตัวกรอง
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
                    <h4 className="text-sm font-bold text-foreground">ตัวกรองแดชบอร์ด</h4>
                    <p className="text-[10px] text-muted">เลือกเงื่อนไขเพื่อกรองข้อมูลในกราฟ</p>
                  </div>
                </div>
                <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-muted hover:text-foreground transition-colors"><X size={16} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reason Filter */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.15em]">⚠️ ประเภทข้อบกพร่อง (Reason)</label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueReasons.map(reason => (
                      <motion.button key={reason} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => toggleArrayFilter(reasonFilter, reason, setReasonFilter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-normal transition-all ${reasonFilter.includes(reason) ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >{reason}</motion.button>
                    ))}
                    {uniqueReasons.length === 0 && <span className="text-xs text-muted italic">ไม่มีข้อมูล</span>}
                  </div>
                </div>

                {/* Customer Filter */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.15em]">🏢 ลูกค้า (Customer)</label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueCustomers.map(customer => (
                      <motion.button key={customer} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => toggleArrayFilter(customerFilter, customer, setCustomerFilter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-normal transition-all ${customerFilter.includes(customer) ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >{customer}</motion.button>
                    ))}
                    {uniqueCustomers.length === 0 && <span className="text-xs text-muted italic">ไม่มีข้อมูล</span>}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.15em]">📊 สถานะ (Status)</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Pending', 'In-Progress', 'Awaiting Valuation', 'Completed'] as const).map(status => {
                      const isActive = statusFilter.includes(status);
                      const labels = {
                        Pending: 'รอดำเนินการ',
                        'In-Progress': 'กำลังดำเนินการ',
                        'Awaiting Valuation': 'รอประเมินราคา',
                        Completed: 'เสร็จสิ้น'
                      };
                      return (
                        <motion.button key={status} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => toggleArrayFilter(statusFilter, status, setStatusFilter)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-normal transition-all ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >{labels[status]}</motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-[0.15em] flex items-center gap-1.5"><Calendar size={12} /> ช่วงเวลา (วันที่)</label>
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
                <span key={`t-s-${s}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-bold">
                  {s === 'Pending' ? 'รอดำเนินการ' : s === 'In-Progress' ? 'กำลังดำเนินการ' : s === 'Awaiting Valuation' ? 'รอประเมินราคา' : 'เสร็จสิ้น'}
                  <button onClick={() => toggleArrayFilter(statusFilter, s, setStatusFilter)} className="hover:text-slate-900"><X size={10} /></button>
                </span>
              ))}
              {reasonFilter.map(r => (
                <span key={`t-r-${r}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold">
                  {r}
                  <button onClick={() => toggleArrayFilter(reasonFilter, r, setReasonFilter)} className="hover:text-orange-900"><X size={10} /></button>
                </span>
              ))}
              {customerFilter.map(c => (
                <span key={`t-c-${c}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                  {c}
                  <button onClick={() => toggleArrayFilter(customerFilter, c, setCustomerFilter)} className="hover:text-indigo-900"><X size={10} /></button>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <MetricCard label="งานทั้งหมด" value={stats.total.toString()} icon={<Package size={24} className="text-blue-500" />} bgColor="bg-blue-50" trend={`บันทึกแล้ว ${filteredCases.length} เคส`} />
        <MetricCard label="เสร็จสิ้นแล้ว" value={stats.completed.toString()} icon={<CheckCircle2 size={24} className="text-emerald-500" />} bgColor="bg-emerald-50" trend={`${stats.completionRate}% ความสำเร็จ`} />
        {/* Correlation KPI Card */}
        <MetricCard 
          label="เปื้อนจากการรั่ว" 
          value={stats.linkedCount.toString()} 
          icon={<Link2 size={24} className="text-amber-600" />} 
          bgColor="bg-amber-50" 
          trend="Correlation Detection"
          tooltip="จำนวนรายการที่เปื้อนเนื่องมาจากการรั่วไหลของไอเทมอื่น"
        />
        {/* Cost KPI Card */}
        <MetricCard label="ค่าใช้จ่าย Rework" value={`฿${stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`} icon={<Banknote size={24} className="text-rose-500" />} bgColor="bg-rose-50" trend="Total Cost" />
        <MetricCard label="อัตราเสร็จสิ้น" value={`${stats.completionRate}%`} icon={<TrendingUp size={24} className="text-indigo-500" />} bgColor="bg-indigo-50" trend="Overall Progress" />
      </div>

      {/* ===== MAIN ANALYTICS VIEW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dual-View Analysis Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              {selectedMainReason && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedMainReason(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-muted transition-colors"
                >
                  <ChevronLeft size={20} />
                </motion.button>
              )}
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Layers size={18} className="text-accent" />
                  {selectedMainReason ? `รายละเอียด: ${selectedMainReason}` : 'วิเคราะห์สาเหตุข้อบกพร่อง'}
                </h3>
                <p className="text-xs text-muted">
                  {selectedMainReason ? 'เจาะลึกรายละเอียดย่อย (Subtypes)' : 'ภาพรวมสาเหตุหลัก (Main Reasons)'}
                </p>
              </div>
            </div>

            {/* Toggle View Mode */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setViewMode('units')}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'units' ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
              >
                ปริมาณสินค้า (Units)
              </button>
              <button
                onClick={() => setViewMode('defects')}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'defects' ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
              >
                ความถี่ปัญหา (Defects)
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {chartData.length > 0 ? (
                <motion.div
                  key={selectedMainReason || 'main'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {chartData.map((item) => (
                    <div 
                      key={item.name} 
                      className={`group relative ${!selectedMainReason ? 'cursor-pointer' : ''}`}
                      onClick={() => !selectedMainReason && setSelectedMainReason(item.name)}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700">{item.name}</span>
                          {!selectedMainReason && (
                            <ArrowRight size={12} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <span className="text-sm font-black text-foreground">{item.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${(item.value / maxChartValue) * 100}%` }} 
                          transition={{ duration: 0.8, ease: 'circOut' }}
                          className={`h-full rounded-full ${viewMode === 'units' ? 'bg-blue-500' : 'bg-orange-500'}`} 
                        />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted">
                  <Package size={48} className="opacity-20 mb-4" />
                  <p className="text-sm font-medium">ไม่มีข้อมูลที่จะแสดงผล</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Legend */}
          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-muted uppercase">ปริมาณชิ้นงาน</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-[10px] font-bold text-muted uppercase">ความถี่ของปัญหา</span>
            </div>
          </div>
        </div>

        {/* Workload by Source (1/3 width) */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6">แหล่งที่มาของงาน</h3>
          <div className="space-y-6">
            {sourceEntries.length > 0 ? (
              sourceEntries.map(([source, count]) => {
                const percentage = Math.round((count / stats.total) * 100);
                return (
                  <div key={source} className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-700">{source}</span>
                      <span className="text-xs font-black text-slate-900">{count} เคส ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${percentage}%` }} 
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-indigo-500 rounded-full shadow-sm" 
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted text-center py-8">ไม่มีข้อมูล</p>
            )}
          </div>
        </div>

      </div>

      {/* Status Distribution Details */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-foreground">สัดส่วนสถานะการจัดการ</h3>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-[10px] font-bold text-muted uppercase">Pending</span>
            <span className="w-3 h-3 rounded-full bg-blue-400 ml-2" />
            <span className="text-[10px] font-bold text-muted uppercase">In-Progress</span>
            <span className="w-3 h-3 rounded-full bg-purple-400 ml-2" />
            <span className="text-[10px] font-bold text-muted uppercase">Awaiting Valuation</span>
            <span className="w-3 h-3 rounded-full bg-emerald-400 ml-2" />
            <span className="text-[10px] font-bold text-muted uppercase">Completed</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { label: 'รอดำเนินการ', count: stats.pending, color: 'amber', icon: <AlertCircle size={20} /> },
            { label: 'กำลังดำเนินการ', count: stats.inProgress, color: 'blue', icon: <Clock size={20} /> },
            { label: 'เสร็จสิ้น', count: stats.completed, color: 'emerald', icon: <CheckCircle2 size={20} /> },
          ].map(({ label, count, color, icon }) => {
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            const colorClasses: Record<string, string> = {
              amber: 'bg-amber-50 text-amber-600 border-amber-100',
              blue: 'bg-blue-50 text-blue-600 border-blue-100',
              emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            };
            return (
              <div key={label} className={`flex items-center gap-4 p-4 rounded-2xl border ${colorClasses[color]}`}>
                <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-muted mb-0.5">{label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{count}</span>
                    <span className="text-xs font-bold text-slate-500">{percentage}%</span>
                  </div>
                </div>
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
  tooltip?: string;
}

function MetricCard({ label, value, icon, bgColor, trend, tooltip }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow relative group">
      <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center mb-5 shadow-inner`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-foreground leading-none">{value}</h3>
      </div>
      {trend && <p className="text-[10px] font-bold text-slate-400 mt-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        {trend}
      </p>}
      
      {tooltip && (
        <div className="absolute top-4 right-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative group/tip">
            <AlertCircle size={14} className="cursor-help" />
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50">
              {tooltip}
              <div className="absolute top-full right-2 border-4 border-transparent border-t-slate-900" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
