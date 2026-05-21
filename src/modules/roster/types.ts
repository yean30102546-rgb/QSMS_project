export type RosterCellStatus = 'OFF' | 'WORK' | 'HOLIDAY' | 'WORK_SWAP' | 'OFF_SWAP' | 'OT2X';

export interface Employee {
  id: string;
  name: string;
  phase: 0 | 1;
  startWorkingSaturday?: string; // YYYY-MM-DD format for Saturday formula
}


export interface RosterOverride {
  employeeId: string;
  dateKey: string;
  status: RosterCellStatus;
}

export type LeaveType = 'sick' | 'business' | 'vacation';

export interface LeaveRecord {
  id: string;
  employeeId: string;
  dateKey: string;
  leaveType: LeaveType;
  note?: string;
}

export interface DayInfo {
  date: Date;
  dateKey: string;
  isSunday: boolean;
  isSaturday: boolean;
  isPublicHoliday: boolean;
  holidayName?: string;
}

