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
    <aside className="bg-white border border-[#e4e4e7] rounded-2xl p-3 flex flex-col gap-4 shadow-sm h-fit">
      <div>
        <h3 className="text-xs uppercase tracking-wide text-[#a1a1aa] font-semibold mb-3">พนักงาน</h3>
        
        <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
          {employees.map((employee) => {
            const isSelected = selectedEmployeeId === employee.id;
            return (
              <div
                key={employee.id}
                className={`group relative flex items-center justify-between rounded-lg py-2 px-2.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#f4f4f5] text-[#18181b] font-semibold'
                    : 'text-[#52525b] hover:bg-[#fafafa]'
                }`}
                onClick={() => onSelectEmployee(employee.id)}
              >
                <span className="text-sm truncate flex items-center gap-1 flex-1">
                  {employee.name}
                  {!employee.startWorkingSaturday && (
                    <span className="text-amber-500 font-bold text-xs" title="ยังไม่ได้ตั้งเสาร์เริ่มงาน">⚠️</span>
                  )}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEmployee(employee.id, employee.name);
                  }}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="ลบพนักงาน"
                >
                  <Trash2 size={13} />
                </motion.button>
              </div>
            );
          })}
          {employees.length === 0 && (
            <div className="text-xs text-[#a1a1aa] text-center py-4">ไม่มีพนักงาน</div>
          )}
        </div>

        <div className="mt-4 border-t border-[#f4f4f5] pt-4 space-y-2">
          <input
            type="text"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            placeholder="เพิ่มพนักงาน..."
            className="border border-[#e4e4e7] rounded-lg bg-[#fafafa] px-3 py-1.5 text-xs outline-none focus:border-[#a1a1aa] focus:ring-1 focus:ring-[#a1a1aa] transition-all w-full"
          />
          <motion.button
            whileHover={newEmployeeName.trim() ? { scale: 1.02 } : {}}
            whileTap={newEmployeeName.trim() ? { scale: 0.97 } : {}}
            type="button"
            onClick={onAddEmployee}
            disabled={!newEmployeeName.trim()}
            className="bg-[#18181b] text-white rounded-lg text-xs py-1.5 font-semibold hover:bg-black transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1"
          >
            <Plus size={13} />
            เพิ่มพนักงาน
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
