import React from 'react';
import { AlertCircle, Calendar, Clock, Factory, Package, Search } from 'lucide-react';

import type { ReworkCase } from '@/src/services/api';
import { formatThaiDateShort } from '@/src/utils/helpers';

interface CaseListTableProps {
  cases: ReworkCase[];
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  isFilterEmpty: boolean;
  onRowClick: (caseItem: ReworkCase) => void;
  onRetry: () => void;
  onClearFilters: () => void;
  searchQuery: string;
  hasActiveFilters: boolean;
  skeletonCount?: number;
}

function getDeadlineStatus(caseDate: string, status: ReworkCase['status']): 'warning' | 'danger' | null {
  if (status === 'Completed') return null;
  const daysSince = Math.floor((Date.now() - new Date(caseDate).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince > 30) return 'danger';
  if (daysSince > 7) return 'warning';
  return null;
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const todayDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const targetDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const diffDays = Math.floor((todayDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
  }
  if (diffDays === 1) {
    return 'เมื่อวาน';
  }
  if (diffDays < 7) {
    return `${diffDays} วันที่แล้ว`;
  }

  return date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric', timeZone: 'Asia/Bangkok' });
}

export function CaseListTable({
  cases,
  isLoading,
  error,
  isEmpty,
  isFilterEmpty,
  onRowClick,
  onRetry,
  onClearFilters,
  searchQuery,
  hasActiveFilters,
  skeletonCount = 10,
}: CaseListTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2.5 sm:space-y-3">
        {[...Array(skeletonCount)].map((_, i) => (
          <div key={i} className="flex animate-pulse flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="h-4 w-16 rounded bg-slate-100" />
              </div>
              <div className="h-4 w-3/5 rounded bg-slate-200" />
              <div className="h-3 w-2/5 rounded bg-slate-100" />
            </div>
            <div className="space-y-2 sm:text-right shrink-0 sm:min-w-[180px]">
              <div className="ml-auto h-3 w-16 rounded bg-slate-200" />
              <div className="h-2 w-full rounded bg-slate-100" />
              <div className="ml-auto h-6 w-20 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center shadow-xs">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={36} />
        <p className="mb-1 text-base font-bold text-red-800">ไม่สามารถโหลดข้อมูลได้</p>
        <p className="mb-4 text-xs text-red-600">{error}</p>
        <button
          onClick={onRetry}
          className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 shadow-xs cursor-pointer"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-amber-50 border border-amber-200">
          <Package size={28} className="text-amber-600" />
        </div>
        <p className="mb-1 text-base font-bold text-slate-900">ไม่พบรายการงาน Rework ในระบบ</p>
        <p className="mx-auto max-w-sm text-xs text-slate-500">
          {searchQuery
            ? 'ลองปรับคำค้นหาใหม่ หรือล้างการค้นหาเพื่อดูรายการทั้งหมด'
            : 'เริ่มต้นโดยการเพิ่มเคสใหม่จากแท็บ "เปิดเคสใหม่" ที่เมนูด้านซ้าย'}
        </p>
      </div>
    );
  }

  if (isFilterEmpty) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-50 border border-slate-200">
          <Search size={28} className="text-slate-500" />
        </div>
        <p className="mb-1 text-base font-bold text-slate-900">ไม่พบรายการที่ตรงกับตัวกรอง</p>
        <p className="mx-auto mb-4 max-w-sm text-xs text-slate-500">
          ลองปรับเงื่อนไขตัวกรอง หรือล้างตัวกรองทั้งหมดเพื่อดูรายการทั้งหมด
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="rounded-md bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-600 shadow-xs cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {cases.map((item) => (
        <CaseRow key={item.id} caseItem={item} onClick={() => onRowClick(item)} />
      ))}
    </div>
  );
}

interface CaseRowProps {
  caseItem: ReworkCase;
  onClick: () => void;
}

