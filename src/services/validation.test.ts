import { describe, it, expect } from 'vitest'
import {
  validateItemNumber,
  validateItemName,
  validateItemCode,
  validateAmount,
  validateReworkItem,
  findDuplicateItemNumbers,
  isSaveDisabled,
  validateEmail,
} from './validation'

describe('Validation Services', () => {
  describe('validateItemNumber', () => {
    it('should pass if empty', () => {
      const result = validateItemNumber('')
      expect(result).toBeNull()
    })

    it('should fail if contains invalid characters', () => {
      const result = validateItemNumber('ITEM@123')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Item Number contains invalid characters')
    })

    it('should fail if too long', () => {
      const longId = 'A'.repeat(51)
      const result = validateItemNumber(longId)
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Item Number must not exceed 50 characters')
    })

    it('should pass if valid alphanumeric and symbols', () => {
      expect(validateItemNumber('ITEM-123_abc/01')).toBeNull()
    })
  })

  describe('validateItemName', () => {
    it('should fail if empty', () => {
      expect(validateItemName('')).not.toBeNull()
    })

    it('should fail if too long', () => {
      expect(validateItemName('A'.repeat(101))).not.toBeNull()
    })

    it('should fail if contains script tags to prevent XSS', () => {
      const result = validateItemName('Test <script>alert(1)</script>')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Item Name contains invalid content')
    })
  })

  describe('validateItemCode', () => {
    it('should pass if empty', () => {
      expect(validateItemCode('')).toBeNull()
    })

    it('should fail if contains non-digits', () => {
      expect(validateItemCode('123a56')).not.toBeNull()
    })

    it('should fail if exceeds 11 digits', () => {
      expect(validateItemCode('123456789012')).not.toBeNull()
    })
  })

  describe('validateAmount', () => {
    it('should fail if not a number', () => {
      expect(validateAmount('abc')).not.toBeNull()
    })

    it('should fail if less than or equal to 0', () => {
      expect(validateAmount(0)).not.toBeNull()
      expect(validateAmount(-5)).not.toBeNull()
    })

    it('should fail if exceeds 999,999', () => {
      expect(validateAmount(1000000)).not.toBeNull()
    })

    it('should pass for valid amount', () => {
      expect(validateAmount(100)).toBeNull()
    })

    it('should pass if empty', () => {
      expect(validateAmount('')).toBeNull()
      expect(validateAmount(undefined)).toBeNull()
    })
  })

  describe('validateReworkItem', () => {
    const validItem = {
      itemNumber: 'ITEM-123',
      itemName: 'Product Name',
      itemCode: '12345',
      amount: 10,
      reason: 'อื่นๆ',
      responsible: 'QA',
      customerName: 'John Doe',
      batchNo: 'B01',
      boxNumber: '001',
      imageCount: 1,
    }

    it('should pass with valid fields', () => {
      const result = validateReworkItem(validItem)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass if boxNumber is empty or null', () => {
      const emptyBoxItem = { ...validItem, boxNumber: '' }
      const result = validateReworkItem(emptyBoxItem)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail if boxNumber is provided but not numeric', () => {
      const invalidBoxItem = { ...validItem, boxNumber: 'ABC' }
      const result = validateReworkItem(invalidBoxItem)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'boxNumber')).toBe(true)
    })

    it('should require reasonSubtype if reason is "รั่ว" or "เปื้อน"', () => {
      const leakItem = { ...validItem, reason: 'รั่ว', reasonSubtype: '' }
      const result = validateReworkItem(leakItem)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'reasonSubtype')).toBe(true)
    })

    it('should require responsibleSubtype if responsible is "SFC" or "Supplier"', () => {
      const sfcItem = { ...validItem, responsible: 'SFC', responsibleSubtype: '' }
      const result = validateReworkItem(sfcItem)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'responsibleSubtype')).toBe(true)
    })
  })

  describe('findDuplicateItemNumbers', () => {
    it('should detect duplicate item numbers with the same reason', () => {
      const items = [
        { itemNumber: 'ITEM1', reason: 'Leak' },
        { itemNumber: 'ITEM2', reason: 'Leak' },
        { itemNumber: 'ITEM1', reason: 'Leak' }, // Duplicate
      ]
      const result = findDuplicateItemNumbers(items)
      expect(result.hasDuplicates).toBe(true)
      expect(result.duplicates).toContain('ITEM1 (Leak) - Box: -, Mold: -, Line: -')
    })

    it('should not treat same item number with different reasons as duplicate', () => {
      const items = [
        { itemNumber: 'ITEM1', reason: 'Leak' },
        { itemNumber: 'ITEM1', reason: 'Dirt' },
      ]
      const result = findDuplicateItemNumbers(items)
      expect(result.hasDuplicates).toBe(false)
    })

    it('should not treat same item number with same reason but different reasonSubtypes as duplicate', () => {
      const items = [
        { itemNumber: 'ITEM1', reason: 'รั่ว', reasonSubtype: 'รั่วซึม' },
        { itemNumber: 'ITEM1', reason: 'รั่ว', reasonSubtype: 'รั่วตามด' },
      ]
      const result = findDuplicateItemNumbers(items)
      expect(result.hasDuplicates).toBe(false)
    })

    it('should treat same item number with same reason and same reasonSubtype as duplicate', () => {
      const items = [
        { itemNumber: 'ITEM1', reason: 'รั่ว', reasonSubtype: 'รั่วซึม' },
        { itemNumber: 'ITEM1', reason: 'รั่ว', reasonSubtype: 'รั่วซึม' },
      ]
      const result = findDuplicateItemNumbers(items)
      expect(result.hasDuplicates).toBe(true)
      expect(result.duplicates).toContain('ITEM1 (รั่ว - รั่วซึม) - Box: -, Mold: -, Line: -')
    })
  })

  describe('isSaveDisabled', () => {
    it('should return true if items list is empty', () => {
      expect(isSaveDisabled([])).toBe(true)
    })

    it('should return true if any item is invalid', () => {
      const items = [
        { itemNumber: 'ITEM1', itemName: 'Name', itemCode: '123', amount: 10, reason: 'Reason', responsible: 'QA', customerName: 'Customer', batchNo: 'B01', boxNumber: '001', imageCount: 1 },
        { itemNumber: 'ITEM2', itemName: '', itemCode: '123', amount: 10, reason: 'Reason', responsible: 'QA', customerName: 'Customer', batchNo: 'B01', boxNumber: '001', imageCount: 1 }, // Invalid itemName
      ]
      expect(isSaveDisabled(items)).toBe(true)
    })

    it('should return true if any item is missing images', () => {
      const items = [
        { itemNumber: 'ITEM1', itemName: 'Name', itemCode: '123', amount: 10, reason: 'Reason', responsible: 'QA', customerName: 'Customer', batchNo: 'B01', boxNumber: '001', imageCount: 0 },
      ]
      expect(isSaveDisabled(items)).toBe(true)
    })

    it('should return true if any item is duplicate', () => {
      const items = [
        { itemNumber: 'ITEM1', itemName: 'Name', itemCode: '123', amount: 10, reason: 'Reason', responsible: 'QA', customerName: 'Customer', batchNo: 'B01', boxNumber: '001', imageCount: 1 },
        { itemNumber: 'ITEM1', itemName: 'Name', itemCode: '123', amount: 10, reason: 'Reason', responsible: 'QA', customerName: 'Customer', batchNo: 'B01', boxNumber: '001', imageCount: 1 },
      ]
      expect(isSaveDisabled(items)).toBe(true)
    })

    it('should return false if all items are valid', () => {
      const items = [
        { itemNumber: 'ITEM1', itemName: 'Name', itemCode: '123', amount: 10, reason: 'Reason', responsible: 'QA', customerName: 'Customer', batchNo: 'B01', boxNumber: '001', imageCount: 1 },
      ]
      expect(isSaveDisabled(items)).toBe(false)
    })
  })

  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true)
    })

    it('should return false for invalid email', () => {
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('testexample.com')).toBe(false)
    })
  })
})
