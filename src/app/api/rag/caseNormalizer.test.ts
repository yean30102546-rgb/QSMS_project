import { describe, it, expect } from 'vitest';
import { normalizeCaseQuery } from './caseNormalizer';

describe('normalizeCaseQuery', () => {
  it('correctly normalizes abbreviated RW codes (e.g. RW001)', () => {
    const res = normalizeCaseQuery('RW001');
    expect(res.prefix).toBe('RW');
    expect(res.seqNum).toBe(1);
    expect(res.paddedSeq).toBe('001');
    expect(res.isExactId).toBe(false);
  });

  it('correctly normalizes space-separated codes (e.g. RT 001)', () => {
    const res = normalizeCaseQuery('RT 001');
    expect(res.prefix).toBe('RT');
    expect(res.seqNum).toBe(1);
    expect(res.paddedSeq).toBe('001');
    expect(res.token).toBe('RT 001');
    expect(res.noSpace).toBe('RT001');
  });

  it('correctly normalizes Thai-appended queries (e.g. RT 001 ล่ะ)', () => {
    const res = normalizeCaseQuery('RT 001 ล่ะ');
    expect(res.prefix).toBe('RT');
    expect(res.seqNum).toBe(1);
    expect(res.paddedSeq).toBe('001');
    expect(res.token).toBe('RT 001');
  });

  it('correctly parses full standard case ID format (e.g. RT-2026-001)', () => {
    const res = normalizeCaseQuery('RT-2026-001');
    expect(res.prefix).toBe('RT');
    expect(res.year).toBe('2026');
    expect(res.seqNum).toBe(1);
    expect(res.paddedSeq).toBe('001');
    expect(res.isExactId).toBe(true);
  });

  it('correctly parses legacy format (e.g. RW888-2026)', () => {
    const res = normalizeCaseQuery('RW888-2026');
    expect(res.prefix).toBe('RW');
    expect(res.year).toBe('2026');
    expect(res.seqNum).toBe(888);
    expect(res.paddedSeq).toBe('888');
    expect(res.isExactId).toBe(true);
  });

  it('correctly normalizes raw numeric inputs without prefix (e.g. 002)', () => {
    const res = normalizeCaseQuery('002');
    expect(res.prefix).toBeNull();
    expect(res.seqNum).toBe(2);
    expect(res.paddedSeq).toBe('002');
  });
});
