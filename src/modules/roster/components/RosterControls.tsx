'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface RosterControlsProps {
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onResetOverrides: () => void;
  onAddEmployee: (name: string) => void;
}

export function RosterControls({
  monthLabel,
  onPreviousMonth,
  onNextMonth,
  onResetOverrides,
  onAddEmployee,
}: RosterControlsProps) {
  const [newEmployeeName, setNewEmployeeName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmployeeName.trim()) {
      onAddEmployee(newEmployeeName.trim());
      setNewEmployeeName('');
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onPreviousMonth}
          className="border border-[#e4e4e7] bg-white hover:bg-[#fafafa] rounded-lg p-2 text-[#3f3f46] transition-colors"
        >
          <ChevronLeft size={16} />
        </motion.button>
        <h2 className="min-w-[200px] text-center text-base font-bold text-[#18181b]">{monthLabel}</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onNextMonth}
          className="border border-[#e4e4e7] bg-white hover:bg-[#fafafa] rounded-lg p-2 text-[#3f3f46] transition-colors"
        >
          <ChevronRight size={16} />
        </motion.button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="ชื่อพนักงานใหม่..."
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            className="w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newEmployeeName.trim()}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">เพิ่มพนักงาน</span>
          </button>
        </form>

        <div className="h-6 w-px bg-slate-200" />

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={onResetOverrides}
          className="border border-[#e4e4e7] bg-white hover:bg-[#fafafa] rounded-lg px-3 py-1.5 text-sm font-semibold text-[#3f3f46] transition-colors inline-flex items-center gap-1.5"
        >
          <RotateCcw size={16} />
          ล้างการสลับเสาร์
        </motion.button>
      </div>
    </div>
  );
}
