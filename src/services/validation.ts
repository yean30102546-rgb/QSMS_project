/**
 * Input Validation Service
 * Frontend validation for all form inputs
 */

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate item number format (10-12 digits)
 */
export function validateItemNumber(value: string | number): ValidationError | null {
  const itemNum = String(value).trim();
  if (!itemNum) {
    return { field: 'itemNumber', message: 'Item number is required' };
  }
  if (!/^\d{10,12}$/.test(itemNum)) {
    return { field: 'itemNumber', message: 'Item number must be 10-12 digits' };
  }
  return null;
}

/**
 * Validate item name (2-100 characters, alphanumeric + spaces/special chars)
 */
export function validateItemName(value: string): ValidationError | null {
  const name = String(value).trim();
  if (!name) {
    return { field: 'itemName', message: 'Item name is required' };
  }
  if (name.length < 2) {
    return { field: 'itemName', message: 'Item name must be at least 2 characters' };
  }
  if (name.length > 100) {
    return { field: 'itemName', message: 'Item name must not exceed 100 characters' };
  }
  // Check for XSS patterns
  if (/<script|javascript:|onerror|onclick/i.test(name)) {
    return { field: 'itemName', message: 'Item name contains invalid characters' };
  }
  return null;
}

/**
 * Validate item code (numeric, up to 12 digits)
 */
export function validateItemCode(value: string | number): ValidationError | null {
  if (!value) return null; // Optional field
  
  const code = String(value).trim();
  if (!/^\d{1,12}$/.test(code)) {
    return { field: 'itemCode', message: 'Item code must be numeric (1-12 digits)' };
  }
  return null;
}

/**
 * Validate quantity/amount (positive number, 1-1000)
 */
export function validateAmount(value: string | number): ValidationError | null {
  const amount = parseInt(String(value));
  if (isNaN(amount)) {
    return { field: 'amount', message: 'Quantity must be a number' };
  }
  if (amount < 1) {
    return { field: 'amount', message: 'Quantity must be at least 1' };
  }
  if (amount > 1000) {
    return { field: 'amount', message: 'Quantity must not exceed 1000' };
  }
  return null;
}

/**
 * Validate reason field
 */
export function validateReason(value: string): ValidationError | null {
  if (!value) {
    return { field: 'reason', message: 'Reason is required' };
  }
  const validReasons = ['รั่ว', 'แตกตะเข็บ', 'รอยมีด', 'ขวดเปื้อน', 'กล่องเปื้อนอย่างเดียว', 'อื่นๆ'];
  if (!validReasons.includes(value)) {
    return { field: 'reason', message: 'Invalid reason selected' };
  }
  return null;
}

/**
 * Validate responsible field
 */
export function validateResponsible(value: string): ValidationError | null {
  if (!value) {
    return { field: 'responsible', message: 'Responsible party is required' };
  }
  const validResponsible = ['SFC', 'Supplier', 'อื่นๆ', 'PDF', 'WFG', 'WPK', 'Customer', 'SP', 'PJW', 'Polymer', 'ธนกร', 'Fuchs'];
  if (!validResponsible.includes(value)) {
    return { field: 'responsible', message: 'Invalid responsible party selected' };
  }
  return null;
}

/**
 * Validate details/notes field
 */
export function validateDetails(value: string | undefined): ValidationError | null {
  if (!value) return null; // Optional field

  const details = String(value).trim();
  if (details.length > 500) {
    return { field: 'details', message: 'Details must not exceed 500 characters' };
  }
  // Check for XSS
  if (/<script|javascript:|onerror|onclick/i.test(details)) {
    return { field: 'details', message: 'Details contain invalid content' };
  }
  return null;
}

/**
 * Validate complete rework item
 */
export function validateReworkItem(item: {
  itemNumber?: string | number;
  itemName?: string;
  itemCode?: string | number;
  amount?: number | string;
  reason?: string;
  responsible?: string;
  details?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required fields
  const itemNumError = validateItemNumber(item.itemNumber || '');
  if (itemNumError) errors.push(itemNumError);

  const itemNameError = validateItemName(item.itemName || '');
  if (itemNameError) errors.push(itemNameError);

  const itemCodeError = validateItemCode(item.itemCode || '');
  if (itemCodeError) errors.push(itemCodeError);

  const amountError = validateAmount(item.amount || 1);
  if (amountError) errors.push(amountError);

  const reasonError = validateReason(item.reason || '');
  if (reasonError) errors.push(reasonError);

  const responsibleError = validateResponsible(item.responsible || '');
  if (responsibleError) errors.push(responsibleError);

  const detailsError = validateDetails(item.details);
  if (detailsError) errors.push(detailsError);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize input string to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return String(input)
    .replace(/[<>\"']/g, (char) => {
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

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username (3-20 alphanumeric characters)
 */
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

/**
 * Validate password strength
 */
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
  // Optional: require mix of uppercase, lowercase, numbers
  // if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
  //   return { field: 'password', message: 'Password must contain uppercase, lowercase, and numbers' };
  // }
  return null;
}