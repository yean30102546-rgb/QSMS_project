/**
 * Pagination Component
 */

import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  isFiltered?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  isFiltered = false,
}: PaginationProps) {
  const hasPages = totalPages > 0;
  const safeCurrentPage = hasPages ? Math.min(Math.max(currentPage, 1), totalPages) : 0;
  const isPrevDisabled = !hasPages || safeCurrentPage <= 1;
  const isNextDisabled = !hasPages || safeCurrentPage >= totalPages;

  return (
    <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-4 py-3 sm:py-4 border-t border-border bg-slate-50/50">
      <div className="text-xs text-muted font-medium text-center sm:text-left">
        {hasPages ? `หน้า ${safeCurrentPage} จาก ${totalPages}` : 'ไม่มีข้อมูล'} ({totalItems} รายการ{isFiltered ? ' (filtered)' : ''})
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={isPrevDisabled}
          className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 flex items-center justify-center p-2 rounded-lg border border-border hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="ย้อนกลับ"
        >
          <ChevronLeft size={16} className="text-foreground" />
        </motion.button>

        <span className="sm:hidden text-xs font-semibold px-2 text-slate-700 font-mono tabular-nums">
          {safeCurrentPage} / {totalPages}
        </span>

        <div className="hidden sm:flex gap-1">
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <motion.button
                type="button"
                key={pageNum}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(pageNum)}
                className={`min-h-9 min-w-9 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pageNum === safeCurrentPage
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
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={isNextDisabled}
          className="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 flex items-center justify-center p-2 rounded-lg border border-border hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="ถัดไป"
        >
          <ChevronRight size={16} className="text-foreground" />
        </motion.button>
      </div>
    </div>
  );
}
