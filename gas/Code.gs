/**
 * QSMS Rework Management System - Google Apps Script Backend
 * Deployed as a Web App
 * 
 * Setup Instructions:
 * 1. Create a new Google Apps Script project
 * 2. Copy this code into the script editor
 * 3. Create triggers and deploy as Web App
 * 4. Set execute as the Google Account that owns the spreadsheet
 * 5. Allow anyone to access
 * 6. Copy the deployment URL and use it in the frontend API service
 */

// ===== CONFIGURATION =====
// Configure these in Apps Script Properties.
const SHEET_ID = getRequiredScriptProperty('GOOGLE_SHEET_ID');
const SHEET_NAME = 'Rework Cases';
const IMG_URL_SHEET_NAME = 'Img_Url';
const ITEM_MASTER_SHEET_NAME = 'ItemMaster';
const BACKUP_SHEET_NAME = 'Backup';
const DRIVE_FOLDER_ID = getRequiredScriptProperty('DRIVE_FOLDER_ID'); // Google Drive folder for images

// ===== COLUMN DEFINITIONS (0-indexed) =====
const COL_TIMESTAMP = 0;
const COL_STATUS = 1;
const COL_SOURCE = 2;
const COL_CUSTOMER = 3;
const COL_CASE_ID = 4;
const COL_ITEM_ID = 5;
const COL_ITEM_NUMBER = 6;
const COL_ITEM_NAME = 7;
const COL_ITEM_CODE = 8;
const COL_BATCH_NO = 9;
const COL_AMOUNT = 10;
const COL_REASON = 11;
const COL_REASON_SUBTYPE = 12;
const COL_LINKED_ID = 13;
const COL_RESPONSIBLE = 14;
const COL_RESP_SUBTYPE = 15;
const COL_DETAILS = 16;
const COL_RESOLUTION = 17;
const COL_COST = 18;
const COL_IMAGE_URLS = 19;
const COL_CASE_FOLDER = 20;
const COL_OR_FILES = 21;
const COL_OR_FOLDER = 22;
const COL_UID = 23;

const MAIN_HEADERS = [
  'Timestamp', 'Status', 'Source', 'Customer Name', 'Case ID', 'Item ID', 
  'Item Number', 'Item Name', 'Item Code', 'Batch No', 'Amount', 
  'Reason', 'Reason Subtype', 'Linked Source ID', 'Responsible', 
  'Responsible Subtype', 'Details', 'Resolution Method', 'Rework Cost', 
  'Image URLs', 'Case Folder URL', 'OR Files', 'OR Folder URL', 'UID'
];

// ===== AUTHENTICATION SETTINGS =====
const REQUIRE_TOKEN_VALIDATION = true;

function getScriptProperty(key) {
  return String(PropertiesService.getScriptProperties().getProperty(key) || '').trim();
}

function getRequiredScriptProperty(key) {
  const value = getScriptProperty(key);
  if (!value) {
    throw new Error(key + ' is not configured in script properties.');
  }
  return value;
}

function getAuthSecret() {
  const secret = getScriptProperty('AUTH_TOKEN_SECRET');
  if (!secret) {
    throw new Error('AUTH_TOKEN_SECRET is not configured in script properties.');
  }
  return secret;
}

function getAuthProfiles() {
  return {
    ADMIN: {
      password: getScriptProperty('ADMIN_PASSWORD'),
      email: getScriptProperty('ADMIN_USER') || getScriptProperty('ADMIN_EMAIL'),
      name: getScriptProperty('ADMIN_NAME') || 'Admin',
      role: 'admin',
      department: 'Management',
    },
    QSMS: {
      password: getScriptProperty('QSMS_PASSWORD'),
      email: getScriptProperty('QSMS_USER') || getScriptProperty('QSMS_EMAIL'),
      name: getScriptProperty('QSMS_NAME') || 'QSMS',
      role: 'qsms',
      department: 'QSMS',
    },
    WFG: {
      password: getScriptProperty('WFG_PASSWORD'),
      email: getScriptProperty('WFG_USER') || getScriptProperty('WFG_EMAIL'),
      name: getScriptProperty('WFG_NAME') || 'WFG',
      role: 'wfg',
      department: 'WFG',
    },
    FINANCE: {
      password: getScriptProperty('FINANCE_PASSWORD'),
      email: getScriptProperty('FINANCE_USER') || getScriptProperty('FINANCE_EMAIL'),
      name: getScriptProperty('FINANCE_NAME') || 'Finance',
      role: 'finance',
      department: 'Finance',
    },
  };
}

function getAuthProfileEmails() {
  const profiles = getAuthProfiles();
  const emails = {};
  Object.keys(profiles).forEach(function (key) {
    const profile = profiles[key];
    if (profile && profile.email) {
      // Normalize to lowercase for comparison
      emails[key] = String(profile.email).trim().toLowerCase();
    }
  });
  return emails;
}

function getOrCreateSheet(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    applyHeaderFormatting(sheet, headers);
    Logger.log('Created new sheet: ' + sheetName);
    return sheet;
  }

  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const headerMismatch = headers.some(function(header, index) {
    return String(firstRow[index] || '').trim() !== header;
  });

  if (headerMismatch) {
    applyHeaderFormatting(sheet, headers);
    Logger.log('Updated headers and formatting for sheet: ' + sheetName);
  }

  return sheet;
}

/**
 * Helper to write headers and apply consistent premium formatting
 */
function applyHeaderFormatting(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setFontWeight('bold')
    .setBackground('#000000')
    .setFontColor('#FFFFFF')
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center');
  
  // Freeze the header row
  sheet.setFrozenRows(1);
}

function createImgUrlLogRows(caseId, itemId, itemIndex, itemImageUrls, caseFolderUrl) {
  const rows = [];
  for (var i = 0; i < itemImageUrls.length; i++) {
    rows.push([
      caseId,
      itemId,
      itemIndex + 1,
      i + 1,
      itemImageUrls[i],
      caseFolderUrl
    ]);
  }
  return rows;
}

function createResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return createResponse({ success: true, message: 'GET endpoint active. Use POST for action calls.' });
}

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate ItemNumber format (alphanumeric, max 50 chars)
 */
function validateItemNumber(itemNumber) {
  if (!itemNumber) {
    return { valid: false, error: 'Item Number is required' };
  }
  
  const str = String(itemNumber).trim();
  
  if (!/^[a-zA-Z0-9.\-_/ ]+$/.test(str)) {
    return { valid: false, error: 'Item Number contains invalid characters. Got: ' + str };
  }

  if (str.length > 50) {
    return { valid: false, error: 'Item Number must not exceed 50 characters. Got: ' + str + ' (' + str.length + ' chars)' };
  }
  
  return { valid: true };
}

/**
 * Validate BatchNo format (numeric only)
 */
function validateBatchNo(batchNo) {
  if (!batchNo) {
    return { valid: false, error: 'Batch No. is required' };
  }
  
  const str = String(batchNo).trim();
  if (!/^[a-zA-Z0-9.\-_/ ]+$/.test(str)) {
    return { valid: false, error: 'Batch No. contains invalid characters. Got: ' + str };
  }
  
  return { valid: true };
}

/**
 * Validate ItemCode format (numeric, max 11 digits if provided)
 */
function validateItemCode(itemCode) {
  if (!itemCode || itemCode === '') {
    return { valid: true }; // Optional field
  }
  
  const str = String(itemCode).trim();
  
  if (!/^\d+$/.test(str)) {
    return { valid: false, error: 'Item Code must contain only digits if provided. Got: ' + str };
  }

  if (str.length > 11) {
    return { valid: false, error: 'Item Code must not exceed 11 digits. Got: ' + str + ' (' + str.length + ' digits)' };
  }
  
  return { valid: true };
}

/**
 * Validate Amount (must be positive number, max 999999)
 */
function validateAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return { valid: false, error: 'Amount is required' };
  }
  
  const num = parseInt(amount);
  if (isNaN(num)) {
    return { valid: false, error: 'Amount must be a valid number. Got: ' + amount };
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
 * Validate ItemName (required, max 100 chars)
 */
function validateItemName(itemName) {
  if (!itemName) {
    return { valid: false, error: 'Item Name is required' };
  }
  
  const str = String(itemName).trim();
  if (str.length === 0) {
    return { valid: false, error: 'Item Name cannot be empty' };
  }
  
  if (str.length > 100) {
    return { valid: false, error: 'Item Name must not exceed 100 characters' };
  }
  
  return { valid: true };
}

/**
 * Validate Reason (required)
 */
function validateReason(reason) {
  if (!reason) {
    return { valid: false, error: 'Reason is required' };
  }
  
  const str = String(reason).trim();
  if (str.length === 0) {
    return { valid: false, error: 'Reason cannot be empty' };
  }
  
  return { valid: true };
}

/**
 * Validate Responsible (required)
 */
function validateResponsible(responsible) {
  if (!responsible) {
    return { valid: false, error: 'Responsible party is required' };
  }
  
  const str = String(responsible).trim();
  if (str.length === 0) {
    return { valid: false, error: 'Responsible party cannot be empty' };
  }
  
  return { valid: true };
}

/**
 * Validate CustomerName (required)
 */
function validateCustomerName(customerName) {
  if (!customerName) {
    return { valid: false, error: 'Customer Name is required' };
  }
  
  const str = String(customerName).trim();
  if (str.length === 0) {
    return { valid: false, error: 'Customer Name cannot be empty' };
  }
  
  return { valid: true };
}

/**
 * Sanitize string input
 */
function sanitizeString(input) {
  if (!input) return '';
  
  return String(input)
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 255); // Max 255 chars
}

/**
 * Validate single item with all checks
 */
