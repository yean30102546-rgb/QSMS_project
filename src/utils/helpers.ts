import * as validationService from '../services/validation';

/**
 * Group rows by Item ID and collect URLs as array
 * ใช้สำหรับข้อมูลที่ 1 URL ต่อ 1 แถว (ไม่ใช่ array)
 * @param rows Array of objects with at least { itemId, url }
 * @returns Array grouped by itemId, with urls: string[]
 */
export function groupItemsById<T extends { itemId: string; url: string }>(rows: T[]) {
  const grouped = Object.values(
    rows.reduce((acc, row) => {
      if (!acc[row.itemId]) {
        acc[row.itemId] = { ...row, urls: [] };
      }
      acc[row.itemId].urls.push(row.url);
      return acc;
    }, {} as Record<string, T & { urls: string[] }> )
  );
  return grouped;
}
/**
 * Utility Functions
 * Formatting, validation, and helper functions
 */

/**
 * Generate a unique ID for a rework case
 * Format: RWYYMMDDHHmmMsRRR (e.g., RW2604251707123456)
 * Includes milliseconds and random suffix for uniqueness
 * ✅ ใช้ timezone Asia/Bangkok เสมอ
 */
export function generateCaseId(): string {
  const now = new Date();
  // แปลงเป็น Bangkok timezone
  const bkk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const yy = bkk.getFullYear().toString().slice(2);
  const mm = (bkk.getMonth() + 1).toString().padStart(2, '0');
  const dd = bkk.getDate().toString().padStart(2, '0');
  const hh = bkk.getHours().toString().padStart(2, '0');
  const min = bkk.getMinutes().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0'); // ms ไม่ต้องแปลง timezone
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `RW${yy}${mm}${dd}${hh}${min}${ms}${random}`;
}

/**
 * Generate unique sub-IDs for items within a case
 * Format: {caseId}-{itemNumber:03d} (e.g., RW2604251707-001)
 */
export function generateItemSubId(caseId: string, itemIndex: number): string {
  return `${caseId}-${(itemIndex + 1).toString().padStart(3, '0')}`;
}

/**
 * Format date to Thai format
 * ✅ ใช้ timezone Asia/Bangkok
 */
