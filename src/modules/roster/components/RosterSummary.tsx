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

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Find the next upcoming Saturday (or today if it's Saturday)
  let upcomingSat = saturdaysInMonth.find(d => d.dateKey >= todayKey);
  if (!upcomingSat && saturdaysInMonth.length > 0) {
    upcomingSat = saturdaysInMonth[saturdaysInMonth.length - 1];
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.04)]">
        <Table className="w-full border-collapse text-left">
          <TableHeader>
            <TableRow className="bg-slate-50/80 border-b border-slate-100">
              <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[250px] sticky left-0 bg-slate-50/80 z-20">
                พนักงาน
              </TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center min-w-[120px]">
                สัปดาห์นี้ {upcomingSat ? `(ส.${upcomingSat.date.getDate()})` : ''}
              </TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center min-w-[150px]">
                สรุปการลา (เดือนนี้)
              </TableHead>
              <TableHead className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center min-w-[150px]">
                ความต่อเนื่อง
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => {
              // 1. Calculate Leaves
              let sick = 0; let biz = 0; let vac = 0;
              Array.from(leaveMap.values()).forEach((leave) => {
                if (leave.employeeId === emp.id) {
                  if (leave.leaveType === 'sick') sick++;
                  else if (leave.leaveType === 'business') biz++;
                  else if (leave.leaveType === 'vacation') vac++;
                }
              });

              // 2. Upcoming Status
              let upcomingStatus: RosterCellStatus | 'LEAVE' = 'OFF';
              let leaveType = '';
              if (upcomingSat) {
                const leave = leaveMap.get(`${emp.id}:${upcomingSat.dateKey}`);
                if (leave) {
                  upcomingStatus = 'LEAVE';
                  leaveType = leave.leaveType;
                } else {
                  upcomingStatus = getEmployeeDayStatus(emp, upcomingSat);
                }
              }

              // 3. Retention
              const totalSat = saturdaysInMonth.length;
              let workingSat = 0;
              saturdaysInMonth.forEach(sat => {
                const status = getEmployeeDayStatus(emp, sat);
                const hasLeave = leaveMap.has(`${emp.id}:${sat.dateKey}`);
                if ((status === 'WORK' || status === 'WORK_SWAP' || status === 'OT2X') && !hasLeave) {
                  workingSat++;
                }
              });
              const retention = totalSat > 0 ? (workingSat / totalSat) * 100 : 0;

              return (
                <TableRow
                  key={emp.id}
                  onClick={() => onNavigateToEmployee(emp.id)}
                  className="cursor-pointer group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0"
                >
                  <TableCell className="py-4 px-6 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-r border-slate-50/50">
                    <div className="text-[14px] font-bold text-slate-900">{emp.name}</div>
                    {!emp.startWorkingSaturday ? (
                      <div className="text-[11px] font-bold text-amber-500 mt-0.5">⚠️ ยังไม่ระบุวันเริ่มงาน</div>
                    ) : (
                      <div className="text-[11px] font-medium text-slate-400 mt-0.5">เริ่มงาน: ส.แรกของรอบ</div>
                    )}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-center">
                    {upcomingStatus === 'LEAVE' ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        leaveType === 'sick' ? 'bg-rose-50 text-rose-600' : 
                        leaveType === 'business' ? 'bg-amber-50 text-amber-600' : 
                        'bg-violet-50 text-violet-600'
                      }`}>
                        ● ลา{leaveType === 'sick' ? 'ป่วย' : leaveType === 'business' ? 'กิจ' : 'พักร้อน'}
                      </span>
                    ) : (upcomingStatus === 'WORK' || upcomingStatus === 'WORK_SWAP' || upcomingStatus === 'OT2X') ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-600">
                        ● ทำงาน
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-500">
                        ● หยุด
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-4 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <span className="text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md" title="ลากิจ">กิจ: {biz}</span>
                      <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md" title="ลาป่วย">ป่วย: {sick}</span>
                      <span className="text-[11px] font-bold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-md" title="ลาพักร้อน">พัก: {vac}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-4 px-6 text-center">
                    <div className="w-full max-w-[120px] h-[6px] bg-slate-100 rounded-full overflow-hidden mx-auto">
                      <div 
                        className={`h-full rounded-full ${retention >= 80 ? 'bg-emerald-500' : retention >= 50 ? 'bg-amber-500' : 'bg-slate-800'}`} 
                        style={{ width: `${retention}%` }}
                      ></div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}