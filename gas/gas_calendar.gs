/**
 * gas_calendar.gs
 * Roster backend for Google Apps Script + Google Sheets
 *
 * Required Script Properties:
 * - CALENDAR_SHEET_ID (preferred) or GOOGLE_SHEET_ID (fallback)
 */

const CALENDAR_SHEET_ID =
  getScriptProperty('CALENDAR_SHEET_ID') || getScriptProperty('GOOGLE_SHEET_ID');

const SHEET_EMPLOYEES = 'Roster_Employees';
const SHEET_OVERRIDES = 'Roster_Overrides';
const SHEET_HOLIDAYS = 'Roster_Holidays';
const SHEET_LEAVES = 'Roster_Leaves';

const EMP_HEADERS = ['Employee ID', 'Name', 'Phase', 'Active', 'Created At', 'Updated At', 'Start Saturday'];
const OVR_HEADERS = ['Employee ID', 'Date Key', 'Status', 'Updated At', 'Updated By'];
const HOL_HEADERS = ['Date Key', 'Holiday Name', 'Active', 'Updated At'];
const LEAVE_HEADERS = ['Leave ID', 'Employee ID', 'Date Key', 'Leave Type', 'Note', 'Updated At'];

function getScriptProperty(key) {
  try {
    const allProps = PropertiesService.getScriptProperties().getProperties();
    const target = String(key || '').trim().toUpperCase();
    for (var propKey in allProps) {
      if (String(propKey).trim().toUpperCase() === target) {
        return String(allProps[propKey] || '').trim();
      }
    }
  } catch (error) {
    Logger.log('Property read error: ' + error.toString());
  }
  return String(PropertiesService.getScriptProperties().getProperty(key) || '').trim();
}

function ensureConfigured() {
  if (!CALENDAR_SHEET_ID) {
    throw new Error('CALENDAR_SHEET_ID (or GOOGLE_SHEET_ID) is not configured.');
  }
}

function openSheet() {
  ensureConfigured();
  return SpreadsheetApp.openById(CALENDAR_SHEET_ID);
}

function getOrCreateSheet(sheetName, headers) {
  const spreadsheet = openSheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }

  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var mismatch = false;
  for (var i = 0; i < headers.length; i++) {
    if (String(firstRow[i] || '').trim() !== headers[i]) {
      mismatch = true;
      break;
    }
  }
  if (mismatch) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function createResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return createResponse({ success: true, message: 'gas_calendar API is active. Use POST.' });
}

function nowIso() {
  return new Date().toISOString();
}

function sanitizeText(value, maxLen) {
  var text = String(value || '').trim().replace(/[<>]/g, '');
  return maxLen ? text.slice(0, maxLen) : text;
}

function normalizePhase(value) {
  var n = Number(value);
  return n === 1 ? 1 : 0;
}

function loadEmployees() {
  const sheet = getOrCreateSheet(SHEET_EMPLOYEES, EMP_HEADERS);
  const rows = sheet.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    const activeStr = sanitizeText(rows[i][3], 20) || 'TRUE';
    if (activeStr.toUpperCase() === 'FALSE') continue;
    const id = sanitizeText(rows[i][0], 80);
    if (!id) continue;
    result.push({
      id: id,
      name: sanitizeText(rows[i][1], 120),
      phase: normalizePhase(rows[i][2]),
      startWorkingSaturday: sanitizeText(rows[i][6], 10),
    });
  }
  return result;
}

function loadOverrides(monthKey) {
  const sheet = getOrCreateSheet(SHEET_OVERRIDES, OVR_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const prefix = sanitizeText(monthKey, 7) + '-';
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    const dateKey = sanitizeText(rows[i][1], 10);
    if (!dateKey || dateKey.indexOf(prefix) !== 0) continue;
    result.push({
      employeeId: sanitizeText(rows[i][0], 80),
      dateKey: dateKey,
      status: sanitizeText(rows[i][2], 20),
    });
  }
  return result;
}