function validateItem(item) {
  const errors = [];
  
  const itemNumberCheck = validateItemNumber(item.itemNumber);
  if (!itemNumberCheck.valid) errors.push(itemNumberCheck.error);
  
  const itemNameCheck = validateItemName(item.itemName);
  if (!itemNameCheck.valid) errors.push(itemNameCheck.error);
  
  const itemCodeCheck = validateItemCode(item.itemCode);
  if (!itemCodeCheck.valid) errors.push(itemCodeCheck.error);

  const batchNoCheck = validateBatchNo(item.batchNo);
  if (!batchNoCheck.valid) errors.push(batchNoCheck.error);
  
  const amountCheck = validateAmount(item.amount);
  if (!amountCheck.valid) errors.push(amountCheck.error);
  
  const reasonCheck = validateReason(item.reason);
  if (!reasonCheck.valid) errors.push(reasonCheck.error);
  
  const responsibleCheck = validateResponsible(item.responsible);
  if (!responsibleCheck.valid) errors.push(responsibleCheck.error);

  const customerCheck = validateCustomerName(item.customerName);
  if (!customerCheck.valid) errors.push(customerCheck.error);
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Check for duplicate ItemNumbers in payload
 */
function checkDuplicateItemNumbers(items) {
  const seen = new Set();
  const duplicates = [];
  
  for (let i = 0; i < items.length; i++) {
    const itemNum = String(items[i].itemNumber || '').trim();
    const reason = String(items[i].reason || '').trim();
    if (!itemNum || !reason) {
      continue;
    }

    const compositeKey = itemNum + '||' + reason;
    const duplicateLabel = itemNum + ' (' + reason + ')';
    if (seen.has(compositeKey)) {
      if (!duplicates.includes(duplicateLabel)) {
        duplicates.push(duplicateLabel);
      }
    }
    seen.add(compositeKey);
  }
  
  return {
    hasDuplicates: duplicates.length > 0,
    duplicates: duplicates
  };
}

function normalizeSheetText(value) {
  return String(value || '').trim();
}

function normalizeSheetAmount(value) {
  var amount = Number(value);
  return isNaN(amount) ? 0 : amount;
}

function createStableReadItemId(caseId, rawItemId, itemNumber, reason, rowIndex, seenIds) {
  var preferredId = normalizeSheetText(rawItemId);
  var fallbackId = [
    normalizeSheetText(caseId) || 'case',
    normalizeSheetText(itemNumber) || 'item',
    normalizeSheetText(reason) || 'reason',
    Utilities.formatString('%03d', rowIndex + 1)
  ].join('__');
  var baseId = preferredId || fallbackId;
  var duplicateCount = seenIds[baseId] || 0;
  seenIds[baseId] = duplicateCount + 1;
  return duplicateCount === 0 ? baseId : baseId + '__' + (duplicateCount + 1);
}

// ===== AUTHENTICATION FUNCTIONS =====

/**
 * Validate authentication token
 * In production: verify JWT signature and claims from backend
 */
function decodeTokenPayload(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    return null;
  }

  const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + new Array(padding + 1).join('=');

  try {
    const decoded = Utilities.newBlob(Utilities.base64Decode(padded)).getDataAsString();
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

function base64UrlEncode(value) {
  const bytes = typeof value === 'string'
    ? Utilities.newBlob(value).getBytes()
    : value;
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function signToken(unsignedToken) {
  const signatureBytes = Utilities.computeHmacSha256Signature(unsignedToken, getAuthSecret());
  return base64UrlEncode(signatureBytes);
}

function createAuthToken(email, profile) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (8 * 60 * 60);
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify({
    sub: email,
    profile: profile,
    iat: now,
    exp: exp,
    type: 'auth_token'
  }));
  const unsignedToken = header + '.' + payload;
  return {
    token: unsignedToken + '.' + signToken(unsignedToken),
    expiresIn: exp - now
  };
}

function validateToken(token, authProfile, authEmail) {
  if (!REQUIRE_TOKEN_VALIDATION) {
    return { valid: true };
  }

  if (!token) {
    return { valid: false, error: 'No token provided' };
  }

  const payload = decodeTokenPayload(token);
  if (!payload) {
    return { valid: false, error: 'Invalid token format' };
  }

  const parts = String(token || '').split('.');
  const expectedSignature = signToken(parts[0] + '.' + parts[1]);
  if (parts[2] !== expectedSignature) {
    return { valid: false, error: 'Invalid token signature' };
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = Number(payload.exp || 0);
  if (!exp || now > exp) {
    return { valid: false, error: 'Token expired' };
  }

  const tokenEmail = String(payload.sub || '').trim().toLowerCase();
  const tokenProfile = String(payload.profile || '').trim().toUpperCase();
  const requestProfile = String(authProfile || '').trim().toUpperCase();
  const requestEmail = String(authEmail || '').trim().toLowerCase();

  if (!tokenEmail) {
    return { valid: false, error: 'Token subject is missing' };
  }

  if (!requestProfile) {
    return { valid: false, error: 'Authentication profile is required' };
  }

  if (requestEmail && requestEmail !== tokenEmail) {
    return { valid: false, error: 'Authentication email mismatch' };
  }

  if (tokenProfile && tokenProfile !== requestProfile) {
    return { valid: false, error: 'Authentication profile mismatch' };
  }

  const allowedEmails = getAuthProfileEmails();
  if (allowedEmails[requestProfile] && allowedEmails[requestProfile] !== tokenEmail) {
    return { valid: false, error: 'Profile is not allowed for this token' };
  }

  return {
    valid: true,
    user: tokenEmail,
    profile: requestProfile
  };
}

function handlePasswordLogin(payload) {
  const profile = String(payload.profile || '').trim().toUpperCase();
  const password = String(payload.password || '').trim();
  const account = getAuthProfiles()[profile];

  if (!account || !account.password || !account.email) {
    return { success: false, error: 'Authentication profile is not configured.' };
  }

  if (!password || password !== account.password) {
    return { success: false, error: 'Invalid profile or password' };
  }

  const tokenResult = createAuthToken(account.email, profile);
  return {
    success: true,
    data: {
      token: tokenResult.token,
      expiresIn: tokenResult.expiresIn,
      user: {
        email: account.email,
        name: account.name,
        role: account.role,
        department: account.department,
      },
    },
  };
}

// ===== GLOBAL FUNCTIONS =====

/**
 * Main doPost handler for all form submissions
 */
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return createResponse({ success: false, error: 'No data received' });
    }

    const payload = JSON.parse(e.postData.contents);
    
    const action = payload.action;

    if (action === 'loginWithPassword') {
      return createResponse(handlePasswordLogin(payload));
    }

    // ===== TOKEN VALIDATION =====
    // Verify authentication before processing any action
    if (REQUIRE_TOKEN_VALIDATION) {
      const tokenValidation = validateToken(payload.token, payload.authProfile, payload.authEmail);
      if (!tokenValidation.valid) {
        return createResponse({
          success: false,
          error: tokenValidation.error || 'Unauthorized',
          statusCode: 401
        });
      }
      // Store user info for audit logging (optional)
      payload._authenticatedUser = tokenValidation.user;
      payload._authenticatedProfile = tokenValidation.profile;
    }
    
    let response;
    switch (action) {
      case 'insert':
        response = handleInsert(payload);
        break;
      case 'readAll':
        response = handleReadAll(payload);
        break;
      case 'update':
        response = handleUpdate(payload);
        break;
      case 'dashboardStats':
        response = handleDashboardStats(payload);
        break;
      case 'getItemMaster':
        response = getItemMaster();
        break;
      case 'saveItemMaster':
        response = saveItemMaster(payload);
        break;
      case 'delete':
        response = handleDelete(payload);
        break;
      case 'getImageDataUrl':
        response = getImageDataUrl(payload);
        break;
      default:
        response = { success: false, error: 'Unknown action' };
    }

    return createResponse(response);
  } catch (error) {
    return createResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * ===== ACTION HANDLERS =====
 */

/**
 * Handle INSERT action - Create a new rework case
 */
function handleInsert(payload) {
  var lock;
  try {
    // ===== INPUT VALIDATION =====
    if (!payload.source || String(payload.source).trim() === '') {
      return {
        success: false,
        error: 'Source is required',
        errorCode: 'INVALID_SOURCE'
      };
    }

    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return {
        success: false,
        error: 'At least one item is required',
        errorCode: 'NO_ITEMS'
      };
    }

    if (payload.items.length > 20) {
      return {
        success: false,
        error: 'Maximum 20 items per case allowed',
        errorCode: 'TOO_MANY_ITEMS'
      };
    }

    // Check for duplicate ItemNumber + Reason combinations
    const dupCheck = checkDuplicateItemNumbers(payload.items);
    if (dupCheck.hasDuplicates) {
      return {
        success: false,
        error: 'Duplicate Item Number + Reason combinations found: ' + dupCheck.duplicates.join(', '),
        errorCode: 'DUPLICATE_ITEMS'
      };
    }

    // Validate each item
    const validationErrors = [];
    for (let i = 0; i < payload.items.length; i++) {
      const itemValidation = validateItem(payload.items[i]);
      if (!itemValidation.valid) {
        validationErrors.push({
          itemIndex: i + 1,
          errors: itemValidation.errors
        });
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        error: 'Validation failed for ' + validationErrors.length + ' item(s)',
        errorCode: 'VALIDATION_ERROR',
        details: validationErrors
      };
    }

    // ===== DATA INSERTION =====
    lock = LockService.getScriptLock();
    lock.waitLock(30000);

    const sheet = getOrCreateSheet(SHEET_NAME, MAIN_HEADERS);
    const existingCaseIds = new Set();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingRows = sheet.getRange(2, COL_CASE_ID + 1, lastRow - 1, 1).getValues();
      existingRows.forEach(function(row) {
        const id = String(row[0] || '').trim();
        if (id) {
          existingCaseIds.add(id);
        }
      });
    }
    
    // Generate unique case ID with timestamp + random suffix, checked against existing sheet IDs.
    const caseId = generateCaseId(existingCaseIds);
    const now = new Date();
    const timestamp = Utilities.formatDate(now, "Asia/Bangkok", "yyyy-MM-dd'T'HH:mm:ss+07:00");

    // ===== สร้าง Folder สำหรับ Case นี้ (สร้างครั้งเดียว) =====
    // จะได้ folder URL ไว้บันทึกลง Google Sheet
    var caseFolder = getOrCreateCaseFolder(caseId);
    var caseFolderUrl = caseFolder.url; // URL ของ folder เช่น https://drive.google.com/drive/folders/xxx
    Logger.log('📁 Case folder: ' + caseFolderUrl);

    // ===== เตรียมข้อมูลแต่ละ item =====
    var rowsToInsert = [];
    var itemIds = [];
    var imgLogRows = [];
    var imgUrlSheet = getOrCreateSheet(IMG_URL_SHEET_NAME, ['Case ID', 'Item ID', 'Item Index', 'Image Index', 'Image URL', 'Case Folder URL']);

    var tempIdToNewId = {};

    // ===== อัพโหลดไฟล์ OR (เฉพาะกรณีที่มี item ทุกตัวเป็น OR) ===== ทำครั้งเดียวต่อเคส
    let orFilesData = { urls: [], folderUrl: '' };
    const isAllOR = payload.items.length > 0 && payload.items.every(function(item) { return item.customerName === 'OR'; });
    if (isAllOR && payload.orFiles && payload.orFiles.length > 0) {
      orFilesData = uploadORFilesToDrive(payload.orFiles, caseId, caseFolder.id);
    }

    payload.items.forEach(function(item, index) {
      var itemId = caseId + '-' + String(index + 1).padStart(3, '0');
      itemIds.push(itemId);
      
      // Store mapping for cross-item links
      if (item.id) {
        tempIdToNewId[item.id] = itemId;
      }

      // ===== อัพโหลดรูปไปไว้ใน Folder ของ Case =====
      var itemImageUrls = []; // เก็บ URL ของแต่ละรูป

      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        Logger.log('📸 Uploading ' + item.images.length + ' images for ' + itemId);

        item.images.forEach(function(base64Data, imgIdx) {
          Logger.log('  Image ' + (imgIdx + 1) + '/' + item.images.length);
          var imageUrl = uploadImageToDrive(base64Data, itemId, caseFolder.id);
          if (imageUrl) {
            itemImageUrls.push(imageUrl);
            imgLogRows.push([caseId, itemId, index + 1, imgIdx + 1, imageUrl, caseFolderUrl]);
          }
        });

        Logger.log('✓ Done uploading images for ' + itemId + ' (' + itemImageUrls.length + ' URLs)');
      } else {
        Logger.log('ℹ️ No images for ' + itemId);
      }

      // ===== สร้าง row สำหรับเขียนลง Sheet =====
      // ใช้ลำดับตาม COL_ constants
      var row = [];
      row[COL_TIMESTAMP] = timestamp;
      row[COL_STATUS] = 'Pending';
      row[COL_SOURCE] = sanitizeString(payload.source);
      row[COL_CUSTOMER] = sanitizeString(item.customerName || payload.customerName || '');
      row[COL_CASE_ID] = caseId;
      row[COL_ITEM_ID] = itemId;
      row[COL_ITEM_NUMBER] = sanitizeString(item.itemNumber);
      row[COL_ITEM_NAME] = sanitizeString(item.itemName);
      row[COL_ITEM_CODE] = sanitizeString(item.itemCode);
      row[COL_BATCH_NO] = sanitizeString(item.batchNo || '');
      row[COL_AMOUNT] = item.amount;
      row[COL_REASON] = sanitizeString(item.reason);
      row[COL_REASON_SUBTYPE] = sanitizeString(item.reasonSubtype || '');
      row[COL_LINKED_ID] = sanitizeString(item.linkedSourceId || '');
      row[COL_RESPONSIBLE] = sanitizeString(item.responsible);
      row[COL_RESP_SUBTYPE] = sanitizeString(item.responsibleSubtype || '');
      row[COL_DETAILS] = sanitizeString(item.details || '');
      row[COL_RESOLUTION] = '';
      row[COL_COST] = '';
      row[COL_IMAGE_URLS] = itemImageUrls.length > 0 ? itemImageUrls.join('|') : '';
      row[COL_CASE_FOLDER] = caseFolderUrl;
      row[COL_OR_FILES] = orFilesData.urls.join('|');
      row[COL_OR_FOLDER] = orFilesData.folderUrl;
      // Use item.uid if provided (e.g. from a clone or retry), otherwise generate a fresh UUID
      row[COL_UID] = item.uid || Utilities.getUuid();
      
      rowsToInsert.push(row);
    });

    // ===== Second pass: Resolve temporary linkedSourceId to real itemId =====
    rowsToInsert.forEach(function(row, index) {
      var originalLinkedId = payload.items[index].linkedSourceId;
      if (originalLinkedId && tempIdToNewId[originalLinkedId]) {
        row[COL_LINKED_ID] = tempIdToNewId[originalLinkedId];
      }
    });

    // Append rows to Rework Cases sheet
    if (rowsToInsert.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, rowsToInsert[0].length)
        .setValues(rowsToInsert);
    }

    // Append image URL rows to Img_Url sheet
    if (imgLogRows.length > 0) {
      imgUrlSheet.getRange(imgUrlSheet.getLastRow() + 1, 1, imgLogRows.length, imgLogRows[0].length)
        .setValues(imgLogRows);
      Logger.log('✓ Logged ' + imgLogRows.length + ' image URL rows to ' + IMG_URL_SHEET_NAME);
    }

    // Create backup
    createBackup(sheet);

    if (lock) {
      lock.releaseLock();
      lock = null;
    }

    return {
      success: true,
      message: `Case ${caseId} inserted successfully with ${payload.items.length} items`,
      data: {
        caseId: caseId,
        itemIds: itemIds,
        timestamp: timestamp
      }
    };
  } catch (error) {
    if (lock) {
      lock.releaseLock();
    }
    return {
      success: false,
      error: 'Insert failed: ' + error.toString(),
      errorCode: 'INSERT_ERROR'
    };
  }
}

