import React from 'react';
import { AlertCircle, Clock, Package, Search } from 'lucide-react';

import type { ReworkCase } from '../services/api';

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
  const bkk = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const diffMs = now.getTime() - bkk.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return bkk.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'เมื่อวาน';
  }
  if (diffDays < 7) {
    return `${diffDays} วันที่แล้ว`;
  }

  return bkk.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
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
      <div className="glass-card bg-white p-0" style={{ minHeight: '640px' }}>
        <div className="divide-y divide-slate-100 p-2">
          {[...Array(skeletonCount)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-4 px-4 py-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/5 rounded-lg bg-slate-200" />
                <div className="h-3 w-2/5 rounded-lg bg-slate-100" />
              </div>
              <div className="space-y-1 text-right">
                <div className="ml-auto h-3 w-12 rounded-lg bg-slate-200" />
                <div className="ml-auto h-2 w-16 rounded-lg bg-slate-100" />
              </div>
              <div className="h-6 w-24 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 text-red-400" size={40} />
        <p className="mb-1 text-lg font-semibold text-red-700">ไม่สามารถโหลดข้อมูลได้</p>
        <p className="mb-4 text-sm text-red-600">{error}</p>
        <button
          onClick={onRetry}
          className="rounded-xl bg-red-600 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="glass-card bg-white p-16 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <Package size={36} className="text-slate-300" />
        </div>
        <p className="mb-2 text-lg font-semibold text-foreground">ไม่พบรายการงาน Rework ในขณะนี้</p>
        <p className="mx-auto max-w-sm text-sm text-muted">
          {searchQuery
            ? 'ลองปรับคำค้นหาใหม่ หรือล้างการค้นหาเพื่อดูรายการทั้งหมด'
            : 'เริ่มต้นโดยการเพิ่มเคสใหม่จากแท็บ "เพิ่มงานใหม่" ที่เมนูด้านซ้าย'}
        </p>
      </div>
    );
  }

  if (isFilterEmpty) {
    return (
      <div className="glass-card bg-white p-16 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
          <Search size={36} className="text-amber-300" />
        </div>
        <p className="mb-2 text-lg font-semibold text-foreground">ไม่พบรายการที่ตรงกับตัวกรอง</p>
        <p className="mx-auto mb-4 max-w-sm text-sm text-muted">
          ลองปรับเงื่อนไขตัวกรอง หรือล้างตัวกรองทั้งหมดเพื่อดูรายการทั้งหมด
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="rounded-xl bg-accent px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-1 flex-col bg-white p-0">
      <div className="flex-1 border-t border-border">
        <div className="divide-y divide-[#f1f1f1] p-2">
          <div>
            {cases.map((item) => (
              <CaseRow key={item.id} caseItem={item} onClick={() => onRowClick(item)} />
            ))}
          </div>
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

  return (
    <div
      onClick={onClick}
      className={`group flex cursor-pointer items-center rounded-lg px-4 py-4 transition-colors hover:bg-slate-50/50 ${
        deadlineStatus === 'warning'
          ? 'border-l-4 border-orange-400 bg-orange-50'
          : deadlineStatus === 'danger'
            ? 'border-l-4 border-red-400 bg-red-50'
            : ''
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-foreground">{firstItem?.itemName || 'N/A'}</div>
          {deadlineStatus === 'warning' && (
            <div className="flex items-center gap-1 text-xs text-orange-600" title="งานค้างเกิน 7 วัน">
              <Clock size={12} />
              <span>7 วัน</span>
            </div>
          )}
          {deadlineStatus === 'danger' && (
            <div className="flex items-center gap-1 text-xs text-red-600" title="งานค้างเกิน 30 วัน">
              <AlertCircle size={12} />
              <span>เกิน 30 วัน</span>
            </div>
          )}
        </div>
        <div className="mt-1 text-[12px] text-muted">
          {formatTimestamp(caseItem.date)} &bull; แหล่งที่มา: <span className="font-bold">{caseItem.source}</span> &bull;{' '}
          <span className="font-mono text-accent">{caseItem.id}</span>
        </div>
      </div>

      <div className="mr-8 text-right">
        <p className="text-xs font-bold text-foreground">{firstItem?.amount || 0} กล่อง</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{firstItem?.reason || 'ไม่ระบุ'}</p>
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
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'In-Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'Awaiting Valuation': 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const thaiLabels: Record<ReworkCase['status'], string> = {
    Pending: 'รอดำเนินการ',
    'In-Progress': 'กำลังดำเนินการ',
    'Awaiting Valuation': 'รอประเมินราคา',
    Completed: 'เสร็จสิ้น',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${styles[status]}`}>
      {status === 'Awaiting Valuation' && <span className="w-1 h-1 rounded-full bg-current mr-1 animate-pulse" />}
      {thaiLabels[status]}
    </span>
  );
}
