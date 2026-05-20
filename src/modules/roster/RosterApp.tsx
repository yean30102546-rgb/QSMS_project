import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import {
  buildOverrideMap,
  buildWorkingSaturdayIndexMap,
  getCellStatus,
  getMonthDays,
  getThaiMonthLabel,
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

// Sub-components
import { RosterHeader } from './components/RosterHeader';
import { RosterControls } from './components/RosterControls';
import { RosterSidebar } from './components/RosterSidebar';
import { RosterSummary } from './components/RosterSummary';
import { RosterEmployeeHeader } from './components/RosterEmployeeHeader';
import { RosterCalendar } from './components/RosterCalendar';
import { RosterDialogs } from './components/RosterDialogs';

interface RosterAppProps {
  user: User | null;
  onBackToPortal: () => void;
}

type DragPayload = {
  sourceDateKey: string;
};

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
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'summary' | 'calendar'>('summary');
  const [activeLeaveDialog, setActiveLeaveDialog] = useState<{
    dateKey: string;
    leaveType: 'sick' | 'business';
  } | null>(null);
  const [leaveNoteInput, setLeaveNoteInput] = useState('');

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

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(result.data));
      } catch (e) {
        console.warn('Failed to cache roster data:', e);
      }
    };
    load();
    return () => { active = false; };
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
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === employeeId ? { ...emp, startWorkingSaturday } : emp))
    );
    clearSessionCache();
    const result = await updateRosterEmployeeStartSaturday(employeeId, startWorkingSaturday);
    if (!result.success) {
      setError(result.error || 'ตั้งค่าเสาร์เริ่มงานไม่สำเร็จ');
      setEmployees(previousEmployees);
    }
  };

  const handleSaturdayStatusChange = async (dateKey: string, status: string) => {
    if (!selectedEmployee) return;
    const previousOverrides = [...overrides];
    setOverrides((prev) => {
      const filtered = prev.filter(
        (item) => !(item.employeeId === selectedEmployee.id && item.dateKey === dateKey)
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
      setOverrides(previousOverrides);
    }
  };

  const handleUpsertLeave = (dateKey: string, leaveType: 'sick' | 'business') => {
    setLeaveNoteInput(leaveType === 'sick' ? 'ลาป่วย 🤒' : 'ลากิจ 💼');
    setActiveLeaveDialog({ dateKey, leaveType });
  };

  const executeUpsertLeave = async () => {
    if (!selectedEmployee || !activeLeaveDialog) return;
    const { dateKey, leaveType: type } = activeLeaveDialog;
    const note = leaveNoteInput.trim() || (type === 'sick' ? 'ลาป่วย 🤒' : 'ลากิจ 💼');
    const previousLeaves = [...leaves];
    const newRecord: LeaveRecord = {
      id: `temp-${Date.now()}`,
      employeeId: selectedEmployee.id,
      dateKey,
      leaveType: type,
      note,
    };
    setLeaves((prev) => {
      const filtered = prev.filter(
        (l) => !(l.employeeId === selectedEmployee.id && l.dateKey === dateKey)
      );
      return [...filtered, newRecord];
    });
    clearSessionCache();
    const result = await upsertRosterLeave(selectedEmployee.id, dateKey, type, note);
    if (!result.success) {
      setError(result.error || 'บันทึกการลาไม่สำเร็จ');
      setLeaves(previousLeaves);
    }
    setActiveLeaveDialog(null);
  };

  const handleDeleteLeave = async (dateKey: string) => {
    if (!selectedEmployee) return;
    const previousLeaves = [...leaves];
    setLeaves((prev) =>
      prev.filter((l) => !(l.employeeId === selectedEmployee.id && l.dateKey === dateKey))
    );
    clearSessionCache();
    const result = await deleteRosterLeave(selectedEmployee.id, dateKey);
    if (!result.success) {
      setError(result.error || 'ลบข้อมูลการลาไม่สำเร็จ');
      setLeaves(previousLeaves);
    }
  };

  const handleCreateLeave = async () => {
    if (!leaveDate) return;
    handleUpsertLeave(leaveDate, leaveType);
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
    clearSessionCache();
  };

  const resetMonthOverrides = async () => {
    if (!window.confirm('คุณต้องการล้างการสลับวันเสาร์ทั้งหมดในเดือนนี้ใช่หรือไม่?')) return;
    const previousOverrides = [...overrides];
    setOverrides((prev) => prev.filter((item) => !item.dateKey.startsWith(`${monthKey}-`)));
    clearSessionCache();
    const result = await clearRosterMonthOverrides(monthKey);
    if (!result.success) {
      setError(result.error || 'ล้างการสลับเดือนนี้ไม่สำเร็จ');
      setOverrides(previousOverrides);
    }
  };

  const getEmployeeDayStatus = (employee: Employee, day: DayInfo): RosterCellStatus => {
    return getCellStatus(employee, day, overrideMap, workingSaturdayIndexMap);
  };

  const handleSwapSaturdayStatus = async (sourceDateKey: string, targetDateKey: string) => {
    if (!selectedEmployee || sourceDateKey === targetDateKey) return;
    const sourceDay = monthDays.find((d) => d.dateKey === sourceDateKey);
    const targetDay = monthDays.find((d) => d.dateKey === targetDateKey);
    if (!sourceDay || !targetDay || !sourceDay.isSaturday || !targetDay.isSaturday) return;
    if (sourceDay.isPublicHoliday || targetDay.isPublicHoliday) return;

    const sourceStatus = getEmployeeDayStatus(selectedEmployee, sourceDay);
    const targetStatus = getEmployeeDayStatus(selectedEmployee, targetDay);

    // If both are already working days, a swap changes nothing, so we just return silently.
    if (
      (sourceStatus === 'WORK' || sourceStatus === 'WORK_SWAP') &&
      (targetStatus === 'WORK' || targetStatus === 'WORK_SWAP')
    ) {
      return;
    }

    if (sourceStatus !== 'WORK' && sourceStatus !== 'WORK_SWAP') {
      setError('สามารถลากย้ายสลับได้เฉพาะวันเสาร์ที่เป็นวันทำงานเท่านั้น');
      return;
    }

    let mappedSource: RosterCellStatus | 'CLEAR' = 'OFF_SWAP';
    let mappedTarget: RosterCellStatus | 'CLEAR' = 'WORK_SWAP';

    if (sourceStatus === 'WORK_SWAP' && targetStatus === 'OFF_SWAP') {
      mappedSource = 'CLEAR';
      mappedTarget = 'CLEAR';
    } else if (targetStatus === 'WORK' || targetStatus === 'WORK_SWAP') {
      mappedSource = 'WORK_SWAP';
      mappedTarget = 'WORK_SWAP';
    } else if (targetStatus === 'OT2X') {
      mappedSource = 'OT2X';
      mappedTarget = 'WORK_SWAP';
    }

    const previousOverrides = [...overrides];
    setOverrides((prev) => {
      const filtered = prev.filter(
        (item) => !(item.employeeId === selectedEmployee.id && (item.dateKey === sourceDateKey || item.dateKey === targetDateKey))
      );
      if (mappedSource !== 'CLEAR') filtered.push({ employeeId: selectedEmployee.id, dateKey: sourceDateKey, status: mappedSource });
      if (mappedTarget !== 'CLEAR') filtered.push({ employeeId: selectedEmployee.id, dateKey: targetDateKey, status: mappedTarget });
      return filtered;
    });
    clearSessionCache();

    const save = await swapRosterSaturday(selectedEmployee.id, sourceDateKey, targetDateKey, mappedSource, mappedTarget);
    if (!save.success) {
      setError(save.error || 'สลับวันเสาร์ไม่สำเร็จ');
      setOverrides(previousOverrides);
    }
  };

  const navigateToEmployeeCalendar = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setActiveTab('calendar');
  };

  const saturdaysInMonth = useMemo(() => monthDays.filter((d) => d.isSaturday && !d.isPublicHoliday), [monthDays]);
  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-[#111111] font-sans">
      <div className="mx-auto max-w-[1440px] px-5 py-6 md:px-8 lg:px-10">
        <RosterHeader user={user} onBackToPortal={onBackToPortal} />

        {error && (
          <div className="mb-6 rounded-xl border border-[#ffd4d4] bg-[#fff6f6] px-3.5 py-3 text-sm text-[#b42318] shadow-sm">
            <div className="font-semibold mb-1 font-thai">❌ เกิดข้อผิดพลาดจากเซิร์ฟเวอร์:</div>
            <div className="break-all font-thai">{error}</div>
            {error.includes('Unknown action') && (
              <div className="mt-2 rounded-lg bg-white/70 p-2.5 text-xs text-[#5f1712] border border-[#ffd4d4]/60 space-y-1 font-thai">
                <p>💡 <strong>คำแนะนำในการแก้ไข:</strong></p>
                <p>ระบบตรวจพบว่า Google Apps Script ยังไม่ได้อัปเดต...</p>
              </div>
            )}
          </div>
        )}

        <RosterControls
          monthLabel={monthLabel}
          onPreviousMonth={previousMonth}
          onNextMonth={nextMonth}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onResetOverrides={resetMonthOverrides}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={monthKey}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="grid gap-5 lg:grid-cols-[240px_1fr]"
          >
            <RosterSidebar
              employees={employees}
              selectedEmployeeId={selectedEmployeeId}
              onSelectEmployee={(id) => {
                setSelectedEmployeeId(id);
                setActiveTab('calendar');
              }}
              onDeleteEmployee={deleteEmployee}
              newEmployeeName={newEmployeeName}
              setNewEmployeeName={setNewEmployeeName}
              onAddEmployee={addEmployee}
            />

            <div className="flex flex-col gap-4">
              {isLoading && <div className="text-sm text-[#71717a] font-medium font-thai">กำลังโหลดข้อมูล...</div>}
              {!isLoading && employees.length === 0 && (
                <div className="border border-[#e4e4e7] rounded-2xl bg-[#fafafa] p-8 text-center text-sm text-[#71717a] font-thai">
                  ยังไม่มีพนักงานในระบบ กรุณาเพิ่มพนักงานที่แถบเมนูด้านซ้ายก่อน
                </div>
              )}

              {!isLoading && employees.length > 0 && activeTab === 'summary' && (
                <RosterSummary
                  employees={employees}
                  saturdaysInMonth={saturdaysInMonth}
                  leaveMap={leaveMap}
                  onNavigateToEmployee={navigateToEmployeeCalendar}
                  getEmployeeDayStatus={getEmployeeDayStatus}
                />
              )}

              {!isLoading && employees.length > 0 && activeTab === 'calendar' && selectedEmployee && (
                <div className="flex flex-col gap-4">
                  <RosterEmployeeHeader
                    selectedEmployee={selectedEmployee}
                    leaves={leaves}
                    leaveType={leaveType}
                    setLeaveType={setLeaveType}
                    leaveDate={leaveDate}
                    setLeaveDate={setLeaveDate}
                    onCreateLeave={handleCreateLeave}
                  />

                  {!selectedEmployee.startWorkingSaturday && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 shadow-sm font-thai">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <strong>ยังไม่ได้ระบุวันเสาร์แรกที่เริ่มงาน:</strong> โปรดเลือกวันเสาร์แรกที่เข้างานของ <strong>{selectedEmployee.name}</strong>...
                      </div>
                    </div>
                  )}

                  <RosterCalendar
                    selectedEmployee={selectedEmployee}
                    calendarCells={calendarCells}
                    leaveMap={leaveMap}
                    todayKey={todayKey}
                    getEmployeeDayStatus={getEmployeeDayStatus}
                    dragPayload={dragPayload}
                    dragOverDateKey={dragOverDateKey}
                    onDragStart={(dateKey) => setDragPayload({ sourceDateKey: dateKey })}
                    onDragOver={setDragOverDateKey}
                    onDragEnd={() => setDragPayload(null)}
                    onDrop={(targetDateKey) => dragPayload && handleSwapSaturdayStatus(dragPayload.sourceDateKey, targetDateKey)}
                    onUpsertLeave={handleUpsertLeave}
                    onDeleteLeave={handleDeleteLeave}
                    onSaturdayStatusChange={handleSaturdayStatusChange}
                    onSetStartSaturday={(dateKey) => updateEmployeeStartSaturday(selectedEmployee.id, dateKey)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <RosterDialogs
        activeLeaveDialog={activeLeaveDialog}
        onCloseLeaveDialog={() => setActiveLeaveDialog(null)}
        leaveNoteInput={leaveNoteInput}
        setLeaveNoteInput={setLeaveNoteInput}
        onConfirmLeave={executeUpsertLeave}
      />
    </div>
  );
}