/**
 * Handle READ ALL action - Fetch all cases from Google Sheets
 */
function handleReadAll(payload) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    const imgUrlSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(IMG_URL_SHEET_NAME);
    const imgUrlMap = new Map();
    if (imgUrlSheet) {
      const imgData = imgUrlSheet.getDataRange().getValues();
      for (let i = 1; i < imgData.length; i++) {
        const [caseId, itemId, itemIndex, imageIndex, imageUrl] = imgData[i];
        const key = String(caseId || '').trim() + '|' + String(itemId || '').trim();
        if (!key || !imageUrl) continue;
        if (!imgUrlMap.has(key)) {
          imgUrlMap.set(key, []);
        }
        imgUrlMap.get(key).push(String(imageUrl).trim());
      }
    }

    if (!data || data.length <= 1) {
      return {
        success: true,
        message: 'No data rows found',
        data: []
      };
    }

    // Skip header row and convert to objects
    const caseMap = new Map(); // Group items by case ID
    const seenItemIdsByCase = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const caseId = normalizeSheetText(row[COL_CASE_ID]);
      if (!caseId) continue;

      const rawItemId = normalizeSheetText(row[COL_ITEM_ID]);
      const itemNumber = normalizeSheetText(row[COL_ITEM_NUMBER]);
      const reason = normalizeSheetText(row[COL_REASON]);
      
      if (!seenItemIdsByCase[caseId]) {
        seenItemIdsByCase[caseId] = {};
      }
 
      const itemId = createStableReadItemId(caseId, rawItemId, itemNumber, reason, i, seenItemIdsByCase[caseId]);

      const rawImageUrls = normalizeSheetText(row[COL_IMAGE_URLS]);
      let imageUrlsArray = rawImageUrls ? rawImageUrls.split('|').filter(function(u) { return u.trim() !== ''; }) : [];
      const imageKey = caseId + '|' + rawItemId;
      if (imgUrlMap.has(imageKey)) {
        const storedUrls = imgUrlMap.get(imageKey);
        if (storedUrls && storedUrls.length > 0) {
          imageUrlsArray = storedUrls;
        }
      }

      const item = {
        id: itemId,
        itemNumber: itemNumber,
        itemName: normalizeSheetText(row[COL_ITEM_NAME]),
        itemCode: normalizeSheetText(row[COL_ITEM_CODE]),
        batchNo: normalizeSheetText(row[COL_BATCH_NO]),
        amount: normalizeSheetAmount(row[COL_AMOUNT]),
        reason: reason,
        reasonSubtype: normalizeSheetText(row[COL_REASON_SUBTYPE]),
        linkedSourceId: normalizeSheetText(row[COL_LINKED_ID]),
        responsible: normalizeSheetText(row[COL_RESPONSIBLE]),
        responsibleSubtype: normalizeSheetText(row[COL_RESP_SUBTYPE]),
        details: normalizeSheetText(row[COL_DETAILS]),
        customerName: normalizeSheetText(row[COL_CUSTOMER]),
        status: normalizeSheetText(row[COL_STATUS]) || 'Pending',
        imageUrls: imageUrlsArray,
        imageFolderUrl: normalizeSheetText(row[COL_CASE_FOLDER]),
        uid: normalizeSheetText(row[COL_UID] || itemId)
      };

      const orFilesUrlsRaw = normalizeSheetText(row[COL_OR_FILES]);
      const orFilesUrls = orFilesUrlsRaw ? orFilesUrlsRaw.split('|') : [];

      if (!caseMap.has(caseId)) {
        caseMap.set(caseId, {
          id: caseId,
          date: normalizeSheetText(row[COL_TIMESTAMP]),
          source: normalizeSheetText(row[COL_SOURCE]),
          customerName: normalizeSheetText(row[COL_CUSTOMER]),
          orFilesUrls: orFilesUrls,
          orFolderUrl: normalizeSheetText(row[COL_OR_FOLDER]),
          resolutionMethod: normalizeSheetText(row[COL_RESOLUTION]),
          reworkCost: normalizeSheetAmount(row[COL_COST]),
          status: normalizeSheetText(row[COL_STATUS]) || 'Pending',
          items: [item]
        });
      } else {
        caseMap.get(caseId).items.push(item);
      }
    }

    // Convert map to array
    const casesArray = Array.from(caseMap.values());

    return {
      success: true,
      message: `Retrieved ${casesArray.length} cases`,
      data: casesArray
    };
  } catch (error) {
    return {
      success: false,
      error: `Read failed: ${error.toString()}`,
      data: []
    };
  }
}

/**
 * Handle UPDATE action - Update case status or details
 */
