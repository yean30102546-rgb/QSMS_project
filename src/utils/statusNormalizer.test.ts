import { describe, expect, it } from 'vitest';
import {
  STATUS_FILTER_GROUPS,
  calculateReworkSummary,
  categorizeStatus,
  normalizeStatus,
} from './statusNormalizer';

describe('statusNormalizer unit tests', () => {
  describe('normalizeStatus', () => {
    it('normalizes standard 5 statuses accurately', () => {
      expect(normalizeStatus('Pending Analysis')).toBe('Pending Analysis');
      expect(normalizeStatus('Awaiting Materials')).toBe('Awaiting Materials');
      expect(normalizeStatus('In-Progress')).toBe('In-Progress');
      expect(normalizeStatus('Blocked')).toBe('Blocked');
      expect(normalizeStatus('Completed')).toBe('Completed');
    });

    it('normalizes legacy Pending to Pending Analysis (not In-Progress)', () => {
      expect(normalizeStatus('Pending')).toBe('Pending Analysis');
      expect(normalizeStatus('pending')).toBe('Pending Analysis');
    });

    it('handles empty or whitespace status gracefully', () => {
      expect(normalizeStatus('')).toBe('Pending Analysis');
      expect(normalizeStatus(undefined)).toBe('Pending Analysis');
      expect(normalizeStatus('  ')).toBe('Pending Analysis');
    });

    it('identifies unknown/foreign statuses as Unknown', () => {
      expect(normalizeStatus('Archived')).toBe('Unknown');
      expect(normalizeStatus('Cancelled')).toBe('Unknown');
      expect(normalizeStatus('SomeRandomStatus')).toBe('Unknown');
    });
  });

  describe('categorizeStatus', () => {
    it('categorizes Pending, Pending Analysis, and Awaiting Materials into pending', () => {
      expect(categorizeStatus('Pending')).toBe('pending');
      expect(categorizeStatus('Pending Analysis')).toBe('pending');
      expect(categorizeStatus('Awaiting Materials')).toBe('pending');
      expect(categorizeStatus('pending analysis')).toBe('pending');
    });

    it('categorizes In-Progress into inProgress', () => {
      expect(categorizeStatus('In-Progress')).toBe('inProgress');
      expect(categorizeStatus('in-progress')).toBe('inProgress');
    });

    it('categorizes Blocked into blocked', () => {
      expect(categorizeStatus('Blocked')).toBe('blocked');
      expect(categorizeStatus('blocked')).toBe('blocked');
    });

    it('categorizes Completed into completed', () => {
      expect(categorizeStatus('Completed')).toBe('completed');
      expect(categorizeStatus('completed')).toBe('completed');
    });

    it('categorizes unknown status into other', () => {
      expect(categorizeStatus('UnknownStatus')).toBe('other');
      expect(categorizeStatus('Archived')).toBe('other');
    });
  });

  describe('calculateReworkSummary', () => {
    it('calculates counts, handles denominator correctly, and ignores deleted cases', () => {
      const mockCases = [
        { status: 'Pending Analysis', is_deleted: false },
        { status: 'Awaiting Materials', is_deleted: false },
        { status: 'Pending', is_deleted: false },
        { status: 'In-Progress', is_deleted: false },
        { status: 'In-Progress', is_deleted: false },
        { status: 'Blocked', is_deleted: false },
        { status: 'Completed', is_deleted: false },
        { status: 'Completed', is_deleted: false },
        { status: 'Completed', is_deleted: false },
        { status: 'MysteryStatus', is_deleted: false },
        // Deleted cases should be ignored:
        { status: 'Completed', is_deleted: true },
        { status: 'In-Progress', is_deleted: true },
      ];

      const summary = calculateReworkSummary(mockCases);

      // Total non-deleted = 10
      expect(summary.total).toBe(10);
      // Pending group = Pending Analysis (1) + Awaiting Materials (1) + legacy Pending (1) = 3
      expect(summary.pending).toBe(3);
      // In-Progress = 2
      expect(summary.inProgress).toBe(2);
      // Blocked = 1
      expect(summary.blocked).toBe(1);
      // Completed = 3
      expect(summary.completed).toBe(3);
      // Other = 1 (MysteryStatus)
      expect(summary.other).toBe(1);
      // Completion rate = 3 / 10 = 30.0%
      expect(summary.completionRate).toBe(30.0);
    });

    it('handles empty case lists without division by zero', () => {
      const summary = calculateReworkSummary([]);
      expect(summary.total).toBe(0);
      expect(summary.pending).toBe(0);
      expect(summary.inProgress).toBe(0);
      expect(summary.blocked).toBe(0);
      expect(summary.completed).toBe(0);
      expect(summary.other).toBe(0);
      expect(summary.completionRate).toBe(0);
    });

    it('reflects correct completionRate when all cases are completed', () => {
      const summary = calculateReworkSummary([
        { status: 'Completed' },
        { status: 'Completed' },
      ]);
      expect(summary.total).toBe(2);
      expect(summary.completed).toBe(2);
      expect(summary.completionRate).toBe(100);
    });
  });

  describe('STATUS_FILTER_GROUPS', () => {
    it('defines correct status mapping arrays for Portal direct jump', () => {
      expect(STATUS_FILTER_GROUPS.pending).toEqual([
        'Pending Analysis',
        'Awaiting Materials',
        'Pending',
      ]);
      expect(STATUS_FILTER_GROUPS.inProgress).toEqual(['In-Progress']);
      expect(STATUS_FILTER_GROUPS.blocked).toEqual(['Blocked']);
      expect(STATUS_FILTER_GROUPS.completed).toEqual(['Completed']);
    });
  });
});

