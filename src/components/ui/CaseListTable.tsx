import React from 'react';
import { AlertCircle, Calendar, Clock, Package, Search } from 'lucide-react';

import type { ReworkCase } from '../../services/api';
import { formatThaiDateShort } from '../../utils/helpers';

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
  if (status === 'Completed' || status === 'Awaiting Valuation') return null;
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
      <div className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm" style={{ minHeight: '640px' }}>
        <div className="divide-y divide-slate-100 p-2">
          {[...Array(skeletonCount)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 px-4 py-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/5 rounded-lg bg-slate-200/50" />
                <div className="h-3 w-2/5 rounded-lg bg-slate-100/40" />
              </div>
              <div className="space-y-1 text-right">
                <div className="ml-auto h-3 w-12 rounded-lg bg-slate-200/50" />
                <div className="ml-auto h-2 w-16 rounded-lg bg-slate-100/40" />
              </div>
              <div className="h-6 w-24 rounded-full bg-slate-200/50" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={40} />
        <p className="mb-1 text-lg font-semibold text-red-700">ไม่สามารถโหลดข้อมูลได้</p>
        <p className="mb-4 text-sm text-red-600/80">{error}</p>
        <button
          onClick={onRetry}
          className="rounded-xl bg-red-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 shadow-sm"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
          <Package size={36} className="text-primary" />
        </div>
        <p className="mb-2 text-lg font-semibold text-primary">ไม่พบรายการงาน Rework ในขณะนี้</p>
        <p className="mx-auto max-w-sm text-sm text-on-surface-variant/80">
          {searchQuery
            ? 'ลองปรับคำค้นหาใหม่ หรือล้างการค้นหาเพื่อดูรายการทั้งหมด'
            : 'เริ่มต้นโดยการเพิ่มเคสใหม่จากแท็บ "เพิ่มงานใหม่" ที่เมนูด้านซ้าย'}
        </p>
      </div>
    );
  }

  if (isFilterEmpty) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
          <Search size={36} className="text-primary" />
        </div>
        <p className="mb-2 text-lg font-semibold text-primary">ไม่พบรายการที่ตรงกับตัวกรอง</p>
        <p className="mx-auto mb-4 max-w-sm text-sm text-on-surface-variant/80">
          ลองปรับเงื่อนไขตัวกรอง หรือล้างตัวกรองทั้งหมดเพื่อดูรายการทั้งหมด
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-primary border border-primary shadow-sm"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
      <div className="flex-1">
        <div className="divide-y divide-slate-100 p-2">
          {cases.map((item) => (
            <CaseRow key={item.id} caseItem={item} onClick={() => onRowClick(item)} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CaseRowProps {
  caseItem: ReworkCase;
  onClick: () => void;
}

function CaseRow({ caseItem, onClick }: CaseRowProps) {
  const deadlineStatus = getDeadlineStatus(caseItem.date, caseItem.status);
  const firstItem = caseItem.items[0];
  const totalAmount = caseItem.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const multipleItems = caseItem.items.length > 1;
  const itemNameDisplay = multipleItems 
    ? `${firstItem?.itemName || 'N/A'} (+${caseItem.items.length - 1} รายการ)` 
    : firstItem?.itemName || 'N/A';
  
  const uniqueReasons = Array.from(new Set(caseItem.items.map(i => i.reason).filter(Boolean)));
  const reasonsDisplay = uniqueReasons.length > 0 ? uniqueReasons.join(', ') : 'ไม่ระบุ';

  // Derive correct display prefix based on source
  const correctPrefix = caseItem.source === 'Customer' ? 'RT' : 'RW';
  const displayId = caseItem.id.startsWith('RW') || caseItem.id.startsWith('RT')
    ? correctPrefix + caseItem.id.substring(2)
    : caseItem.id;

  return (
    <div
      onClick={onClick}
      className={`group flex cursor-pointer items-center rounded-lg px-4 py-4 transition-all duration-300 hover:bg-slate-50 hover:shadow-sm active:scale-[0.99] ${
        deadlineStatus === 'warning'
          ? 'bg-amber-50/50'
          : deadlineStatus === 'danger'
            ? 'bg-red-50/50'
            : ''
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-primary truncate max-w-[200px] md:max-w-[300px]">{caseItem.caseName || displayId}</div>
          {caseItem.caseName && (
             <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200 font-mono">{displayId}</span>
          )}
          {deadlineStatus === 'warning' && (
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600" title="งานค้างเกิน 7 วัน">
              <Clock size={12} />
              <span>7 วัน</span>
            </div>
          )}
          {deadlineStatus === 'danger' && (
            <div className="flex items-center gap-1 text-xs font-semibold text-red-600" title="งานค้างเกิน 30 วัน">
              <AlertCircle size={12} />
              <span>เกิน 30 วัน</span>
            </div>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="font-semibold text-primary/80 truncate max-w-[150px]">{itemNameDisplay}</span>
          <span>&bull;</span>
          <div className="flex items-center gap-1 text-primary/80">
            <Calendar size={11} className="shrink-0" />
            <span className="font-semibold">{formatThaiDateShort(caseItem.date)}</span>
          </div>
          <span>&bull;</span>
          <span>{formatTimestamp(caseItem.timestamp || caseItem.date)}</span>
          <span>&bull;</span>
          <span>แหล่งที่มา: <span className="font-semibold text-primary">{caseItem.source}</span></span>
          {caseItem.items.length > 0 && (
            <>
              <span>&bull;</span>
              <span className="font-semibold text-secondary">
                {caseItem.items[0].customerName || '-'}
                {new Set(caseItem.items.map(i => i.customerName)).size > 1 ? ' (หลายลูกค้า)' : ''}
              </span>
            </>
          )}

          {caseItem.items.every(i => i.customerName === 'OR') && (!caseItem.orFilesUrls || caseItem.orFilesUrls.length === 0) && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600 border border-red-100">
              <AlertCircle size={12} />
              ขาดไฟล์ OR
            </span>
          )}
        </div>
      </div>

      <div className="mr-8 text-right">
        <p className="text-sm font-semibold text-primary">{totalAmount} กล่อง</p>
        <p className="text-xs font-medium text-slate-500 mt-0.5">{reasonsDisplay}</p>
      </div>

      <StatusPill status={caseItem.status} />
    </div>
  );
}

interface StatusPillProps {
  status: ReworkCase['status'];
}

function StatusPill({ status }: StatusPillProps) {
  const styles: Record<ReworkCase['status'], string> = {
    Pending: 'bg-amber-100/90 text-amber-900 border-amber-300/70 shadow-sm shadow-amber-500/5',
    'In-Progress': 'bg-sky-100/90 text-sky-950 border-sky-300/70 shadow-sm shadow-sky-500/5',
    'Awaiting Valuation': 'bg-violet-100/90 text-violet-950 border-violet-300/70 shadow-sm shadow-violet-500/5',
    Completed: 'bg-emerald-100/90 text-emerald-950 border-emerald-300/70 shadow-sm shadow-emerald-500/5',
  };

  const thaiLabels: Record<ReworkCase['status'], string> = {
    Pending: 'รอดำเนินการ',
    'In-Progress': 'กำลังดำเนินการ',
    'Awaiting Valuation': 'รอประเมินราคา',
    Completed: 'เสร็จสิ้น',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {status === 'Awaiting Valuation' && <span className="w-1.5 h-1.5 rounded-full bg-violet-600 mr-1.5 animate-pulse" />}
      {thaiLabels[status]}
    </span>
  );
}