function handleUpdate(payload) {
  var lock;
  try {
    lock = LockService.getScriptLock();
    lock.waitLock(30000);

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const caseId = payload.caseId;
    const updates = payload.updates || {};
    const userRole = (payload.userRole || payload.authProfile || '').toUpperCase();

    if (!caseId) {
      return { success: false, error: 'Case ID is required' };
    }

    let updatedCount = 0;
    let matchedRows = 0;

    // Check permissions for specific updates
    const isAdminOrQSMS = (userRole === 'ADMIN' || userRole === 'QSMS');
    const isFinance = (userRole === 'FINANCE');
    const isWFG = (userRole === 'WFG');

    const seenItemIdsByCase = {};

    const updatedItemIds = new Set((updates.items || []).map(function(u) { return u.id; }));
    let deletedCount = 0;

    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][COL_CASE_ID] === caseId) { 
        matchedRows++;
        
        const rawItemId = normalizeSheetText(data[i][COL_ITEM_ID]);
        const itemNumber = normalizeSheetText(data[i][COL_ITEM_NUMBER]);
        const reason = normalizeSheetText(data[i][COL_REASON]);
        
        if (!seenItemIdsByCase[caseId]) {
          seenItemIdsByCase[caseId] = {};
        }
        
        const currentItemId = createStableReadItemId(caseId, rawItemId, itemNumber, reason, i, seenItemIdsByCase[caseId]);
        
        // Handle Item Deletion: ONLY delete if explicitly requested in deleteItemIds array
        const deleteIds = updates.deleteItemIds || [];
        if (isAdminOrQSMS && deleteIds.length > 0 && (deleteIds.includes(currentItemId) || (data[i][COL_UID] && deleteIds.includes(data[i][COL_UID])))) {
          sheet.deleteRow(i + 1);
          deletedCount++;
          continue; 
        }
        
        // 0. Administrative Source Edit
        if (isAdminOrQSMS && updates.source) {
          sheet.getRange(i + 1, COL_SOURCE + 1).setValue(updates.source);
        }

        // 1. Update Resolution Method (WFG or Admin/QSMS)
        if (updates.resolutionMethod !== undefined) {
          if (isAdminOrQSMS || isWFG) {
            sheet.getRange(i + 1, COL_RESOLUTION + 1).setValue(updates.resolutionMethod);
            // Auto-update status to 'Awaiting Valuation' if method is set
            // BUG FIX: Only auto-transition if NOT already 'Completed' or 'Awaiting Valuation'
            const currentStatus = String(data[i][COL_STATUS] || '').trim();
            if (updates.resolutionMethod.trim() !== '' && 
                (!updates.status || !isAdminOrQSMS) && 
                currentStatus !== 'Completed' && 
                currentStatus !== 'Awaiting Valuation') {
              sheet.getRange(i + 1, COL_STATUS + 1).setValue('Awaiting Valuation');
            }
            updatedCount++;
          } else {
            return { success: false, error: 'Permission denied: Only WFG or Admin can update resolution method' };
          }
        }

        // 2. Update Rework Cost (Finance or Admin/QSMS)
        if (updates.reworkCost !== undefined) {
          if (isAdminOrQSMS || isFinance) {
            sheet.getRange(i + 1, COL_COST + 1).setValue(updates.reworkCost);
            // Auto-update status to 'Completed' if cost is set
            if (updates.reworkCost > 0 && (!updates.status || !isAdminOrQSMS)) {
              sheet.getRange(i + 1, COL_STATUS + 1).setValue('Completed');
            }
            updatedCount++;
          } else {
            return { success: false, error: 'Permission denied: Only Finance or Admin can update rework cost' };
          }
        }

        // 3. Update Status (Explicit or Flow-based)
        if (updates.status) {
          const currentStatus = String(data[i][COL_STATUS] || '').trim();
          if (isAdminOrQSMS) {
            sheet.getRange(i + 1, COL_STATUS + 1).setValue(updates.status);
            updatedCount++;
          } else if (isWFG) {
            // WFG can move to In-Progress or Awaiting Valuation (if resolution added)
            if (updates.status === 'In-Progress' || updates.status === 'Awaiting Valuation') {
              sheet.getRange(i + 1, COL_STATUS + 1).setValue(updates.status);
              updatedCount++;
            }
          } else if (isFinance && updates.status === 'Completed') {
             sheet.getRange(i + 1, COL_STATUS + 1).setValue('Completed');
             updatedCount++;
          }
        }

        // 4. Update Item-specific fields
        if (updates.items && Array.isArray(updates.items)) {
          const itemUpdate = updates.items.find(function(u) { 
            // Match by UID (New stable method) or fallback to generated currentItemId
            return (u.uid && u.uid === normalizeSheetText(data[i][COL_UID])) || (u.id === currentItemId); 
          });
          
          if (itemUpdate) {
            if (itemUpdate.details !== undefined) {
              sheet.getRange(i + 1, COL_DETAILS + 1).setValue(itemUpdate.details);
              updatedCount++;
            }
            
            // Administrative Edit
            if (isAdminOrQSMS) {
              if (itemUpdate.customerName) sheet.getRange(i + 1, COL_CUSTOMER + 1).setValue(itemUpdate.customerName);
              if (itemUpdate.itemNumber) sheet.getRange(i + 1, COL_ITEM_NUMBER + 1).setValue(itemUpdate.itemNumber);
              if (itemUpdate.itemName) sheet.getRange(i + 1, COL_ITEM_NAME + 1).setValue(itemUpdate.itemName);
              if (itemUpdate.itemCode !== undefined) sheet.getRange(i + 1, COL_ITEM_CODE + 1).setValue(itemUpdate.itemCode);
              if (itemUpdate.batchNo) sheet.getRange(i + 1, COL_BATCH_NO + 1).setValue(itemUpdate.batchNo);
              if (itemUpdate.amount !== undefined) sheet.getRange(i + 1, COL_AMOUNT + 1).setValue(itemUpdate.amount);
              if (itemUpdate.reason) sheet.getRange(i + 1, COL_REASON + 1).setValue(itemUpdate.reason);
              if (itemUpdate.reasonSubtype !== undefined) sheet.getRange(i + 1, COL_REASON_SUBTYPE + 1).setValue(itemUpdate.reasonSubtype);
              if (itemUpdate.responsible) sheet.getRange(i + 1, COL_RESPONSIBLE + 1).setValue(itemUpdate.responsible);
              if (itemUpdate.responsibleSubtype !== undefined) sheet.getRange(i + 1, COL_RESP_SUBTYPE + 1).setValue(itemUpdate.responsibleSubtype);
              if (itemUpdate.linkedSourceId !== undefined) sheet.getRange(i + 1, COL_LINKED_ID + 1).setValue(itemUpdate.linkedSourceId);
              
              // Ensure UID is persisted if missing
              if (!data[i][COL_UID]) {
                sheet.getRange(i + 1, COL_UID + 1).setValue(itemUpdate.uid || Utilities.getUuid());
              }
            }
          }
        }

        // 5. Update Customer Name
        if (isAdminOrQSMS && updates.customerName !== undefined) {
           sheet.getRange(i + 1, COL_CUSTOMER + 1).setValue(updates.customerName);
           updatedCount++;
        }
      }
    }

    // 6. Upload OR Files ONCE outside the per-row loop
    if (payload.orFiles && Array.isArray(payload.orFiles) && payload.orFiles.length > 0 && matchedRows > 0) {
      var caseFolderIdForOr = null;
      for (let j = 1; j < data.length; j++) {
        if (data[j][COL_CASE_ID] === caseId && data[j][COL_CASE_FOLDER]) {
          caseFolderIdForOr = extractDriveFileId(data[j][COL_CASE_FOLDER]);
          break;
        }
      }
      if (caseFolderIdForOr) {
        var orFilesData = uploadORFilesToDrive(payload.orFiles, caseId, caseFolderIdForOr);
        if (orFilesData.urls.length > 0) {
          for (let j = 1; j < data.length; j++) {
            if (data[j][COL_CASE_ID] === caseId) { 
              var existingOrUrls = normalizeSheetText(data[j][COL_OR_FILES]);
              var allUrls = existingOrUrls
                ? existingOrUrls + '|' + orFilesData.urls.join('|')
                : orFilesData.urls.join('|');
              sheet.getRange(j + 1, COL_OR_FILES + 1).setValue(allUrls);
              sheet.getRange(j + 1, COL_OR_FOLDER + 1).setValue(orFilesData.folderUrl);
            }
          }
          updatedCount++;
        }
      }
    }

    if (matchedRows === 0) {
      if (lock) { lock.releaseLock(); lock = null; }
      return { success: false, error: `Case ID not found: ${caseId}` };
    }

    createBackup(sheet);
    if (lock) { lock.releaseLock(); lock = null; }
    return { success: true, message: `Updated case ${caseId} successfully. ${deletedCount > 0 ? 'Deleted ' + deletedCount + ' items.' : ''}`, data: { updatedCount, deletedCount } };
  } catch (error) {
    if (lock) lock.releaseLock();
    return { success: false, error: `Update failed: ${error.toString()}` };
  }
}

/**
 * Handle DELETE action - Delete case and its rows
 */
function handleDelete(payload) {
  var lock;
  try {
    const caseId = payload.caseId;
    const userRole = (payload.userRole || payload.authProfile || '').toUpperCase();

    if (!(userRole === 'ADMIN' || userRole === 'QSMS')) {
      return { success: false, error: 'Permission denied: Only Admin or QSMS can delete cases' };
    }

    lock = LockService.getScriptLock();
    lock.waitLock(30000);

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Iterate backwards to delete rows without affecting indices
    let deletedRows = 0;
    let folderIdToDelete = null;
    
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][COL_CASE_ID] === caseId) {
        if (!folderIdToDelete && data[i][COL_CASE_FOLDER]) {
          folderIdToDelete = extractDriveFileId(data[i][COL_CASE_FOLDER]);
        }
        sheet.deleteRow(i + 1);
        deletedRows++;
      }
    }

    if (deletedRows === 0) {
      if (lock) lock.releaseLock();
      return { success: false, error: `Case ID not found: ${caseId}` };
    }

    // Clean up Img_Url sheet
    try {
      const imgUrlSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(IMG_URL_SHEET_NAME);
      if (imgUrlSheet) {
        const imgData = imgUrlSheet.getDataRange().getValues();
        for (let i = imgData.length - 1; i >= 1; i--) {
          if (imgData[i][0] === caseId) {
            imgUrlSheet.deleteRow(i + 1);
          }
        }
      }
    } catch (e) {
      Logger.log('Error cleaning Img_Url sheet: ' + e);
    }

    // Clean up Drive folder
    if (folderIdToDelete) {
      try {
        DriveApp.getFolderById(folderIdToDelete).setTrashed(true);
      } catch (e) {
        Logger.log('Error trashing Drive folder: ' + e);
      }
    }

    createBackup(sheet);
    if (lock) { lock.releaseLock(); lock = null; }
    return { success: true, message: `Deleted case ${caseId} and ${deletedRows} associated rows` };
  } catch (error) {
    if (lock) lock.releaseLock();
    return { success: false, error: `Delete failed: ${error.toString()}` };
  }
}

/**
 * Handle DASHBOARD STATS action - Get aggregated statistics
 */
function handleDashboardStats(payload) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    const stats = {
      totalCases: 0,
      pendingCases: 0,
      inProgressCases: 0,
      awaitingValuationCases: 0,
      completedCases: 0,
      completionRate: 0,
      defectReasons: {},
      sourceWorkload: {},
      stainFromLeakCount: 0 // Correlation Analysis
    };

    const caseStats = new Map();

    for (let i = 1; i < data.length; i++) {
      const caseId = String(data[i][COL_CASE_ID] || '').trim();
      const status = String(data[i][COL_STATUS] || 'Pending').trim();
      const reason = String(data[i][COL_REASON] || '').trim();
      const linkedSourceId = String(data[i][COL_LINKED_ID] || '').trim();
      const source = String(data[i][COL_SOURCE] || '').trim();

      if (!caseId) continue;

      if (!caseStats.has(caseId)) {
        caseStats.set(caseId, {
          status: status,
          source: source
        });
      }

      // Count defect reasons
      if (reason) {
        stats.defectReasons[reason] = (stats.defectReasons[reason] || 0) + 1;
      }

      // Count Correlation (Stain from Leak)
      if (linkedSourceId) {
        stats.stainFromLeakCount++;
      }
    }

    caseStats.forEach(function(caseInfo) {
      switch (caseInfo.status) {
        case 'Pending':
          stats.pendingCases++;
          break;
        case 'In-Progress':
        case 'กำลังดำเนินการ':
          stats.inProgressCases++;
          break;
        case 'Awaiting Valuation':
        case 'รอประเมินราคา':
          stats.awaitingValuationCases++;
          break;
        case 'Completed':
        case 'เสร็จสิ้น':
          stats.completedCases++;
          break;
      }

      if (caseInfo.source) {
        stats.sourceWorkload[caseInfo.source] = (stats.sourceWorkload[caseInfo.source] || 0) + 1;
      }
    });

    stats.totalCases = caseStats.size;
    stats.completionRate = stats.totalCases > 0 
      ? Math.round((stats.completedCases / stats.totalCases) * 100)
      : 0;

    return {
      success: true,
      message: 'Dashboard stats retrieved',
      data: stats
    };
  } catch (error) {
    return {
      success: false,
      error: `Dashboard stats failed: ${error.toString()}`
    };
  }
}

