/**
 * CaseListTable Component
 * ตารางแสดงรายการ Cases — รวม Skeleton, Empty, Error states ไว้ในที่เดียว
 *
 * วิธีใช้:
 *   <CaseListTable
 *     cases={paginatedCases}
 *     isLoading={isLoadingCases}
 *     error={caseError}
 *     isEmpty={cases.length === 0}
 *     isFilterEmpty={filteredCases.length === 0}
 *     onRowClick={openUpdateModal}
 *     onRetry={loadCases}
 *     onClearFilters={clearAllFilters}
 *     searchQuery={searchQuery}
 *     hasActiveFilters={hasActiveFilters}
 *     skeletonCount={10}
 *   />
 */

import React from 'react';
import { Package, AlertCircle, Clock, Search } from 'lucide-react';

// ===== TYPES =====

interface CaseItem {
  id: string;
  date: string;
  source: string;
  status: string;
  items: Array<{
    itemName?: string;
    amount?: number;
    reason?: string;
  }>;
}

interface CaseListTableProps {
  /** รายการ cases ที่จะแสดง (paginated แล้ว) */
  cases: CaseItem[];
  /** กำลังโหลดข้อมูล */
  isLoading: boolean;
  /** ข้อผิดพลาดจาก API */
  error: string | null;
  /** ไม่มีข้อมูลเลย (ก่อน filter) */
  isEmpty: boolean;
  /** ไม่มีข้อมูลหลัง filter */
  isFilterEmpty: boolean;
  /** เมื่อคลิกแถว → เปิด modal */
  onRowClick: (caseItem: CaseItem) => void;
  /** โหลดข้อมูลใหม่ */
  onRetry: () => void;
  /** ล้างตัวกรอง */
  onClearFilters: () => void;
  /** คำค้นหาปัจจุบัน */
  searchQuery: string;
  /** มีตัวกรองที่ใช้งานอยู่หรือไม่ */
  hasActiveFilters: boolean;
  /** จำนวนแถว skeleton ที่จะแสดง */
  skeletonCount?: number;
}

// ===== HELPER FUNCTIONS =====

/**
 * คำนวณว่า case เกินกำหนดหรือยัง
 */
function getDeadlineStatus(caseDate: string, status: string): 'warning' | 'danger' | null {
  if (status === 'Completed') return null;
  const daysSince = Math.floor((Date.now() - new Date(caseDate).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince > 30) return 'danger';
  if (daysSince > 7) return 'warning';
  return null;
}

/**
 * แปลงวันที่เป็นข้อความที่อ่านง่าย
 * ✅ ใช้ timezone Asia/Bangkok
 */
function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  // แปลงเป็น Bangkok timezone
  const bkk = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const diffMs = now.getTime() - bkk.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return bkk.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'เมื่อวาน';
  } else if (diffDays < 7) {
    return `${diffDays} วันที่แล้ว`;
  } else {
    return bkk.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
  }
}