function loadHolidays(monthKey) {
  const sheet = getOrCreateSheet(SHEET_HOLIDAYS, HOL_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const prefix = sanitizeText(monthKey, 7) + '-';
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    const activeStr = sanitizeText(rows[i][2], 20) || 'TRUE';
    if (activeStr.toUpperCase() === 'FALSE') continue;
    const dateKey = sanitizeText(rows[i][0], 10);
    if (!dateKey || dateKey.indexOf(prefix) !== 0) continue;
    result.push({
      dateKey: dateKey,
      name: sanitizeText(rows[i][1], 120) || 'Holiday',
    });
  }
  return result;
}

function loadLeaves(monthKey) {
  const sheet = getOrCreateSheet(SHEET_LEAVES, LEAVE_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const prefix = sanitizeText(monthKey, 7) + '-';
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    const dateKey = sanitizeText(rows[i][2], 10);
    if (!dateKey || dateKey.indexOf(prefix) !== 0) continue;
    result.push({
      id: sanitizeText(rows[i][0], 80),
      employeeId: sanitizeText(rows[i][1], 80),
      dateKey: dateKey,
      leaveType: sanitizeText(rows[i][3], 50),
      note: sanitizeText(rows[i][4], 240),
    });
  }
  return result;
}

function rosterGetMonth(payload) {
  const monthKey = sanitizeText(payload.monthKey, 7);
  if (!monthKey) return { success: false, error: 'monthKey is required' };
  return {
    success: true,
    data: {
      employees: loadEmployees(),
      overrides: loadOverrides(monthKey),
      holidays: loadHolidays(monthKey),
      leaves: loadLeaves(monthKey),
    },
  };
}

function rosterAddEmployee(payload) {
  const name = sanitizeText(payload.name, 120);
  if (!name) return { success: false, error: 'Employee name is required' };
  const phase = normalizePhase(payload.phase);
  const startWorkingSaturday = sanitizeText(payload.startWorkingSaturday, 10);
  const employeeId = 'emp-' + new Date().getTime();
  const ts = nowIso();
  const sheet = getOrCreateSheet(SHEET_EMPLOYEES, EMP_HEADERS);
  sheet.appendRow([employeeId, name, phase, 'TRUE', ts, ts, startWorkingSaturday]);
  return { success: true, data: { id: employeeId, name: name, phase: phase, startWorkingSaturday: startWorkingSaturday } };
}

function rosterUpdateEmployeePhase(payload) {
  const employeeId = sanitizeText(payload.employeeId, 80);
  if (!employeeId) return { success: false, error: 'employeeId is required' };
  const phase = normalizePhase(payload.phase);
  const sheet = getOrCreateSheet(SHEET_EMPLOYEES, EMP_HEADERS);
  const rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (sanitizeText(rows[i][0], 80) === employeeId) {
      sheet.getRange(i + 1, 3).setValue(phase);
      sheet.getRange(i + 1, 6).setValue(nowIso());
      return { success: true, data: { employeeId: employeeId, phase: phase } };
    }
  }
  return { success: false, error: 'Employee not found' };
}

function upsertOverrideRows(employeeId, overridesList, updatedBy) {
  const sheet = getOrCreateSheet(SHEET_OVERRIDES, OVR_HEADERS);
  const rows = sheet.getDataRange().getValues();
  
  const updateMap = {};
  overridesList.forEach(function(item) {
    updateMap[item.dateKey] = item.status;
  });
  
  const keep = [OVR_HEADERS];
  const processedKeys = {};
  
  for (var i = 1; i < rows.length; i++) {
    const rowEmpId = sanitizeText(rows[i][0], 80);
    const rowDateKey = sanitizeText(rows[i][1], 10);
    
    if (rowEmpId === employeeId && updateMap.hasOwnProperty(rowDateKey)) {
      const newStatus = updateMap[rowDateKey];
      processedKeys[rowDateKey] = true;
      if (newStatus !== 'CLEAR') {
        keep.push([employeeId, rowDateKey, newStatus, nowIso(), updatedBy]);
      }
    } else {
      keep.push(rows[i]);
    }
  }
  
  overridesList.forEach(function(item) {
    if (!processedKeys.hasOwnProperty(item.dateKey) && item.status !== 'CLEAR') {
      keep.push([employeeId, item.dateKey, item.status, nowIso(), updatedBy]);
    }
  });
  
  sheet.clearContents();
  sheet.getRange(1, 1, keep.length, OVR_HEADERS.length).setValues(keep);
}