/**
 * ===== UTILITY FUNCTIONS =====
 */

/**
 * Generate a unique case ID
 * Format: RWYYMMDDHHmmssSSSRRR
 */
function generateCaseId(existingCaseIds) {
  const existing = existingCaseIds || new Set();
  const maxAttempts = 15;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const now = new Date();
    const formatted = Utilities.formatDate(now, "Asia/Bangkok", "yy|MM|dd|HH|mm|ss|SSS");
    const parts = formatted.split('|');
    const yy = parts[0];
    const mm = parts[1];
    const dd = parts[2];
    const hh = parts[3];
    const min = parts[4];
    const sec = parts[5];
    const ms = parts[6];
    const rand = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const caseId = `RW${yy}${mm}${dd}${hh}${min}${sec}${ms}${rand}`;

    if (!existing.has(caseId)) {
      return caseId;
    }

    Utilities.sleep(5);
  }

  // Fallback to guaranteed unique suffix if collisions are unexpectedly frequent.
  return `RW${new Date().getTime()}${Math.floor(Math.random() * 10000)}`;
}

/**
 * Creates a stable item ID during read if one is missing or for consistency.
 */
function createStableReadItemId(caseId, rawItemId, itemNumber, reason, rowIdx, seenMap) {
  let id = rawItemId || "";
  
  // If no ID or duplicate ID found in this case, generate a virtual one
  if (!id || seenMap[id]) {
    const suffix = (rowIdx + 1).toString().padStart(3, '0');
    id = caseId + "-" + suffix;
  }
  
  seenMap[id] = true;
  return id;
}

/**
 * Create a backup of the current sheet data
 */
function createBackup(sourceSheet) {
  try {
    const spreadsheet = sourceSheet.getParent();
    const backupSheetName = BACKUP_SHEET_NAME + ' - ' + new Date().toISOString().slice(0, 10);
    
    // Check if backup sheet exists for today, if not create one
    let backupSheet = spreadsheet.getSheetByName(backupSheetName);
    
    if (!backupSheet) {
      backupSheet = spreadsheet.insertSheet(backupSheetName);
    }
    
    // Copy data
    const data = sourceSheet.getDataRange();
    backupSheet.getRange(1, 1, data.getNumRows(), data.getNumColumns())
      .setValues(data.getValues());
      
  } catch (error) {
    // Silently fail backup if there's an issue
    Logger.log('Backup creation failed: ' + error);
  }
}

/**
 * Initialize sheet headers if they don't exist
 * Run this once to set up your sheet
 */
function initializeSheet() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      getOrCreateSheet(SHEET_NAME, MAIN_HEADERS);
    } else {
      const firstRow = sheet.getRange(1, 1, 1, MAIN_HEADERS.length).getValues()[0];
      const headerMismatch = MAIN_HEADERS.some(function(header, index) {
        return String(firstRow[index] || '').trim() !== header;
      });

      if (headerMismatch) {
        applyHeaderFormatting(sheet, MAIN_HEADERS);
        Logger.log('Rework Cases sheet header synced via initializeSheet');
      }
    }

    getOrCreateSheet(IMG_URL_SHEET_NAME, ['Case ID', 'Item ID', 'Item Index', 'Image Index', 'Image URL', 'Case Folder URL']);
    getOrCreateSheet(ITEM_MASTER_SHEET_NAME, ['Item Number', 'Item Name']);
  } catch (error) {
    Logger.log('Initialization error: ' + error);
  }
}

/**
 * ⚠️ DEPRECATED — DO NOT RUN on data created after Customer Name migration (2026-05-13).
 * ฟังก์ชันนี้ออกแบบมาสำหรับ schema เก่า (ก่อนย้าย Customer Name ไปที่ column 5)
 * การรันกับ data ใหม่จะทำให้ข้อมูล shift ผิด column และเสียหายทั้ง sheet
 *
 * ฟังก์ชันสำหรับแก้ไขข้อมูลที่เลื่อนคอลัมน์ (Data Shift)
 * หากคุณมีข้อมูลเก่าและเพิ่มคอลัมน์ "Batch no." เข้าไปใหม่ ข้อมูลเดิมจะเบี้ยว
 * ให้รันฟังก์ชันนี้หนึ่งครั้งเพื่อดันข้อมูลให้ตรงล็อก
 */
function fixSheetDataShift() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return "No data to fix";
  
  let fixedCount = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // ถ้า Amount (index 8) ไม่เป็นตัวเลข แต่ index 7 เป็นตัวเลข
    // แสดงว่าข้อมูลอาจจะเลื่อนมาจากโครงสร้างเก่า (ที่ index 7 คือ Amount)
    const valAt7 = row[7];
    const valAt8 = row[8];
    
    if (!isNaN(parseFloat(valAt7)) && isNaN(parseFloat(valAt8)) && String(valAt8).trim() !== "") {
      // ดันข้อมูลตั้งแต่ index 7 ไปทางขวา 1 ช่อง
      const rangeToShift = sheet.getRange(i + 1, 8, 1, sheet.getLastColumn() - 7);
      const valuesToShift = rangeToShift.getValues()[0];
      
      // แทรกค่าว่างที่ Batch no (index 8 ใน 1-based คือ column 8)
      // แล้วขยับที่เหลือ
      const newRowSegment = [""]; // Empty Batch No
      for(let j=0; j<valuesToShift.length - 1; j++) {
        newRowSegment.push(valuesToShift[j]);
      }
      
      sheet.getRange(i + 1, 8, 1, newRowSegment.length).setValues([newRowSegment]);
      fixedCount++;
    }
  }
  
  return "Fixed " + fixedCount + " rows";
}

/**
 * Test the doPost function
 * Run this to test your API
 */
function testDoPost() {
  const testPayload = {
    action: 'insert',
    source: 'SFC',
    items: [
      {
        itemNumber: 'TEST-001',
        itemName: 'Test Product',
        itemCode: 'TP-01',
        amount: 10,
        reason: 'รั่ว',
        reasonSubtype: 'รั่วซึม',
        responsible: 'SFC',
        responsibleSubtype: 'PDF',
        details: 'Test details'
      }
    ]
  };

  const mockEvent = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };

  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

/**
 * ===== MASTER DATA FUNCTIONS =====
 */

/**
 * Fetch Item Master Data from ItemMaster sheet
 * Returns array of {itemNumber, itemName} objects
 */
