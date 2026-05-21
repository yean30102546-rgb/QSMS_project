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
import { RosterLegend } from './RosterLegend';

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
    <div className="space-y-4">
      <RosterLegend />
      <div className="overflow-x-auto rounded-xl border border-[#e4e4e7] bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[180px] font-semibold text-[#71717a] sticky left-0 bg-white z-20 border-r">
                พนักงาน
              </TableHead>
              {saturdaysInMonth.map((sat) => (
                <TableHead key={sat.dateKey} className="text-center font-semibold text-[#71717a] min-w-[50px]">
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
                className="cursor-pointer group even:bg-slate-50/50"
              >
                <TableCell className="font-semibold text-[#18181b] sticky left-0 bg-white z-10 group-hover:bg-[#fafafa] border-r">
                  {emp.name}
                  {!emp.startWorkingSaturday && <span className="text-amber-500 ml-1">⚠️</span>}
                </TableCell>
                {saturdaysInMonth.map((sat) => {
                  const dayStatus = getEmployeeDayStatus(emp, sat);
                  const leave = leaveMap.get(`${emp.id}:${sat.dateKey}`);
                  
                  let bgColor = '#10b981'; // Default WORK
                  if (leave) {
                    if (leave.leaveType === 'sick') bgColor = '#f43f5e';
                    else if (leave.leaveType === 'business') bgColor = '#f59e0b';
                    else if (leave.leaveType === 'vacation') bgColor = '#8b5cf6';
                  } else {
                    if (dayStatus === 'OFF' || dayStatus === 'OFF_SWAP') bgColor = '#cbd5e1';
                    else if (dayStatus === 'HOLIDAY') bgColor = '#94a3b8';
                    else if (dayStatus === 'OT2X') bgColor = '#3b82f6';
                  }

                  return (
                    <TableCell key={sat.dateKey} className="p-0.5 text-center h-10">
                      <div 
                        className="w-full h-full min-h-[32px] rounded-sm transition-opacity hover:opacity-80"
                        style={{ backgroundColor: bgColor }}
                        title={getStatusLabel(dayStatus)}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
