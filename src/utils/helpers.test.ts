import { describe, it, expect } from 'vitest'
import {
  groupItemsById,
  generateCaseId,
  generateItemSubId,
  sortCasesByStatus,
  filterCasesByQuery,
  filterCasesByMultipleCriteria,
  getStatistics,
  formatThaiDate,
  formatThaiDateShort,
  convertDMYToYMD,
  convertYMDToDMY,
} from './helpers'
import type { ReworkCase } from '../services/api'

describe('Helper Functions', () => {
  describe('groupItemsById', () => {
    it('should group rows by itemId and gather urls', () => {
      const rows = [
        { itemId: 'item-1', url: 'url1', name: 'Test 1' },
        { itemId: 'item-1', url: 'url2', name: 'Test 1' },
        { itemId: 'item-2', url: 'url3', name: 'Test 2' },
      ]
      const result = groupItemsById(rows)
      expect(result).toHaveLength(2)
      
      const item1 = result.find(r => r.itemId === 'item-1')
      expect(item1?.urls).toEqual(['url1', 'url2'])
      
      const item2 = result.find(r => r.itemId === 'item-2')
      expect(item2?.urls).toEqual(['url3'])
    })
  })

  describe('generateCaseId', () => {
    it('should generate a valid case ID starting with RW by default', () => {
      const id = generateCaseId()
      expect(id).toMatch(/^RW\d{16}$/)
    })

    it('should generate a valid case ID starting with RT when prefix is RT', () => {
      const id = generateCaseId('RT')
      expect(id).toMatch(/^RT\d{16}$/)
    })
  })

  describe('generateItemSubId', () => {
    it('should generate sub ID with padded index', () => {
      const subId = generateItemSubId('RW260101', 0)
      expect(subId).toBe('RW260101-001')

      const subId2 = generateItemSubId('RW260101', 9)
      expect(subId2).toBe('RW260101-010')
    })
  })

  describe('sortCasesByStatus', () => {
    it('should sort cases in order: Pending > In-Progress > Completed', () => {
      const mockCases = [
        { id: '1', status: 'Completed' },
        { id: '2', status: 'Pending' },
        { id: '3', status: 'In-Progress' },
      ] as ReworkCase[]

      const sorted = sortCasesByStatus(mockCases)
      expect(sorted[0].status).toBe('Pending')
      expect(sorted[1].status).toBe('In-Progress')
      expect(sorted[2].status).toBe('Completed')
    })
  })

  describe('filterCasesByQuery', () => {
    const mockCases = [
      {
        id: 'RW001',
        source: 'Production',
        items: [
          { itemNumber: 'A123', itemName: 'Bottle', reason: 'Leak', responsible: 'QA' }
        ]
      },
      {
        id: 'RW002',
        source: 'Warehouse',
        items: [
          { itemNumber: 'B456', itemName: 'Cap', reason: 'Dirt', responsible: 'SFC' }
        ]
      }
    ] as ReworkCase[]

    it('should return all cases if query is empty', () => {
      expect(filterCasesByQuery(mockCases, '')).toEqual(mockCases)
    })

    it('should filter by case ID', () => {
      const result = filterCasesByQuery(mockCases, 'RW001')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('RW001')
    })

    it('should filter by item properties', () => {
      const result = filterCasesByQuery(mockCases, 'Cap')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('RW002')
    })
  })

  describe('filterCasesByMultipleCriteria', () => {
    const mockCases = [
      {
        id: 'RW001',
        status: 'Pending',
        source: 'Production',
        date: '2026-05-10T10:00:00.000Z',
        items: [{ reason: 'Leak', responsible: 'QA' }]
      },
      {
        id: 'RW002',
        status: 'Completed',
        source: 'Warehouse',
        date: '2026-05-15T10:00:00.000Z',
        items: [{ reason: 'Dirt', responsible: 'SFC' }]
      }
    ] as ReworkCase[]

    it('should filter by status', () => {
      const result = filterCasesByMultipleCriteria(mockCases, { status: ['Pending'] })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('RW001')
    })

    it('should filter by date range', () => {
      const result = filterCasesByMultipleCriteria(mockCases, {
        dateFrom: '2026-05-09',
        dateTo: '2026-05-11'
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('RW001')
    })
  })

  describe('getStatistics', () => {
    it('should calculate correct statistics', () => {
      const mockCases = [
        { status: 'Pending', items: [] },
        { status: 'In-Progress', items: [] },
        { status: 'Completed', items: [] },
      ] as unknown as ReworkCase[]

      const stats = getStatistics(mockCases)
      expect(stats.total).toBe(3)
      expect(stats.pending).toBe(1)
      expect(stats.completed).toBe(1)
      expect(stats.completionRate).toBeCloseTo(33.33)
    })
  })

  describe('formatThaiDate', () => {
    it('should format ISO string to Thai date layout with Bangkok timezone', () => {
      const isoDate = '2026-05-15T10:30:00.000Z' // UTC 10:30 is BKK 17:30
      const formatted = formatThaiDate(isoDate)
      expect(formatted).toContain('15 พฤษภาคม 2569')
      expect(formatted).toContain('17:30')
    })
  })

  describe('formatThaiDateShort', () => {
    it('should format YYYY-MM-DD to DD-MM-YYYY format directly', () => {
      expect(formatThaiDateShort('2026-05-15')).toBe('15-05-2026')
    })
  })

  describe('convertDMYToYMD', () => {
    it('should convert DD/MM/YYYY to YYYY-MM-DD', () => {
      expect(convertDMYToYMD('26/05/2026')).toBe('2026-05-26')
      expect(convertDMYToYMD('05/12/2025')).toBe('2025-12-05')
    })
    it('should handle dash separators as well', () => {
      expect(convertDMYToYMD('26-05-2026')).toBe('2026-05-26')
    })
    it('should return empty string for invalid formats', () => {
      expect(convertDMYToYMD('240510')).toBe('')
      expect(convertDMYToYMD('')).toBe('')
    })
  })

  describe('convertYMDToDMY', () => {
    it('should convert YYYY-MM-DD to DD/MM/YYYY', () => {
      expect(convertYMDToDMY('2026-05-26')).toBe('26/05/2026')
      expect(convertYMDToDMY('2025-12-05')).toBe('05/12/2025')
    })
    it('should handle already formatted DMY values gracefully', () => {
      expect(convertYMDToDMY('26/05/2026')).toBe('26/05/2026')
    })
    it('should return raw input for invalid formats', () => {
      expect(convertYMDToDMY('240510')).toBe('240510')
      expect(convertYMDToDMY('')).toBe('')
    })
  })
})