function getItemMaster() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let sheet = spreadsheet.getSheetByName(ITEM_MASTER_SHEET_NAME);
    
    // Auto-create ItemMaster sheet if it doesn't exist
    if (!sheet) {
      Logger.log('ItemMaster sheet not found. Creating new sheet...');
      sheet = spreadsheet.insertSheet(ITEM_MASTER_SHEET_NAME);
      sheet.getRange(1, 1, 1, 2).setValues([['Item Number', 'Item Name']]);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#4285F4').setFontColor('#FFFFFF');
      Logger.log('ItemMaster sheet created with headers');
      
      return {
        success: true,
        data: [],
        message: 'ItemMaster sheet created. No items loaded yet.'
      };
    }

    const data = sheet.getDataRange().getValues();
    const itemMaster = [];

    Logger.log('📋 Reading ItemMaster sheet:', {
      totalRows: data.length,
      headers: data[0],
      firstDataRow: data[1]
    });

    // Skip header row (row 0)
    for (let i = 1; i < data.length; i++) {
      const rawItemNumber = data[i][0];
      const rawItemName = data[i][1];
      
      const itemNumber = String(rawItemNumber || '').trim();
      const itemName = String(rawItemName || '').trim();
      
      Logger.log(`  Row ${i + 1}: Raw=[${rawItemNumber}|${rawItemName}] Trimmed=[${itemNumber}|${itemName}]`);
      
      if (itemNumber) {
        itemMaster.push({
          itemNumber,
          itemName: itemName || itemNumber
        });
        Logger.log(`    ✓ Added: "${itemNumber}" → "${itemName}"`);
      } else {
        Logger.log(`    ✗ Skipped (empty itemNumber or itemName)`);
      }
    }

    Logger.log(`✓ ItemMaster loaded: ${itemMaster.length} items`);
    
    return {
      success: true,
      data: itemMaster,
      message: `Retrieved ${itemMaster.length} items from master data`
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch item master: ${error.toString()}`,
      data: []
    };
  }
}

/**
 * Save a new item to ItemMaster sheet if it doesn't already exist
 * Auto-called when user enters a new ItemNumber not found in master
 * @param {object} payload - { itemNumber, itemName }
 */
function saveItemMaster(payload) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(ITEM_MASTER_SHEET_NAME);
    
    if (!sheet) {
      // Create ItemMaster sheet if it doesn't exist
      const newSheet = spreadsheet.insertSheet(ITEM_MASTER_SHEET_NAME);
      newSheet.getRange(1, 1, 1, 2).setValues([['Item Number', 'Item Name']]);
      newSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#4285F4').setFontColor('#FFFFFF');
    }

    const sheet_final = spreadsheet.getSheetByName(ITEM_MASTER_SHEET_NAME);
    const data = sheet_final.getDataRange().getValues();
    
    const itemNumber = String(payload.itemNumber || '').trim();
    const itemName = String(payload.itemName || '').trim();

    if (!itemNumber) {
      return {
        success: false,
        error: 'Item Number is required',
        message: null
      };
    }

    if (!itemName) {
      return {
        success: false,
        error: 'Item Name is required',
        message: null
      };
    }

    // Check if item already exists
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || '').trim() === itemNumber) {
        return {
          success: true,
          message: `Item "${itemNumber}" already exists in master data`,
          data: { isNew: false, itemNumber }
        };
      }
    }

    // Add new item to the sheet
    const lastRow = sheet_final.getLastRow();
    sheet_final.getRange(lastRow + 1, 1, 1, 2).setValues([
      [itemNumber, itemName]
    ]);

    return {
      success: true,
      message: `Item "${itemNumber}" added to master data successfully`,
      data: { isNew: true, itemNumber, itemName: itemName }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save item master: ${error.toString()}`,
      message: null
    };
  }
}


function extractDriveFileId(url) {
  const normalizedUrl = String(url || '').trim();
  const patterns = [
    /drive\.google\.com\/file\/d\/([^/]+)/,
    /drive\.google\.com\/open\?id=([^&]+)/,
    /drive\.google\.com\/uc\?(?:.*&)?id=([^&]+)/,
    /drive\.google\.com\/thumbnail\?id=([^&]+)/,
    /lh3\.googleusercontent\.com\/d\/([^/?]+)/
  ];

  for (var i = 0; i < patterns.length; i++) {
    const match = normalizedUrl.match(patterns[i]);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return normalizedUrl && normalizedUrl.indexOf('/') === -1 && normalizedUrl.indexOf('http') !== 0
    ? normalizedUrl
    : '';
}

function getImageDataUrl(payload) {
  try {
    const fileId = extractDriveFileId(payload.imageUrl || payload.fileId);
    if (!fileId) {
      return { success: false, error: 'Image file ID is required' };
    }

    const blob = DriveApp.getFileById(fileId).getBlob();
    const contentType = blob.getContentType() || 'image/jpeg';
    const base64 = Utilities.base64Encode(blob.getBytes());

    return {
      success: true,
      data: {
        fileId: fileId,
        contentType: contentType,
        dataUrl: 'data:' + contentType + ';base64,' + base64
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Image load failed: ' + error.toString()
    };
  }
}
/**
 * สร้าง Folder สำหรับ Case ใน Google Drive (หรือใช้ folder เดิมถ้ามีอยู่แล้ว)
 * 
 * วิธีทำงาน:
 * 1. เปิด parent folder (DRIVE_FOLDER_ID) ที่เก็บ folder ทั้งหมด
 * 2. ค้นหา folder ชื่อ "Case_RWxxxxxx" ถ้ามีอยู่แล้ว → ใช้อันนั้น
 * 3. ถ้ายังไม่มี → สร้างใหม่
 * 4. return ทั้ง id และ url ของ folder
 * 
 * @param {string} caseId - เช่น "RW26050513190001"
 * @returns {{ id: string, url: string }} - id = folder ID, url = link เปิดใน Drive
 */
function getOrCreateCaseFolder(caseId) {
  try {
    // เปิด folder หลักที่เก็บ folder ทุก case
    var parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var caseFolderName = 'Case_' + caseId;

    // ค้นหา folder ที่มีชื่อเดียวกัน
    var folders = parentFolder.getFoldersByName(caseFolderName);

    if (folders.hasNext()) {
      // ✅ มีอยู่แล้ว → ใช้อันเดิม
      var existingFolder = folders.next();
      Logger.log('📁 Found existing folder: ' + caseFolderName);
      return {
        id: existingFolder.getId(),
        url: existingFolder.getUrl()
      };
    }

    // ✅ ยังไม่มี → สร้างใหม่
    var newFolder = parentFolder.createFolder(caseFolderName);
    Logger.log('📁 Created new folder: ' + caseFolderName);
    return {
      id: newFolder.getId(),
      url: newFolder.getUrl()
    };

  } catch (error) {
    Logger.log('❌ Folder error: ' + error.toString());
    // กรณี error → fallback ใช้ parent folder
    return {
      id: DRIVE_FOLDER_ID,
      url: 'https://drive.google.com/drive/folders/' + DRIVE_FOLDER_ID
    };
  }
}

/**
 * อัพโหลดรูปภาพไปยัง Google Drive ใน folder ที่กำหนด
 * 
 * วิธีทำงาน:
 * 1. รับ base64 จาก frontend (format: "data:image/jpeg;base64,xxxxx")
 * 2. แยกส่วน base64 ออกจาก data URL header
 * 3. ตรวจจับว่าเป็น PNG หรือ JPEG
 * 4. decode เป็น blob แล้วบันทึกลง folder
 * 
 * @param {string} base64Data - รูปภาพเข้ารหัส base64 (data URL format)
 * @param {string} itemId - ชื่อ item สำหรับตั้งชื่อไฟล์ เช่น "RW26050513-001"
 * @param {string} folderId - ID ของ folder ใน Google Drive ที่จะเก็บรูป
 */
function uploadImageToDrive(base64Data, itemId, folderId) {
  try {
    // ===== ตรวจสอบ input =====
    if (!base64Data || typeof base64Data !== 'string') {
      Logger.log('❌ Invalid image data for ' + itemId);
      return null;
    }

    // ===== ตรวจจับ MIME type (PNG หรือ JPEG) =====
    var mimeType = 'image/jpeg'; // ค่าเริ่มต้น
    var fileExt = '.jpg';

    if (base64Data.indexOf('image/png') !== -1) {
      mimeType = 'image/png';
      fileExt = '.png';
    }

    // ===== แยก base64 content จาก data URL =====
    // data URL format: "data:image/jpeg;base64,/9j/4AAQ..."
    // เราต้องการเฉพาะส่วนหลัง comma
    var base64Content = base64Data;
    if (base64Data.indexOf(',') !== -1) {
      base64Content = base64Data.split(',')[1];
    }

    if (!base64Content) {
      Logger.log('❌ Empty base64 content for ' + itemId);
      return null;
    }

    // ===== decode base64 → blob → file =====
    var decodedBytes = Utilities.base64Decode(base64Content);
    var blob = Utilities.newBlob(decodedBytes, mimeType);

    // ตั้งชื่อไฟล์: itemId + timestamp + extension
    var filename = itemId + '_' + new Date().getTime() + fileExt;
    blob.setName(filename);

    // บันทึกไฟล์ลง folder
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);

    // ✅ ตั้งให้ทุกคนดูได้ (สำหรับแสดงรูปใน frontend)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // ✅ สร้าง URL ที่แสดงได้โดยตรงใน <img src>
    var fileId = file.getId();
    var viewUrl = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1200';

    Logger.log('✅ Uploaded: ' + filename + ' → ' + viewUrl);
    return viewUrl;

  } catch (error) {
    Logger.log('❌ Upload failed for ' + itemId + ': ' + error.toString());
    return null;
  }
}

/**
 * อัพโหลดไฟล์ OR (Excel, PDF, PNG)
 */
function uploadORFilesToDrive(orFilesBase64, caseId, caseFolderId) {
  if (!orFilesBase64 || !Array.isArray(orFilesBase64) || orFilesBase64.length === 0) return { urls: [], folderUrl: '' };
  
  try {
    const parentFolder = DriveApp.getFolderById(caseFolderId);
    let orFolder;
    const existingFolders = parentFolder.getFoldersByName('OR_Files');
    if (existingFolders.hasNext()) {
      orFolder = existingFolders.next();
    } else {
      orFolder = parentFolder.createFolder('OR_Files');
    }

    const fileUrls = [];
    orFilesBase64.forEach((base64Data, index) => {
      let mimeType = 'application/octet-stream';
      let extension = '';
      
      if (base64Data.includes('image/png')) { mimeType = 'image/png'; extension = '.png'; }
      else if (base64Data.includes('application/pdf')) { mimeType = 'application/pdf'; extension = '.pdf'; }
      else if (base64Data.includes('spreadsheet') || base64Data.includes('excel')) { mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; extension = '.xlsx'; }

      let base64Content = base64Data;
      if (base64Data.includes(',')) {
        base64Content = base64Data.split(',')[1];
      }

      const decodedBytes = Utilities.base64Decode(base64Content);
      const blob = Utilities.newBlob(decodedBytes, mimeType);
      const filename = 'OR_File_' + caseId + '_' + (index + 1) + '_' + new Date().getTime() + extension;
      blob.setName(filename);
      
      const file = orFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrls.push(file.getUrl());
    });

    return {
      urls: fileUrls,
      folderUrl: orFolder.getUrl()
    };
  } catch (error) {
    Logger.log('❌ OR Upload error: ' + error.toString());
    return { urls: [], folderUrl: '' };
  }
}

/**
 * Migration helper to reorder existing data to the new column structure
 * Run this ONCE if you have existing data and want to update to the new structure.
 */
function standardizeSheetStructure() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return "Sheet not found";
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    // Just update headers
    sheet.getRange(1, 1, 1, MAIN_HEADERS.length).setValues([MAIN_HEADERS]);
    return "Updated headers for empty sheet";
  }
  
  const oldHeaders = data[0];
  const oldData = data.slice(1);
  const newData = [];
  
  // Mapping of old column names to old indices
  const colMap = {};
  oldHeaders.forEach((header, index) => {
    colMap[String(header).trim()] = index;
  });
  
  // Create new data based on COL_ constants mapping
  oldData.forEach(oldRow => {
    const newRow = new Array(MAIN_HEADERS.length).fill('');
    
    // Manual mapping for safety
    const mapping = {
      'Timestamp': COL_TIMESTAMP,
      'Status': COL_STATUS,
      'Source': COL_SOURCE,
      'Customer Name': COL_CUSTOMER,
      'Case ID': COL_CASE_ID,
      'Item ID': COL_ITEM_ID,
      'Item Number': COL_ITEM_NUMBER,
      'Item Name': COL_ITEM_NAME,
      'Item Code': COL_ITEM_CODE,
      'Batch No': COL_BATCH_NO,
      'Amount': COL_AMOUNT,
      'Reason': COL_REASON,
      'Reason Subtype': COL_REASON_SUBTYPE,
      'Linked Source ID': COL_LINKED_ID,
      'Responsible': COL_RESPONSIBLE,
      'Responsible Subtype': COL_RESP_SUBTYPE,
      'Details': COL_DETAILS,
      'Resolution Method': COL_RESOLUTION,
      'Rework Cost': COL_COST,
      'Image URLs': COL_IMAGE_URLS,
      'Case Folder URL': COL_CASE_FOLDER,
      'OR Files': COL_OR_FILES,
      'OR Folder URL': COL_OR_FOLDER
    };
    
    Object.keys(mapping).forEach(header => {
      const oldIndex = colMap[header];
      if (oldIndex !== undefined) {
        newRow[mapping[header]] = oldRow[oldIndex];
      }
    });
    
    newData.push(newRow);
  });
  
  // Clear and rewrite
  sheet.clear();
  sheet.getRange(1, 1, 1, MAIN_HEADERS.length).setValues([MAIN_HEADERS]);
  sheet.getRange(2, 1, newData.length, MAIN_HEADERS.length).setValues(newData);
  
  // Format headers
  sheet.getRange(1, 1, 1, MAIN_HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#000000')
    .setFontColor('#FFFFFF');
    
  return "Migration completed successfully";
}

