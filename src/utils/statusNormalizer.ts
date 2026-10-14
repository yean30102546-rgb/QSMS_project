export type StandardReworkStatus =
  | 'Pending Analysis'
  | 'Awaiting Materials'
  | 'In-Progress'
  | 'Blocked'
  | 'Completed';

export type NormalizedStatus = StandardReworkStatus | 'Unknown';

export type StatusCategory = 'pending' | 'inProgress' | 'blocked' | 'completed' | 'other';

export interface ReworkSummary {
  total: number;
  pending: number;
  inProgress: number;
  blocked: number;
  completed: number;
  other: number;
  completionRate: number;
}

export const STATUS_FILTER_GROUPS = {
  pending: ['Pending Analysis', 'Awaiting Materials', 'Pending'] as const,
  inProgress: ['In-Progress'] as const,
  blocked: ['Blocked'] as const,
  completed: ['Completed'] as const,
};

/**
 * Normalizes any rework case status string into standard status.
 * Legacy 'Pending' is treated as part of the initial queue ('Pending Analysis'),
 * preserving 'In-Progress' strictly for active work.
 */
export function normalizeStatus(status?: string): NormalizedStatus {
  if (!status) return 'Pending Analysis';
  const s = status.trim();
  if (!s) return 'Pending Analysis';
  const lower = s.toLowerCase();

  if (lower === 'pending analysis') return 'Pending Analysis';
  if (lower === 'awaiting materials') return 'Awaiting Materials';
  if (lower === 'blocked') return 'Blocked';
  if (lower === 'completed') return 'Completed';
  if (lower === 'in-progress' || lower === 'in progress') return 'In-Progress';
  if (lower === 'pending') return 'Pending Analysis';

  return 'Unknown';
}

/**
 * Categorizes a case status into high-level operational buckets.
 */
export function categorizeStatus(status?: string): StatusCategory {
  if (!status) return 'pending';
  const s = status.trim();
  const lower = s.toLowerCase();

  if (
    lower === 'pending' ||
    lower === 'pending analysis' ||
    lower === 'awaiting materials'
  ) {
    return 'pending';
  }
  if (lower === 'in-progress' || lower === 'in progress') {
    return 'inProgress';
  }
  if (lower === 'blocked') {
    return 'blocked';
  }
  if (lower === 'completed') {
    return 'completed';
  }

  return 'other';
}

/**
 * Calculates unified Rework summary metrics.
 * - Total denominator strictly counts all non-deleted cases.
 * - Unrecognized/foreign statuses are counted transparently in `other`.
 * - Legacy 'Pending' cases are counted under `pending`.
 * - Completion rate = Completed / Total.
 */
export function calculateReworkSummary(
  cases: Array<{ status?: string | null; is_deleted?: boolean | null }>
): ReworkSummary {
  const activeCases = (cases || []).filter((c) => !c.is_deleted);
  const total = activeCases.length;

  let pending = 0;
  let inProgress = 0;
  let blocked = 0;
  let completed = 0;
  let other = 0;

  for (const c of activeCases) {
    const category = categorizeStatus(c.status || undefined);
    switch (category) {
      case 'pending':
        pending++;
        break;
      case 'inProgress':
        inProgress++;
        break;
      case 'blocked':
        blocked++;
        break;
      case 'completed':
        completed++;
        break;
      case 'other':
        other++;
        break;
    }
  }

  const completionRate =
    total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;

  return {
    total,
    pending,
    inProgress,
    blocked,
    completed,
    other,
    completionRate,
  };
}