function upsertOverrideRow(employeeId, dateKey, status, updatedBy) {
  upsertOverrideRows(employeeId, [{ dateKey: dateKey, status: status }], updatedBy);
}

function rosterUpsertOverride(payload) {
  const employeeId = sanitizeText(payload.employeeId, 80);
  const dateKey = sanitizeText(payload.dateKey, 10);
  const status = sanitizeText(payload.status, 20);
  if (!employeeId || !dateKey || !status) {
    return { success: false, error: 'employeeId, dateKey, and status are required' };
  }
  upsertOverrideRow(employeeId, dateKey, status, sanitizeText(payload.authEmail, 120));
  return { success: true, data: { employeeId: employeeId, dateKey: dateKey, status: status } };
}

function rosterSwapSaturday(payload) {
  const employeeId = sanitizeText(payload.employeeId, 80);
  const sourceDateKey = sanitizeText(payload.sourceDateKey, 10);
  const targetDateKey = sanitizeText(payload.targetDateKey, 10);
  const sourceStatus = sanitizeText(payload.sourceStatus, 20);
  const targetStatus = sanitizeText(payload.targetStatus, 20);
  if (!employeeId || !sourceDateKey || !targetDateKey || !sourceStatus || !targetStatus) {
    return { success: false, error: 'swap payload is incomplete' };
  }
  const updatedBy = sanitizeText(payload.authEmail, 120);
  upsertOverrideRows(employeeId, [
    { dateKey: sourceDateKey, status: sourceStatus },
    { dateKey: targetDateKey, status: targetStatus }
  ], updatedBy);
  return { success: true, data: { employeeId: employeeId } };
}

function rosterClearMonthOverrides(payload) {
  const monthKey = sanitizeText(payload.monthKey, 7);
  if (!monthKey) return { success: false, error: 'monthKey is required' };
  const sheet = getOrCreateSheet(SHEET_OVERRIDES, OVR_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const keep = [OVR_HEADERS];
  const prefix = monthKey + '-';
  for (var i = 1; i < rows.length; i++) {
    const dateKey = sanitizeText(rows[i][1], 10);
    if (dateKey.indexOf(prefix) === 0) continue;
    keep.push(rows[i]);
  }
  sheet.clearContents();
  sheet.getRange(1, 1, keep.length, OVR_HEADERS.length).setValues(keep);
  return { success: true, data: { monthKey: monthKey } };
}

function rosterDeleteEmployee(payload) {
  const employeeId = sanitizeText(payload.employeeId, 80);
  if (!employeeId) return { success: false, error: 'employeeId is required' };
  const sheet = getOrCreateSheet(SHEET_EMPLOYEES, EMP_HEADERS);
  const rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (sanitizeText(rows[i][0], 80) === employeeId) {
      sheet.getRange(i + 1, 4).setValue('FALSE'); // Column Active
      sheet.getRange(i + 1, 6).setValue(nowIso()); // Column Updated At
      return { success: true, data: { employeeId: employeeId } };
    }
  }
  return { success: false, error: 'Employee not found' };
}

function rosterUpdateEmployeeStartSaturday(payload) {
  const employeeId = sanitizeText(payload.employeeId, 80);
  if (!employeeId) return { success: false, error: 'employeeId is required' };
  const startWorkingSaturday = sanitizeText(payload.startWorkingSaturday, 10);
  const sheet = getOrCreateSheet(SHEET_EMPLOYEES, EMP_HEADERS);
  const rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (sanitizeText(rows[i][0], 80) === employeeId) {
      sheet.getRange(i + 1, 7).setValue(startWorkingSaturday); // Column 7 is Start Saturday
      sheet.getRange(i + 1, 6).setValue(nowIso()); // Column 6 is Updated At
      return { success: true, data: { employeeId: employeeId, startWorkingSaturday: startWorkingSaturday } };
    }
  }
  return { success: false, error: 'Employee not found' };
}

