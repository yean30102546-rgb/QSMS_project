import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import type { DayInfo, Employee, LeaveRecord, RosterCellStatus } from '../types';
import { getStatusLabel } from '../calendar';

interface RosterSummaryProps {
  employees: Employee[];
  saturdaysInMonth: DayInfo[];
  leaveMap: Map<string, LeaveRecord>;
  onNavigateToEmployee: (id: string) => void;
  getEmployeeDayStatus: (employee: Employee, day: DayInfo) => RosterCellStatus;
}

export function RosterSummary({
  employees,
  saturdaysInMonth,
  leaveMap,
  onNavigateToEmployee,
  getEmployeeDayStatus,
}: RosterSummaryProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e4e4e7] bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px] font-semibold text-[#71717a] sticky left-0 bg-white z-20">
              พนักงาน
            </TableHead>
            {saturdaysInMonth.map((sat) => (
              <TableHead key={sat.dateKey} className="text-center font-semibold text-[#71717a]">
                ส.{sat.date.getDate()}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => (
            <TableRow
              key={emp.id}
              onClick={() => onNavigateToEmployee(emp.id)}
              className="cursor-pointer group"
            >
              <TableCell className="font-semibold text-[#18181b] sticky left-0 bg-white z-10 group-hover:bg-[#fafafa]">
                {emp.name}
                {!emp.startWorkingSaturday && <span className="text-amber-500 ml-1">⚠️</span>}
              </TableCell>
              {saturdaysInMonth.map((sat) => {
                const dayStatus = getEmployeeDayStatus(emp, sat);
                const leave = leaveMap.get(`${emp.id}:${sat.dateKey}`);
                const dotClass = leave
                  ? leave.leaveType === 'sick'
                    ? 'leave-sick'
                    : 'leave-business'
                  : dayStatus === 'WORK' || dayStatus === 'WORK_SWAP'
                  ? 'work'
                  : dayStatus === 'OT2X'
                  ? 'ot'
                  : dayStatus === 'OFF' || dayStatus === 'OFF_SWAP'
                  ? 'off'
                  : 'holiday';
                return (
                  <TableCell key={sat.dateKey} className="text-center">
                    <div className="flex justify-center">
                      <span className={`status-dot ${dotClass}`} title={getStatusLabel(dayStatus)} />
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
