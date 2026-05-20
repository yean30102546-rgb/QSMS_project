import React from 'react';
import { motion } from 'motion/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import type { DayInfo, Employee, LeaveRecord, RosterCellStatus } from '../types';
import { getStatusLabel } from '../calendar';

interface RosterCalendarProps {
  selectedEmployee: Employee;
  calendarCells: (DayInfo | null)[];
  leaveMap: Map<string, LeaveRecord>;
  todayKey: string;
  getEmployeeDayStatus: (employee: Employee, day: DayInfo) => RosterCellStatus;
  
  // Drag and Drop
  dragPayload: { sourceDateKey: string } | null;
  dragOverDateKey: string | null;
  onDragStart: (dateKey: string) => void;
  onDragOver: (dateKey: string | null) => void;
  onDragEnd: () => void;
  onDrop: (targetDateKey: string) => void;

  // Actions
  onUpsertLeave: (dateKey: string, type: 'sick' | 'business') => void;
  onDeleteLeave: (dateKey: string) => void;
  onSaturdayStatusChange: (dateKey: string, status: string) => void;
  onSetStartSaturday: (dateKey: string) => void;
}

const WEEKDAY_HEADERS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export function RosterCalendar({
  selectedEmployee,
  calendarCells,
  leaveMap,
  todayKey,
  getEmployeeDayStatus,
  dragPayload,
  dragOverDateKey,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onUpsertLeave,
  onDeleteLeave,
  onSaturdayStatusChange,
  onSetStartSaturday,
}: RosterCalendarProps) {
  return (
    <div className="overflow-x-auto rounded-[24px] border border-[#d8d8de] bg-[#f6f6f9] p-1 shadow-sm">
      <div className="grid grid-cols-7 gap-1 min-w-[750px] lg:min-w-0">
        {WEEKDAY_HEADERS.map((header) => (
          <div
            key={header}
            className="border border-[#d8d8de] bg-[#ebebef] px-2 py-1.5 text-center text-[10px] font-bold tracking-[0.12em] text-[#3a3a3f] rounded-lg"
          >
            {header}
          </div>
        ))}

        {calendarCells.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[64px] border border-[#e2e2e8] bg-[#f3f3f6] rounded-lg opacity-40"
              />
            );
          }

          const status = getEmployeeDayStatus(selectedEmployee, day);
          const leave = leaveMap.get(`${selectedEmployee.id}:${day.dateKey}`);
          const isSaturday = day.isSaturday;
          const isHoliday = day.isSunday || day.isPublicHoliday;
          const isToday = day.dateKey === todayKey;

          const isSource = dragPayload?.sourceDateKey === day.dateKey;
          const isOver = dragOverDateKey === day.dateKey;

          return (
            <Popover key={day.dateKey}>
              <PopoverTrigger asChild>
                <div
                  className={`roster-cell group ${isToday ? 'is-today' : ''} ${
                    isSource ? 'drag-source' : ''
                  } ${isOver ? 'drag-over' : ''} flex flex-col justify-between`}
                  onDragOver={(e) => {
                    if (isSaturday && !day.isPublicHoliday && dragPayload && dragPayload.sourceDateKey !== day.dateKey) {
                      e.preventDefault();
                      onDragOver(day.dateKey);
                    }
                  }}
                  onDragLeave={() => onDragOver(null)}
                  onDrop={() => {
                    if (dragPayload && isSaturday && !day.isPublicHoliday) {
                      onDrop(day.dateKey);
                    }
                    onDragOver(null);
                    onDragEnd();
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-[#18181b]">
                      {day.date.getDate()}
                    </span>
                    {(() => {
                      const dotClass = leave
                        ? leave.leaveType === 'sick'
                          ? 'leave-sick'
                          : 'leave-business'
                        : status === 'WORK' || status === 'WORK_SWAP'
                        ? 'work'
                        : status === 'OT2X'
                        ? 'ot'
                        : status === 'OFF' || status === 'OFF_SWAP'
                        ? 'off'
                        : 'holiday';
                      return (
                        <span className={`status-dot ${dotClass}`} title={getStatusLabel(status)} />
                      );
                    })()}
                  </div>

                  <div className="my-1 flex-1 flex flex-col justify-end">
                    {day.isPublicHoliday && (
                      <span
                        className="text-[9px] text-rose-500 font-semibold truncate block w-full"
                        title={day.holidayName}
                      >
                        🇹🇭 {day.holidayName}
                      </span>
                    )}
                    {leave && (
                      <span className="text-[10px] font-bold text-rose-600 block truncate">
                        {leave.note}
                      </span>
                    )}
                    {!leave && !isSaturday && !isHoliday && (
                      <span className="text-[9px] text-slate-400 font-medium">ทำงานปกติ</span>
                    )}
                    {!leave && !isSaturday && isHoliday && !day.isPublicHoliday && (
                      <span className="text-[9px] text-[#71717a] font-medium">วันอาทิตย์</span>
                    )}
                    {!leave && isSaturday && !day.isPublicHoliday && (
                      status === 'WORK' || status === 'WORK_SWAP' ? (
                        <div
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            onDragStart(day.dateKey);
                          }}
                          onDragEnd={onDragEnd}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 flex items-center justify-between gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-[9.5px] font-bold text-emerald-700 shadow-sm cursor-grab active:cursor-grabbing hover:bg-emerald-100 transition-colors"
                          title="ลากสลับวันหยุดเสาร์อื่น"
                        >
                          <span>{getStatusLabel(status)}</span>
                          <span className="text-emerald-400/80">⋮⋮</span>
                        </div>
                      ) : (
                        <span
                          className={`text-[9.5px] font-bold ${
                            status === 'OT2X' ? 'text-blue-600' : 'text-amber-500'
                          }`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      )
                    )}
                  </div>

                  <div className="flex items-center justify-between min-h-[14px]">
                    {!isHoliday && !leave && (status === 'WORK' || status === 'WORK_SWAP' || !isSaturday) ? (
                      <div
                        className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onUpsertLeave(day.dateKey, 'sick')}
                          className="text-[9px] text-rose-500 hover:underline font-semibold"
                        >
                          🤒 ป่วย
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpsertLeave(day.dateKey, 'business')}
                          className="text-[9px] text-amber-600 hover:underline font-semibold"
                        >
                          💼 กิจ
                        </button>
                      </div>
                    ) : leave ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLeave(day.dateKey);
                        }}
                        className="text-[9px] text-red-500 hover:underline font-bold z-10"
                      >
                        ลบวันลา
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
              </PopoverTrigger>

              {isSaturday && !day.isPublicHoliday && (
                <PopoverContent className="w-56 p-0 overflow-hidden rounded-xl" onClick={(e) => e.stopPropagation()}>
                  {!selectedEmployee.startWorkingSaturday ? (
                    <button
                      type="button"
                      className="roster-popover-item"
                      onClick={() => onSetStartSaturday(day.dateKey)}
                    >
                      ✨ ตั้งเป็นเสาร์เริ่มงาน
                    </button>
                  ) : (
                    <>
                      <div className="roster-popover-header">จัดการตั้งค่าสูตร</div>
                      <div className="roster-popover-group">
                        <button
                          type="button"
                          className="roster-popover-item"
                          onClick={() => onSetStartSaturday(day.dateKey)}
                        >
                          🔄 ย้ายจุดเริ่มงานมาเสาร์นี้
                        </button>
                        <button
                          type="button"
                          className="roster-popover-item"
                          onClick={() => onSaturdayStatusChange(day.dateKey, 'CLEAR')}
                        >
                          🧹 คืนค่าสูตรปกติ
                        </button>
                      </div>

                      <div className="roster-popover-divider" />
                      <div className="roster-popover-header">กำหนดสถานะการทำงาน</div>
                      <div className="roster-popover-group">
                        <button
                          type="button"
                          className="roster-popover-item"
                          onClick={() => onSaturdayStatusChange(day.dateKey, 'WORK')}
                        >
                          ✅ ทำงาน (WORK)
                        </button>
                        <button
                          type="button"
                          className="roster-popover-item"
                          onClick={() => onSaturdayStatusChange(day.dateKey, 'OFF')}
                        >
                          📴 วันหยุด (OFF)
                        </button>
                        <button
                          type="button"
                          className="roster-popover-item"
                          onClick={() => onSaturdayStatusChange(day.dateKey, 'OT2X')}
                        >
                          ⏰ OT x2
                        </button>
                      </div>

                      <div className="roster-popover-divider" />
                      <div className="roster-popover-header">การลาหยุด</div>
                      <div className="roster-popover-group">
                        <button
                          type="button"
                          className="roster-popover-item"
                          onClick={() => onUpsertLeave(day.dateKey, 'sick')}
                        >
                          🤒 ลาป่วย
                        </button>
                        <button
                          type="button"
                          className="roster-popover-item"
                          onClick={() => onUpsertLeave(day.dateKey, 'business')}
                        >
                          💼 ลากิจ
                        </button>
                        {leave && (
                          <button
                            type="button"
                            className="roster-popover-item danger"
                            onClick={() => onDeleteLeave(day.dateKey)}
                          >
                            🗑️ ลบวันลา
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </PopoverContent>
              )}
            </Popover>
          );
        })}
      </div>
    </div>
  );
}
