import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

import {
  buildOverrideMap,
  buildWorkingSaturdayIndexMap,
  getCellStatus,
  getMonthDays,
  getStatusLabel,
  getThaiMonthLabel,
  toDateKey,
} from './calendar';
import type { DayInfo, Employee, LeaveRecord, RosterCellStatus, RosterOverride } from './types';
import type { User } from '../../services/auth';
import {
  addRosterEmployee,
  clearRosterMonthOverrides,
  deleteRosterEmployee,
  fetchRosterMonth,
  swapRosterSaturday,
  updateRosterEmployeePhase,
  updateRosterEmployeeStartSaturday,
  upsertRosterLeave,
  deleteRosterLeave,
  upsertRosterOverride,
} from '../../services/rosterApi';

interface RosterAppProps {
  user: User | null;
  onBackToPortal: () => void;
}

type DragPayload = {
  sourceDateKey: string;
};

const WEEKDAY_HEADERS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export function RosterApp({ user, onBackToPortal }: RosterAppProps) {
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [overrides, setOverrides] = useState<RosterOverride[]>([]);
  const [holidays, setHolidays] = useState<Array<{ dateKey: string; name: string }>>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [leaveType, setLeaveType] = useState<'sick' | 'business'>('sick');
  const [leaveDate, setLeaveDate] = useState('');
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);

  // New States for Dialogs & Popovers
  const [activeLeaveDialog, setActiveLeaveDialog] = useState<{ dateKey: string; leaveType: 'sick' | 'business' } | null>(null);
  const [leaveNoteInput, setLeaveNoteInput] = useState('');
  const [activeSaturdayEdit, setActiveSaturdayEdit] = useState<string | null>(null);

  const monthKey = useMemo(
    () => `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
    [monthDate],
  );

  const monthDays = useMemo(() => getMonthDays(monthDate, holidays), [monthDate, holidays]);
  const workingSaturdayIndexMap = useMemo(() => buildWorkingSaturdayIndexMap(monthDays), [monthDays]);
  const overrideMap = useMemo(() => buildOverrideMap(overrides), [overrides]);
  const monthLabel = useMemo(() => getThaiMonthLabel(monthDate), [monthDate]);
  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  );

  const leaveMap = useMemo(() => {
    const map = new Map<string, LeaveRecord>();
    for (const leave of leaves) {
      map.set(`${leave.employeeId}:${leave.dateKey}`, leave);
    }
    return map;
  }, [leaves]);

  const calendarCells = useMemo(() => {
    if (monthDays.length === 0) return [];
    const firstWeekday = monthDays[0].date.getDay();
    const before = Array.from({ length: firstWeekday }, () => null as DayInfo | null);
    const combined = [...before, ...monthDays];
    while (combined.length % 7 !== 0) combined.push(null);
    return combined;
  }, [monthDays]);

  const clearSessionCache = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('roster-month-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    } catch (e) {
      console.warn('Failed to clear session cache:', e);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setError(null);

      // Try loading from Cache first
      const cacheKey = `roster-month-${monthKey}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.employees) {
            setEmployees(parsed.employees || []);
            setOverrides(parsed.overrides || []);
            setHolidays(parsed.holidays || []);
            setLeaves(parsed.leaves || []);
            setSelectedEmployeeId((prev) =>
              prev && parsed.employees.some((e: any) => e.id === prev)
                ? prev
                : parsed.employees[0]?.id || ''
            );
            setIsLoading(false);
          }
        } catch (e) {
          console.warn('Failed to parse cached roster data:', e);
        }
      } else {
        setIsLoading(true);
      }

      // Fetch from network
      const result = await fetchRosterMonth(monthKey);
      if (!active) return;
      if (!result.success || !result.data) {
        if (!cached) {
          setError(result.error || 'ไม่สามารถโหลดข้อมูล roster ได้');
          setIsLoading(false);
        }
        return;
      }

      const nextEmployees = result.data.employees || [];
      setEmployees(nextEmployees);
      setOverrides(result.data.overrides || []);
      setHolidays(result.data.holidays || []);
      setLeaves(result.data.leaves || []);
      setSelectedEmployeeId((prev) => (prev && nextEmployees.some((e) => e.id === prev) ? prev : nextEmployees[0]?.id || ''));
      setIsLoading(false);

      // Save to Cache
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(result.data));
      } catch (e) {
        console.warn('Failed to cache roster data:', e);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [monthKey]);

  const previousMonth = () => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const addEmployee = async () => {
    const trimmed = newEmployeeName.trim();
    if (!trimmed) return;
    const phase: 0 | 1 = employees.length % 2 === 0 ? 0 : 1;
    const result = await addRosterEmployee(trimmed, phase, '');
    if (!result.success || !result.data) {
      setError(result.error || 'เพิ่มพนักงานไม่สำเร็จ');
      return;
    }
    clearSessionCache();
    const created = result.data as Employee;
    setEmployees((prev) => [...prev, created]);
    if (!selectedEmployeeId) setSelectedEmployeeId(created.id);
    setNewEmployeeName('');
  };

  const updateEmployeeStartSaturday = async (employeeId: string, startWorkingSaturday: string) => {
    const previousEmployees = [...employees];
    // Optimistic Update
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === employeeId ? { ...emp, startWorkingSaturday } : emp,
      ),
    );
    clearSessionCache();

    const result = await updateRosterEmployeeStartSaturday(employeeId, startWorkingSaturday);
    if (!result.success) {
      setError(result.error || 'ตั้งค่าเสาร์เริ่มงานไม่สำเร็จ');
      setEmployees(previousEmployees); // Rollback
    }
  };

  const handleSaturdayStatusChange = async (dateKey: string, status: string) => {
    if (!selectedEmployee) return;
    const previousOverrides = [...overrides];

    // Optimistic Update
    setOverrides((prev) => {
      const filtered = prev.filter(
        (item) => !(item.employeeId === selectedEmployee.id && item.dateKey === dateKey),
      );
      if (status !== 'CLEAR') {
        filtered.push({ employeeId: selectedEmployee.id, dateKey, status: status as RosterCellStatus });
      }
      return filtered;
    });

    clearSessionCache();

    const result = await upsertRosterOverride(selectedEmployee.id, dateKey, status);
    if (!result.success) {
      setError(result.error || 'ปรับปรุงสถานะวันเสาร์ไม่สำเร็จ');
      setOverrides(previousOverrides); // Rollback
    }
  };

  const handleUpsertLeave = (dateKey: string, leaveType: 'sick' | 'business') => {
    setLeaveNoteInput(leaveType === 'sick' ? 'ลาป่วย 🤒' : 'ลากิจ 💼');
    setActiveLeaveDialog({ dateKey, leaveType });
  };

  const executeUpsertLeave = async (dateKey: string, type: 'sick' | 'business', noteText: string) => {
    if (!selectedEmployee) return;
    const note = noteText.trim() || (type === 'sick' ? 'ลาป่วย 🤒' : 'ลากิจ 💼');
    const previousLeaves = [...leaves];

    const tempId = `temp-${Date.now()}`;
    const newRecord: LeaveRecord = {
      id: tempId,
      employeeId: selectedEmployee.id,
      dateKey,
      leaveType: type,
      note,
    };

    // Optimistic Update
    setLeaves((prev) => {
      const filtered = prev.filter(
        (l) => !(l.employeeId === selectedEmployee.id && l.dateKey === dateKey),
      );
      return [...filtered, newRecord];
    });

    clearSessionCache();

    const result = await upsertRosterLeave(selectedEmployee.id, dateKey, type, note);
    if (!result.success) {
      setError(result.error || 'บันทึกการลาไม่สำเร็จ');
      setLeaves(previousLeaves); // Rollback
    }
  };

  const handleDeleteLeave = async (dateKey: string) => {
    if (!selectedEmployee) return;
    const previousLeaves = [...leaves];

    // Optimistic Update
    setLeaves((prev) =>
      prev.filter((l) => !(l.employeeId === selectedEmployee.id && l.dateKey === dateKey)),
    );

    clearSessionCache();

    const result = await deleteRosterLeave(selectedEmployee.id, dateKey);
    if (!result.success) {
      setError(result.error || 'ลบข้อมูลการลาไม่สำเร็จ');
      setLeaves(previousLeaves); // Rollback
    }
  };

  const handleCreateLeave = async (employeeId: string) => {
    if (!leaveDate) return;
    await handleUpsertLeave(leaveDate, leaveType);
    setLeaveDate('');
  };

  const deleteEmployee = async (employeeId: string, name: string) => {
    if (!window.confirm(`คุณต้องการลบพนักงาน "${name}" ใช่หรือไม่?`)) return;
    const result = await deleteRosterEmployee(employeeId);
    if (!result.success) {
      setError(result.error || 'ลบพนักงานไม่สำเร็จ');
      return;
    }
    setEmployees((prev) => {
      const remaining = prev.filter((e) => e.id !== employeeId);
      if (selectedEmployeeId === employeeId) {
        setSelectedEmployeeId(remaining[0]?.id || '');
      }
      return remaining;
    });
  };

  const resetMonthOverrides = async () => {
    if (!window.confirm('คุณต้องการล้างการสลับวันเสาร์ทั้งหมดในเดือนนี้ใช่หรือไม่?')) return;
    const previousOverrides = [...overrides];
    
    // Optimistic Update
    setOverrides((prev) => prev.filter((item) => !item.dateKey.startsWith(`${monthKey}-`)));

    const result = await clearRosterMonthOverrides(monthKey);
    if (!result.success) {
      setError(result.error || 'ล้างการสลับเดือนนี้ไม่สำเร็จ');
      setOverrides(previousOverrides); // Rollback
      return;
    }
  };

  const getEmployeeDayStatus = (employee: Employee, day: DayInfo): RosterCellStatus => {
    return getCellStatus(employee, day, overrideMap, workingSaturdayIndexMap);
  };

  const setSaturdayOffAnchor = async (day: DayInfo) => {
    if (!selectedEmployee || !day.isSaturday || day.isPublicHoliday) return;
    const saturdayIndex = workingSaturdayIndexMap.get(day.dateKey);
    if (saturdayIndex === undefined) return;
    const targetPhase: 0 | 1 = saturdayIndex % 2 === 0 ? 0 : 1;
    const prevPhase = selectedEmployee.phase;
    if (prevPhase === targetPhase) return;

    // Optimistic Update
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.id === selectedEmployee.id ? { ...employee, phase: targetPhase } : employee,
      ),
    );

    const result = await updateRosterEmployeePhase(selectedEmployee.id, targetPhase);
    if (!result.success) {
      setError(result.error || 'ตั้งค่าแพทเทิร์นเสาร์หยุดไม่สำเร็จ');
      // Rollback
      setEmployees((prev) =>
        prev.map((employee) =>
          employee.id === selectedEmployee.id ? { ...employee, phase: prevPhase } : employee,
        ),
      );
      return;
    }
  };

  const handleSwapSaturdayStatus = async (sourceDateKey: string, targetDateKey: string) => {
    if (!selectedEmployee || sourceDateKey === targetDateKey) return;
    const sourceDay = monthDays.find((d) => d.dateKey === sourceDateKey);
    const targetDay = monthDays.find((d) => d.dateKey === targetDateKey);
    if (!sourceDay || !targetDay || !sourceDay.isSaturday || !targetDay.isSaturday) return;
    if (sourceDay.isPublicHoliday || targetDay.isPublicHoliday) return;

    const sourceStatus = getEmployeeDayStatus(selectedEmployee, sourceDay);
    const targetStatus = getEmployeeDayStatus(selectedEmployee, targetDay);

    // Rule: Can only drag working Saturdays to swap
    if (sourceStatus !== 'WORK' && sourceStatus !== 'WORK_SWAP') {
      setError('สามารถลากย้ายสลับได้เฉพาะวันเสาร์ที่เป็นวันทำงานเท่านั้น');
      return;
    }

    // Swapping: Source working Saturday becomes OFF_SWAP, Target off Saturday becomes WORK_SWAP.
    let mappedSource: RosterCellStatus = 'OFF_SWAP';
    let mappedTarget: RosterCellStatus = 'WORK_SWAP';

    if (targetStatus === 'WORK' || targetStatus === 'WORK_SWAP') {
      // If target is also a working Saturday, we keep both as work or swap them normally.
      mappedSource = 'WORK_SWAP';
      mappedTarget = 'WORK_SWAP';
    } else if (targetStatus === 'OT2X') {
      mappedSource = 'OT2X';
      mappedTarget = 'WORK_SWAP';
    }

    const previousOverrides = [...overrides];

    // Optimistic Update
    setOverrides((prev) => {
      const filtered = prev.filter(
        (item) =>
          !(
            item.employeeId === selectedEmployee.id &&
            (item.dateKey === sourceDateKey || item.dateKey === targetDateKey)
          ),
      );
      filtered.push({ employeeId: selectedEmployee.id, dateKey: sourceDateKey, status: mappedSource });
      filtered.push({ employeeId: selectedEmployee.id, dateKey: targetDateKey, status: mappedTarget });
      return filtered;
    });

    const save = await swapRosterSaturday(
      selectedEmployee.id,
      sourceDateKey,
      targetDateKey,
      mappedSource,
      mappedTarget,
    );
    if (!save.success) {
      setError(save.error || 'สลับวันเสาร์ไม่สำเร็จ');
      setOverrides(previousOverrides); // Rollback
      return;
    }
  };

  const toggleOtOnSaturday = async (day: DayInfo) => {
    if (!selectedEmployee || !day.isSaturday || day.isPublicHoliday) return;
    const currentStatus = getEmployeeDayStatus(selectedEmployee, day);
    if (!(currentStatus === 'OFF' || currentStatus === 'OFF_SWAP')) return;

    const previousOverrides = [...overrides];

    // Optimistic Update
    setOverrides((prev) => {
      const filtered = prev.filter(
        (item) => !(item.employeeId === selectedEmployee.id && item.dateKey === day.dateKey),
      );
      filtered.push({ employeeId: selectedEmployee.id, dateKey: day.dateKey, status: 'OT2X' });
      return filtered;
    });

    const result = await upsertRosterOverride(selectedEmployee.id, day.dateKey, 'OT2X');
    if (!result.success) {
      setError(result.error || 'บันทึก OT x2 ไม่สำเร็จ');
      setOverrides(previousOverrides); // Rollback
      return;
    }
  };

  return (
    <div className="apple-shell min-h-screen overflow-y-auto">
      <div className="mx-auto flex min-h-screen w-full max-w-[1620px] flex-col px-5 py-6 md:px-8 lg:px-12">
        <header className="apple-card mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] px-5 py-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onBackToPortal}
              className="apple-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
            >
              <ArrowLeft size={15} />
              Back to Portal
            </motion.button>
            <div>
              <p className="apple-subtle text-[11px] font-semibold uppercase tracking-[0.22em]">ShiftHub Roster</p>
              <h1 className="apple-heading text-xl font-semibold">Roster Calendar (Thailand)</h1>
            </div>
          </div>
          <div className="apple-subtle text-sm">Signed in as {user?.name || 'User'}</div>
        </header>

        <section className="apple-surface-light mb-6 rounded-[28px] p-5">
          {error && (
            <div className="mb-3 rounded-xl border border-[#ffd4d4] bg-[#fff6f6] px-3.5 py-3 text-sm text-[#b42318] shadow-sm">
              <div className="font-semibold mb-1">❌ เกิดข้อผิดพลาดจากเซิร์ฟเวอร์:</div>
              <div className="break-all">{error}</div>
              {error.includes('Unknown action') && (
                <div className="mt-2 rounded-lg bg-white/70 p-2.5 text-xs text-[#5f1712] border border-[#ffd4d4]/60 space-y-1">
                  <p>💡 <strong>คำแนะนำในการแก้ไข:</strong></p>
                  <p>ระบบตรวจพบว่า Google Apps Script (Web App) ของคุณบน Google Drive ยังไม่ได้อัปเดตโค้ดเวอร์ชันล่าสุด</p>
                  <ol className="list-decimal pl-4 space-y-0.5 mt-1 font-medium">
                    <li>เปิดโครงการ Google Apps Script ของตารางเวร (Roster Calendar) ขึ้นมา</li>
                    <li>คัดลอกโค้ดทั้งหมดในไฟล์ <code>gas/gas_calendar.gs</code> จากโปรเจคนี้ไปวางแทนที่ของเดิมทั้งหมด</li>
                    <li>คลิกที่ปุ่ม <strong>Deploy (การทำให้ใช้งานได้)</strong> &rarr; เลือก <strong>Manage Deployments (จัดการการทำให้ใช้งานได้)</strong></li>
                    <li>กดไอคอน <strong>แก้ไข (รูปดินสอ)</strong> ตรงรายการ Web App</li>
                    <li>ในช่อง Version เลือกเป็น <strong>"New Version" (เวอร์ชันใหม่)</strong> แล้วกด <strong>Deploy (ทำให้ใช้งานได้)</strong> เพื่ออัปเดตระบบ</li>
                  </ol>
                </div>
              )}
            </div>
          )}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" onClick={previousMonth} className="apple-btn-secondary p-2">
                <ChevronLeft size={16} />
              </button>
              <h2 className="apple-heading min-w-[260px] text-lg font-semibold">{monthLabel}</h2>
              <button type="button" onClick={nextMonth} className="apple-btn-secondary p-2">
                <ChevronRight size={16} />
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={resetMonthOverrides}
              className="apple-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
            >
              <RotateCcw size={14} />
              ล้างการสลับเดือนนี้
            </motion.button>
          </div>

          <div className="apple-subtle text-sm">
            💡 <strong>วิธีใช้งาน:</strong> เลือกพนักงานจากรายการด้านซ้าย จากนั้นคลิกที่วันเสาร์ในปฏิทินเพื่อกำหนดวันเสาร์หยุดตั้งต้น (ระบบจะคำนวณเว้นวันเสาร์ให้พนักงานแต่ละคนโดยอัตโนมัติ และไม่นับเสาร์ที่เป็นวันหยุดนักขัตฤกษ์) หรือลากวันหยุดเพื่อสลับเสาร์ทำงาน
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="apple-surface-light flex flex-col gap-4 rounded-[24px] p-4">
            <div>
              <h3 className="apple-heading mb-3 text-sm font-semibold uppercase tracking-[0.16em]">Employees</h3>
              
              {/* ฟอร์มเพิ่มพนักงาน */}
              <div className="mb-4 space-y-3 rounded-xl border border-[#e6e6ea] bg-white p-3 shadow-sm">
                <h4 className="text-xs font-bold text-[#1d1d1f] mb-1">เพิ่มพนักงานใหม่</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    placeholder="กรอกชื่อพนักงาน..."
                    className="apple-input w-full px-3 py-2 text-sm"
                  />
                  <motion.button
                    whileHover={newEmployeeName.trim() ? { scale: 1.02 } : {}}
                    whileTap={newEmployeeName.trim() ? { scale: 0.97 } : {}}
                    type="button"
                    onClick={addEmployee}
                    disabled={!newEmployeeName.trim()}
                    className="apple-btn-primary w-full inline-flex items-center justify-center gap-2 py-2 text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} />
                    เพิ่มพนักงาน
                  </motion.button>
                </div>
              </div>

              {/* รายการพนักงาน */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {employees.map((employee) => {
                  let displaySat = '';
                  if (employee.startWorkingSaturday) {
                    const d = new Date(employee.startWorkingSaturday);
                    displaySat = `เสาร์ที่ ${d.getDate()} / ${d.getMonth() + 1}`;
                  }
                  return (
                    <div
                      key={employee.id}
                      className={`group relative flex items-center justify-between rounded-xl border p-2.5 transition-all duration-200 ${
                        selectedEmployeeId === employee.id
                          ? 'border-[var(--color-apple-blue)] bg-[#eaf3ff] text-[#0e4985]'
                          : 'border-[#e6e6ea] bg-white text-[#1d1d1f] hover:border-[#d2d2d7] hover:bg-[#fafafc]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedEmployeeId(employee.id)}
                        className="flex-1 text-left text-sm min-w-0"
                      >
                        <div className="font-semibold truncate text-[#1d1d1f] group-hover:text-[var(--color-apple-blue)] flex items-center gap-1">
                          {employee.name}
                          {!employee.startWorkingSaturday && (
                            <span className="animate-pulse text-xs text-amber-500 font-bold" title="โปรดเลือกวันเสาร์เริ่มงาน">
                              ⚠️
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#6e6e73] mt-0.5">
                          {displaySat ? `เสาร์แรกเริ่มงาน: ${displaySat}` : `Pattern ${employee.phase === 0 ? 'A' : 'B'}`}
                        </div>
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => deleteEmployee(employee.id, employee.name)}
                        className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100"
                        title="ลบพนักงาน"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="apple-surface-light rounded-[24px] p-4 md:p-5">
            {isLoading && <div className="apple-subtle mb-3 text-sm">กำลังโหลดข้อมูล roster...</div>}
            {!selectedEmployee && !isLoading && (
              <div className="apple-subtle rounded-xl border border-[#ececf1] bg-[#fafafc] px-4 py-6 text-sm">
                ยังไม่มีพนักงานในระบบ กรุณาเพิ่มชื่อก่อนเริ่มวางแผน
              </div>
            )}
            {selectedEmployee && (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#e6e6ea] shadow-sm">
                  <div className="flex flex-col">
                    <h3 className="apple-heading text-xl font-bold tracking-[-0.03em] text-[#1d1d1f]">
                      {selectedEmployee.name}
                    </h3>
                    <div className="apple-subtle text-xs mt-0.5">
                      สถิติการลาเดือนนี้:{' '}
                      {leaves.filter((leave) => leave.employeeId === selectedEmployee.id).length} วัน
                    </div>
                  </div>

                  {/* ฟอร์มด่วนบันทึกการลาป่วย/ลากิจ */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateLeave(selectedEmployee.id);
                    }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold text-[#6e6e73]">ประเภทการลา</span>
                      <select
                        value={leaveType}
                        onChange={(e) => setLeaveType(e.target.value as 'sick' | 'business')}
                        className="apple-input px-2 py-1 text-xs bg-white border border-[#d2d2d7] rounded-lg"
                      >
                        <option value="sick">ลาป่วย</option>
                        <option value="business">ลากิจ</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold text-[#6e6e73]">วันที่ต้องการลา</span>
                      <input
                        type="date"
                        value={leaveDate}
                        onChange={(e) => setLeaveDate(e.target.value)}
                        className="apple-input px-2 py-1 text-xs border border-[#d2d2d7] rounded-lg"
                        required
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      className="apple-btn-primary px-3.5 py-1.5 text-xs font-semibold rounded-xl self-end"
                    >
                      บันทึกวันลา
                    </motion.button>
                  </form>
                </div>

                {/* แถบเตือน Visual Callout หากยังไม่ระบุวันเสาร์ทำงานวันแรก */}
                {!selectedEmployee.startWorkingSaturday && (
                  <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 shadow-sm animate-pulse">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <strong>ยังไม่ได้ระบุวันเสาร์แรกที่เริ่มงาน:</strong> โปรดเลือกวันเสาร์แรกที่เข้างานของ <strong>{selectedEmployee.name}</strong> โดยคลิกที่ปุ่ม <span className="underline font-bold">"ตั้งเป็นเสาร์เริ่มงาน"</span> บนวันเสาร์ใดๆ ในปฏิทิน เพื่อให้ระบบสลับเสาร์เว้นเสาร์ตามสูตรได้ถูกต้อง
                    </div>
                  </div>
                )}

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
                        return <div key={`empty-${idx}`} className="min-h-[105px] border border-[#e2e2e8] bg-[#f3f3f6] rounded-lg opacity-40" />;
                      }

                      const status = getEmployeeDayStatus(selectedEmployee, day);
                      const leave = leaveMap.get(`${selectedEmployee.id}:${day.dateKey}`);
                      const isSaturday = day.isSaturday;
                      const isHoliday = day.isSunday || day.isPublicHoliday;
                      
                      // Premium, high-contrast visual status colors to guide the eyes
                      const statusColor =
                        leave
                          ? 'bg-rose-50 border-rose-200 text-rose-950 hover:bg-rose-100/50'
                          : status === 'HOLIDAY'
                            ? 'bg-slate-50 border-slate-200 text-slate-500'
                            : status === 'OFF' || status === 'OFF_SWAP'
                              ? 'bg-amber-50/60 border-[#fbe9cc] text-amber-900 hover:bg-amber-100/40'
                              : status === 'OT2X'
                                ? 'bg-blue-50/70 border-blue-200 text-blue-900 hover:bg-blue-100/50'
                                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950 hover:bg-emerald-100/50';

                      return (
                        <div
                          key={day.dateKey}
                          className={`relative group min-h-[105px] border border-[#d8d8de] bg-white p-2 rounded-lg transition-all duration-200 hover:shadow-md ${statusColor}`}
                          onDragOver={(e) => {
                            if (isSaturday && !day.isPublicHoliday && dragPayload) e.preventDefault();
                          }}
                          onDrop={() => {
                            if (!dragPayload || !isSaturday || day.isPublicHoliday) return;
                            handleSwapSaturdayStatus(dragPayload.sourceDateKey, day.dateKey);
                            setDragPayload(null);
                          }}
                        >
                          <div className="mb-1 flex items-start justify-between gap-1">
                            <span className="text-[11px] font-bold text-[#1d1d1f]">{day.date.getDate()}</span>
                            {day.isPublicHoliday && (
                              <span className="rounded bg-[#ffd4d4] px-1 py-0.5 text-[9px] font-medium text-[#b42318] max-w-[80%] truncate animate-pulse" title={day.holidayName || 'วันหยุด'}>
                                🇹🇭 {day.holidayName || 'วันหยุด'}
                              </span>
                            )}
                          </div>

                          {/* แสดงแถบการลาป่วย/ลากิจ ถ้ามีข้อมูลการลา */}
                          {leave ? (
                            <div className={`flex items-center justify-between gap-1 rounded px-1.5 py-1 text-[10.5px] font-bold border transition-all mt-1 ${
                              leave.leaveType === 'sick'
                                ? 'bg-rose-100 border-rose-200 text-rose-800'
                                : 'bg-amber-100 border-amber-200 text-amber-800'
                            }`}>
                              <span className="truncate">{leave.leaveType === 'sick' ? '🤒 ลาป่วย' : '💼 ลากิจ'}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteLeave(day.dateKey)}
                                className="text-red-500 hover:text-red-800 font-bold ml-1 text-sm px-1.5 rounded hover:bg-red-50 transition-colors"
                                title="ลบวันลา"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* กรณีเป็นวันเสาร์ปกติ และไม่ใช่เทศกาลหยุด */}
                              {isSaturday && !day.isPublicHoliday && (
                                <div className="space-y-1 mt-1">
                                  {!selectedEmployee.startWorkingSaturday ? (
                                    <motion.button
                                      whileHover={{ scale: 1.04 }}
                                      whileTap={{ scale: 0.96 }}
                                      type="button"
                                      onClick={() => updateEmployeeStartSaturday(selectedEmployee.id, day.dateKey)}
                                      className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 px-2 py-1.5 text-[9px] font-bold text-white shadow-sm transition-all animate-pulse"
                                    >
                                      ✨ ตั้งเป็นเสาร์เริ่มงาน
                                    </motion.button>
                                  ) : (
                                    <>
                                      {status === 'WORK' || status === 'WORK_SWAP' ? (
                                        <div
                                          draggable
                                          onDragStart={() => {
                                            setDragPayload({ sourceDateKey: day.dateKey });
                                          }}
                                          onDragEnd={() => setDragPayload(null)}
                                          className="rounded border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-800 text-center transition-all select-none shadow-sm cursor-grab active:cursor-grabbing hover:bg-emerald-100"
                                        >
                                          {getStatusLabel(status)} ✊ (ลากสลับ)
                                        </div>
                                      ) : (
                                        <div className="group/notallowed relative cursor-not-allowed">
                                          <div className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-800 text-center select-none shadow-sm opacity-80">
                                            {getStatusLabel(status)} 🚫
                                          </div>
                                          
                                          {/* Tooltip เตือนลอยสีแดง */}
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/notallowed:block bg-rose-600 text-white text-[9.5px] py-1 px-2.5 rounded-lg shadow-md whitespace-nowrap z-50 animate-fade-in border border-rose-500 font-semibold pointer-events-none">
                                            🚫 เฉพาะวันเสาร์ที่ทำงานตามสูตรเท่านั้นที่สามารถลากสลับได้
                                          </div>
                                        </div>
                                      )}
                                      
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={() => updateEmployeeStartSaturday(selectedEmployee.id, day.dateKey)}
                                        className="w-full text-center block text-[8.5px] text-slate-500 hover:text-slate-800 hover:underline py-0.5"
                                        title="ย้ายจุดคำนวณวันเสาร์แรกมาที่วันนี้"
                                      >
                                        ย้ายจุดเริ่มงานมาเสาร์นี้
                                      </motion.button>

                                      {/* ปุ่มเปิด Saturday Status Editor */}
                                      <div className="relative mt-1">
                                        <motion.button
                                          whileHover={{ scale: 1.02 }}
                                          whileTap={{ scale: 0.98 }}
                                          type="button"
                                          onClick={() => setActiveSaturdayEdit(activeSaturdayEdit === day.dateKey ? null : day.dateKey)}
                                          className="w-full text-slate-400 hover:text-slate-700 text-[10px] flex items-center justify-center gap-1 py-0.5 rounded hover:bg-slate-100 transition-colors border border-slate-200"
                                          title="ปรับปรุงสถานะวันเสาร์โดยตรง"
                                        >
                                          ⚙️ ปรับปรุงสถานะ
                                        </motion.button>
                                        
                                        {activeSaturdayEdit === day.dateKey && (
                                          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-40 bg-white border border-[#d2d2d7] rounded-xl shadow-lg p-1.5 min-w-[130px] text-xs space-y-1">
                                            <p className="text-[9px] font-bold text-[#6e6e73] text-center border-b pb-1">ปรับสถานะวันนี้</p>
                                            <motion.button
                                              whileHover={{ x: 3, backgroundColor: '#f0fdf4' }}
                                              whileTap={{ scale: 0.97 }}
                                              type="button"
                                              onClick={() => {
                                                handleSaturdayStatusChange(day.dateKey, 'WORK');
                                                setActiveSaturdayEdit(null);
                                              }}
                                              className="w-full text-left px-2 py-1 text-emerald-800 rounded font-semibold transition-all"
                                            >
                                              ทำงาน (WORK)
                                            </motion.button>
                                            <motion.button
                                              whileHover={{ x: 3, backgroundColor: '#fffbeb' }}
                                              whileTap={{ scale: 0.97 }}
                                              type="button"
                                              onClick={() => {
                                                handleSaturdayStatusChange(day.dateKey, 'OFF');
                                                setActiveSaturdayEdit(null);
                                              }}
                                              className="w-full text-left px-2 py-1 text-amber-800 rounded font-semibold transition-all"
                                            >
                                              วันหยุด (OFF)
                                            </motion.button>
                                            <motion.button
                                              whileHover={{ x: 3, backgroundColor: '#eff6ff' }}
                                              whileTap={{ scale: 0.97 }}
                                              type="button"
                                              onClick={() => {
                                                handleSaturdayStatusChange(day.dateKey, 'OT2X');
                                                setActiveSaturdayEdit(null);
                                              }}
                                              className="w-full text-left px-2 py-1 text-blue-800 rounded font-semibold transition-all"
                                            >
                                              OT x2
                                            </motion.button>
                                            <motion.button
                                              whileHover={{ x: 3, backgroundColor: '#f8fafc' }}
                                              whileTap={{ scale: 0.97 }}
                                              type="button"
                                              onClick={() => {
                                                handleSaturdayStatusChange(day.dateKey, 'CLEAR');
                                                setActiveSaturdayEdit(null);
                                              }}
                                              className="w-full text-left px-2 py-1 text-slate-700 border-t pt-1 rounded font-medium transition-all"
                                            >
                                              ล้างค่าเป็นสูตรปกติ
                                            </motion.button>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* แสดงสถานะสำหรับวันอื่นๆ ที่ไม่ใช่วันเสาร์ */}
                              {!isSaturday && (
                                <div className="text-[10px] text-[#6e6e73] mt-1 space-y-1">
                                  {isHoliday ? (
                                    <span className="opacity-75 font-semibold text-slate-500">{day.holidayName || 'วันอาทิตย์'}</span>
                                  ) : (
                                    <span className="opacity-50 text-emerald-700 font-semibold">ทำงานปกติ</span>
                                  )}
                                </div>
                              )}

                              {/* ปุ่มลาป่วย/ลากิจด่วนเมื่อ hover (ใช้ได้ทุกวันที่ต้องทำงาน หรือเป็นวันเสาร์ทำงาน) */}
                              {!isHoliday && (status === 'WORK' || status === 'WORK_SWAP' || !isSaturday) && (
                                <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={() => handleUpsertLeave(day.dateKey, 'sick')}
                                    className="rounded bg-rose-50 border border-rose-200 px-1 py-0.5 text-[9px] font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                                    title="ลาป่วย"
                                  >
                                    🤒 ลาป่วย
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={() => handleUpsertLeave(day.dateKey, 'business')}
                                    className="rounded bg-amber-50 border border-amber-200 px-1 py-0.5 text-[9px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                                    title="ลากิจ"
                                  >
                                    💼 ลากิจ
                                  </motion.button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
      {/* Leave Note Dialog / Popover */}
      {activeLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-[#d2d2d7] space-y-4 animate-scale-up">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#1d1d1f]">
                {activeLeaveDialog.leaveType === 'sick' ? '🤒 ระบุหมายเหตุลาป่วย' : '💼 ระบุหมายเหตุลากิจ'}
              </h3>
              <p className="text-xs text-[#6e6e73]">
                วันที่ {activeLeaveDialog.dateKey}
              </p>
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="leave-note-input" className="block text-xs font-semibold text-[#1d1d1f]">
                หมายเหตุการลา (ระบุสั้นๆ)
              </label>
              <input
                id="leave-note-input"
                type="text"
                value={leaveNoteInput}
                onChange={(e) => setLeaveNoteInput(e.target.value)}
                placeholder="เช่น ไปโรงพยาบาล, ติดธุระครอบครัว"
                className="w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-apple-blue)] focus:ring-1 focus:ring-[var(--color-apple-blue)] transition-all bg-[#f5f5f7]"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setActiveLeaveDialog(null)}
                className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
              >
                ยกเลิก
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={async () => {
                  await executeUpsertLeave(activeLeaveDialog.dateKey, activeLeaveDialog.leaveType, leaveNoteInput);
                  setActiveLeaveDialog(null);
                }}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors ${
                  activeLeaveDialog.leaveType === 'sick'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                บันทึกการลา
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
