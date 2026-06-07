import { getCurrentUser, isAuthenticated } from './auth';
import type { Employee, LeaveRecord, RosterOverride } from '../modules/roster/types';

interface RosterApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface MonthPayload {
  employees: Employee[];
  overrides: RosterOverride[];
  holidays: Array<{ dateKey: string; name: string }>;
  leaves: LeaveRecord[];
}

async function postToRoster<T>(payload: Record<string, unknown>): Promise<RosterApiResponse<T>> {
  if (!isAuthenticated()) {
    return { success: false, error: 'Authentication required. Please login again.' };
  }

  const currentUser = getCurrentUser();
  const authProfile = String(currentUser?.role || '').trim().toUpperCase();
  const authEmail = currentUser?.email ? String(currentUser.email).trim() : '';

  const response = await fetch('/api/roster', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      authProfile,
      authEmail,
      userRole: currentUser?.role || '',
    }),
  });

  if (!response.ok) {
    return { success: false, error: `Network response was not ok (${response.status})` };
  }

  const result = (await response.json()) as RosterApiResponse<T>;
  return result;
}

export async function fetchRosterMonth(monthKey: string): Promise<RosterApiResponse<MonthPayload>> {
  return postToRoster<MonthPayload>({ action: 'rosterGetMonth', monthKey });
}

export async function addRosterEmployee(
  name: string,
  phase: 0 | 1,
  startWorkingSaturday?: string,
): Promise<RosterApiResponse<Employee>> {
  return postToRoster<Employee>({ action: 'rosterAddEmployee', name, phase, startWorkingSaturday });
}

export async function updateRosterEmployeePhase(
  employeeId: string,
  phase: 0 | 1,
): Promise<RosterApiResponse<{ employeeId: string; phase: 0 | 1 }>> {
  return postToRoster<{ employeeId: string; phase: 0 | 1 }>({
    action: 'rosterUpdateEmployeePhase',
    employeeId,
    phase,
  });
}

export async function updateRosterEmployeeStartSaturday(
  employeeId: string,
  startWorkingSaturday: string,
): Promise<RosterApiResponse<{ employeeId: string; startWorkingSaturday: string }>> {
  return postToRoster<{ employeeId: string; startWorkingSaturday: string }>({
    action: 'rosterUpdateEmployeeStartSaturday',
    employeeId,
    startWorkingSaturday,
  });
}

export async function deleteRosterEmployee(
  employeeId: string,
): Promise<RosterApiResponse<{ employeeId: string }>> {
  return postToRoster<{ employeeId: string }>({
    action: 'rosterDeleteEmployee',
    employeeId,
  });
}

export async function upsertRosterOverride(
  employeeId: string,
  dateKey: string,
  status: string,
): Promise<RosterApiResponse<RosterOverride>> {
  return postToRoster<RosterOverride>({
    action: 'rosterUpsertOverride',
    employeeId,
    dateKey,
    status,
  });
}

export async function swapRosterSaturday(
  employeeId: string,
  sourceDateKey: string,
  targetDateKey: string,
  sourceStatus: string,
  targetStatus: string,
): Promise<RosterApiResponse<{ employeeId: string }>> {
  return postToRoster<{ employeeId: string }>({
    action: 'rosterSwapSaturday',
    employeeId,
    sourceDateKey,
    targetDateKey,
    sourceStatus,
    targetStatus,
  });
}

export async function clearRosterMonthOverrides(monthKey: string): Promise<RosterApiResponse<{ monthKey: string }>> {
  return postToRoster<{ monthKey: string }>({ action: 'rosterClearMonthOverrides', monthKey });
}

export async function upsertRosterLeave(
  employeeId: string,
  dateKey: string,
  leaveType: string,
  note?: string,
): Promise<RosterApiResponse<LeaveRecord>> {
  return postToRoster<LeaveRecord>({
    action: 'rosterUpsertLeave',
    employeeId,
    dateKey,
    leaveType,
    note,
  });
}

export async function deleteRosterLeave(
  employeeId: string,
  dateKey: string,
): Promise<RosterApiResponse<{ employeeId: string; dateKey: string; deleted: boolean }>> {
  return postToRoster<{ employeeId: string; dateKey: string; deleted: boolean }>({
    action: 'rosterDeleteLeave',
    employeeId,
    dateKey,
  });
}

