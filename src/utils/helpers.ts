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
  amount?: number | string;
  reason?: string;
  responsible?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!item.itemNumber || String(item.itemNumber).trim() === '') {
    errors.push('Item Number is required');
  }

  if (!item.itemName || String(item.itemName).trim() === '') {
    errors.push('Item Name is required');
  }

  if (!item.amount || parseInt(String(item.amount)) <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!item.reason || String(item.reason).trim() === '') {
    errors.push('Reason is required');
  }

  if (!item.responsible || String(item.responsible).trim() === '') {
    errors.push('Responsible party is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
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
  if (items.length === 0) return true;

  return items.some(
    (item) =>
      !item.itemNumber ||
      !item.itemName ||
      !item.amount ||
      item.amount <= 0 ||
      !item.reason ||
      !item.responsible
  );
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
  const trimmed = String(itemNumber).trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Item Number is required' };
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return { valid: false, error: 'Item Number must contain only letters and digits' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Item Number must not exceed 50 characters' };
  }
  
  return { valid: true };
}

/**
 * Validate ItemCode format (numeric, max 11 digits or empty)
 */
export function validateItemCode(itemCode: string): { valid: boolean; error?: string } {
  const trimmed = String(itemCode).trim();
  
  if (!trimmed) {
    return { valid: true }; // ItemCode is optional
  }
  
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'Item Code must contain only digits' };
  }

  if (trimmed.length > 11) {
    return { valid: false, error: 'Item Code must not exceed 11 digits' };
  }
  
  return { valid: true };
}

/**
 * Validate Amount range
 */
export function validateAmount(amount: string | number): { valid: boolean; error?: string } {
  const num = parseInt(String(amount));
  
  if (isNaN(num)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }
  
  if (num <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }
  
  if (num > 999999) {
    return { valid: false, error: 'Amount must not exceed 999,999' };
  }
  
  return { valid: true };
}

/**
 * Validate ItemName (not empty, max 100 chars)
 */
export function validateItemName(itemName: string): { valid: boolean; error?: string } {
  const trimmed = String(itemName).trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Item Name is required' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Item Name must not exceed 100 characters' };
  }
  
  return { valid: true };
}

/**
 * Validate Reason (not empty)
 */
export function validateReason(reason: string): { valid: boolean; error?: string } {
  const trimmed = String(reason).trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Reason is required' };
  }
  
  return { valid: true };
}

/**
 * Validate Responsible (not empty)
 */
export function validateResponsible(responsible: string): { valid: boolean; error?: string } {
  const trimmed = String(responsible).trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Responsible party is required' };
  }
  
  return { valid: true };
}

/**
 * Comprehensive validation for a single item with detailed error messages
 */
export function validateItemDetailed(item: any): { isValid: boolean; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  
  const itemNumberValidation = validateItemNumber(item.itemNumber);
  if (!itemNumberValidation.valid) {
    fieldErrors['itemNumber'] = itemNumberValidation.error || '';
  }
  
  const itemNameValidation = validateItemName(item.itemName);
  if (!itemNameValidation.valid) {
    fieldErrors['itemName'] = itemNameValidation.error || '';
  }
  
  const itemCodeValidation = validateItemCode(item.itemCode);
  if (!itemCodeValidation.valid) {
    fieldErrors['itemCode'] = itemCodeValidation.error || '';
  }
  
  const amountValidation = validateAmount(item.amount);
  if (!amountValidation.valid) {
    fieldErrors['amount'] = amountValidation.error || '';
  }
  
  const reasonValidation = validateReason(item.reason);
  if (!reasonValidation.valid) {
    fieldErrors['reason'] = reasonValidation.error || '';
  }
  
  const responsibleValidation = validateResponsible(item.responsible);
  if (!responsibleValidation.valid) {
    fieldErrors['responsible'] = responsibleValidation.error || '';
  }
  
  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors
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
  const seen = new Set<string>();
  const duplicates: string[] = [];
  
  items.forEach(item => {
    const num = String(item.itemNumber).trim();
    if (num && seen.has(num)) {
      if (!duplicates.includes(num)) {
        duplicates.push(num);
      }
    }
    if (num) {
      seen.add(num);
    }
  });
  
  return {
    hasDuplicates: duplicates.length > 0,
    duplicates
  };
}
