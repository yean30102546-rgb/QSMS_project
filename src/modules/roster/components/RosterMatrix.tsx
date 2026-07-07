import React from 'react';
import type { DayInfo, Employee, LeaveRecord, RosterCellStatus } from '../types';
import { RosterCellPopover } from './RosterCellPopover';

interface RosterMatrixProps {
  employees: Employee[];
  monthDays: DayInfo[];
  leaveMap: Map<string, LeaveRecord>;
  todayKey: string;
  getEmployeeDayStatus: (employee: Employee, day: DayInfo) => RosterCellStatus;
  onNavigateToEmployee: (employeeId: string) => void;
  onSetStartSaturday: (employeeId: string, dateKey: string) => void;
  onSaturdayStatusChange: (employeeId: string, dateKey: string, status: string) => void;
  onUpsertLeave: (employeeId: string, dateKey: string, type: 'sick' | 'business') => void;
  onDeleteLeave: (employeeId: string, dateKey: string) => void;
}

export function RosterMatrix({
  employees,
  monthDays,
  leaveMap,
  todayKey,
  getEmployeeDayStatus,
  onNavigateToEmployee,
  onSetStartSaturday,
  onSaturdayStatusChange,
  onUpsertLeave,
  onDeleteLeave,
}: RosterMatrixProps) {
  const getStatusStyle = (status: RosterCellStatus, leave?: LeaveRecord, isSaturday?: boolean, isPublicHoliday?: boolean, isSunday?: boolean) => {
    if (leave) {
      if (leave.leaveType === 'sick') return 'bg-rose-100 text-rose-700 font-bold border-rose-200';
      if (leave.leaveType === 'business') return 'bg-amber-100 text-amber-700 font-bold border-amber-200';
      return 'bg-violet-100 text-violet-700 font-bold border-violet-200';
    }
    
    if (isPublicHoliday) return 'bg-rose-50 text-rose-500 font-semibold border-rose-100';
    if (isSunday) return 'bg-slate-50 text-slate-400 font-medium border-slate-100';

    if (status === 'WORK' || status === 'WORK_SWAP') return 'bg-emerald-50 text-emerald-700 font-semibold border-emerald-100';
    if (status === 'OT2X') return 'bg-blue-50 text-blue-700 font-semibold border-blue-100';
    if (status === 'OFF' || status === 'OFF_SWAP') return 'bg-slate-100 text-slate-500 font-medium border-slate-200';
    
    // Default working day (Mon-Fri)
    if (!isSaturday && !isSunday) return 'bg-white text-slate-600 font-medium border-slate-100';

    return 'bg-white text-slate-400 border-slate-100';
  };

  const getStatusText = (status: RosterCellStatus, leave?: LeaveRecord) => {
    if (leave) {
      return leave.leaveType === 'sick' ? 'ลาป่วย' : leave.leaveType === 'business' ? 'ลากิจ' : 'ลาพัก';
    }
    if (status === 'WORK') return 'W';
    if (status === 'WORK_SWAP') return 'WS';
    if (status === 'OFF') return 'O';
    if (status === 'OFF_SWAP') return 'OS';
    if (status === 'OT2X') return 'OT';
    return '-';
  };

  return (
    <div className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm font-sans">
      <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="sticky left-0 z-20 w-[200px] min-w-[200px] bg-slate-50 px-4 py-3 font-semibold text-slate-700 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
              พนักงาน
            </th>
            {monthDays.map((day) => {
              const isWeekend = day.isSaturday || day.isSunday;
              const isToday = day.dateKey === todayKey;
              return (
                <th
                  key={day.dateKey}
                  className={`min-w-[44px] px-2 py-3 text-center text-xs font-semibold ${
                    isToday ? 'text-blue-600 bg-blue-50' : 
                    day.isPublicHoliday ? 'text-rose-500' :
                    isWeekend ? 'text-slate-500 bg-slate-50/50' : 'text-slate-700'
                  } border-r border-slate-100 last:border-r-0`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-medium uppercase opacity-70">
                      {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][day.date.getDay()]}
                    </span>
                    <span>{day.date.getDate()}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan={monthDays.length + 1} className="py-12 text-center text-slate-500">
                ยังไม่มีพนักงานในระบบ
              </td>
            </tr>
          ) : (
            employees.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td 
                  className="sticky left-0 z-10 bg-white px-4 py-2 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] cursor-pointer group"
                  onClick={() => onNavigateToEmployee(emp.id)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors truncate w-full max-w-[180px]" title={emp.name}>
                      {emp.name}
                    </span>
                    {!emp.startWorkingSaturday && (
                      <span className="text-[10px] text-amber-500 font-medium">⚠️ ยังไม่กำหนดเสาร์เริ่มงาน</span>
                    )}
                  </div>
                </td>
                {monthDays.map((day) => {
                  const status = getEmployeeDayStatus(emp, day);
                  const leave = leaveMap.get(`${emp.id}:${day.dateKey}`);
                  const styleClass = getStatusStyle(status, leave, day.isSaturday, day.isPublicHoliday, day.isSunday);
                  const text = day.isPublicHoliday ? 'หยุด' : day.isSunday ? '' : (!day.isSaturday && !leave ? '' : getStatusText(status, leave));
                  
                  return (
                    <td key={day.dateKey} className="p-1 border-r border-slate-100 last:border-r-0 text-center">
                      <RosterCellPopover
                        day={day}
                        employee={emp}
                        status={status}
                        leave={leave}
                        onSetStartSaturday={(d) => onSetStartSaturday(emp.id, d)}
                        onSaturdayStatusChange={(d, s) => onSaturdayStatusChange(emp.id, d, s)}
                        onUpsertLeave={(d, type) => onUpsertLeave(emp.id, d, type)}
                        onDeleteLeave={(d) => onDeleteLeave(emp.id, d)}
                      >
                        <button
                          type="button"
                          className={`w-full h-[36px] flex items-center justify-center rounded-md border text-[11px] transition-all hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${styleClass}`}
                          title={day.isPublicHoliday ? day.holidayName : undefined}
                          disabled={day.isPublicHoliday || day.isSunday}
                        >
                          {text}
                        </button>
                      </RosterCellPopover>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