// ===== MAIN COMPONENT =====

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
  // ----- สถานะ 1: กำลังโหลด → แสดง Skeleton -----
  if (isLoading) {
    return (
      <div className="glass-card p-0 bg-white" style={{ minHeight: '640px' }}>
        <div className="divide-y divide-slate-100 p-2">
          {[...Array(skeletonCount)].map((_, i) => (
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
    );
  }

  // ----- สถานะ 2: เกิดข้อผิดพลาด -----
  if (error) {
    return (
      <div className="glass-card p-8 bg-white border border-red-200 bg-red-50 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-3" size={40} />
        <p className="font-semibold text-red-700 text-lg mb-1">ไม่สามารถโหลดข้อมูลได้</p>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  // ----- สถานะ 3: ไม่มีข้อมูลเลย -----
  if (isEmpty) {
    return (
      <div className="glass-card p-16 bg-white text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Package size={36} className="text-slate-300" />
        </div>
        <p className="text-foreground font-semibold text-lg mb-2">
          ไม่พบรายการงาน Rework ในขณะนี้
        </p>
        <p className="text-sm text-muted max-w-sm mx-auto">
          {searchQuery
            ? 'ลองปรับคำค้นหาใหม่ หรือล้างการค้นหาเพื่อดูรายการทั้งหมด'
            : 'เริ่มต้นโดยการเพิ่มเคสใหม่จากแท็บ "เพิ่มงานใหม่" ที่เมนูด้านซ้าย'}
        </p>
      </div>
    );
  }

  // ----- สถานะ 4: ไม่มีข้อมูลหลัง filter -----
  if (isFilterEmpty) {
    return (
      <div className="glass-card p-16 bg-white text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <Search size={36} className="text-amber-300" />
        </div>
        <p className="text-foreground font-semibold text-lg mb-2">
          ไม่พบรายการที่ตรงกับตัวกรอง
        </p>
        <p className="text-sm text-muted max-w-sm mx-auto mb-4">
          ลองปรับเงื่อนไขตัวกรอง หรือล้างตัวกรองทั้งหมดเพื่อดูรายการทั้งหมด
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-6 py-2 bg-accent text-white text-sm font-bold rounded-xl hover:bg-black transition-colors"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>
    );
  }

  // ----- สถานะ 5: มีข้อมูล → แสดงรายการ -----
  return (
    <div className="glass-card p-0 bg-white flex flex-col flex-1">
      <div className="flex-1 border-t border-border">
        <div className="divide-y divide-[#f1f1f1] p-2">
          <div>
            {cases.map((item) => (
              <CaseRow
                key={item.id}
                caseItem={item}
                onClick={() => onRowClick(item)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SUB-COMPONENT: CaseRow (แต่ละแถว) =====

interface CaseRowProps {
  caseItem: CaseItem;
  onClick: () => void;
}

function CaseRow({ caseItem, onClick }: CaseRowProps) {
  const deadlineStatus = getDeadlineStatus(caseItem.date, caseItem.status);

  return (
    <div
      onClick={onClick}
      className={`flex items-center py-4 px-4 hover:bg-slate-50/50 transition-colors group rounded-lg cursor-pointer ${
        deadlineStatus === 'warning' ? 'bg-orange-50 border-l-4 border-orange-400' :
        deadlineStatus === 'danger' ? 'bg-red-50 border-l-4 border-red-400' : ''
      }`}
    >
      {/* ข้อมูลหลัก */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-foreground">
            {caseItem.items[0]?.itemName || 'N/A'}
          </div>
          {deadlineStatus === 'warning' && (
            <div className="flex items-center gap-1 text-orange-600 text-xs" title="งานค้างเกิน 7 วัน">
              <Clock size={12} />
              <span>7 วัน</span>
            </div>
          )}
          {deadlineStatus === 'danger' && (
            <div className="flex items-center gap-1 text-red-600 text-xs" title="งานค้างเกิน 30 วัน — ต้องเร่งดำเนินการ">
              <AlertCircle size={12} />
              <span>เกิน 30 วัน</span>
            </div>
          )}
        </div>
        <div className="text-[12px] text-muted mt-1">
          {formatTimestamp(caseItem.date)} &bull; Source:{' '}
          <span className="font-bold">{caseItem.source}</span> &bull;{' '}
          <span className="font-mono text-accent">{caseItem.id}</span>
        </div>
      </div>

      {/* ข้อมูลเสริม */}
      <div className="mr-8 text-right">
        <p className="text-xs font-bold text-foreground">
          {caseItem.items[0]?.amount || 0} Box
        </p>
        <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
          {caseItem.items[0]?.reason || 'N/A'}
        </p>
      </div>

      {/* สถานะ */}
      <StatusPill status={caseItem.status as any} />
    </div>
  );
}

// ===== SUB-COMPONENT: StatusPill =====

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
