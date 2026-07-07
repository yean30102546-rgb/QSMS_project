import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import type { DayInfo, Employee, LeaveRecord, RosterCellStatus } from '../types';

interface RosterCellPopoverProps {
  day: DayInfo;
  employee: Employee;
  status: RosterCellStatus;
  leave?: LeaveRecord;
  children: React.ReactNode;
  onSetStartSaturday: (dateKey: string) => void;
  onSaturdayStatusChange: (dateKey: string, status: string) => void;
  onUpsertLeave: (dateKey: string, type: 'sick' | 'business') => void;
  onDeleteLeave: (dateKey: string) => void;
}

export function RosterCellPopover({
  day,
  employee,
  status,
  leave,
  children,
  onSetStartSaturday,
  onSaturdayStatusChange,
  onUpsertLeave,
  onDeleteLeave,
}: RosterCellPopoverProps) {
  // Only Saturday or existing Leave is interactable based on previous logic, 
  // but in the unified Matrix, we might want to interact with any day if it's for Leave.
  // We'll allow interaction for Leave on any day, and Status Change on Saturdays.

  const isSaturday = day.isSaturday;
  const isPublicHoliday = day.isPublicHoliday;

  if (isPublicHoliday) {
    return <>{children}</>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-1.5 overflow-hidden rounded-xl bg-white border border-slate-200 shadow-xl z-50 font-sans"
        onClick={(e) => e.stopPropagation()}
        sideOffset={4}
      >
        {isSaturday && !employee.startWorkingSaturday ? (
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left"
            onClick={() => onSetStartSaturday(day.dateKey)}
          >
            ✨ ตั้งเป็นเสาร์เริ่มงาน
          </button>
        ) : (
          <div className="flex flex-col gap-0.5">
            {isSaturday && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">สถานะกะงาน (เสาร์)</p>
                </div>
                
                <div className="flex flex-col gap-0.5 px-1">
                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
                    onClick={() => onSaturdayStatusChange(day.dateKey, 'WORK')}
                  >
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    ทำงาน (WORK)
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
                    onClick={() => onSaturdayStatusChange(day.dateKey, 'OFF')}
                  >
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                    วันหยุด (OFF)
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
                    onClick={() => onSaturdayStatusChange(day.dateKey, 'OT2X')}
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    ล่วงเวลา (OT x2)
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors text-left"
                    onClick={() => onSaturdayStatusChange(day.dateKey, 'CLEAR')}
                  >
                    <div className="h-2 w-2 rounded-full border border-slate-300" />
                    คืนค่าระบบ
                  </button>
                </div>
                <div className="my-1.5 h-px bg-slate-100 mx-2" />
              </>
            )}

            <div className="px-2 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">การลางาน</p>
            </div>

            <div className="flex flex-col gap-0.5 px-1 pb-1">
              <button
                type="button"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
                onClick={() => onUpsertLeave(day.dateKey, 'sick')}
              >
                🤒 ลาป่วย
              </button>
              <button
                type="button"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors text-left"
                onClick={() => onUpsertLeave(day.dateKey, 'business')}
              >
                💼 ลากิจ
              </button>
              {leave && (
                <button
                  type="button"
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  onClick={() => onDeleteLeave(day.dateKey)}
                >
                  🗑️ ยกเลิกวันลา
                </button>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
