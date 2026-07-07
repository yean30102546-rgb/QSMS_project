/**
 * Canonical frontend validation for rework forms.
 * Keep these rules aligned with gas/Code.gs backend validation.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ReworkItemValidationInput {
  itemNumber?: string | number;
  itemName?: string;
  itemCode?: string | number;
  amount?: number | string;
  reason?: string;
  responsible?: string;
  details?: string;
  batchNo?: string;
  boxNumber?: string;
  reasonSubtype?: string;
  responsibleSubtype?: string;
  linkedSourceId?: string;
  customerName?: string;
  mold?: string;
  line?: string;
  verificationStatus?: string;
  imageCount?: number;
  isFastTrack?: boolean;
}

export function validateItemNumber(value: string | number | undefined | null): ValidationError | null {
  const itemNumber = String(value || '').trim();
  if (!itemNumber) {
    return null; // Item Number is optional
  }
  if (!/^[a-zA-Z0-9.\-_/ ]+$/.test(itemNumber)) {
    return { field: 'itemNumber', message: 'Item Number contains invalid characters' };
  }
  if (itemNumber.length > 50) {
    return { field: 'itemNumber', message: 'Item Number must not exceed 50 characters' };
  }
  return null;
}

export function validateItemName(value: string): ValidationError | null {
  const itemName = String(value || '').trim();
  if (!itemName) {
    return { field: 'itemName', message: 'Item Name is required' };
  }
  if (itemName.length > 100) {
    return { field: 'itemName', message: 'Item Name must not exceed 100 characters' };
  }
  if (/<script|javascript:|onerror|onclick/i.test(itemName)) {
    return { field: 'itemName', message: 'Item Name contains invalid content' };
  }
  return null;
}

export function validateItemCode(value: string | number | undefined | null): ValidationError | null {
  const itemCode = String(value || '').trim();
  if (!itemCode) {
    return null; // Item Code is optional/nullable
  }
  if (!/^\d+$/.test(itemCode)) {
    return { field: 'itemCode', message: 'Item Code must contain only digits' };
  }
  if (itemCode.length > 11) {
    return { field: 'itemCode', message: 'Item Code must not exceed 11 digits' };
  }
  return null;
}

export function validateAmount(value: string | number | undefined | null): ValidationError | null {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null; // Amount is optional
  }
  const amount = parseInt(String(value), 10);
  if (isNaN(amount)) {
    return { field: 'amount', message: 'Amount must be a valid number' };
  }
  if (amount <= 0) {
    return { field: 'amount', message: 'Amount must be greater than 0' };
  }
  if (amount > 999999) {
    return { field: 'amount', message: 'Amount must not exceed 999,999' };
  }
  return null;
}

export function validateReason(value: string): ValidationError | null {
  if (!String(value || '').trim()) {
    return { field: 'reason', message: 'Reason is required' };
  }
  return null;
}

export function validateResponsible(value: string): ValidationError | null {
  if (!String(value || '').trim()) {
    return { field: 'responsible', message: 'Responsible party is required' };
  }
  return null;
}

export function validateDetails(value: string | undefined): ValidationError | null {
  if (!value) return null;
  const details = String(value).trim();
  if (details.length > 500) {
    return { field: 'details', message: 'Details must not exceed 500 characters' };
  }
  if (/<script|javascript:|onerror|onclick/i.test(details)) {
    return { field: 'details', message: 'Details contain invalid content' };
  }
  return null;
}

export function validateBatchNo(value: string | undefined | null): ValidationError | null {
  const batchNo = String(value || '').trim();
  if (!batchNo) {
    return null; // Batch no. is optional
  }
  if (!/^[a-zA-Z0-9.\-_/ ]+$/.test(batchNo)) {
    return { field: 'batchNo', message: 'Batch no. contains invalid characters' };
  }
  return null;
}

export function validateBoxNumber(value: string | undefined): ValidationError | null {
  const boxNumber = String(value || '').trim();
  if (!boxNumber) {
    return null; // Box Number is optional/nullable
  }
  if (!/^\d+$/.test(boxNumber)) {
    return { field: 'boxNumber', message: 'Box Number must contain only numbers' };
  }
  return null;
}

export function validateReworkItem(item: ReworkItemValidationInput): ValidationResult {
  const isFastTrack = item.isFastTrack === true;

  const errors = [
    validateItemNumber(item.itemNumber || ''),
    validateItemName(item.itemName || ''),
    validateItemCode(item.itemCode || ''),
    validateAmount(item.amount ?? ''),
    validateReason(item.reason || ''),
    !isFastTrack ? validateResponsible(item.responsible || '') : null,
    validateDetails(item.details),
    validateBatchNo(item.batchNo),
    validateBoxNumber(item.boxNumber),
    // Subtype Validation (Logic for Thailand)
    (item.reason === 'รั่ว' || item.reason === 'เปื้อน') && !String(item.reasonSubtype || '').trim() 
      ? { field: 'reasonSubtype', message: `กรุณาระบุรูปแบบการ${item.reason}` } : null,
    !isFastTrack && (item.responsible === 'SFC' || item.responsible === 'Supplier') && !String(item.responsibleSubtype || '').trim()
      ? { field: 'responsibleSubtype', message: 'กรุณาระบุหน่วยงานที่รับผิดชอบ' } : null,
    !isFastTrack && !String(item.customerName || '').trim()
      ? { field: 'customerName', message: 'Customer Name is required' } : null,
    // Image Validation (Mandatory Evidence) - Removed per user request
    null,
  ].filter((error): error is ValidationError => Boolean(error));

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getFieldErrors(errors: ValidationError[]): Record<string, string> {
  return errors.reduce<Record<string, string>>((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
}

export function findDuplicateItemNumbers(
  items: Array<{ 
    itemNumber?: string | number; 
    reason?: string;
    reasonSubtype?: string;
    boxNumber?: string;
    mold?: string;
    line?: string;
  }>
): { hasDuplicates: boolean; duplicates: string[] } {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  items.forEach((item) => {
    const itemNumber = String(item.itemNumber || '').trim();
    const reason = String(item.reason || '').trim();
    const reasonSubtype = String(item.reasonSubtype || '').trim();
    const boxNumber = String(item.boxNumber || '').trim();
    const mold = String(item.mold || '').trim();
    const line = String(item.line || '').trim();
    
    if (!itemNumber || !reason) return;

    // New Composite Key: Item + Reason + Subtype + Box + Mold + Line
    const compositeKey = `${itemNumber}||${reason}||${reasonSubtype}||${boxNumber}||${mold}||${line}`;
    const duplicateLabel = `${itemNumber} (${reason}${reasonSubtype ? ` - ${reasonSubtype}` : ''}) - Box: ${boxNumber || '-'}, Mold: ${mold || '-'}, Line: ${line || '-'}`;

    if (seen.has(compositeKey) && !duplicates.includes(duplicateLabel)) {
      duplicates.push(duplicateLabel);
    }
    seen.add(compositeKey);
  });

  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}

export function isSaveDisabled(items: ReworkItemValidationInput[]): boolean {
  if (items.length === 0) return true;
  if (findDuplicateItemNumbers(items).hasDuplicates) return true;
  return items.some((item) => !validateReworkItem(item).isValid || item.verificationStatus === 'conflict');
}

export function sanitizeInput(input: string): string {
  return String(input)
    .replace(/[<>"']/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
      };
      return entities[char] || char;
    })
    .trim();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username: string): ValidationError | null {
  if (!username) {
    return { field: 'username', message: 'Username is required' };
  }
  if (username.length < 3 || username.length > 20) {
    return { field: 'username', message: 'Username must be 3-20 characters' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { field: 'username', message: 'Username can only contain letters, numbers, underscore, and hyphen' };
  }
  return null;
}

export function validatePassword(password: string): ValidationError | null {
  if (!password) {
    return { field: 'password', message: 'Password is required' };
  }
  if (password.length < 6) {
    return { field: 'password', message: 'Password must be at least 6 characters' };
  }
  if (password.length > 50) {
    return { field: 'password', message: 'Password must not exceed 50 characters' };
  }
  return null;
}
