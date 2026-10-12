import { describe, it, expect } from 'vitest';
import { calculateItemStatus } from './CaseUpdateView';
import type { ReworkItem } from '@/src/services/api';

describe('calculateItemStatus', () => {
  const completeBaseItem: ReworkItem = {
    id: 'item-1',
    itemCode: '40000386',
    itemNumber: '60230052B790A',
    itemName: 'YAMAHA GEAR OIL 4T',
    amount: 2,
    reason: 'รั่ว',
    reasonSubtype: 'รั่วซึม',
    responsible: 'SFC',
    responsibleSubtype: 'WPK',
    imageUrls: ['https://example.com/evidence1.jpg'],
  };

  it('returns complete status when all mandatory fields and evidence photo exist', () => {
    const result = calculateItemStatus(completeBaseItem);
    expect(result.status).toBe('complete');
    expect(result.label).toBe('ข้อมูลสมบูรณ์');
    expect(result.missingFields).toEqual([]);
  });

  it('keeps complete status even if optional fields (gallonDate, batchNo, mold, line) are empty', () => {
    const itemWithoutOptionals: ReworkItem = {
      ...completeBaseItem,
      gallonDate: '',
      batchNo: '',
      mold: '',
      line: '',
      details: '',
    };
    const result = calculateItemStatus(itemWithoutOptionals);
    expect(result.status).toBe('complete');
    expect(result.missingFields).toEqual([]);
  });

  it('flags missing reasonSubtype as incomplete', () => {
    const itemMissingSubtype: ReworkItem = {
      ...completeBaseItem,
      reasonSubtype: '',
    };
    const result = calculateItemStatus(itemMissingSubtype);
    expect(result.status).not.toBe('complete');
    expect(result.missingFields).toContain('สาเหตุย่อย');
  });

  it('flags missing responsibleSubtype as incomplete', () => {
    const itemMissingResponsibleSubtype: ReworkItem = {
      ...completeBaseItem,
      responsibleSubtype: '',
    };
    const result = calculateItemStatus(itemMissingResponsibleSubtype);
    expect(result.status).not.toBe('complete');
    expect(result.missingFields).toContain('ผู้รับผิดชอบย่อย');
  });

  it('flags missing photos when imageUrls is empty and stagedFilesCount is 0', () => {
    const itemNoPhotos: ReworkItem = {
      ...completeBaseItem,
      imageUrls: [],
    };
    const result = calculateItemStatus(itemNoPhotos, 0);
    expect(result.status).not.toBe('complete');
    expect(result.missingFields).toContain('รูปภาพหลักฐาน');
  });

  it('satisfies photo requirement when stagedFilesCount > 0 even if imageUrls is empty', () => {
    const itemNoRemotePhotos: ReworkItem = {
      ...completeBaseItem,
      imageUrls: [],
    };
    const result = calculateItemStatus(itemNoRemotePhotos, 1);
    expect(result.status).toBe('complete');
    expect(result.missingFields).toEqual([]);
  });

  it('flags missing photos if remote photo was marked as deleted and no staged files', () => {
    const result = calculateItemStatus(completeBaseItem, 0, ['https://example.com/evidence1.jpg']);
    expect(result.status).not.toBe('complete');
    expect(result.missingFields).toContain('รูปภาพหลักฐาน');
  });
});
