import type { DayInfo, Employee, RosterCellStatus, RosterOverride } from './types';

const THAI_MONTH_FORMATTER = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
  month: 'long',
  year: 'numeric',
});

export function getThaiMonthLabel(monthDate: Date): string {
  return THAI_MONTH_FORMATTER.format(monthDate);
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getThailandPublicHolidays(year: number): Map<string, string> {
  const map = new Map<string, string>();
  map.set(`${year}-01-01`, 'วันขึ้นปีใหม่');
  map.set(`${year}-04-06`, 'วันจักรี');
  map.set(`${year}-04-13`, 'วันสงกรานต์');
  map.set(`${year}-04-14`, 'วันสงกรานต์');
  map.set(`${year}-04-15`, 'วันสงกรานต์');
  map.set(`${year}-05-01`, 'วันแรงงานแห่งชาติ');
  map.set(`${year}-05-04`, 'วันฉัตรมงคล');
  map.set(`${year}-06-03`, 'วันเฉลิมฯ พระราชินี');
  map.set(`${year}-07-28`, 'วันเฉลิมฯ ร.10');
  map.set(`${year}-08-12`, 'วันแม่แห่งชาติ');
  map.set(`${year}-10-13`, 'วันคล้ายวันสวรรคต ร.9');
  map.set(`${year}-10-23`, 'วันปิยมหาราช');
  map.set(`${year}-12-05`, 'วันพ่อแห่งชาติ');
  map.set(`${year}-12-10`, 'วันรัฐธรรมนูญ');
  map.set(`${year}-12-31`, 'วันสิ้นปี');
  return map;
}

export function getMonthDays(
  monthDate: Date,
  extraHolidays: Array<{ dateKey: string; name: string }> = []
): DayInfo[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const publicHolidays = getThailandPublicHolidays(year);

  const extraHolidayMap = new Map<string, string>();
  for (const h of extraHolidays) {
    extraHolidayMap.set(h.dateKey, h.name);
  }

  const days: DayInfo[] = [];
  for (let day = firstDay.getDate(); day <= lastDay.getDate(); day += 1) {
    const date = new Date(year, month, day);
    const dateKey = toDateKey(date);
    const weekday = date.getDay();
    
    const pubHolidayName = publicHolidays.get(dateKey);
    const extraHolidayName = extraHolidayMap.get(dateKey);
    const isPublicHoliday = !!pubHolidayName || !!extraHolidayName;
    const holidayName = pubHolidayName || extraHolidayName || undefined;

    days.push({
      date,
      dateKey,
      isSunday: weekday === 0,
      isSaturday: weekday === 6,
      isPublicHoliday,
      holidayName,
    });
  }
  return days;
}

export function getCellStatus(
  employee: Employee,
  day: DayInfo,
  overrides: Map<string, RosterCellStatus>,
  workingSaturdayIndexMap: Map<string, number>,
): RosterCellStatus {
  const override = overrides.get(`${employee.id}:${day.dateKey}`);
  if (override) return override;

  if (day.isSunday) return 'HOLIDAY';
  if (day.isPublicHoliday) return 'HOLIDAY';
  if (!day.isSaturday) return 'WORK';

  const saturdayIndex = workingSaturdayIndexMap.get(day.dateKey);
  if (saturdayIndex === undefined) return 'HOLIDAY';

  if (employee.startWorkingSaturday) {
    try {
      const startSat = new Date(employee.startWorkingSaturday);
      const d1 = new Date(startSat.getFullYear(), startSat.getMonth(), startSat.getDate(), 12, 0, 0);
      const d2 = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate(), 12, 0, 0);
      const diffTime = d2.getTime() - d1.getTime();
      const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
      const isOffSaturday = Math.abs(diffWeeks) % 2 !== 0;
      return isOffSaturday ? 'OFF' : 'WORK';
    } catch (e) {
      // Fallback
    }
  }

  // Return OFF as default instead of computing formula automatically before start date is set.
  return 'OFF';
}


export function buildWorkingSaturdayIndexMap(days: DayInfo[]): Map<string, number> {
  const map = new Map<string, number>();
  let idx = 0;
  for (const day of days) {
    if (day.isSaturday && !day.isPublicHoliday) {
      map.set(day.dateKey, idx);
      idx += 1;
    }
  }
  return map;
}

export function buildOverrideMap(items: RosterOverride[]): Map<string, RosterCellStatus> {
  const map = new Map<string, RosterCellStatus>();
  for (const item of items) {
    map.set(`${item.employeeId}:${item.dateKey}`, item.status);
  }
  return map;
}

export function getStatusLabel(status: RosterCellStatus): string {
  switch (status) {
    case 'OFF':
      return 'หยุดเสาร์';
    case 'WORK':
      return 'ทำงาน';
    case 'HOLIDAY':
      return 'วันหยุด';
    case 'WORK_SWAP':
      return 'ทำงาน (สลับ)';
    case 'OFF_SWAP':
      return 'หยุด (สลับ)';
    case 'OT2X':
      return 'ทำงาน OT x2';
    default:
      return status;
  }
}
