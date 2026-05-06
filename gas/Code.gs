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
    QSMS: {
      password: getScriptProperty('QSMS_PASSWORD'),
      email: getScriptProperty('QSMS_EMAIL'),
      name: getScriptProperty('QSMS_NAME') || 'QSMS',
      role: getScriptProperty('QSMS_ROLE') || 'operator',
      department: getScriptProperty('QSMS_DEPARTMENT') || 'Rework',
    },
    WFG: {
      password: getScriptProperty('WFG_PASSWORD'),
      email: getScriptProperty('WFG_EMAIL'),
      name: getScriptProperty('WFG_NAME') || 'WFG',
      role: getScriptProperty('WFG_ROLE') || 'operator',
      department: getScriptProperty('WFG_DEPARTMENT') || 'Rework',
    },
  };
}

function getAuthProfileEmails() {
  const profiles = getAuthProfiles();
  const emails = {};
  Object.keys(profiles).forEach(function (key) {
    const profile = profiles[key];
    if (profile && profile.email) {
      emails[key] = profile.email;
    }
  });
  return emails;
}

function getOrCreateSheet(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#000000')
      .setFontColor('#FFFFFF');
    Logger.log('Created new sheet: ' + sheetName);
    return sheet;
  }

  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const headerMismatch = headers.some(function(header, index) {
    return String(firstRow[index] || '').trim() !== header;
  });

  if (headerMismatch) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    Logger.log('Updated headers for sheet: ' + sheetName);
  }

  return sheet;
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
  
  if (!/^[a-zA-Z0-9]+$/.test(str)) {
    return { valid: false, error: 'Item Number must contain only letters and digits. Got: ' + str };
  }

  if (str.length > 50) {
    return { valid: false, error: 'Item Number must not exceed 50 characters. Got: ' + str + ' (' + str.length + ' chars)' };
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
  
  const amountCheck = validateAmount(item.amount);
  if (!amountCheck.valid) errors.push(amountCheck.error);
  
  const reasonCheck = validateReason(item.reason);
  if (!reasonCheck.valid) errors.push(reasonCheck.error);
  
  const responsibleCheck = validateResponsible(item.responsible);
  if (!responsibleCheck.valid) errors.push(responsibleCheck.error);
  
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
    const itemNum = String(items[i].itemNumber).trim();
    if (seen.has(itemNum)) {
      if (!duplicates.includes(itemNum)) {
        duplicates.push(itemNum);
      }
    }
    seen.add(itemNum);
  }
  
  return {
    hasDuplicates: duplicates.length > 0,
    duplicates: duplicates
  };
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

    // Check for duplicate ItemNumbers
    const dupCheck = checkDuplicateItemNumbers(payload.items);
    if (dupCheck.hasDuplicates) {
      return {
        success: false,
        error: 'Duplicate Item Numbers found: ' + dupCheck.duplicates.join(', '),
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

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const existingCaseIds = new Set();
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingRows = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
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

    payload.items.forEach(function(item, index) {
      var itemId = caseId + '-' + String(index + 1).padStart(3, '0');
      itemIds.push(itemId);

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
      // คอลัมที่ 15: เก็บ URL ของรูปแต่ละภาพ คั่นด้วย | (pipe)
      // คอลัมที่ 16: เก็บ folder URL
      rowsToInsert.push([
        itemId,
        caseId,
        timestamp,
        sanitizeString(payload.source),
        sanitizeString(item.itemNumber),
        sanitizeString(item.itemName),
        sanitizeString(item.itemCode),
        item.amount,
        sanitizeString(item.reason),
        sanitizeString(item.reasonSubtype || ''),
        sanitizeString(item.responsible),
        sanitizeString(item.responsibleSubtype || ''),
        sanitizeString(item.details || ''),
        'Pending',
        itemImageUrls.length > 0 ? itemImageUrls.join('|') : '', // คอลัม 15: URL แต่ละรูป คั่นด้วย |
        caseFolderUrl, // คอลัม 16: folder URL
      ]);
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

    // Columns: Item ID | Case ID | Date | Source | ItemNumber | ItemName | ItemCode | Amount | Reason | Reason Subtype | Responsible | Responsible Subtype | Details | Status | ImageUrls (pipe-separated) | ImageFolderUrl
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const caseId = String(row[1] || '').trim();
      const itemId = String(row[0] || '').trim();

      const rawImageUrls = String(row[14] || '').trim();
      let imageUrlsArray = rawImageUrls ? rawImageUrls.split('|').filter(function(u) { return u.trim() !== ''; }) : [];
      const imageKey = caseId + '|' + itemId;
      if (imgUrlMap.has(imageKey)) {
        const storedUrls = imgUrlMap.get(imageKey);
        if (storedUrls && storedUrls.length > 0) {
          imageUrlsArray = storedUrls;
        }
      }

      const item = {
        id: itemId,
        itemNumber: row[4] || '',
        itemName: row[5] || '',
        itemCode: row[6] || '',
        amount: row[7] || 0,
        reason: row[8] || '',
        reasonSubtype: row[9] || '',
        responsible: row[10] || '',
        responsibleSubtype: row[11] || '',
        details: row[12] || '',
        status: row[13] || 'Pending',
        imageUrls: imageUrlsArray,
        imageFolderUrl: String(row[15] || row[14] || '').trim(),
      };

      if (!caseMap.has(caseId)) {
        caseMap.set(caseId, {
          id: caseId,
          date: row[2] || '',
          source: row[3] || '',
          status: row[13] || 'Pending',
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

    let updatedCount = 0;

    // Find and update all rows with matching case ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === caseId) { // Column B is Case ID
        // Update status if provided
        if (payload.updates.status) {
          sheet.getRange(i + 1, 14).setValue(payload.updates.status); // Column N is Status (0-indexed: 13)
          updatedCount++;
        }

        // Update details if provided
        if (payload.updates.items && payload.updates.items[0]) {
          const detailsIndex = 13; // Column M is Details (0-indexed: 12)
          sheet.getRange(i + 1, detailsIndex).setValue(payload.updates.items[0].details || '');
        }
      }
    }

    // Create backup
    createBackup(sheet);

    if (lock) {
      lock.releaseLock();
      lock = null;
    }

    return {
      success: true,
      message: `Updated ${updatedCount} items for case ${caseId}`,
      data: { updatedCount: updatedCount }
    };
  } catch (error) {
    if (lock) {
      lock.releaseLock();
    }
    return {
      success: false,
      error: `Update failed: ${error.toString()}`
    };
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
      completedCases: 0,
      completionRate: 0,
      defectReasons: {},
      sourceWorkload: {}
    };

    const caseIds = new Set();

    for (let i = 1; i < data.length; i++) {
      const caseId = data[i][1];
      const status = data[i][13]; // Status column (0-indexed: 13)
      const reason = data[i][8]; // Reason column
      const source = data[i][3]; // Source column

      // Count unique cases for total
      caseIds.add(caseId);

      // Count by status
      switch (status) {
        case 'Pending':
          stats.pendingCases++;
          break;
        case 'In-Progress':
          stats.inProgressCases++;
          break;
        case 'Completed':
          stats.completedCases++;
          break;
      }

      // Count defect reasons
      if (reason) {
        stats.defectReasons[reason] = (stats.defectReasons[reason] || 0) + 1;
      }

      // Count source workload
      if (source) {
        stats.sourceWorkload[source] = (stats.sourceWorkload[source] || 0) + 1;
      }
    }

    stats.totalCases = caseIds.size;
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
    const headers = [
      'Item ID',
      'Case ID',
      'Date',
      'Source',
      'Item Number',
      'Item Name',
      'Item Code',
      'Amount (Box)',
      'Reason',
      'Reason Subtype',
      'Responsible',
      'Responsible Subtype',
      'Details',
      'Status',
      'Image URLs',
      'Image Folder URL'
    ];
    const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    const headerMismatch = headers.some(function(header, index) {
      return String(firstRow[index] || '').trim() !== header;
    });

    if (headerMismatch) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#000000');
      headerRange.setFontColor('#FFFFFF');
      Logger.log('Rework Cases sheet header synced');
    }

    getOrCreateSheet(IMG_URL_SHEET_NAME, ['Case ID', 'Item ID', 'Item Index', 'Image Index', 'Image URL', 'Case Folder URL']);
  } catch (error) {
    Logger.log('Initialization error: ' + error);
  }
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