function CaseRow({ caseItem, onClick }: CaseRowProps) {
  const deadlineStatus = getDeadlineStatus(caseItem.date, caseItem.status);
  const itemsList = caseItem.items || [];
  const firstItem = itemsList[0];
  const totalAmount = itemsList.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalCompleted = caseItem.status === 'Completed' ? totalAmount : itemsList.reduce((sum, item) => sum + (Number(item.completedBoxes) || 0), 0);
  const progressPercent = totalAmount > 0 ? Math.round((totalCompleted / totalAmount) * 100) : 0;
  const multipleItems = itemsList.length > 1;
  const itemNameDisplay = multipleItems 
    ? `${firstItem?.itemName || 'รอระบุสินค้า'} (+${itemsList.length - 1} รายการ)` 
    : firstItem?.itemName || 'รอระบุสินค้า';

  // Derive correct display prefix based on source
  const correctPrefix = caseItem.source === 'Customer' ? 'RT' : 'RW';
  const displayId = caseItem.id.startsWith('RW') || caseItem.id.startsWith('RT')
    ? correctPrefix + caseItem.id.substring(2)
    : caseItem.id;

  const primaryCustomer = caseItem.items?.[0]?.customerName || caseItem.customerName || (correctPrefix === 'RT' ? 'ลูกค้า' : 'SFC');

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#E5E5E7] bg-white hover:border-[#0071E3]/40 hover:bg-[#FAFBFD] transition-all duration-150 cursor-pointer shadow-xs"
    >
      {/* Left Section: Core Identifiers & Part Name */}
      <div className="flex-1 min-w-0">
        {/* Header row: Case ID Pill + Customer + Date */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-tight ${
            correctPrefix === 'RT' 
              ? 'bg-sky-50 text-[#0071E3] border border-sky-100' 
              : 'bg-amber-50 text-amber-900 border border-amber-100'
          }`}>
            {displayId}
          </span>

          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-[#F5F5F7] text-[#6E6E73]">
            {primaryCustomer}
          </span>

          <span className="text-xs text-[#86868B] font-medium">
            {formatThaiDateShort(caseItem.date)}
          </span>

          {/* Urgent warnings only */}
          {deadlineStatus === 'danger' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <AlertCircle size={11} />
              เกิน 30 วัน
            </span>
          )}
          {(caseItem.missingBoxes! > 0 || caseItem.missingGallons! > 0 || caseItem.missingOil! > 0) && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <AlertCircle size={11} />
              รอของ
            </span>
          )}
        </div>

        {/* Primary Part Name */}
        <h4 className="text-sm sm:text-base font-semibold text-[#1D1D1F] tracking-tight leading-snug line-clamp-1 group-hover:text-[#0071E3] transition-colors">
          {itemNameDisplay}
        </h4>
      </div>

      {/* Right Section: Progress & Status Pill */}
      <div className="shrink-0 sm:w-64 pt-2.5 sm:pt-0 border-t border-[#F5F5F7] sm:border-0 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[#6E6E73] font-mono tabular-nums">
            {totalCompleted}/{totalAmount} กล่อง
          </span>
          <StatusPill status={caseItem.status} deadlineStatus={deadlineStatus} />
        </div>

        {/* Clean Apple Progress Track */}
        <div className="w-full bg-[#E5E5E7] rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              progressPercent === 100 
                ? 'bg-emerald-500' 
                : 'bg-[#0071E3]'
            }`}
            style={{ width: `${progressPercent}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

interface StatusPillProps {
  status: ReworkCase['status'];
  deadlineStatus?: 'warning' | 'danger' | null;
}

function StatusPill({ status, deadlineStatus }: StatusPillProps) {
  const styles: Record<ReworkCase['status'], string> = {
    'Pending Analysis': 'bg-amber-50 text-amber-800 border-amber-200',
    'Awaiting Materials': 'bg-orange-50 text-orange-800 border-orange-200',
    Pending: 'bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5E7]',
    'In-Progress': 'bg-sky-50 text-[#0071E3] border-sky-200',
    Blocked: 'bg-rose-50 text-rose-800 border-rose-200',
    Completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };

  const thaiLabels: Record<ReworkCase['status'], string> = {
    'Pending Analysis': 'รอวิเคราะห์',
    'Awaiting Materials': 'รอเบิกของ',
    Pending: 'รอดำเนินการ',
    'In-Progress': 'กำลังดำเนินการ',
    Blocked: 'ติดปัญหา',
    Completed: 'เสร็จสิ้น 100%',
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'Completed' ? 'bg-emerald-500' :
        status === 'In-Progress' ? 'bg-[#0071E3]' :
        status === 'Blocked' ? 'bg-rose-500' :
        'bg-amber-500'
      }`} />
      {thaiLabels[status]}
    </span>
  );
}

