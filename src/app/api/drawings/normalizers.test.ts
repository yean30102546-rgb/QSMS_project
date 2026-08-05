import { describe, it, expect } from 'vitest';
import {
  normalizeCustomerName,
  normalizeRevision,
  normalizePalletType,
  normalizeBoxesPerPallet,
  normalizeItemCode,
  normalizeItemNumber,
  normalizeOilGroup,
  normalizePackageSize,
  parsePackageDetails,
  normalizeShelfLife
} from './normalizers';

describe('Drawings API Normalizers & Parsers', () => {
  describe('normalizeCustomerName', () => {
    it('should map ENEOS aliases to ENEOS', () => {
      expect(normalizeCustomerName('eneos')).toBe('ENEOS');
      expect(normalizeCustomerName('HONDA THAILAND')).toBe('ENEOS');
      expect(normalizeCustomerName('Suzuki Lubricants')).toBe('ENEOS');
      expect(normalizeCustomerName(null)).toBe('ENEOS');
    });

    it('should map PTT OR aliases to PTTOR', () => {
      expect(normalizeCustomerName('or')).toBe('PTTOR');
      expect(normalizeCustomerName('PTT Station')).toBe('PTTOR');
    });

    it('should uppercase unrecognized brands', () => {
      expect(normalizeCustomerName('nissan')).toBe('NISSAN');
      expect(normalizeCustomerName('Toyota Motor')).toBe('TOYOTA');
      expect(normalizeCustomerName('custom brand')).toBe('CUSTOM BRAND');
    });
  });

  describe('normalizeRevision', () => {
    it('should pad single digits with leading zero', () => {
      expect(normalizeRevision('0')).toBe('00');
      expect(normalizeRevision('1')).toBe('01');
      expect(normalizeRevision('7')).toBe('07');
    });

    it('should strip REV/R prefixes and sanitize', () => {
      expect(normalizeRevision('REV. 2')).toBe('02');
      expect(normalizeRevision('R03')).toBe('03');
      expect(normalizeRevision('V1')).toBe('01');
      expect(normalizeRevision('')).toBe('00');
      expect(normalizeRevision('-')).toBe('00');
    });
  });

  describe('normalizePalletType', () => {
    it('should map Thai and English pallet descriptions', () => {
      expect(normalizePalletType('พาเลทพลาสติก')).toBe('พลาสติก');
      expect(normalizePalletType('Plastic Pallet')).toBe('พลาสติก');
      expect(normalizePalletType('ไม้')).toBe('ไม้');
      expect(normalizePalletType('Wooden')).toBe('ไม้');
      expect(normalizePalletType('CHEP Pallet')).toBe('CHEP');
      expect(normalizePalletType('unknown')).toBeNull();
    });
  });

  describe('normalizeBoxesPerPallet', () => {
    it('should extract digits for numeric box counts', () => {
      expect(normalizeBoxesPerPallet(24)).toBe('24');
      expect(normalizeBoxesPerPallet(' 20 กล่อง ')).toBe('20');
      expect(normalizeBoxesPerPallet('24')).toBe('24');
    });

    it('should return ตามความเหมาะสม for suitability keywords', () => {
      expect(normalizeBoxesPerPallet('ตามความเหมาะสม')).toBe('ตามความเหมาะสม');
      expect(normalizeBoxesPerPallet('วางเรียงตามความเหมาะสม')).toBe('ตามความเหมาะสม');
      expect(normalizeBoxesPerPallet('as appropriate')).toBe('ตามความเหมาะสม');
    });

    it('should return null for null, undefined, or empty values', () => {
      expect(normalizeBoxesPerPallet(null)).toBeNull();
      expect(normalizeBoxesPerPallet(undefined)).toBeNull();
      expect(normalizeBoxesPerPallet('')).toBeNull();
    });
  });

  describe('normalizeItemCode', () => {
    it('should extract 6-8 digit internal product codes starting with 4-9', () => {
      expect(normalizeItemCode('40001584')).toBe('40001584');
      expect(normalizeItemCode('Product Code: 407697')).toBe('407697');
      expect(normalizeItemCode('invalid')).toBeNull();
    });
  });

  describe('normalizeItemNumber', () => {
    it('should return null for drawings (docType === drawing)', () => {
      expect(normalizeItemNumber('6023670E800A', 'drawing')).toBeNull();
    });

    it('should reject pure 6-8 digit internal item_code from item_number', () => {
      expect(normalizeItemNumber('40001584', 'master')).toBeNull();
    });

    it('should allow valid master formula numbers', () => {
      expect(normalizeItemNumber('61653013A700A', 'master')).toBe('61653013A700A');
    });
  });

  describe('normalizeOilGroup', () => {
    it('should map motor and engine oil terms to ENGINE OIL', () => {
      expect(normalizeOilGroup('Engine Oil')).toBe('ENGINE OIL');
      expect(normalizeOilGroup('น้ำมันเครื่องดีเซล')).toBe('ENGINE OIL');
      expect(normalizeOilGroup('Motorcycle Oil')).toBe('ENGINE OIL');
    });

    it('should map gear terms to GEAR OIL', () => {
      expect(normalizeOilGroup('Gear Oil')).toBe('GEAR OIL');
      expect(normalizeOilGroup('น้ำมันเกียร์')).toBe('GEAR OIL');
    });

    it('should return null for unknown categories', () => {
      expect(normalizeOilGroup('ATF')).toBeNull();
    });
  });

  describe('normalizePackageSize & parsePackageDetails', () => {
    it('should format small pack and parse details correctly', () => {
      expect(normalizePackageSize('1L x 24')).toBe('1 x 24 L.');
      const details = parsePackageDetails('1 x 24 L.');
      expect(details).toEqual({ volume: 1, qty: 24, free: 0, unit: 'L' });
    });

    it('should format small pack with free gift and parse details', () => {
      expect(normalizePackageSize('4L x 6 + 1L')).toBe('4 x 6 + 1 L.');
      const details = parsePackageDetails('4 x 6 + 1 L.');
      expect(details).toEqual({ volume: 4, qty: 6, free: 1, unit: 'L' });
    });

    it('should format pail/drum/IBC volumes', () => {
      expect(normalizePackageSize('200L')).toBe('200 L.');
      expect(normalizePackageSize('1000L')).toBe('1000 L.');
    });
  });

  describe('normalizeShelfLife', () => {
    it('should convert months and Thai text to years', () => {
      expect(normalizeShelfLife('24 months')).toBe('2 years');
      expect(normalizeShelfLife('EXP. 2 ปี')).toBe('2 years');
      expect(normalizeShelfLife('5')).toBe('5 years');
      expect(normalizeShelfLife('')).toBeNull();
    });
  });
});
