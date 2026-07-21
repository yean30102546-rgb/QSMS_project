/**
 * Interactive Dashboard Component with Filters
 * Filters: Date Range, Defect Type (Reason), Status
 * All charts update reactively without page refresh
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingDown, TrendingUp, CheckCircle2, Clock, AlertCircle,
  Package, SlidersHorizontal, X, Calendar, Layers, Link2, ChevronLeft, ArrowRight, Banknote
} from 'lucide-react';
import { ReworkCase, ReworkItem } from '@/src/services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [responsibleFilter, setResponsibleFilter] = useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // New States for Dual-View Analysis
  const [viewMode, setViewMode] = useState<ViewMode>('units');
  const [analysisDimension, setAnalysisDimension] = useState<'reason' | 'responsible'>('reason');
  const [selectedMainReason, setSelectedMainReason] = useState<string | null>(null);
  const [selectedMainResponsible, setSelectedMainResponsible] = useState<string | null>(null);

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

  const uniqueResponsibles = useMemo(() => {
    const responsibles = new Set<string>();
    cases.forEach(c => c.items?.forEach(item => {
      const trimmedResp = String(item.responsible || '').trim();
      if (trimmedResp) responsibles.add(trimmedResp);
    }));
    return Array.from(responsibles).sort();
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
      // Responsible filter
      if (responsibleFilter.length > 0) {
        const hasResponsible = c.items?.some(item => responsibleFilter.includes(String(item.responsible || '').trim()));
        if (!hasResponsible) return false;
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
  }, [cases, statusFilter, reasonFilter, responsibleFilter, customerFilter, dateFrom, dateTo]);

  const hasActiveFilters = statusFilter.length > 0 || reasonFilter.length > 0 || responsibleFilter.length > 0 || customerFilter.length > 0 || dateFrom || dateTo;
  const activeFilterCount = (statusFilter.length > 0 ? 1 : 0) + (reasonFilter.length > 0 ? 1 : 0) + (responsibleFilter.length > 0 ? 1 : 0) + (customerFilter.length > 0 ? 1 : 0) + (dateFrom || dateTo ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter([]);
    setReasonFilter([]);
    setResponsibleFilter([]);
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
      completed: 0,
      completionRate: 0,
      linkedCount: 0, // Correlation KPI
      totalCost: 0,
      pendingOverdue: 0,
      totalBoxes: 0,
      completedBoxes: 0,
      remainingBoxes: 0,
      itemsData: {} as Record<string, { code: string; name: string; units: number; frequency: number }>,
      trendByDate: {} as Record<string, { date: string; cases: number; units: number; defects: number; completedUnits: number }>,
      unitsByReason: {} as Record<string, number>,
      frequencyByReason: {} as Record<string, number>,
      subtypesByMainReason: {} as Record<string, Record<string, { units: number; frequency: number }>>,
      unitsByResponsible: {} as Record<string, number>,
      frequencyByResponsible: {} as Record<string, number>,
      subtypesByMainResponsible: {} as Record<string, Record<string, { units: number; frequency: number }>>,
      sources: {} as Record<string, number>
    };

    if (!filteredCases || filteredCases.length === 0) return initialStats;

    filteredCases.forEach(caseItem => {
      if (caseItem.status === 'Pending') initialStats.pending++;
      else if (caseItem.status === 'In-Progress') initialStats.inProgress++;
      else if (caseItem.status === 'Completed') initialStats.completed++;

      const caseDateObj = new Date(caseItem.date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - caseDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (caseItem.status === 'Pending' && diffDays > 7) {
        initialStats.pendingOverdue++;
      }

      const dateStr = caseItem.date.split('T')[0];
      if (!initialStats.trendByDate[dateStr]) {
        initialStats.trendByDate[dateStr] = { date: dateStr, cases: 0, units: 0, defects: 0, completedUnits: 0 };
      }
      initialStats.trendByDate[dateStr].cases++;

      initialStats.totalCost += caseItem.reworkCost || 0;

      const source = String(caseItem.source || '').trim();
      if (source) {
        initialStats.sources[source] = (initialStats.sources[source] || 0) + 1;
      }

      caseItem.items?.forEach(item => {
        // Item-level filtering for stats accuracy
        if (reasonFilter.length > 0 && !reasonFilter.includes(item.reason)) return;
        if (responsibleFilter.length > 0 && !responsibleFilter.includes(String(item.responsible || '').trim())) return;
        if (customerFilter.length > 0 && !customerFilter.includes(String(item.customerName || '').trim())) return;

        const amount = item.amount || 0;
        const mainReason = String(item.reason || 'ไม่ระบุ').trim();
        const mainResponsible = String(item.responsible || 'ไม่ระบุ').trim();
        
        initialStats.totalBoxes += amount;
        
        let completed = 0;
        if (caseItem.status === 'Completed') {
          completed = amount;
        } else {
          completed = Number(item.completedBoxes) || 0;
        }
        initialStats.completedBoxes += completed;

        initialStats.trendByDate[dateStr].units += amount;
        initialStats.trendByDate[dateStr].completedUnits += completed;

        const itemCode = String(item.itemCode || 'Unknown').trim();
        if (!initialStats.itemsData[itemCode]) {
          initialStats.itemsData[itemCode] = { code: itemCode, name: String(item.itemName || '').trim(), units: 0, frequency: 0 };
        }
        initialStats.itemsData[itemCode].units += amount;
        initialStats.itemsData[itemCode].frequency += 1;

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
          initialStats.trendByDate[dateStr].defects += amount;
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
            initialStats.trendByDate[dateStr].defects += amount;
          });
        }

        // Responsible calculations
        initialStats.unitsByResponsible[mainResponsible] = (initialStats.unitsByResponsible[mainResponsible] || 0) + amount;
        const responsibleSubtypes = String(item.responsibleSubtype || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

        if (responsibleSubtypes.length === 0) {
          initialStats.frequencyByResponsible[mainResponsible] = (initialStats.frequencyByResponsible[mainResponsible] || 0) + amount;
        } else {
          responsibleSubtypes.forEach(st => {
            initialStats.frequencyByResponsible[mainResponsible] = (initialStats.frequencyByResponsible[mainResponsible] || 0) + amount;
            if (!initialStats.subtypesByMainResponsible[mainResponsible]) {
              initialStats.subtypesByMainResponsible[mainResponsible] = {};
            }
            if (!initialStats.subtypesByMainResponsible[mainResponsible][st]) {
              initialStats.subtypesByMainResponsible[mainResponsible][st] = { units: 0, frequency: 0 };
            }
            initialStats.subtypesByMainResponsible[mainResponsible][st].units += amount;
            initialStats.subtypesByMainResponsible[mainResponsible][st].frequency += amount;
          });
        }
      });
    });

    initialStats.total = filteredCases.length;
    const completionRate = initialStats.total > 0
      ? Math.round((initialStats.completed / initialStats.total) * 100)
      : 0;
      
    const remainingBoxes = Math.max(0, initialStats.totalBoxes - initialStats.completedBoxes);

    return {
      ...initialStats,
      completionRate,
      remainingBoxes
    };
  }, [filteredCases, reasonFilter, responsibleFilter, customerFilter]);

  // Chart Data preparation based on View Mode and Drill-down
  const chartData = useMemo(() => {
    if (analysisDimension === 'reason') {
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
    } else {
      if (selectedMainResponsible) {
        // Responsible Subtype View
        const subtypes = stats.subtypesByMainResponsible[selectedMainResponsible] || {};
        return Object.entries(subtypes)
          .map(([name, counts]) => ({
            name,
            value: viewMode === 'units' ? counts.units : counts.frequency
          }))
          .sort((a, b) => b.value - a.value);
      } else {
        // Main Responsible View
        return Object.entries(viewMode === 'units' ? stats.unitsByResponsible : stats.frequencyByResponsible)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      }
    }
  }, [analysisDimension, selectedMainReason, selectedMainResponsible, viewMode, stats]);

  const maxChartValue = Math.max(1, ...chartData.map(d => d.value));
  const sourceEntries = Object.entries(stats.sources).sort(([, a], [, b]) => b - a);

  // ===== LOADING STATE =====
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-container p-5 rounded-2xl border border-slate-100 h-28 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '1.5s' }} />
              <div className="w-10 h-10 rounded-xl bg-slate-50 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
              <div className="h-6 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-container p-6 rounded-2xl border border-slate-100 h-96 animate-pulse" />
          <div className="glass-container p-6 rounded-2xl border border-slate-100 h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ===== FILTER TOOLBAR ===== */}
      <div className="flex flex-col gap-4">
        {/* Quick Status Pills + Filter Toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-on-surface-variant mr-1">สถานะ:</span>
            {([
              { key: 'all', label: 'ทั้งหมด', color: 'bg-primary text-white shadow-lg shadow-primary/20' },
              { key: 'Pending', label: 'รอดำเนินการ', color: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' },
              { key: 'In-Progress', label: 'กำลังดำเนินการ', color: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' },
              { key: 'Completed', label: 'เสร็จสิ้น', color: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' },

            ] as const).map(({ key, label, color }) => {
              const isAll = key === 'all';
              const isActive = isAll ? statusFilter.length === 0 : statusFilter.includes(key);
              const count = isAll ? cases.length : cases.filter(c => c.status === key).length;
              return (
                <motion.button key={key} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => isAll ? setStatusFilter([]) : toggleArrayFilter(statusFilter, key, setStatusFilter)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-100 ${isActive ? color : 'bg-slate-50 text-on-surface-variant hover:bg-slate-100 hover:text-foreground'}`}
                >
                  {label} <span className={`text-xs font-black ${isActive ? 'opacity-80' : 'opacity-50'}`}>{count}</span>
                </motion.button>
              );
            })}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:w-auto border ${showFilters || hasActiveFilters ? 'bg-primary text-white border-primary/20 shadow-lg shadow-primary/20' : 'bg-slate-50 border-slate-200 text-on-surface-variant hover:bg-slate-100 hover:text-foreground'}`}
          >
            <SlidersHorizontal size={14} /> ตัวกรอง
            {activeFilterCount > 0 && <span className="bg-white/95 text-primary text-xs font-black w-5 h-5 flex items-center justify-center rounded-full ml-1">{activeFilterCount}</span>}
          </motion.button>
        </div>

        {/* Advanced Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="glass-container p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><SlidersHorizontal size={15} className="text-primary" /></div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">ตัวกรองแดชบอร์ด</h4>
                    <p className="text-xs text-on-surface-variant">เลือกเงื่อนไขเพื่อกรองข้อมูลในกราฟ</p>
                  </div>
                </div>
                <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-lg hover:bg-slate-50 flex items-center justify-center text-on-surface-variant hover:text-foreground transition-colors"><X size={15} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reason Filter */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">⚠️ ประเภทข้อบกพร่อง (Reason)</label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueReasons.map(reason => (
                      <motion.button key={reason} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => toggleArrayFilter(reasonFilter, reason, setReasonFilter)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${reasonFilter.includes(reason) ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-slate-50 border-slate-100 text-on-surface-variant hover:bg-slate-100'}`}
                      >{reason}</motion.button>
                    ))}
                    {uniqueReasons.length === 0 && <span className="text-xs text-on-surface-variant italic">ไม่มีข้อมูล</span>}
                  </div>
                </div>

                {/* Responsible Filter */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">👤 ผู้รับผิดชอบ (Responsible)</label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueResponsibles.map(responsible => (
                      <motion.button key={responsible} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => toggleArrayFilter(responsibleFilter, responsible, setResponsibleFilter)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${responsibleFilter.includes(responsible) ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-50 border-slate-100 text-on-surface-variant hover:bg-slate-100'}`}
                      >{responsible}</motion.button>
                    ))}
                    {uniqueResponsibles.length === 0 && <span className="text-xs text-on-surface-variant italic">ไม่มีข้อมูล</span>}
                  </div>
                </div>

                {/* Customer Filter */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">🏢 ลูกค้า (Customer)</label>
                  <div className="flex flex-wrap gap-2">
                    {uniqueCustomers.map(customer => (
                      <motion.button key={customer} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => toggleArrayFilter(customerFilter, customer, setCustomerFilter)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${customerFilter.includes(customer) ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-50 border-slate-100 text-on-surface-variant hover:bg-slate-100'}`}
                      >{customer}</motion.button>
                    ))}
                    {uniqueCustomers.length === 0 && <span className="text-xs text-on-surface-variant italic">ไม่มีข้อมูล</span>}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">📊 สถานะ (Status)</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Pending', 'In-Progress', 'Completed'] as const).map(status => {
                      const isActive = statusFilter.includes(status);
                      const labels = {
                        Pending: 'รอดำเนินการ',
                        'In-Progress': 'กำลังดำเนินการ',
                        Completed: 'เสร็จสิ้น'
                      };
                      return (
                        <motion.button key={status} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => toggleArrayFilter(statusFilter, status, setStatusFilter)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${isActive ? 'bg-primary/20 text-primary border-primary/30' : 'bg-slate-50 border-slate-100 text-on-surface-variant hover:bg-slate-100'}`}
                        >{labels[status]}</motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5"><Calendar size={12} /> ช่วงเวลา (วันที่)</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
                      <span className="absolute -top-1.5 left-3 bg-slate-100  px-1.5 py-0.5 rounded text-xs text-on-surface-variant font-bold border border-slate-100">เริ่มต้น</span>
                    </div>
                    <span className="text-on-surface-variant text-xs font-bold">→</span>
                    <div className="flex-1 relative">
                      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
                      <span className="absolute -top-1.5 left-3 bg-slate-100  px-1.5 py-0.5 rounded text-xs text-on-surface-variant font-bold border border-slate-100">สิ้นสุด</span>
                    </div>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <p className="text-xs text-on-surface-variant">พบ <span className="font-bold text-primary">{filteredCases.length}</span> รายการ จากทั้งหมด {cases.length} รายการ</p>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={clearAllFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-xs font-bold">
                    <X size={13} /> ล้างตัวกรองทั้งหมด
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filter Tags (when panel closed) */}
        <AnimatePresence>
          {hasActiveFilters && !showFilters && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">กรอง:</span>
              {statusFilter.map(s => (
                <span key={`t-s-${s}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-on-surface border border-slate-200 text-xs font-medium">
                  {s === 'Pending' ? 'รอดำเนินการ' : s === 'In-Progress' ? 'กำลังดำเนินการ' : 'เสร็จสิ้น'}
                  <button onClick={() => toggleArrayFilter(statusFilter, s, setStatusFilter)} className="hover:text-foreground text-on-surface-variant ml-0.5"><X size={10} /></button>
                </span>
              ))}
              {reasonFilter.map(r => (
                <span key={`t-r-${r}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-medium">
                  {r}
                  <button onClick={() => toggleArrayFilter(reasonFilter, r, setReasonFilter)} className="hover:text-orange-300 text-orange-400 ml-0.5"><X size={10} /></button>
                </span>
              ))}
              {responsibleFilter.map(resp => (
                <span key={`t-resp-${resp}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-medium">
                  {resp}
                  <button onClick={() => toggleArrayFilter(responsibleFilter, resp, setResponsibleFilter)} className="hover:text-cyan-300 text-cyan-400 ml-0.5"><X size={10} /></button>
                </span>
              ))}
              {customerFilter.map(c => (
                <span key={`t-c-${c}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-medium">
                  {c}
                  <button onClick={() => toggleArrayFilter(customerFilter, c, setCustomerFilter)} className="hover:text-indigo-300 text-indigo-400 ml-0.5"><X size={10} /></button>
                </span>
              ))}
              {(dateFrom || dateTo) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                  📅 {dateFrom || '...'} → {dateTo || '...'}
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="hover:text-emerald-300 text-emerald-400 ml-0.5"><X size={10} /></button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-xs text-rose-400 font-medium hover:text-rose-300 ml-1 underline underline-offset-2">ล้างทั้งหมด</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== KEY METRICS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard label="งานทั้งหมด" value={stats.total.toString()} icon={<Package size={20} className="text-blue-400" />} bgColor="blue" trend={`บันทึกแล้ว ${filteredCases.length} เคส`} />
        <MetricCard label="เสร็จสิ้นแล้ว" value={stats.completed.toString()} icon={<CheckCircle2 size={20} className="text-emerald-400" />} bgColor="emerald" trend={`${stats.completionRate}% ความสำเร็จ`} />
        
        <MetricCard 
          label="จำนวนกล่องค้างงาน" 
          value={stats.remainingBoxes.toLocaleString()} 
          icon={<Package size={20} className="text-indigo-400" />} 
          bgColor="indigo" 
          trend={`จากทั้งหมด ${stats.totalBoxes.toLocaleString()} กล่อง`}
          tooltip="ยอดรวมกล่องทั้งหมดที่ยังไม่ได้อัปเดตความคืบหน้า (Total - Completed)"
        />

        <MetricCard 
          label="เปื้อนจากการรั่ว" 
          value={stats.linkedCount.toString()} 
          icon={<Link2 size={20} className="text-amber-400" />} 
          bgColor="amber" 
          trend="Correlation Detection"
          tooltip="จำนวนรายการที่เปื้อนเนื่องมาจากการรั่วไหลของไอเทมอื่น"
        />
        <MetricCard label="งานค้าง > 7 วัน" value={stats.pendingOverdue.toString()} icon={<Clock size={20} className="text-rose-400" />} bgColor="rose" trend="Overdue SLA" tooltip="จำนวนรายการที่ค้างเกิน 7 วัน" />
      </div>

      {/* ===== MAIN ANALYTICS VIEW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dual-View Analysis Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              {(selectedMainReason || selectedMainResponsible) && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => {
                    setSelectedMainReason(null);
                    setSelectedMainResponsible(null);
                  }}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-on-surface-variant hover:text-foreground transition-colors border border-slate-100"
                >
                  <ChevronLeft size={16} />
                </motion.button>
              )}
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Layers size={16} className="text-primary" />
                  {selectedMainReason 
                    ? `รายละเอียดสาเหตุ: ${selectedMainReason}` 
                    : selectedMainResponsible 
                    ? `รายละเอียดงานของ: ${selectedMainResponsible}`
                    : analysisDimension === 'reason' ? 'วิเคราะห์สาเหตุข้อบกพร่อง' : 'วิเคราะห์ตามผู้รับผิดชอบ'}
                </h3>
                <p className="text-xs text-on-surface-variant font-medium">
                  {selectedMainReason || selectedMainResponsible 
                    ? 'เจาะลึกรายละเอียดย่อย (Subtypes)' 
                    : 'ภาพรวมหลัก (Main Categories) - คลิกเพื่อเจาะลึก'}
                </p>
              </div>
            </div>

            {/* Toggles container */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Toggle Dimension */}
              {!selectedMainReason && !selectedMainResponsible && (
                <div className="flex bg-slate-50 p-1 rounded-xl w-fit border border-slate-100">
                  <button
                    onClick={() => setAnalysisDimension('reason')}
                    className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${analysisDimension === 'reason' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-foreground'}`}
                  >
                    ดูตามสาเหตุ
                  </button>
                  <button
                    onClick={() => setAnalysisDimension('responsible')}
                    className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${analysisDimension === 'responsible' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-foreground'}`}
                  >
                    ดูตามผู้รับผิดชอบ
                  </button>
                </div>
              )}

              {/* Toggle View Mode */}
              <div className="flex bg-slate-50 p-1 rounded-xl w-fit border border-slate-100">
                <button
                  onClick={() => setViewMode('units')}
                  className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'units' ? 'bg-indigo-500 text-foreground shadow-sm' : 'text-on-surface-variant hover:text-foreground'}`}
                >
                  ปริมาณ (Units)
                </button>
                <button
                  onClick={() => setViewMode('defects')}
                  className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'defects' ? 'bg-indigo-500 text-foreground shadow-sm' : 'text-on-surface-variant hover:text-foreground'}`}
                >
                  ความถี่ (Defects)
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <AnimatePresence mode="wait">
              {chartData.length > 0 ? (
                <motion.div
                  key={selectedMainReason || 'main'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {chartData.map((item) => {
                    const isMainView = !selectedMainReason && !selectedMainResponsible;
                    return (
                      <div 
                        key={item.name} 
                        className={`group relative ${isMainView ? 'cursor-pointer hover:bg-slate-50' : ''} p-2 rounded-xl transition-all border border-transparent hover:border-slate-100`}
                        onClick={() => {
                          if (isMainView) {
                            if (analysisDimension === 'reason') setSelectedMainReason(item.name);
                            else setSelectedMainResponsible(item.name);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-on-surface">{item.name}</span>
                            {isMainView && (
                              <ArrowRight size={11} className="text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                            )}
                          </div>
                        <span className="text-xs font-black text-foreground">{item.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2.5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${(item.value / maxChartValue) * 100}%` }} 
                          transition={{ duration: 0.8, ease: 'circOut' }}
                          className={`h-full rounded-full ${viewMode === 'units' ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-orange-500 to-orange-400'}`} 
                        />
                      </div>
                    </div>
                  );
                })}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                  <Package size={40} className="opacity-10 mb-3" />
                  <p className="text-xs font-medium italic">ไม่มีข้อมูลที่จะแสดงผล</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Legend */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">ปริมาณชิ้นงาน (Units)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">ความถี่ของปัญหา (Defects)</span>
            </div>
          </div>
        </div>

        {/* Right Stack: Workload Source & Top Offenders (1/3 width) */}
        <div className="flex flex-col gap-6 h-full">
          {/* Workload by Source */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md flex flex-col justify-start gap-2 h-1/2">
          <div>
            <h3 className="text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
              <Package size={16} className="text-primary" />
              แหล่งที่มาของงาน
            </h3>
            <p className="text-xs text-on-surface-variant mb-4 font-medium">สถิติจำนวนเคสแยกตามฝ่ายที่แจ้ง rework</p>
          </div>
          <div className="space-y-5 flex-1">
            {sourceEntries.length > 0 ? (
              sourceEntries.map(([source, count]) => {
                const percentage = Math.round((count / stats.total) * 100);
                return (
                  <div key={source} className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-on-surface">{source}</span>
                      <span className="text-xs font-bold text-foreground">{count} เคส ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${percentage}%` }} 
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full shadow-sm" 
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-on-surface-variant text-center py-8 italic">ไม่มีข้อมูล</p>
            )}
          </div>
          <div className="mt-2 pt-4 border-t border-slate-100 text-xs text-on-surface-variant font-medium uppercase tracking-wider text-center mt-auto">
            Source Dispatch
          </div>
          </div>

          {/* Top 3 Offenders */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md flex flex-col justify-start gap-2 flex-1">
            <TopOffendersSection stats={stats} />
          </div>
        </div>

      </div>

      {/* ===== TIME-SERIES TREND CHART ===== */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md mb-6">
        <TrendAnalysisSection stats={stats} viewMode={viewMode} />
      </div>

      {/* Status Distribution Details (Responsive Grid + Interactive SVG Donut) */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <TrendingUp size={16} />
              สัดส่วนสถานะการจัดการ
            </h3>
            <p className="text-xs text-on-surface-variant font-medium">วิเคราะห์ความก้าวหน้าและการกระจายตัวของเคส</p>
          </div>
        </div>
        
        <StatusDistributionSection stats={stats} />
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
  let glowColor = 'from-primary/10 to-transparent';
  if (bgColor.includes('blue')) glowColor = 'from-blue-500/10 to-transparent';
  else if (bgColor.includes('emerald')) glowColor = 'from-emerald-500/10 to-transparent';
  else if (bgColor.includes('amber')) glowColor = 'from-amber-500/10 to-transparent';
  else if (bgColor.includes('rose')) glowColor = 'from-rose-500/10 to-transparent';
  else if (bgColor.includes('indigo')) glowColor = 'from-indigo-500/10 to-transparent';

  return (
    <div className="bg-white p-5 rounded-2xl relative group border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-300">
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br ${glowColor} blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
      </div>
      
      <div className={`relative z-10 w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 shadow-inner`}>
        {icon}
      </div>
      
      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5 truncate min-w-0">{label}</p>
      
      <div className="flex items-baseline gap-2 min-w-0">
        <h3 className="text-2xl font-black text-foreground leading-none tracking-tight truncate">{value}</h3>
      </div>
      
      {trend && (
        <p className="text-xs font-bold text-on-surface-variant mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
          {trend}
        </p>
      )}
      
      {tooltip && (
        <div className="absolute top-4 right-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
          <div className="relative group/tip">
            <AlertCircle size={13} className="cursor-help text-on-surface-variant/60 hover:text-foreground relative z-50" />
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-white border border-slate-200 text-foreground text-xs shadow-xl rounded-lg opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50">
              {tooltip}
              <div className="absolute top-full right-2 border-4 border-transparent border-t-slate-950" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== StatusDistributionSection Sub-Component =====
interface StatusDistributionSectionProps {
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

function StatusDistributionSection({ stats }: StatusDistributionSectionProps) {
  const { total, pending, inProgress, completed } = stats;
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const data = useMemo(() => {
    return [
      { 
        name: 'รอดำเนินการ (Pending)', 
        count: pending, 
        color: '#f59e0b', // Amber 500
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/5',
        hoverBg: 'hover:bg-amber-500/10',
        key: 'pending' 
      },
      { 
        name: 'กำลังดำเนินการ (In-Progress)', 
        count: inProgress, 
        color: '#6366f1', // Indigo 500
        borderColor: 'border-indigo-500/30',
        textColor: 'text-indigo-400',
        bgColor: 'bg-indigo-500/5',
        hoverBg: 'hover:bg-indigo-500/10',
        key: 'inProgress' 
      },
      { 
        name: 'เสร็จสมบูรณ์ (Completed)', 
        count: completed, 
        color: '#10b981', // Emerald 500
        borderColor: 'border-emerald-500/30',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/5',
        hoverBg: 'hover:bg-emerald-500/10',
        key: 'completed' 
      },
    ];
  }, [pending, inProgress, completed]);

  const activeSegments = useMemo(() => {
    return data.filter(item => item.count > 0);
  }, [data]);

  const r = 72;
  const strokeWidth = 10;
  const size = 200;
  const center = size / 2;
  const circumference = 2 * Math.PI * r;

  const segments = useMemo(() => {
    let accumulatedPercent = 0;
    return activeSegments.map((item) => {
      const percentage = total > 0 ? (item.count / total) * 100 : 0;
      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
      accumulatedPercent += percentage;
      return {
        ...item,
        percentage,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [activeSegments, total, circumference]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-4">
      {/* Left side: Interactive SVG Donut Chart */}
      <div className="md:col-span-5 flex flex-col items-center justify-center">
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Inner Text Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none z-10">
            <AnimatePresence mode="wait">
              {hoveredKey ? (
                <motion.div
                  key={hoveredKey}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="px-2"
                >
                  {(() => {
                    const activeItem = data.find(d => d.key === hoveredKey);
                    if (!activeItem) return null;
                    const percent = total > 0 ? Math.round((activeItem.count / total) * 100) : 0;
                    return (
                      <>
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
                          {activeItem.key === 'pending' ? 'รอดำเนินการ' :
                           activeItem.key === 'inProgress' ? 'กำลังทำ' : 'เสร็จสิ้น'}
                        </span>
                        <span className="text-2xl font-black text-foreground block leading-none mb-1">
                          {activeItem.count}
                        </span>
                        <span className={`text-xs font-extrabold ${activeItem.textColor}`}>
                          {percent}% ของทั้งหมด
                        </span>
                      </>
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">
                    เคสทั้งหมด
                  </span>
                  <span className="text-3xl font-black text-foreground block leading-none mb-1">
                    {total}
                  </span>
                  <span className="text-xs font-bold text-primary/70 uppercase tracking-widest">
                    QSMS REWORK
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SVG Donut */}
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 select-none cursor-pointer"
          >
            {/* Background Track Circle */}
            <circle
              cx={center}
              cy={center}
              r={r}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />

            {/* Empty State Circle if no cases */}
            {total === 0 && (
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
              />
            )}

            {/* Dynamic Segments */}
            {segments.map((segment) => {
              const isHovered = hoveredKey === segment.key;
              return (
                <motion.circle
                  key={segment.key}
                  cx={center}
                  cy={center}
                  r={r}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                  strokeLinecap="round"
                  onMouseEnter={() => setHoveredKey(segment.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  className="transition-all duration-300 origin-center"
                  style={{
                    filter: isHovered 
                      ? `drop-shadow(0 0 6px ${segment.color})` 
                      : 'none',
                    opacity: hoveredKey && !isHovered ? 0.4 : 1,
                  }}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right side: Modern Interactive Legend Cards */}
      <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.map((item) => {
          const isHovered = hoveredKey === item.key;
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div
              key={item.key}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 select-none ${item.bgColor} ${item.borderColor} ${item.hoverBg} ${
                isHovered ? 'scale-[1.02] shadow-sm hover:shadow-md border-slate-300 -translate-y-0.5' : 'opacity-90'
              }`}
              style={{
                boxShadow: isHovered ? `0 8px 24px -6px ${item.color}20` : 'none',
                opacity: hoveredKey && !isHovered ? 0.5 : 1
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider truncate">
                  {item.key === 'pending' ? 'รอดำเนินการ' :
                   item.key === 'inProgress' ? 'กำลังดำเนินการ' : 'เสร็จสมบูรณ์'}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-black text-foreground">{item.count} <span className="text-xs font-normal text-on-surface-variant">เคส</span></span>
                <span className={`text-xs font-extrabold ${item.textColor}`}>{percentage}%</span>
              </div>

              <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-1.5 overflow-hidden mt-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== TopOffendersSection Sub-Component =====
function TopOffendersSection({ stats }: { stats: any }) {
  const topItems = useMemo(() => {
    return Object.values(stats.itemsData)
      .sort((a: any, b: any) => b.units - a.units)
      .slice(0, 3);
  }, [stats]);

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
        <AlertCircle size={16} className="text-rose-400" />
        Top 3 สินค้าที่ Rework สูงสุด
      </h3>
      <p className="text-xs text-on-surface-variant mb-4 font-medium">รายการสินค้าเรียงตามปริมาณ (Units)</p>
      
      <div className="space-y-4 flex-1">
        {topItems.length > 0 ? (
          topItems.map((item: any, index: number) => (
            <div key={item.code} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-sm shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate" title={item.name}>{item.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{item.code}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-rose-400">{item.units} <span className="text-[10px] font-medium text-on-surface-variant uppercase">Units</span></p>
                <p className="text-[10px] font-medium text-on-surface-variant">พบ {item.frequency} ครั้ง</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-on-surface-variant text-center py-8 italic">ไม่มีข้อมูล</p>
        )}
      </div>
    </div>
  );
}

// ===== TrendAnalysisSection Sub-Component =====
function TrendAnalysisSection({ stats, viewMode }: { stats: any, viewMode: string }) {
  const chartData = useMemo(() => {
    return Object.values(stats.trendByDate)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [stats]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <TrendingUp size={16} />
            แนวโน้มปริมาณ Rework (Time-Series)
          </h3>
          <p className="text-xs text-on-surface-variant font-medium">แสดงสถิติรายวันตามวันที่เปิดเคส</p>
        </div>
      </div>
      
      <div className="h-[250px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={viewMode === 'units' ? '#6366f1' : '#f97316'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={viewMode === 'units' ? '#6366f1' : '#f97316'} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickMargin={10} minTickGap={20} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#e2e8f0', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                labelStyle={{ color: '#64748b', fontSize: '11px', marginBottom: '4px' }}
                formatter={(value: number, name: string) => {
                  if (name === 'completedUnits') return [value, 'Completed Units'];
                  return [value, viewMode === 'units' ? 'Total Units' : 'Total Defects'];
                }}
              />
              <Area 
                type="monotone" 
                dataKey={viewMode === 'units' ? 'units' : 'defects'} 
                stroke={viewMode === 'units' ? '#6366f1' : '#f97316'} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
              {viewMode === 'units' && (
                <Area 
                  type="monotone" 
                  dataKey="completedUnits"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant">
            <TrendingUp size={40} className="opacity-10 mb-3" />
            <p className="text-xs font-medium italic">ไม่มีข้อมูลกราฟสำหรับช่วงเวลานี้</p>
          </div>
        )}
      </div>
    </div>
  );
}
