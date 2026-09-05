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
  
  const uniqueReasons = Array.from(new Set(itemsList.map(i => i.reason).filter(Boolean)));
  const reasonsDisplay = uniqueReasons.length > 0 ? uniqueReasons.join(', ') : 'ไม่ระบุ';

  // Derive correct display prefix based on source
  const correctPrefix = caseItem.source === 'Customer' ? 'RT' : 'RW';
  const displayId = caseItem.id.startsWith('RW') || caseItem.id.startsWith('RT')
    ? correctPrefix + caseItem.id.substring(2)
    : caseItem.id;

  const originDept = correctPrefix === 'RT' ? 'CS' : 'WFG';
  const primaryCustomer = caseItem.items?.[0]?.customerName || caseItem.customerName || (correctPrefix === 'RT' ? 'ลูกค้า' : 'SFC');
  const hasMultipleCustomers = new Set(itemsList.map(i => i.customerName).filter(Boolean)).size > 1;
  const customerDisplay = `${primaryCustomer}${hasMultipleCustomers ? ' (+หลายลูกค้า)' : ''}`;

  return (
    <div
      onClick={onClick}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:px-4 sm:py-3 rounded-xl border border-slate-200/90 bg-white hover:border-amber-300 hover:bg-[#FEFDF5]/50 transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer"
    >
      {/* Left & Info Section */}
      <div className="flex-1 min-w-0">
        {/* Top line: Status Pill + Case ID + Unified Route Badge + Case Name */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <StatusPill status={caseItem.status} deadlineStatus={deadlineStatus} />

          <span className={`px-2 py-0.5 rounded-md text-xs font-bold font-mono tabular-nums border shrink-0 ${
            correctPrefix === 'RT' 
              ? 'bg-sky-50 text-sky-900 border-sky-200/90' 
              : 'bg-amber-50 text-amber-900 border-amber-200/90'
          }`}>
            {displayId}
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100/90 text-slate-700 border border-slate-200/80 shrink-0">
            {correctPrefix === 'RT' ? (
              <Package size={11} className="shrink-0 text-sky-700" />
            ) : (
              <Factory size={11} className="shrink-0 text-amber-700" />
            )}
            <span className={correctPrefix === 'RT' ? 'text-sky-700 font-bold' : 'text-amber-800 font-bold'}>
              {originDept}
            </span>
            <span className="text-slate-400">→</span>
            <span className="truncate max-w-[130px]">{customerDisplay}</span>
          </span>

          {caseItem.caseName && caseItem.caseName !== displayId && (
            <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500 border border-slate-200/70 truncate max-w-[120px]">
              {caseItem.caseName}
            </span>
          )}
        </div>

        {/* Item Title */}
        <h4 className="mt-1.5 text-sm font-bold text-slate-800 leading-snug line-clamp-1 group-hover:text-amber-900 transition-colors">
          {itemNameDisplay}
        </h4>

        {/* Metadata Details */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Calendar size={12} className="shrink-0 text-slate-400" />
            <span>{formatThaiDateShort(caseItem.date)}</span>
          </div>
          <span className="text-slate-300">•</span>
          <span className="text-slate-400 font-mono tabular-nums">{formatTimestamp(caseItem.timestamp || caseItem.date)}</span>
          
          {uniqueReasons.length > 0 && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                สาเหตุ: <span className="font-medium text-slate-700">{reasonsDisplay}</span>
              </span>
            </>
          )}

          {caseItem.items.every(i => i.customerName === 'OR') && (!caseItem.orFilesUrls || caseItem.orFilesUrls.length === 0) && (
            <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
              <AlertCircle size={10} />
              ขาดไฟล์ OR
            </span>
          )}
          {(caseItem.missingBoxes! > 0 || caseItem.missingGallons! > 0 || caseItem.missingOil! > 0) && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200" title={`ขาดกล่อง: ${caseItem.missingBoxes || 0}, ขาดแกลลอน: ${caseItem.missingGallons || 0}, ขาดน้ำมัน: ${caseItem.missingOil || 0} ลิตร`}>
              <AlertCircle size={10} />
              รอของ ({[
                caseItem.missingBoxes ? `กล่อง ${caseItem.missingBoxes}` : '',
                caseItem.missingGallons ? `แกลลอน ${caseItem.missingGallons}` : '',
                caseItem.missingOil ? `น้ำมัน ${caseItem.missingOil}L` : ''
              ].filter(Boolean).join(', ')})
            </span>
          )}
          {deadlineStatus === 'warning' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="งานค้างเกิน 7 วัน">
              <Clock size={10} />
              ค้าง 7 วัน
            </span>
          )}
          {deadlineStatus === 'danger' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200" title="งานค้างเกิน 30 วัน">
              <AlertCircle size={10} />
              เกิน 30 วัน
            </span>
          )}
        </div>
      </div>

      {/* Right: Quantity & Progress Bar */}
      <div className="shrink-0 sm:w-56 pt-2.5 sm:pt-0 border-t border-slate-100 sm:border-0 flex flex-col justify-center">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-800 font-mono tabular-nums">
            {totalAmount} กล่อง
          </span>
          <span className="text-[11px] font-mono tabular-nums text-slate-500">
            เสร็จ {totalCompleted}/{totalAmount} <span className="font-semibold text-slate-700">({progressPercent}%)</span>
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-[#F5C754]'}`}
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
  let pendingStyle = 'bg-[#FEF3C7]/80 text-[#92400E] border-[#FDE68A]';
  
  if (status === 'Pending') {
    if (deadlineStatus === 'warning') {
      pendingStyle = 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
    } else if (deadlineStatus === 'danger') {
      pendingStyle = 'bg-[#FFE4E6] text-[#9F1239] border-[#FECDD3]';
    }
  }

  const styles: Record<ReworkCase['status'], string> = {
    'Pending Analysis': 'bg-[#FEF9E7] text-[#92400E] border-[#FDE68A]',
    'Awaiting Materials': 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]',
    Pending: pendingStyle,
    'In-Progress': 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
    Blocked: 'bg-[#FFE4E6] text-[#9F1239] border-[#FECDD3]',
    Completed: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]',
  };

  const thaiLabels: Record<ReworkCase['status'], string> = {
    'Pending Analysis': 'รอวิเคราะห์',
    'Awaiting Materials': 'รอเบิกของ',
    Pending: 'รอดำเนินการ',
    'In-Progress': 'กำลังดำเนินการ',
    Blocked: 'ติดปัญหา',
    Completed: 'เสร็จสิ้น',
  };

  return (
    <span 
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold shrink-0 ${styles[status]}`}
    >
      {status === 'Pending' && deadlineStatus === 'danger' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse" />}
      {status === 'Pending' && deadlineStatus === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse" />}
      {thaiLabels[status]}
    </span>
  );
}