/**
 * Migrate data written by the OLD GAS_IMPROVED.gs (13-column schema)
 * to the current 23-column schema.
 * 
 * Old schema (GAS_IMPROVED.gs):
 *   [0] Item ID  [1] Case ID  [2] Date  [3] Source  [4] Item Number
 *   [5] Item Name  [6] Item Code  [7] Amount  [8] Reason
 *   [9] Responsible  [10] Details  [11] Status  [12] Image URLs
 * 
 * Detection: If row[0] starts with "RW" (Item ID format) instead of
 *   being a timestamp, and row[1] also starts with "RW" (Case ID),
 *   it's old schema data.
 * 
 * Run this ONCE from GAS editor to fix existing old-format rows.
 */
function migrateFromOldSchema() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) return 'Sheet not found';
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return 'No data rows to migrate';
  
  var migratedCount = 0;
  var skippedCount = 0;
  
  // Start from row index 1 (skip header)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var col0 = String(row[0] || '').trim();
    var col1 = String(row[1] || '').trim();
    
    // Detect old schema: col[0] = ItemID (starts with 'RW'), col[1] = CaseID (starts with 'RW')
    // New schema: col[0] = Timestamp (date string), col[1] = Status (Pending/In-Progress/etc.)
    var isOldSchema = col0.indexOf('RW') === 0 && col1.indexOf('RW') === 0;
    
    if (!isOldSchema) {
      skippedCount++;
      continue;
    }
    
    // Map old schema values to new schema positions
    var newRow = new Array(MAIN_HEADERS.length);
    for (var k = 0; k < newRow.length; k++) newRow[k] = '';
    
    newRow[COL_TIMESTAMP]      = row[2] || '';               // Old[2] Date -> Timestamp
    newRow[COL_STATUS]         = row[11] || 'Pending';       // Old[11] Status -> Status
    newRow[COL_SOURCE]         = String(row[3] || '').trim(); // Old[3] Source -> Source
    newRow[COL_CUSTOMER]       = '';                          // Not in old schema
    newRow[COL_CASE_ID]        = col1;                        // Old[1] Case ID -> Case ID
    newRow[COL_ITEM_ID]        = col0;                        // Old[0] Item ID -> Item ID
    newRow[COL_ITEM_NUMBER]    = String(row[4] || '').trim(); // Old[4] Item Number
    newRow[COL_ITEM_NAME]      = String(row[5] || '').trim(); // Old[5] Item Name
    newRow[COL_ITEM_CODE]      = String(row[6] || '').trim(); // Old[6] Item Code
    newRow[COL_BATCH_NO]       = '';                          // Not in old schema
    newRow[COL_AMOUNT]         = row[7] !== undefined ? row[7] : 0; // Old[7] Amount
    newRow[COL_REASON]         = String(row[8] || '').trim(); // Old[8] Reason
    newRow[COL_REASON_SUBTYPE] = '';                          // Not in old schema
    newRow[COL_LINKED_ID]      = '';                          // Not in old schema
    newRow[COL_RESPONSIBLE]    = String(row[9] || '').trim(); // Old[9] Responsible
    newRow[COL_RESP_SUBTYPE]   = '';                          // Not in old schema
    newRow[COL_DETAILS]        = String(row[10] || '').trim();// Old[10] Details
    newRow[COL_RESOLUTION]     = '';
    newRow[COL_COST]           = '';
    newRow[COL_IMAGE_URLS]     = String(row[12] || '').trim();// Old[12] Image URLs
    newRow[COL_CASE_FOLDER]    = '';
    newRow[COL_OR_FILES]       = '';
    newRow[COL_OR_FOLDER]      = '';
    
    // Write the migrated row back (1-indexed: i+1 for row, 1 for column A)
    sheet.getRange(i + 1, 1, 1, newRow.length).setValues([newRow]);
    migratedCount++;
  }
  
  Logger.log('Migration complete: ' + migratedCount + ' rows migrated, ' + skippedCount + ' rows skipped (already new schema)');
  return 'Migrated ' + migratedCount + ' rows, skipped ' + skippedCount + ' rows';
}
