'use client';

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
import { User } from '../../services/auth';
import { useNotification } from '../../contexts/NotificationContext';
import { useSaveProgress } from '../../hooks/useSaveProgress';
import {
  addRosterEmployee,
  clearRosterMonthOverrides,
  deleteRosterEmployee,
  fetchRosterMonth,
  updateRosterEmployeeStartSaturday,
  upsertRosterLeave,
  deleteRosterLeave,
  upsertRosterOverride,
} from '../../services/rosterApi';

// Sub-components
import { RosterHeader } from './components/RosterHeader';
import { RosterControls } from './components/RosterControls';
import { RosterDialogs } from './components/RosterDialogs';
import { RosterMatrix } from './components/RosterMatrix';
import { RosterEmployeeDrawer } from './components/RosterEmployeeDrawer';

interface RosterAppProps {
  user: User | null;
  onBackToPortal: () => void;
}

export function RosterApp({ user, onBackToPortal }: RosterAppProps) {
  const { showConfirm } = useNotification();
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIdForDrawer, setSelectedEmployeeIdForDrawer] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<RosterOverride[]>([]);
  const [holidays, setHolidays] = useState<Array<{ dateKey: string; name: string }>>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog States
  const [activeLeaveDialog, setActiveLeaveDialog] = useState<{
    employeeId: string;
    dateKey: string;
    leaveType: 'sick' | 'business' | 'vacation';
  } | null>(null);
  const [leaveNoteInput, setLeaveNoteInput] = useState('');
  const [deleteConfirmation, setDeleteEmployeeConfirm] = useState<{ id: string; name: string } | null>(null);

  const { isSaving, progress, statusText, isComplete, startSaving, finishSaving, failSaving } = useSaveProgress();

  const monthKey = useMemo(
    () => `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
    [monthDate],
  );

  const monthDays = useMemo(() => getMonthDays(monthDate, holidays), [monthDate, holidays]);
  const workingSaturdayIndexMap = useMemo(() => buildWorkingSaturdayIndexMap(monthDays), [monthDays]);
  const overrideMap = useMemo(() => buildOverrideMap(overrides), [overrides]);
  const monthLabel = useMemo(() => getThaiMonthLabel(monthDate), [monthDate]);
  
  const selectedEmployeeForDrawer = useMemo(
    () => employees.find((employee) => employee.id === selectedEmployeeIdForDrawer) || null,
    [employees, selectedEmployeeIdForDrawer],
  );

  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const leaveMap = useMemo(() => {
    const map = new Map<string, LeaveRecord>();
    for (const leave of leaves) {
      map.set(`${leave.employeeId}:${leave.dateKey}`, leave);
    }
    return map;
  }, [leaves]);

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

  const addEmployee = async (name: string) => {
    const trimmed = name.trim();
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

  const handleSaturdayStatusChange = async (employeeId: string, dateKey: string, status: string) => {
    const previousOverrides = [...overrides];
    setOverrides((prev) => {
      const filtered = prev.filter(
        (item) => !(item.employeeId === employeeId && item.dateKey === dateKey)
      );
      if (status !== 'CLEAR') {
        filtered.push({ employeeId, dateKey, status: status as RosterCellStatus });
      }
      return filtered;
    });
    clearSessionCache();
    const result = await upsertRosterOverride(employeeId, dateKey, status);
    if (!result.success) {
      setError(result.error || 'ปรับปรุงสถานะวันเสาร์ไม่สำเร็จ');
      setOverrides(previousOverrides);
    }
  };

  const handleUpsertLeave = (employeeId: string, dateKey: string, leaveType: 'sick' | 'business' | 'vacation') => {
    setLeaveNoteInput(
      leaveType === 'sick' ? 'ลาป่วย 🤒' : leaveType === 'business' ? 'ลากิจ 💼' : 'ลาพักร้อน 🏖️',
    );
    setActiveLeaveDialog({ employeeId, dateKey, leaveType });
  };

  const executeUpsertLeave = async () => {
    if (!activeLeaveDialog) return;
    startSaving();
    const { employeeId, dateKey, leaveType: type } = activeLeaveDialog;
    const note =
      leaveNoteInput.trim() ||
      (type === 'sick' ? 'ลาป่วย 🤒' : type === 'business' ? 'ลากิจ 💼' : 'ลาพักร้อน 🏖️');
    
    const previousLeaves = [...leaves];
    const newRecord: LeaveRecord = {
      id: `temp-${Date.now()}`,
      employeeId,
      dateKey,
      leaveType: type,
      note,
    };
    
    setLeaves((prev) => {
      const filtered = prev.filter(
        (l) => !(l.employeeId === employeeId && l.dateKey === dateKey)
      );
      return [...filtered, newRecord];
    });
    clearSessionCache();

    try {
      const result = await upsertRosterLeave(employeeId, dateKey, type, note);
      if (!result.success) {
        failSaving();
        setError(result.error || 'บันทึกการลาไม่สำเร็จ');
        setLeaves(previousLeaves);
      } else {
        finishSaving(() => setActiveLeaveDialog(null));
      }
    } catch (e) {
      failSaving();
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setLeaves(previousLeaves);
    }
  };

  const handleDeleteLeave = async (employeeId: string, dateKey: string) => {
    const previousLeaves = [...leaves];
    setLeaves((prev) =>
      prev.filter((l) => !(l.employeeId === employeeId && l.dateKey === dateKey))
    );
    clearSessionCache();
    const result = await deleteRosterLeave(employeeId, dateKey);
    if (!result.success) {
      setError(result.error || 'ลบข้อมูลการลาไม่สำเร็จ');
      setLeaves(previousLeaves);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    setIsLoading(true);
    const result = await deleteRosterEmployee(employeeId);
    if (!result.success) {
      setError(result.error || 'ลบพนักงานไม่สำเร็จ');
      setIsLoading(false);
      return;
    }
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    clearSessionCache();
    setIsLoading(false);
  };

  const resetMonthOverrides = async () => {
    showConfirm('คุณต้องการล้างการสลับวันเสาร์ทั้งหมดในเดือนนี้ใช่หรือไม่?', async () => {
      const previousOverrides = [...overrides];
      setOverrides((prev) => prev.filter((item) => !item.dateKey.startsWith(`${monthKey}-`)));
      clearSessionCache();
      const result = await clearRosterMonthOverrides(monthKey);
      if (!result.success) {
        setError(result.error || 'ล้างการสลับเดือนนี้ไม่สำเร็จ');
        setOverrides(previousOverrides);
      }
    });
  };

  const getEmployeeDayStatus = (employee: Employee, day: DayInfo): RosterCellStatus => {
    return getCellStatus(employee, day, overrideMap, workingSaturdayIndexMap);
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-[#111111] font-sans">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <RosterHeader user={user} onBackToPortal={onBackToPortal} />

        {error && (
          <div className="mb-6 rounded-xl border border-[#ffd4d4] bg-[#fff6f6] px-4 py-3 text-sm text-[#b42318] shadow-sm flex items-center justify-between">
            <div className="flex gap-2">
              <span className="font-semibold">❌ ข้อผิดพลาด:</span>
              <span className="break-all">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 p-1 font-bold rounded-md hover:bg-rose-100 transition-colors">
              ✕
            </button>
          </div>
        )}

        <div className="mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <RosterControls
            monthLabel={monthLabel}
            onPreviousMonth={previousMonth}
            onNextMonth={nextMonth}
            activeTab={'matrix'}
            onTabChange={() => {}} // Disabled as we use Unified view
            onResetOverrides={resetMonthOverrides}
            onAddEmployee={addEmployee}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={monthKey}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {isLoading ? (
              <div className="flex justify-center py-20 text-sm font-medium text-slate-500">
                <span className="animate-pulse">กำลังโหลดข้อมูล...</span>
              </div>
            ) : (
              <RosterMatrix
                employees={employees}
                monthDays={monthDays}
                leaveMap={leaveMap}
                todayKey={todayKey}
                getEmployeeDayStatus={getEmployeeDayStatus}
                onNavigateToEmployee={(id) => setSelectedEmployeeIdForDrawer(id)}
                onSetStartSaturday={updateEmployeeStartSaturday}
                onSaturdayStatusChange={handleSaturdayStatusChange}
                onUpsertLeave={handleUpsertLeave}
                onDeleteLeave={handleDeleteLeave}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <RosterEmployeeDrawer
        employee={selectedEmployeeForDrawer}
        isOpen={!!selectedEmployeeIdForDrawer}
        onClose={() => setSelectedEmployeeIdForDrawer(null)}
        onDelete={handleDeleteEmployee}
      />

      <RosterDialogs
        activeLeaveDialog={activeLeaveDialog as any}
        onCloseLeaveDialog={() => setActiveLeaveDialog(null)}
        leaveNoteInput={leaveNoteInput}
        setLeaveNoteInput={setLeaveNoteInput}
        onConfirmLeave={executeUpsertLeave}
        isSavingProgress={isSaving}
        progress={progress}
        statusText={statusText}
        isComplete={isComplete}
        deleteConfirmation={deleteConfirmation}
        onCloseDeleteDialog={() => setDeleteEmployeeConfirm(null)}
        onConfirmDelete={async () => {}} // Not used here, handled in Drawer
      />
    </div>
  );
}
