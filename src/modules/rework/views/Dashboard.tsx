/**
 * Operations Bottleneck & Department Flow Dashboard
 * Monitors rework lifecycle, department queues, defect root causes, and blocked defend issues.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2, Clock, AlertCircle,
  Package, SlidersHorizontal, X, Calendar, Layers, Link2, ChevronLeft, ArrowRight,
  ShieldCheck, Truck, Wrench, AlertTriangle, TrendingUp, BarChart3, ChevronRight, Boxes
} from 'lucide-react';
import { ReworkCase, ReworkItem, CaseStatus } from '@/src/services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ViewMode = 'units' | 'defects';

interface DashboardProps {
  cases: ReworkCase[];
  isLoading: boolean;
}

// Normalize case status for unified analytics
export function normalizeStatus(status?: string): 'Pending Analysis' | 'Awaiting Materials' | 'In-Progress' | 'Blocked' | 'Completed' {
  if (!status) return 'Pending Analysis';
  const s = status.trim();
  if (s === 'Pending Analysis') return 'Pending Analysis';
  if (s === 'Awaiting Materials') return 'Awaiting Materials';
  if (s === 'Blocked') return 'Blocked';
  if (s === 'Completed') return 'Completed';
  if (s === 'In-Progress' || s === 'Pending') return 'In-Progress';
  return 'Pending Analysis';
}

export function Dashboard({ cases, isLoading }: DashboardProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [reasonFilter, setReasonFilter] = useState<string[]>([]);
  const [responsibleFilter, setResponsibleFilter] = useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string[]>([]);
  const [departmentQueueFilter, setDepartmentQueueFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Dual-View Analysis States
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
    cases.forEach(c => {
      const caseCustomer = String(c.customerName || '').trim();
      if (caseCustomer) customers.add(caseCustomer);
      c.items?.forEach(item => {
        const trimmedCustomer = String(item.customerName || '').trim();
        if (trimmedCustomer) customers.add(trimmedCustomer);
      });
    });
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
      const normStatus = normalizeStatus(c.status);

      // Status filter
      if (statusFilter.length > 0) {
        const matchesStatus = statusFilter.some(sf => {
          if (sf === 'In-Progress') return c.status === 'In-Progress' || c.status === 'Pending';
          return c.status === sf;
        });
        if (!matchesStatus) return false;
      }

      // Department Queue Quick Filter
      if (departmentQueueFilter) {
        if (departmentQueueFilter === 'QSMS' && normStatus !== 'Pending Analysis') return false;
        if (departmentQueueFilter === 'WPK' && normStatus !== 'Awaiting Materials') return false;
        if (departmentQueueFilter === 'PDF' && normStatus !== 'In-Progress') return false;
        if (departmentQueueFilter === 'BLOCKED' && normStatus !== 'Blocked') return false;
        if (departmentQueueFilter === 'COMPLETED' && normStatus !== 'Completed') return false;
      }

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
        const cCust = String(c.customerName || '').trim();
        const hasCustomer = customerFilter.includes(cCust) || c.items?.some(item => customerFilter.includes(String(item.customerName || '').trim()));
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
  }, [cases, statusFilter, departmentQueueFilter, reasonFilter, responsibleFilter, customerFilter, dateFrom, dateTo]);

  const hasActiveFilters = statusFilter.length > 0 || departmentQueueFilter !== null || reasonFilter.length > 0 || responsibleFilter.length > 0 || customerFilter.length > 0 || dateFrom || dateTo;
  const activeFilterCount = (statusFilter.length > 0 ? 1 : 0) + (departmentQueueFilter ? 1 : 0) + (reasonFilter.length > 0 ? 1 : 0) + (responsibleFilter.length > 0 ? 1 : 0) + (customerFilter.length > 0 ? 1 : 0) + (dateFrom || dateTo ? 1 : 0);

  const clearAllFilters = () => {
    setStatusFilter([]);
    setDepartmentQueueFilter(null);
    setReasonFilter([]);
    setResponsibleFilter([]);
    setCustomerFilter([]);
    setDateFrom('');
    setDateTo('');
  };

  const toggleArrayFilter = <T extends string>(arr: T[], val: T, setter: (v: T[]) => void) => {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  // ===== CALCULATE OPERATIONS & DEPARTMENT METRICS =====
  const stats = useMemo(() => {
    const initialStats = {
      total: 0,
      // 5 Stages of Workflow
      pendingAnalysis: 0,   // Step 1: QSMS
      awaitingMaterials: 0, // Step 2: WPK
      pending: 0,           // Legacy Pending
      inProgress: 0,        // Step 3: PDF / Production
      blocked: 0,           // Step 4: Blocked / Defend
      completed: 0,         // Step 5: Finished
      
      // Units / Boxes per Stage
      boxesPendingAnalysis: 0,
      boxesAwaitingMaterials: 0,
      boxesPending: 0,
      boxesInProgress: 0,
      boxesBlocked: 0,
      boxesCompleted: 0,

      // Blocked defect materials count
      missingBoxesTotal: 0,
      missingGallonsTotal: 0,
      missingOilTotal: 0,
      blockedReasons: {} as Record<string, number>,
      completionRate: 0,
      linkedCount: 0,
      pendingOverdue: 0, // > 7 days non-completed
      totalBoxes: 0,
      completedBoxes: 0,
      remainingBoxes: 0,
      itemsData: {} as Record<string, { code: string; name: string; units: number; frequency: number }>,
      trendByDate: {} as Record<string, { date: string; cases: number; units: number; defects: number; completedUnits: number }>,
      
      // Defect Root Cause Analytics
      unitsByReason: {} as Record<string, number>,
      frequencyByReason: {} as Record<string, number>,
      subtypesByMainReason: {} as Record<string, Record<string, { units: number; frequency: number }>>,
      
      // Responsible Entity Analytics
      unitsByResponsible: {} as Record<string, number>,
      frequencyByResponsible: {} as Record<string, number>,
      subtypesByMainResponsible: {} as Record<string, Record<string, { units: number; frequency: number }>>,
      
      sources: {} as Record<string, number>,

      // Department Queue Breakdown
      departmentWorkload: {
        QSMS: { cases: 0, boxes: 0, label: 'รอวิเคราะห์สเปก & สาเหตุ', role: 'QSMS (Quality Control)' },
        WPK: { cases: 0, boxes: 0, label: 'รอเบิกจ่ายบรรจุภัณฑ์ & วัสดุ', role: 'WPK (Warehouse & Store)' },
        PDF: { cases: 0, boxes: 0, label: 'กำลังดำเนินการผลิตซ่อม', role: 'PDF (Production & Repair)' },
        BLOCKED: { cases: 0, boxes: 0, label: 'ติดปัญหาหน้างาน / รอของ', role: 'Defend / On-hold' },
      }
    };

    if (!filteredCases || filteredCases.length === 0) return initialStats;

    const today = new Date();

    filteredCases.forEach(caseItem => {
      const normStatus = normalizeStatus(caseItem.status);
      let caseTotalBoxes = 0;
      let caseCompletedBoxes = 0;

      // Overdue calculation (> 7 days active)
      const caseDateObj = new Date(caseItem.date);
      const diffTime = Math.abs(today.getTime() - caseDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (normStatus !== 'Completed' && diffDays > 7) {
        initialStats.pendingOverdue++;
      }

      if (normStatus === 'Blocked' || caseItem.blockedInfo?.isBlocked) {
        const cat = String(caseItem.blockedInfo?.reasonCategory || 'other');
        initialStats.blockedReasons[cat] = (initialStats.blockedReasons[cat] || 0) + 1;
      }

      // Sum missing materials in blocked cases
      if (caseItem.missingBoxes) initialStats.missingBoxesTotal += Number(caseItem.missingBoxes) || 0;
      if (caseItem.missingGallons) initialStats.missingGallonsTotal += Number(caseItem.missingGallons) || 0;
      if (caseItem.missingOil) initialStats.missingOilTotal += Number(caseItem.missingOil) || 0;

      const dateStr = caseItem.date ? caseItem.date.split('T')[0] : 'Unknown';
      if (!initialStats.trendByDate[dateStr]) {
        initialStats.trendByDate[dateStr] = { date: dateStr, cases: 0, units: 0, defects: 0, completedUnits: 0 };
      }
      initialStats.trendByDate[dateStr].cases++;

      const source = String(caseItem.source || 'SFC').trim();
      initialStats.sources[source] = (initialStats.sources[source] || 0) + 1;

      // Process Items
      caseItem.items?.forEach(item => {
        const amount = Number(item.amount) || 0;
        const mainReason = String(item.reason || 'ไม่ระบุ').trim();
        const mainResponsible = String(item.responsible || 'ไม่ระบุ').trim();
        
        caseTotalBoxes += amount;
        initialStats.totalBoxes += amount;
        
        let completed = 0;
        if (normStatus === 'Completed') {
          completed = amount;
        } else {
          completed = Number(item.completedBoxes) || 0;
        }
        caseCompletedBoxes += completed;
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

        // Units and Frequency by Reason
        initialStats.unitsByReason[mainReason] = (initialStats.unitsByReason[mainReason] || 0) + amount;

        const subtypes = String(item.reasonSubtype || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

        if (subtypes.length === 0) {
          initialStats.frequencyByReason[mainReason] = (initialStats.frequencyByReason[mainReason] || 0) + amount;
          initialStats.trendByDate[dateStr].defects += amount;
        } else {
          subtypes.forEach(st => {
            initialStats.frequencyByReason[mainReason] = (initialStats.frequencyByReason[mainReason] || 0) + amount;
            if (!initialStats.subtypesByMainReason[mainReason]) {
              initialStats.subtypesByMainReason[mainReason] = {};
            }
            if (!initialStats.subtypesByMainReason[mainReason][st]) {
              initialStats.subtypesByMainReason[mainReason][st] = { units: 0, frequency: 0 };
            }
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

      // Stage Distribution & Department Queues
      if (normStatus === 'Pending Analysis') {
        initialStats.pendingAnalysis++;
        initialStats.boxesPendingAnalysis += caseTotalBoxes;
        initialStats.departmentWorkload.QSMS.cases++;
        initialStats.departmentWorkload.QSMS.boxes += caseTotalBoxes;
      } else if (normStatus === 'Awaiting Materials') {
        initialStats.awaitingMaterials++;
        initialStats.boxesAwaitingMaterials += caseTotalBoxes;
        initialStats.departmentWorkload.WPK.cases++;
        initialStats.departmentWorkload.WPK.boxes += caseTotalBoxes;
      } else if (normStatus === 'In-Progress') {
        initialStats.inProgress++;
        initialStats.boxesInProgress += Math.max(0, caseTotalBoxes - caseCompletedBoxes);
        initialStats.departmentWorkload.PDF.cases++;
        initialStats.departmentWorkload.PDF.boxes += Math.max(0, caseTotalBoxes - caseCompletedBoxes);
      } else if (normStatus === 'Blocked') {
        initialStats.blocked++;
        initialStats.boxesBlocked += Math.max(0, caseTotalBoxes - caseCompletedBoxes);
        initialStats.departmentWorkload.BLOCKED.cases++;
        initialStats.departmentWorkload.BLOCKED.boxes += Math.max(0, caseTotalBoxes - caseCompletedBoxes);
      } else if (normStatus === 'Completed') {
        initialStats.completed++;
        initialStats.boxesCompleted += caseTotalBoxes;
      }
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
  }, [filteredCases]);

  // Identify highest bottleneck department
  const bottleneckSummary = useMemo(() => {
    const queues = [
      { key: 'QSMS', name: 'ฝ่าย QSMS', cases: stats.departmentWorkload.QSMS.cases, boxes: stats.departmentWorkload.QSMS.boxes, action: 'รอวิเคราะห์สาเหตุ & สเปก' },
      { key: 'WPK', name: 'ฝ่าย WPK (คลัง/ภาชนะ)', cases: stats.departmentWorkload.WPK.cases, boxes: stats.departmentWorkload.WPK.boxes, action: 'รอเบิกจ่ายบรรจุภัณฑ์' },
      { key: 'PDF', name: 'ฝ่าย PDF (ผลิต/ซ่อม)', cases: stats.departmentWorkload.PDF.cases, boxes: stats.departmentWorkload.PDF.boxes, action: 'กำลังผลิตซ่อมในสายงาน' },
      { key: 'BLOCKED', name: 'จุดติดปัญหา (Defend)', cases: stats.departmentWorkload.BLOCKED.cases, boxes: stats.departmentWorkload.BLOCKED.boxes, action: 'ขาดวัสดุ / รอเคลียร์ปัญหา' },
    ];
    const sorted = [...queues].sort((a, b) => b.cases - a.cases);
    return {
      highest: sorted[0]?.cases > 0 ? sorted[0] : null,
      queues: sorted,
    };
  }, [stats]);

  // Chart Data preparation based on View Mode and Drill-down
  const chartData = useMemo(() => {
    if (analysisDimension === 'reason') {
      if (selectedMainReason) {
        const subtypes = stats.subtypesByMainReason[selectedMainReason] || {};
        return Object.entries(subtypes)
          .map(([name, counts]) => ({
            name,
            value: viewMode === 'units' ? counts.units : counts.frequency
          }))
          .sort((a, b) => b.value - a.value);
      } else {
        return Object.entries(viewMode === 'units' ? stats.unitsByReason : stats.frequencyByReason)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      }
    } else {
      if (selectedMainResponsible) {
        const subtypes = stats.subtypesByMainResponsible[selectedMainResponsible] || {};
        return Object.entries(subtypes)
          .map(([name, counts]) => ({
            name,
            value: viewMode === 'units' ? counts.units : counts.frequency
          }))
          .sort((a, b) => b.value - a.value);
      } else {
        return Object.entries(viewMode === 'units' ? stats.unitsByResponsible : stats.frequencyByResponsible)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      }
    }
  }, [stats, analysisDimension, selectedMainReason, selectedMainResponsible, viewMode]);

  const maxChartValue = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(...chartData.map(d => d.value), 1);
  }, [chartData]);

  const sourceEntries = useMemo(() => {
    return Object.entries(stats.sources).sort((a, b) => b[1] - a[1]);
  }, [stats.sources]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <p className="mt-3 text-xs font-semibold text-slate-500">กำลังโหลดข้อมูลแดชบอร์ด &amp; สถิติ...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* ===== 1. BOTTLENECK RADAR BANNER ===== */}
      <div className="rounded-xl border border-[#FDE68A] bg-gradient-to-r from-[#FEF9E7] via-white to-[#FEFDF5] p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-2xs">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-tight">
                  Operations Flow &amp; Bottleneck Monitor
                </h2>
                {bottleneckSummary.highest && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                    <AlertTriangle size={12} className="text-rose-600" />
                    จุดคอขวดสูงสุด: {bottleneckSummary.highest.name} ({bottleneckSummary.highest.cases} เคส)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                ติดตามขั้นตอนงาน Rework แบบ Real-time เพื่อชี้เป้าว่างานกำลังติดค้างอยู่ที่ส่วนหรือแผนกไหน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-all border cursor-pointer ${
                showFilters || hasActiveFilters
                  ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span>ตัวกรองแดชบอร์ด</span>
              {activeFilterCount > 0 && (
                <span className="bg-[#92400E] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ml-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 4 Department Queue Status Island */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200/70">
          {bottleneckSummary.queues.map((q) => {
            const isSelected = departmentQueueFilter === q.key;
            const isBottleneck = bottleneckSummary.highest?.key === q.key && q.cases > 0;
            return (
              <button
                key={q.key}
                type="button"
                onClick={() => setDepartmentQueueFilter(isSelected ? null : q.key)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#FEF3C7] border-[#F5C754] ring-2 ring-[#F5C754]/30 shadow-2xs'
                    : isBottleneck
                    ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-50'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                {isBottleneck && (
                  <span className="absolute -top-2 right-2 text-[9px] font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded-full shadow-2xs">
                    คอขวด
                  </span>
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-800 truncate">{q.name}</span>
                  <span className="text-xs font-semibold font-mono text-slate-900">{q.cases} เคส</span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] text-slate-500">
                  <span className="truncate">{q.action}</span>
                  <span className="font-semibold font-mono text-slate-700 shrink-0 ml-1">{q.boxes} กล่อง</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== 2. ADVANCED FILTERS PANEL ===== */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-[#92400E]" />
                  <h3 className="text-xs font-semibold text-slate-800">ตัวกรองข้อมูลเชิงลึก (Deep Filters)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Status Filter */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">ขั้นตอน &amp; สถานะ</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'Pending Analysis', label: 'รอวิเคราะห์ (QSMS)' },
                      { key: 'Awaiting Materials', label: 'รอเบิกภาชนะ (WPK)' },
                      { key: 'In-Progress', label: 'กำลังซ่อม (PDF)' },
                      { key: 'Blocked', label: 'ติดปัญหา (Blocked)' },
                      { key: 'Completed', label: 'เสร็จสิ้น (100%)' },
                    ].map(({ key, label }) => {
                      const isActive = statusFilter.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleArrayFilter(statusFilter, key, setStatusFilter)}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                            isActive
                              ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Responsible Filter */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">ฝ่ายต้นเหตุข้อบกพร่อง</label>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueResponsibles.map(resp => (
                      <button
                        key={resp}
                        type="button"
                        onClick={() => toggleArrayFilter(responsibleFilter, resp, setResponsibleFilter)}
                        className={`px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                          responsibleFilter.includes(resp)
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {resp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Reason Filter */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">อาการข้อบกพร่อง</label>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueReasons.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleArrayFilter(reasonFilter, r, setReasonFilter)}
                        className={`px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                          reasonFilter.includes(r)
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Date Range */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                    <Calendar size={11} /> ช่วงเวลาวันที่
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    แสดง <strong className="text-slate-900">{filteredCases.length}</strong> จากทั้งหมด {cases.length} เคส
                  </span>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer underline underline-offset-2"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Tags (when panel closed) */}
      <AnimatePresence>
        {hasActiveFilters && !showFilters && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">ตัวกรองที่เลือก:</span>
            {statusFilter.map(s => (
              <span key={`t-s-${s}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-xs font-medium">
                {s === 'Pending Analysis' ? 'รอวิเคราะห์ (QSMS)' : s === 'Awaiting Materials' ? 'รอเบิกภาชนะ (WPK)' : s === 'Pending' ? 'รอดำเนินการ' : s === 'In-Progress' ? 'กำลังซ่อม (PDF)' : s === 'Blocked' ? 'ติดปัญหา Defend' : 'เสร็จสิ้น 100%'}
                <button type="button" onClick={() => toggleArrayFilter(statusFilter, s, setStatusFilter)} className="hover:text-amber-900 text-[#92400E] ml-0.5 cursor-pointer"><X size={11} /></button>
              </span>
            ))}
            {reasonFilter.map(r => (
              <span key={`t-r-${r}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                {r}
                <button type="button" onClick={() => toggleArrayFilter(reasonFilter, r, setReasonFilter)} className="hover:text-amber-900 text-amber-800 ml-0.5 cursor-pointer"><X size={11} /></button>
              </span>
            ))}
            {responsibleFilter.map(resp => (
              <span key={`t-resp-${resp}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-xs font-medium">
                {resp}
                <button type="button" onClick={() => toggleArrayFilter(responsibleFilter, resp, setResponsibleFilter)} className="hover:text-sky-900 text-sky-800 ml-0.5 cursor-pointer"><X size={11} /></button>
              </span>
            ))}
            {customerFilter.map(c => (
              <span key={`t-c-${c}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                {c}
                <button type="button" onClick={() => toggleArrayFilter(customerFilter, c, setCustomerFilter)} className="hover:text-indigo-900 text-indigo-800 ml-0.5 cursor-pointer"><X size={11} /></button>
              </span>
            ))}
            {(dateFrom || dateTo) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                <Calendar size={12} className="text-emerald-700 shrink-0" />
                <span>{dateFrom || '...'} &rarr; {dateTo || '...'}</span>
                <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); }} className="hover:text-emerald-900 text-emerald-800 ml-0.5 cursor-pointer"><X size={11} /></button>
              </span>
            )}
            <button type="button" onClick={clearAllFilters} className="text-xs text-rose-600 font-medium hover:text-rose-700 ml-1 underline underline-offset-2 cursor-pointer">ล้างทั้งหมด</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== 3. KEY METRIC KPI TILES ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <MetricCard
          label="งานทั้งหมดในระบบ"
          value={stats.total.toString()}
          icon={<Package size={18} className="text-slate-700" />}
          subtext={`รวม ${stats.totalBoxes.toLocaleString()} กล่อง`}
        />
        <MetricCard
          label="รอ QSMS วิเคราะห์"
          value={stats.pendingAnalysis.toString()}
          icon={<ShieldCheck size={18} className="text-[#92400E]" />}
          subtext={`${stats.boxesPendingAnalysis.toLocaleString()} กล่องรอสเปก`}
          highlight={stats.pendingAnalysis > 0 ? 'amber' : undefined}
        />
        <MetricCard
          label="รอ WPK เบิกภาชนะ"
          value={stats.awaitingMaterials.toString()}
          icon={<Truck size={18} className="text-orange-700" />}
          subtext={`${stats.boxesAwaitingMaterials.toLocaleString()} กล่องรอเบิก`}
          highlight={stats.awaitingMaterials > 0 ? 'orange' : undefined}
        />
        <MetricCard
          label="กำลังดำเนินการซ่อม"
          value={stats.inProgress.toString()}
          icon={<Wrench size={18} className="text-sky-700" />}
          subtext={`ค้างซ่อม ${stats.remainingBoxes.toLocaleString()} กล่อง`}
        />
        <MetricCard
          label="ติดปัญหา Defend"
          value={stats.blocked.toString()}
          icon={<AlertTriangle size={18} className="text-rose-700" />}
          subtext={stats.blocked > 0 ? `ขาดกล่อง ${stats.missingBoxesTotal} / แกลลอน ${stats.missingGallonsTotal}` : 'ไม่มีปัญหาติดขัด'}
          highlight={stats.blocked > 0 ? 'rose' : undefined}
        />
        <MetricCard
          label="เสร็จสมบูรณ์ 100%"
          value={stats.completed.toString()}
          icon={<CheckCircle2 size={18} className="text-emerald-700" />}
          subtext={`สำเร็จ ${stats.completionRate}%`}
          highlight="emerald"
        />
      </div>

      {/* ===== 4. DUAL-VIEW ROOT CAUSE & RESPONSIBLE ANALYSIS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart (2/3 width) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              {(selectedMainReason || selectedMainResponsible) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMainReason(null);
                    setSelectedMainResponsible(null);
                  }}
                  className="p-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="ย้อนกลับ"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-[#92400E]" />
                  {selectedMainReason 
                    ? `เจาะลึกสาเหตุย่อย: ${selectedMainReason}` 
                    : selectedMainResponsible 
                    ? `เจาะลึกฝ่ายย่อย: ${selectedMainResponsible}`
                    : analysisDimension === 'reason' ? 'วิเคราะห์สาเหตุของเสีย (Defect Cause)' : 'วิเคราะห์ฝ่ายที่ต้องรับผิดชอบ (Root Cause Entity)'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedMainReason || selectedMainResponsible 
                    ? 'สถิติรายละเอียดย่อย (Subtypes)' 
                    : 'คลิกแถบเพื่อเจาะลึกรายละเอียดย่อย'}
                </p>
              </div>
            </div>

            {/* Toggle dimension and units */}
            <div className="flex items-center gap-2">
              {!selectedMainReason && !selectedMainResponsible && (
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setAnalysisDimension('reason')}
                    className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      analysisDimension === 'reason' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ตามสาเหตุ
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalysisDimension('responsible')}
                    className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      analysisDimension === 'responsible' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ตามฝ่าย
                  </button>
                </div>
              )}

              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('units')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    viewMode === 'units' ? 'bg-[#FEF3C7] text-[#92400E] shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  จำนวนกล่อง
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('defects')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    viewMode === 'defects' ? 'bg-[#FEF3C7] text-[#92400E] shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ความถี่เคส
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {chartData.length > 0 ? (
                <motion.div
                  key={selectedMainReason || selectedMainResponsible || 'main'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  {chartData.map((item) => {
                    const isMainView = !selectedMainReason && !selectedMainResponsible;
                    const pct = Math.round((item.value / maxChartValue) * 100);
                    return (
                      <div 
                        key={item.name} 
                        className={`group p-2.5 rounded-lg transition-all border ${
                          isMainView ? 'cursor-pointer hover:bg-slate-50 border-slate-100 hover:border-slate-300' : 'border-slate-100'
                        }`}
                        onClick={() => {
                          if (isMainView) {
                            if (analysisDimension === 'reason') setSelectedMainReason(item.name);
                            else setSelectedMainResponsible(item.name);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <span>{item.name}</span>
                            {isMainView && (
                              <ArrowRight size={12} className="text-[#92400E] opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                          <span className="font-semibold font-mono text-slate-900">
                            {item.value.toLocaleString()} {viewMode === 'units' ? 'กล่อง' : 'ครั้ง'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${pct}%` }} 
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              analysisDimension === 'responsible'
                                ? 'bg-sky-500'
                                : 'bg-[#F5C754]'
                            }`} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Package size={36} className="opacity-30 mb-2" />
                  <p className="text-xs font-medium">ไม่มีข้อมูลในตัวกรองนี้</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Stack: Top Defect Items & Workload Origin */}
        <div className="flex flex-col gap-6">
          {/* Top 3 Products */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex-1">
            <TopOffendersSection stats={stats} />
          </div>

          {/* Workload Origin */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Boxes size={14} className="text-[#92400E]" /> แหล่งที่มาของเคส (Origin Source)
            </h4>
            <div className="space-y-3">
              {sourceEntries.length > 0 ? (
                sourceEntries.map(([source, count]) => {
                  const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={source} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-medium">{source}</span>
                        <span className="font-mono font-semibold text-slate-900">{count} เคส ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${percentage}%` }} 
                          transition={{ duration: 0.8 }}
                          className="h-full bg-slate-800 rounded-full" 
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">ไม่มีข้อมูล</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ===== 5. TIME-SERIES DAILY TREND ===== */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <TrendAnalysisSection stats={stats} viewMode={viewMode} />
      </div>

      {/* ===== 6. WORKFLOW STAGE DISTRIBUTION DONUT ===== */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#92400E]" />
            สัดส่วนขั้นตอนการทำงานทั้งระบบ (Full Stage Distribution)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            ภาพรวมการกระจายตัวของเคสทั้ง 5 ขั้นตอน พร้อมจำนวนกล่องที่รอจัดการ
          </p>
        </div>
        
        <StatusDistributionSection stats={stats} />
      </div>

    </div>
  );
}

// ===== MetricCard Sub-Component =====
function MetricCard({
  label,
  value,
  icon,
  subtext,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtext?: string;
  highlight?: 'amber' | 'orange' | 'rose' | 'emerald';
}) {
  const borderClasses = {
    amber: 'border-amber-300 bg-[#FEFDF5]',
    orange: 'border-orange-300 bg-orange-50/40',
    rose: 'border-rose-300 bg-rose-50/40',
    emerald: 'border-emerald-300 bg-emerald-50/40',
  };

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      highlight ? borderClasses[highlight] : 'border-slate-200 bg-white shadow-2xs'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-600 truncate">{label}</span>
        <div className="shrink-0">{icon}</div>
      </div>
      <div className="text-xl sm:text-2xl font-semibold font-mono text-slate-900 tracking-tight">
        {value}
      </div>
      {subtext && (
        <p className="text-[11px] text-slate-500 font-medium mt-1 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
}

// ===== StatusDistributionSection Sub-Component =====
function StatusDistributionSection({
  stats
}: {
  stats: {
    total: number;
    pendingAnalysis: number;
    awaitingMaterials: number;
    inProgress: number;
    blocked: number;
    completed: number;
    boxesPendingAnalysis: number;
    boxesAwaitingMaterials: number;
    boxesInProgress: number;
    boxesBlocked: number;
    boxesCompleted: number;
  }
}) {
  const { total, pendingAnalysis, awaitingMaterials, inProgress, blocked, completed } = stats;
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const data = useMemo(() => {
    return [
      { 
        name: 'รอวิเคราะห์ (QSMS)', 
        count: pendingAnalysis,
        boxes: stats.boxesPendingAnalysis,
        color: '#f59e0b', // Amber 500
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        bgColor: 'bg-amber-50/60',
        key: 'pendingAnalysis' 
      },
      { 
        name: 'รอเบิกภาชนะ (WPK)', 
        count: awaitingMaterials,
        boxes: stats.boxesAwaitingMaterials,
        color: '#f97316', // Orange 500
        borderColor: 'border-orange-200',
        textColor: 'text-orange-800',
        bgColor: 'bg-orange-50/60',
        key: 'awaitingMaterials' 
      },
      { 
        name: 'กำลังซ่อม (PDF)', 
        count: inProgress,
        boxes: stats.boxesInProgress,
        color: '#0284c7', // Sky 600
        borderColor: 'border-sky-200',
        textColor: 'text-sky-800',
        bgColor: 'bg-sky-50/60',
        key: 'inProgress' 
      },
      { 
        name: 'ติดปัญหา (Blocked)', 
        count: blocked,
        boxes: stats.boxesBlocked,
        color: '#e11d48', // Rose 600
        borderColor: 'border-rose-200',
        textColor: 'text-rose-800',
        bgColor: 'bg-rose-50/60',
        key: 'blocked' 
      },
      { 
        name: 'เสร็จสมบูรณ์ (100%)', 
        count: completed,
        boxes: stats.boxesCompleted,
        color: '#10b981', // Emerald 500
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-800',
        bgColor: 'bg-emerald-50/60',
        key: 'completed' 
      },
    ];
  }, [pendingAnalysis, awaitingMaterials, inProgress, blocked, completed, stats]);

  const activeSegments = useMemo(() => {
    return data.filter(item => item.count > 0);
  }, [data]);

  const r = 70;
  const strokeWidth = 12;
  const size = 190;
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-2">
      {/* Left side: Interactive SVG Donut Chart */}
      <div className="md:col-span-5 flex flex-col items-center justify-center">
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Inner Text Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none z-10">
            <AnimatePresence mode="wait">
              {hoveredKey ? (
                <motion.div
                  key={hoveredKey}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="px-2"
                >
                  {(() => {
                    const activeItem = data.find(d => d.key === hoveredKey);
                    if (!activeItem) return null;
                    const percent = total > 0 ? Math.round((activeItem.count / total) * 100) : 0;
                    return (
                      <>
                        <span className="text-[11px] font-semibold text-slate-500 block mb-0.5 truncate max-w-[120px]">
                          {activeItem.name}
                        </span>
                        <span className="text-xl font-bold font-mono text-slate-900 block leading-none mb-1">
                          {activeItem.count} เคส
                        </span>
                        <span className={`text-[11px] font-semibold ${activeItem.textColor}`}>
                          {percent}% ({activeItem.boxes} กล่อง)
                        </span>
                      </>
                    );
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                    เคสทั้งหมด
                  </span>
                  <span className="text-2xl font-bold font-mono text-slate-900 block leading-none mb-1">
                    {total}
                  </span>
                  <span className="text-[10px] font-semibold text-[#92400E] uppercase tracking-wider">
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
            <circle
              cx={center}
              cy={center}
              r={r}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

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
                  className="transition-all duration-200 origin-center"
                  style={{
                    opacity: hoveredKey && !isHovered ? 0.4 : 1,
                  }}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right side: Modern Interactive Legend Cards */}
      <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.map((item) => {
          const isHovered = hoveredKey === item.key;
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div
              key={item.key}
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`p-3 rounded-lg border transition-all select-none ${item.bgColor} ${item.borderColor} ${
                isHovered ? 'ring-2 ring-slate-400/20 shadow-xs' : 'opacity-95'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {item.name}
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold font-mono text-slate-900">
                  {item.count} เคส <span className="font-normal text-slate-500 font-sans">({item.boxes} กล่อง)</span>
                </span>
                <span className={`font-semibold font-mono ${item.textColor}`}>{percentage}%</span>
              </div>

              <div className="w-full bg-white/80 border border-slate-200 rounded-full h-1.5 overflow-hidden mt-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8 }}
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

interface OffenderItem {
  code: string;
  name: string;
  units: number;
  frequency: number;
}

interface TrendItem {
  date: string;
  cases: number;
  units: number;
}

// ===== TopOffendersSection Sub-Component =====
function TopOffendersSection({ stats }: { stats: { itemsData: Record<string, OffenderItem> } }) {
  const topItems = useMemo(() => {
    return Object.values(stats.itemsData)
      .sort((a, b) => b.units - a.units)
      .slice(0, 3);
  }, [stats]);

  return (
    <div className="flex flex-col h-full">
      <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
        <AlertCircle size={14} className="text-rose-600" />
        Top 3 สินค้าที่มีปริมาณ Rework สูงสุด
      </h4>
      <p className="text-[11px] text-slate-500 mb-3">จัดอันดับตามจำนวนกล่องที่พบของเสีย</p>
      
      <div className="space-y-2.5 flex-1">
        {topItems.length > 0 ? (
          topItems.map((item, index: number) => (
            <div key={item.code} className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate" title={item.name}>{item.name}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{item.code}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold font-mono text-rose-700">{item.units.toLocaleString()} กล่อง</p>
                <p className="text-[10px] text-slate-500">พบ {item.frequency} ครั้ง</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 text-center py-6 italic">ไม่มีข้อมูล</p>
        )}
      </div>
    </div>
  );
}

// ===== TrendAnalysisSection Sub-Component =====
function TrendAnalysisSection({ stats, viewMode }: { stats: { trendByDate: Record<string, TrendItem> }; viewMode: string }) {
  const chartData = useMemo(() => {
    return Object.values(stats.trendByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [stats]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#92400E]" />
            แนวโน้มการเกิดงาน Rework รายวัน (Time-Series)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">สถิติตามวันที่เปิดเคสเทียบกับยอดปิดงานเสร็จ</p>
        </div>
      </div>
      
      <div className="h-[220px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickMargin={8} minTickGap={20} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#0f172a', fontSize: '12px', fontWeight: '500' }}
                labelStyle={{ color: '#64748b', fontSize: '11px', marginBottom: '2px', fontWeight: '600' }}
                formatter={(value: number, name: string) => {
                  if (name === 'completedUnits') return [value, 'ผลิตเสร็จ (Completed Units)'];
                  return [value, viewMode === 'units' ? 'ยอดกล่องรวม (Total Units)' : 'ความถี่เคส (Defects)'];
                }}
              />
              <Area 
                type="monotone" 
                dataKey={viewMode === 'units' ? 'units' : 'defects'} 
                stroke="#f59e0b" 
                strokeWidth={2}
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
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <TrendingUp size={36} className="opacity-30 mb-2" />
            <p className="text-xs font-medium">ไม่มีข้อมูลกราฟสำหรับช่วงเวลานี้</p>
          </div>
        )}
      </div>
    </div>
  );
}