function rosterUpsertLeave(payload) {
  const employeeId = sanitizeText(payload.employeeId, 80);
  const dateKey = sanitizeText(payload.dateKey, 10);
  const leaveType = sanitizeText(payload.leaveType, 50);
  const note = sanitizeText(payload.note, 240);
  if (!employeeId || !dateKey || !leaveType) {
    return { success: false, error: 'employeeId, dateKey, and leaveType are required' };
  }
  const sheet = getOrCreateSheet(SHEET_LEAVES, LEAVE_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const ts = nowIso();
  for (var i = 1; i < rows.length; i++) {
    if (sanitizeText(rows[i][1], 80) === employeeId && sanitizeText(rows[i][2], 10) === dateKey) {
      sheet.getRange(i + 1, 4).setValue(leaveType);
      sheet.getRange(i + 1, 5).setValue(note);
      sheet.getRange(i + 1, 6).setValue(ts);
      return { success: true, data: { id: sanitizeText(rows[i][0], 80), employeeId: employeeId, dateKey: dateKey, leaveType: leaveType, note: note } };
    }
  }
  const leaveId = 'leave-' + new Date().getTime();
  sheet.appendRow([leaveId, employeeId, dateKey, leaveType, note, ts]);
  return { success: true, data: { id: leaveId, employeeId: employeeId, dateKey: dateKey, leaveType: leaveType, note: note } };
}

function rosterDeleteLeave(payload) {
  const employeeId = sanitizeText(payload.employeeId, 80);
  const dateKey = sanitizeText(payload.dateKey, 10);
  if (!employeeId || !dateKey) {
    return { success: false, error: 'employeeId and dateKey are required' };
  }
  const sheet = getOrCreateSheet(SHEET_LEAVES, LEAVE_HEADERS);
  const rows = sheet.getDataRange().getValues();
  const keep = [LEAVE_HEADERS];
  var found = false;
  for (var i = 1; i < rows.length; i++) {
    if (sanitizeText(rows[i][1], 80) === employeeId && sanitizeText(rows[i][2], 10) === dateKey) {
      found = true;
      continue;
    }
    keep.push(rows[i]);
  }
  if (found) {
    sheet.clearContents();
    sheet.getRange(1, 1, keep.length, LEAVE_HEADERS.length).setValues(keep);
  }
  return { success: true, data: { employeeId: employeeId, dateKey: dateKey, deleted: found } };
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return createResponse({ success: false, error: 'No data received' });
    }
    const payload = JSON.parse(e.postData.contents);
    const action = sanitizeText(payload.action, 60);

    if (action === 'rosterGetMonth') return createResponse(rosterGetMonth(payload));
    if (action === 'rosterAddEmployee') return createResponse(rosterAddEmployee(payload));
    if (action === 'rosterUpdateEmployeePhase') return createResponse(rosterUpdateEmployeePhase(payload));
    if (action === 'rosterUpdateEmployeeStartSaturday') return createResponse(rosterUpdateEmployeeStartSaturday(payload));
    if (action === 'rosterDeleteEmployee') return createResponse(rosterDeleteEmployee(payload));
    if (action === 'rosterUpsertOverride') return createResponse(rosterUpsertOverride(payload));
    if (action === 'rosterSwapSaturday') return createResponse(rosterSwapSaturday(payload));
    if (action === 'rosterClearMonthOverrides') return createResponse(rosterClearMonthOverrides(payload));
    if (action === 'rosterUpsertLeave') return createResponse(rosterUpsertLeave(payload));
    if (action === 'rosterDeleteLeave') return createResponse(rosterDeleteLeave(payload));

    return createResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}
