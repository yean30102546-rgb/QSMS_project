import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  // Tab state: 'summary' หรือ 'calendar'
  const [activeTab, setActiveTab] = useState<'summary' | 'calendar'>('summary');

  // Popover state: เก็บ dateKey ของ cell ที่ถูกคลิก (null = ปิด)
  const [activePopover, setActivePopover] = useState<string | null>(null);

  // Drag visual feedback
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);

  // New States for Dialogs & Popovers
  const [activeLeaveDialog, setActiveLeaveDialog] = useState<{ dateKey: string; leaveType: 'sick' | 'business' } | null>(null);
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
    clearSessionCache();
  };

  const resetMonthOverrides = async () => {
    if (!window.confirm('คุณต้องการล้างการสลับวันเสาร์ทั้งหมดในเดือนนี้ใช่หรือไม่?')) return;
    const previousOverrides = [...overrides];
    
    // Optimistic Update
    setOverrides((prev) => prev.filter((item) => !item.dateKey.startsWith(`${monthKey}-`)));
    clearSessionCache();

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
    clearSessionCache();

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
    let mappedSource: RosterCellStatus | 'CLEAR' = 'OFF_SWAP';
    let mappedTarget: RosterCellStatus | 'CLEAR' = 'WORK_SWAP';

    if (sourceStatus === 'WORK_SWAP' && targetStatus === 'OFF_SWAP') {
      mappedSource = 'CLEAR';
      mappedTarget = 'CLEAR';
    } else if (targetStatus === 'WORK' || targetStatus === 'WORK_SWAP') {
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
      if (mappedSource !== 'CLEAR') {
        filtered.push({ employeeId: selectedEmployee.id, dateKey: sourceDateKey, status: mappedSource });
      }
      if (mappedTarget !== 'CLEAR') {
        filtered.push({ employeeId: selectedEmployee.id, dateKey: targetDateKey, status: mappedTarget });
      }
      return filtered;
    });
    clearSessionCache();

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

  const navigateToEmployeeCalendar = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setActiveTab('calendar');
  };

  // helper: สร้างลิสต์วันเสาร์ทั้งหมดในเดือน (สำหรับ Summary Table)
  const saturdaysInMonth = useMemo(
    () => monthDays.filter((d) => d.isSaturday && !d.isPublicHoliday),
    [monthDays],
  );

  // helper: เช็คว่าเป็นวันนี้หรือไม่
  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // helper: ปิด Popover เมื่อคลิกข้างนอก
  useEffect(() => {
    if (!activePopover) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-popover-id="${activePopover}"]`)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activePopover]);

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-[#111111] font-sans">
      <div className="mx-auto max-w-[1440px] px-5 py-6 md:px-8 lg:px-10">

        {/* ===== HEADER ===== */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e4e7] pb-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onBackToPortal}
              className="border border-[#e4e4e7] bg-white hover:bg-[#fafafa] rounded-lg px-4 py-2 text-sm font-medium text-[#3f3f46] transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft size={15} />
              กลับพอร์ทัล
            </motion.button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a1a1aa]">ตารางเวร</p>
              <h1 className="text-xl font-bold text-[#18181b]">ShiftHub Roster</h1>
            </div>
          </div>
          <div className="text-sm text-[#71717a] font-medium">ลงชื่อเข้าใช้: {user?.name || 'User'}</div>
        </header>

        {/* ===== ERROR BANNER ===== */}
        {error && (
          <div className="mb-6 rounded-xl border border-[#ffd4d4] bg-[#fff6f6] px-3.5 py-3 text-sm text-[#b42318] shadow-sm">
            <div className="font-semibold mb-1 font-thai">❌ เกิดข้อผิดพลาดจากเซิร์ฟเวอร์:</div>
            <div className="break-all font-thai">{error}</div>
            {error.includes('Unknown action') && (
              <div className="mt-2 rounded-lg bg-white/70 p-2.5 text-xs text-[#5f1712] border border-[#ffd4d4]/60 space-y-1 font-thai">
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

        {/* ===== MONTH NAVIGATION + TAB SWITCHER ===== */}
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white border border-[#e4e4e7] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={previousMonth}
              className="border border-[#e4e4e7] bg-white hover:bg-[#fafafa] rounded-lg p-2 text-[#3f3f46] transition-colors"
            >
              <ChevronLeft size={16} />
            </motion.button>
            <h2 className="min-w-[200px] text-center text-base font-bold text-[#18181b]">{monthLabel}</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={nextMonth}
              className="border border-[#e4e4e7] bg-white hover:bg-[#fafafa] rounded-lg p-2 text-[#3f3f46] transition-colors"
            >
              <ChevronRight size={16} />
            </motion.button>
          </div>

          <div className="flex items-center gap-3">
            <div className="roster-tab-bar">
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`roster-tab ${activeTab === 'summary' ? 'active' : ''}`}
              >
                📊 ภาพรวม
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`roster-tab ${activeTab === 'calendar' ? 'active' : ''}`}
              >
                📅 ปฏิทิน
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={resetMonthOverrides}
              className="border border-[#e4e4e7] bg-white hover:bg-[#fafafa] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#3f3f46] transition-colors inline-flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              ล้างการสลับ
            </motion.button>
          </div>
        </section>

        {/* ===== MAIN CONTENT WITH TRANSITION ===== */}
        <AnimatePresence mode="wait">
          <motion.div
            key={monthKey}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="grid gap-5 lg:grid-cols-[240px_1fr]"
          >
            {/* --- SIDEBAR --- */}
            <aside className="bg-white border border-[#e4e4e7] rounded-2xl p-3 flex flex-col gap-4 shadow-sm h-fit">
              <div>
                <h3 className="text-xs uppercase tracking-wide text-[#a1a1aa] font-semibold mb-3">พนักงาน</h3>
                
                {/* รายการพนักงาน */}
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
                        onClick={() => setSelectedEmployeeId(employee.id)}
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
                            deleteEmployee(employee.id, employee.name);
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

                {/* ฟอร์มเพิ่มพนักงาน */}
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
                    onClick={addEmployee}
                    disabled={!newEmployeeName.trim()}
                    className="bg-[#18181b] text-white rounded-lg text-xs py-1.5 font-semibold hover:bg-black transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1"
                  >
                    <Plus size={13} />
                    เพิ่มพนักงาน
                  </motion.button>
                </div>
              </div>
            </aside>

            {/* --- CONTENT AREA --- */}
            <div className="flex flex-col gap-4">
              {isLoading && <div className="text-sm text-[#71717a] font-medium font-thai">กำลังโหลดข้อมูล...</div>}
              
              {!isLoading && employees.length === 0 && (
                <div className="border border-[#e4e4e7] rounded-2xl bg-[#fafafa] p-8 text-center text-sm text-[#71717a] font-thai">
                  ยังไม่มีพนักงานในระบบ กรุณาเพิ่มพนักงานที่แถบเมนูด้านซ้ายก่อน
                </div>
              )}

              {!isLoading && employees.length > 0 && activeTab === 'summary' && (
                <div className="overflow-x-auto rounded-xl border border-[#e4e4e7] bg-white shadow-sm">
                  <table className="roster-summary-table">
                    <thead>
                      <tr>
                        <th>พนักงาน</th>
                        {saturdaysInMonth.map((sat) => (
                          <th key={sat.dateKey}>
                            ส.{sat.date.getDate()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp) => (
                        <tr
                          key={emp.id}
                          onClick={() => navigateToEmployeeCalendar(emp.id)}
                          className="cursor-pointer"
                        >
                          <td className="font-semibold text-[#18181b]">
                            {emp.name}
                            {!emp.startWorkingSaturday && <span className="text-amber-500 ml-1">⚠️</span>}
                          </td>
                          {saturdaysInMonth.map((sat) => {
                            const dayStatus = getEmployeeDayStatus(emp, sat);
                            const leave = leaveMap.get(`${emp.id}:${sat.dateKey}`);
                            const dotClass = leave
                              ? (leave.leaveType === 'sick' ? 'leave-sick' : 'leave-business')
                              : dayStatus === 'WORK' || dayStatus === 'WORK_SWAP' ? 'work'
                              : dayStatus === 'OT2X' ? 'ot'
                              : dayStatus === 'OFF' || dayStatus === 'OFF_SWAP' ? 'off'
                              : 'holiday';
                            return (
                              <td key={sat.dateKey}>
                                <span className={`status-dot ${dotClass}`} title={getStatusLabel(dayStatus)} />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!isLoading && employees.length > 0 && activeTab === 'calendar' && selectedEmployee && (
                <div className="flex flex-col gap-4">
                  {/* Employee Stat Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#e4e4e7] p-4 rounded-2xl shadow-sm">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-bold text-[#18181b]">
                        {selectedEmployee.name}
                      </h3>
                      <div className="text-xs text-[#71717a] mt-0.5 font-thai">
                        สถิติการลาเดือนนี้:{' '}
                        {leaves.filter((leave) => leave.employeeId === selectedEmployee.id).length} วัน
                      </div>
                    </div>

                    {/* Quick Leave form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCreateLeave(selectedEmployee.id);
                      }}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-[#71717a] font-thai">ประเภทการลา</span>
                        <select
                          value={leaveType}
                          onChange={(e) => setLeaveType(e.target.value as 'sick' | 'business')}
                          className="border border-[#e4e4e7] rounded-lg bg-white px-2 py-1 text-xs text-[#3f3f46] outline-none"
                        >
                          <option value="sick">ลาป่วย</option>
                          <option value="business">ลากิจ</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-[#71717a] font-thai">วันที่ต้องการลา</span>
                        <input
                          type="date"
                          value={leaveDate}
                          onChange={(e) => setLeaveDate(e.target.value)}
                          className="border border-[#e4e4e7] rounded-lg bg-[#fafafa] px-2 py-1 text-xs text-[#3f3f46] outline-none"
                          required
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        className="bg-[#18181b] text-white rounded-lg text-xs px-3.5 py-1.5 font-semibold hover:bg-black transition-colors self-end"
                      >
                        บันทึกวันลา
                      </motion.button>
                    </form>
                  </div>

                  {/* Warning visual callout */}
                  {!selectedEmployee.startWorkingSaturday && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 shadow-sm font-thai">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <strong>ยังไม่ได้ระบุวันเสาร์แรกที่เริ่มงาน:</strong> โปรดเลือกวันเสาร์แรกที่เข้างานของ <strong>{selectedEmployee.name}</strong> โดยคลิกวันเสาร์บนปฏิทิน แล้วเลือก <span className="underline font-bold">"ตั้งเป็นเสาร์เริ่มงาน"</span> เพื่อเปิดใช้งานสูตรคำนวณเว้นเสาร์อัตโนมัติ
                      </div>
                    </div>
                  )}

                  {/* Calendar Grid Container */}
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

                        // Drag status class
                        const isSource = dragPayload?.sourceDateKey === day.dateKey;
                        const isOver = dragOverDateKey === day.dateKey;

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
                          data-popover-id={day.dateKey}
                          className={`roster-cell group ${isToday ? 'is-today' : ''} ${isSource ? 'drag-source' : ''} ${isOver ? 'drag-over' : ''} flex flex-col justify-between`}
                          onClick={() => {
                            if (isSaturday && !day.isPublicHoliday) {
                              setActivePopover(activePopover === day.dateKey ? null : day.dateKey);
                            }
                          }}
                          onDragOver={(e) => {
                            if (isSaturday && !day.isPublicHoliday && dragPayload && dragPayload.sourceDateKey !== day.dateKey) {
                              e.preventDefault();
                              setDragOverDateKey(day.dateKey);
                            }
                          }}
                          onDragLeave={() => {
                            setDragOverDateKey(null);
                          }}
                          onDrop={() => {
                            if (dragPayload && isSaturday && !day.isPublicHoliday) {
                              handleSwapSaturdayStatus(dragPayload.sourceDateKey, day.dateKey);
                            }
                            setDragOverDateKey(null);
                            setDragPayload(null);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            {/* Date Number */}
                            <span className="text-xs font-semibold text-[#18181b]">
                              {day.date.getDate()}
                            </span>

                            {/* Status Dot */}
                            {(() => {
                              const dotClass = leave
                                ? (leave.leaveType === 'sick' ? 'leave-sick' : 'leave-business')
                                : status === 'WORK' || status === 'WORK_SWAP' ? 'work'
                                : status === 'OT2X' ? 'ot'
                                : status === 'OFF' || status === 'OFF_SWAP' ? 'off'
                                : 'holiday';
                              return <span className={`status-dot ${dotClass}`} title={getStatusLabel(status)} />;
                            })()}
                          </div>

                          {/* Center Section: Public Holiday or Leave record */}
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
                              <span className="text-[9px] text-slate-400 font-medium">
                                ทำงานปกติ
                              </span>
                            )}
                            {!leave && !isSaturday && isHoliday && !day.isPublicHoliday && (
                              <span className="text-[9px] text-[#71717a] font-medium">
                                วันอาทิตย์
                              </span>
                            )}
                            {!leave && isSaturday && !day.isPublicHoliday && (
                              status === 'WORK' || status === 'WORK_SWAP' ? (
                                <div
                                  draggable
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    setDragPayload({ sourceDateKey: day.dateKey });
                                  }}
                                  onDragEnd={() => {
                                    setDragPayload(null);
                                    setDragOverDateKey(null);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-0.5 flex items-center justify-between gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-[9.5px] font-bold text-emerald-700 shadow-sm cursor-grab active:cursor-grabbing hover:bg-emerald-100 transition-colors"
                                  title="ลากสลับวันหยุดเสาร์อื่น"
                                >
                                  <span>{getStatusLabel(status)}</span>
                                  <span className="text-emerald-400/80">⋮⋮</span>
                                </div>
                              ) : (
                                <span className={`text-[9.5px] font-bold ${
                                  status === 'OT2X' ? 'text-blue-600' : 'text-amber-500'
                                }`}>
                                  {getStatusLabel(status)}
                                </span>
                              )
                            )}
                          </div>

                          {/* Bottom Row: Quick actions */}
                          <div className="flex items-center justify-between min-h-[14px]">
                            {/* Quick leave hover triggers */}
                            {!isHoliday && !leave && (status === 'WORK' || status === 'WORK_SWAP' || !isSaturday) ? (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleUpsertLeave(day.dateKey, 'sick')}
                                  className="text-[9px] text-rose-500 hover:underline font-semibold"
                                >
                                  🤒 ป่วย
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpsertLeave(day.dateKey, 'business')}
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
                                  handleDeleteLeave(day.dateKey);
                                }}
                                className="text-[9px] text-red-500 hover:underline font-bold z-10"
                              >
                                ลบวันลา
                              </button>
                            ) : <span />}
                          </div>

                          {/* ===== POPOVER ACTION MENU ===== */}
                          {activePopover === day.dateKey && (
                            <div
                              className="roster-popover"
                              style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {!selectedEmployee.startWorkingSaturday ? (
                                <button
                                  type="button"
                                  className="roster-popover-item"
                                  onClick={() => {
                                    updateEmployeeStartSaturday(selectedEmployee.id, day.dateKey);
                                    setActivePopover(null);
                                  }}
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
                                      onClick={() => {
                                        updateEmployeeStartSaturday(selectedEmployee.id, day.dateKey);
                                        setActivePopover(null);
                                      }}
                                    >
                                      🔄 ย้ายจุดเริ่มงานมาเสาร์นี้
                                    </button>
                                    <button
                                      type="button"
                                      className="roster-popover-item"
                                      onClick={() => {
                                        handleSaturdayStatusChange(day.dateKey, 'CLEAR');
                                        setActivePopover(null);
                                      }}
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
                                      onClick={() => {
                                        handleSaturdayStatusChange(day.dateKey, 'WORK');
                                        setActivePopover(null);
                                      }}
                                    >
                                      ✅ ทำงาน (WORK)
                                    </button>
                                    <button
                                      type="button"
                                      className="roster-popover-item"
                                      onClick={() => {
                                        handleSaturdayStatusChange(day.dateKey, 'OFF');
                                        setActivePopover(null);
                                      }}
                                    >
                                      📴 วันหยุด (OFF)
                                    </button>
                                    <button
                                      type="button"
                                      className="roster-popover-item"
                                      onClick={() => {
                                        handleSaturdayStatusChange(day.dateKey, 'OT2X');
                                        setActivePopover(null);
                                      }}
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
                                      onClick={() => {
                                        handleUpsertLeave(day.dateKey, 'sick');
                                        setActivePopover(null);
                                      }}
                                    >
                                      🤒 ลาป่วย
                                    </button>
                                    <button
                                      type="button"
                                      className="roster-popover-item"
                                      onClick={() => {
                                        handleUpsertLeave(day.dateKey, 'business');
                                        setActivePopover(null);
                                      }}
                                    >
                                      💼 ลากิจ
                                    </button>
                                    {leave && (
                                      <button
                                        type="button"
                                        className="roster-popover-item danger"
                                        onClick={() => {
                                          handleDeleteLeave(day.dateKey);
                                          setActivePopover(null);
                                        }}
                                      >
                                        🗑️ ลบวันลา
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          </motion.div>
        </AnimatePresence>
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