export function formatDateThai(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Validate required fields
 */
export function validateReworkItem(item: {
  itemNumber?: string | number;
  itemName?: string;
  itemCode?: string | number;
  amount?: number | string;
  reason?: string;
  responsible?: string;
  details?: string;
}): { isValid: boolean; errors: string[] } {
  const validation = validationService.validateReworkItem(item);
  return {
    isValid: validation.isValid,
    errors: validation.errors.map((error) => error.message),
  };
}

/**
 * Validate all form items
 */
export function validateAllItems(items: any[]): { isValid: boolean; errors: Record<number, string[]> } {
  const errors: Record<number, string[]> = {};

  items.forEach((item, idx) => {
    const validation = validateReworkItem(item);
    if (!validation.isValid) {
      errors[idx] = validation.errors;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check if save button should be disabled
 * Required fields: itemNumber, itemName, amount, reason, responsible
 */
export function isSaveDisabled(items: any[]): boolean {
  return validationService.isSaveDisabled(items);
}

/**
 * Sort cases by status: Pending > In-Progress > Completed
 */
export function sortCasesByStatus(
  cases: any[]
): any[] {
  const statusOrder = { Pending: 0, 'In-Progress': 1, Completed: 2 };

  return [...cases].sort(
    (a, b) =>
      (statusOrder[a.status as keyof typeof statusOrder] || 999) -
      (statusOrder[b.status as keyof typeof statusOrder] || 999)
  );
}

/**
 * Comprehensive filter options interface
 */
export interface FilterOptions {
  query?: string;
  status?: string[];
  source?: string[];
  reason?: string[];
  responsible?: string[];
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Filter cases by search query
 */
export function filterCasesByQuery(cases: any[], query: string): any[] {
  if (!query.trim()) return cases;

  const lowerQuery = query.toLowerCase();

  return cases.filter(
    (caseItem) =>
      String(caseItem.id || '').toLowerCase().includes(lowerQuery) ||
      String(caseItem.source || '').toLowerCase().includes(lowerQuery) ||
      // Search in all items, not just first one
      caseItem.items?.some((item: any) =>
        String(item.itemName || '').toLowerCase().includes(lowerQuery) ||
        String(item.itemNumber || '').toLowerCase().includes(lowerQuery) ||
        String(item.itemCode || '').toLowerCase().includes(lowerQuery) ||
        String(item.reason || '').toLowerCase().includes(lowerQuery) ||
        String(item.responsible || '').toLowerCase().includes(lowerQuery) ||
        String(item.details || '').toLowerCase().includes(lowerQuery)
      )
  );
}

/**
 * Filter cases by multiple criteria (comprehensive)
 */
export function filterCasesByMultipleCriteria(
  cases: any[],
  options: FilterOptions
): any[] {
  return cases.filter((caseItem) => {
    // Status filter
    if (options.status && options.status.length > 0) {
      if (!options.status.includes(caseItem.status)) {
        return false;
      }
    }

    // Source filter
    if (options.source && options.source.length > 0) {
      if (!options.source.includes(caseItem.source)) {
        return false;
      }
    }

    // Reason filter - check all items in case
    if (options.reason && options.reason.length > 0) {
      const hasReason = caseItem.items.some((item: any) =>
        options.reason!.includes(item.reason)
      );
      if (!hasReason) {
        return false;
      }
    }

    // Responsible filter - check all items in case
    if (options.responsible && options.responsible.length > 0) {
      const hasResponsible = caseItem.items.some((item: any) =>
        options.responsible!.includes(item.responsible)
      );
      if (!hasResponsible) {
        return false;
      }
    }

    // Date range filter
    if (options.dateFrom || options.dateTo) {
      const itemDate = new Date(caseItem.date);
      
      if (options.dateFrom) {
        const fromDate = new Date(options.dateFrom);
        if (itemDate < fromDate) return false;
      }

      if (options.dateTo) {
        const toDate = new Date(options.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire day
        if (itemDate > toDate) return false;
      }
    }

    // Search query filter
    if (options.query && options.query.trim()) {
      const filtered = filterCasesByQuery([caseItem], options.query);
      if (filtered.length === 0) return false;
    }

    return true;
  });
}

/**
 * Check if a value is a valid number
 */
export function isNumeric(value: string): boolean {
  return /^\d*$/.test(value);
}

/**
 * Enforce numeric input only
 */
export function enforceNumeric(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/**
 * Format timestamp to readable format
 * ✅ ใช้ timezone Asia/Bangkok
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionRate(cases: any[]): number {
  if (cases.length === 0) return 0;
  const completed = cases.filter((c) => c.status === 'Completed').length;
  return Math.round((completed / cases.length) * 100);
}

/**
 * Get statistics from cases
 */
export function getStatistics(cases: any[]) {
  return {
    total: cases.length,
    pending: cases.filter((c) => c.status === 'Pending').length,
    inProgress: cases.filter((c) => c.status === 'In-Progress').length,
    completed: cases.filter((c) => c.status === 'Completed').length,
    completionRate: calculateCompletionRate(cases),
  };
}

/**
 * Format ISO date to Thai format with time
 * Input: "2026-04-27T01:59:09.000Z"
 * Output: "27 เมษายน 2569, 08:59"
 * ✅ ใช้ timezone Asia/Bangkok เสมอ
 */
export function formatThaiDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    // แปลงเป็น Bangkok timezone เพื่อดึงค่า day/month/year/hours ที่ถูกต้อง
    const bkk = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    
    // Thai month names
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
      'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
      'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const day = bkk.getDate();
    const month = thaiMonths[bkk.getMonth()];
    // Thai year = Western year + 543
    const year = bkk.getFullYear() + 543;
    const hours = String(bkk.getHours()).padStart(2, '0');
    const minutes = String(bkk.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return isoDate;
  }
}

// ===== ADVANCED VALIDATION FUNCTIONS =====

/**
 * Validate ItemNumber format (alphanumeric, max 50 characters)
 */
export function validateItemNumber(itemNumber: string): { valid: boolean; error?: string } {
  const error = validationService.validateItemNumber(itemNumber);
  return error ? { valid: false, error: error.message } : { valid: true };
}

/**
 * Validate ItemCode format (numeric, max 11 digits or empty)
 */
export function validateItemCode(itemCode: string): { valid: boolean; error?: string } {
  const error = validationService.validateItemCode(itemCode);
  return error ? { valid: false, error: error.message } : { valid: true };
}

/**
 * Validate Amount range
 */
export function validateAmount(amount: string | number): { valid: boolean; error?: string } {
  const error = validationService.validateAmount(amount);
  return error ? { valid: false, error: error.message } : { valid: true };
}

/**
 * Validate ItemName (not empty, max 100 chars)
 */
export function validateItemName(itemName: string): { valid: boolean; error?: string } {
  const error = validationService.validateItemName(itemName);
  return error ? { valid: false, error: error.message } : { valid: true };
}

/**
 * Validate Reason (not empty)
 */
export function validateReason(reason: string): { valid: boolean; error?: string } {
  const error = validationService.validateReason(reason);
  return error ? { valid: false, error: error.message } : { valid: true };
}

/**
 * Validate Responsible (not empty)
 */
export function validateResponsible(responsible: string): { valid: boolean; error?: string } {
  const error = validationService.validateResponsible(responsible);
  return error ? { valid: false, error: error.message } : { valid: true };
}

/**
 * Comprehensive validation for a single item with detailed error messages
 */
export function validateItemDetailed(item: any): { isValid: boolean; fieldErrors: Record<string, string> } {
  const validation = validationService.validateReworkItem(item);
  return {
    isValid: validation.isValid,
    fieldErrors: validationService.getFieldErrors(validation.errors),
  };
}

/**
 * Sanitize string input (remove unwanted characters)
 */
export function sanitizeString(input: string): string {
  return String(input)
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets (prevent HTML injection)
    .slice(0, 255); // Max 255 chars
}

/**
 * Check for duplicate ItemNumbers in items array
 */
export function findDuplicateItemNumbers(items: any[]): { hasDuplicates: boolean; duplicates: string[] } {
  return validationService.findDuplicateItemNumbers(items);
}
