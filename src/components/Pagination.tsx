/**
 * Pagination Component
 * ส่วนเลือกหน้า — ใช้ <button type="button"> เพื่อป้องกัน browser ดีดขึ้นบน
 *
 * วิธีใช้:
 *   <Pagination
 *     currentPage={1}
 *     totalPages={5}
 *     onPageChange={(page) => setCurrentPage(page)}
 *     totalItems={47}
 *     isFiltered={true}
 *   />
 */

import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  /** หน้าปัจจุบัน (1-based) */
  currentPage: number;
  /** จำนวนหน้าทั้งหมด */
  totalPages: number;
  /** Callback เมื่อเปลี่ยนหน้า */
  onPageChange: (page: number) => void;
  /** จำนวนรายการที่แสดง (สำหรับข้อความสรุป) */
  totalItems: number;
  /** แสดงว่ากำลังใช้ตัวกรองหรือไม่ */
  isFiltered?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  isFiltered = false,
}: PaginationProps) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-t border-border bg-slate-50/50">
      {/* ข้อมูลสรุป */}
      <div className="text-xs text-muted font-medium">
        {totalPages > 0 ? `หน้า ${currentPage} จาก ${totalPages}` : 'ไม่มีข้อมูล'}{' '}
        ({totalItems} รายการ{isFiltered ? ' (filtered)' : ''})
      </div>

      {/* ปุ่มเลือกหน้า */}
      <div className="flex items-center gap-2">
        {/* ปุ่มย้อนกลับ */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-border hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="ย้อนกลับ"
        >
          <ChevronLeft size={16} className="text-foreground" />
        </motion.button>

        {/* ปุ่มตัวเลขหน้า */}
        <div className="flex gap-1">
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <motion.button
                type="button"
                key={pageNum}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(pageNum)}
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

        {/* ปุ่มถัดไป */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-border hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="ถัดไป"
        >
          <ChevronRight size={16} className="text-foreground" />
        </motion.button>
      </div>
    </div>
  );
}
