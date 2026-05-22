'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { Employee } from '../types';

interface RosterSidebarProps {
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
  onDeleteEmployee: (id: string, name: string) => void;
  newEmployeeName: string;
  setNewEmployeeName: (name: string) => void;
  onAddEmployee: () => void;
}

export function RosterSidebar({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  onDeleteEmployee,
  newEmployeeName,
  setNewEmployeeName,
  onAddEmployee,
}: RosterSidebarProps) {
  return (
    <aside className="glass-panel h-fit rounded-[32px] p-4 shadow-xl shadow-blue-900/5">
      <div>
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-black/40">รายชื่อพนักงาน</h3>
        
        <div className="scrollbar-hide space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
          {employees.map((employee) => {
            const isSelected = selectedEmployeeId === employee.id;
            return (
              <motion.div
                key={employee.id}
                initial={false}
                animate={{
                  backgroundColor: isSelected ? '#1d1d1f' : 'transparent',
                  scale: isSelected ? 1.02 : 1,
                  color: isSelected ? '#ffffff' : '#1d1d1f',
                }}
                whileHover={!isSelected ? { 
                  scale: 1.01, 
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                } : {}}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`group relative flex items-center justify-between rounded-2xl py-2.5 px-3.5 cursor-pointer ${
                  isSelected
                    ? 'shadow-xl shadow-black/20 font-bold'
                    : ''
                }`}
                onClick={() => onSelectEmployee(employee.id)}
              >
                <span className="text-[14px] truncate flex items-center gap-2 flex-1">
                  {employee.name}
                  {!employee.startWorkingSaturday && (
                    <span 
                      className={`font-bold text-xs ${isSelected ? 'text-amber-400' : 'text-amber-500'}`} 
                      title="ยังไม่ได้ตั้งเสาร์เริ่มงาน"
                    >
                      ⚠️
                    </span>
                  )}
                </span>
                <motion.button
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEmployee(employee.id, employee.name);
                  }}
                  className={`rounded-xl p-1.5 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                    isSelected ? 'text-white/80 hover:bg-white/20 hover:text-white' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'
                  }`}
                  title="ลบพนักงาน"
                >
                  <Trash2 size={14} />
                </motion.button>
              </motion.div>
            );
          })}
          {employees.length === 0 && (
            <div className="py-8 text-center text-xs font-medium text-[#a1a1aa]">ไม่มีข้อมูลพนักงาน</div>
          )}
        </div>

        <div className="mt-6 space-y-3 border-t border-black/5 pt-5">
          <div className="relative group">
            <input
              type="text"
              value={newEmployeeName}
              onChange={(e) => setNewEmployeeName(e.target.value)}
              placeholder="ชื่อพนักงานใหม่..."
              className="glass-input w-full rounded-2xl py-3 px-4 text-xs font-medium"
            />
          </div>
          <motion.button
            whileHover={newEmployeeName.trim() ? { scale: 1.02 } : {}}
            whileTap={newEmployeeName.trim() ? { scale: 0.98 } : {}}
            type="button"
            onClick={onAddEmployee}
            disabled={!newEmployeeName.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1d1d1f] py-3 text-xs font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} />
            เพิ่มพนักงาน
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
