# ✅ Deployment & Testing Checklist

**Project**: QSMS Rework Management System
**Bugs Fixed**: 2 Critical Issues (ItemMaster Verification + Image Upload)
**Date**: January 15, 2025
**Status**: Ready for Testing Phase

---

## Pre-Testing Checklist (Do This First)

- [ ] Read `BUG_FIX_REPORT.md` to understand the issues
- [ ] Read `TECHNICAL_SUMMARY.md` for implementation details
- [ ] Review modified files list (see below)
- [ ] Backup current Google Apps Script (in case rollback needed)
- [ ] Have Google Drive open in another tab for verification
- [ ] Have Google Sheets open for ItemMaster sheet

---

## Code Deployment

### Step 1: GAS Backend Update
- [ ] Open Google Apps Script editor
- [ ] Copy entire content from `gas/Code.gs`
- [ ] Paste into GAS project, replacing old code
- [ ] Save project (Ctrl+S)
- [ ] Deploy as new version (Deploy → New Deployment)
- [ ] Copy new deployment URL
- [ ] Update deployment URL in `src/App.tsx` line 289 if needed

### Step 2: Frontend Code Update
- [ ] Pull latest changes (git pull or manually copy files)
- [ ] Install dependencies: `npm install` (if any new packages)
- [ ] Run linter: `npm run lint` (some pre-existing errors OK)
- [ ] Build project: `npm run build`
- [ ] Deploy built files to hosting platform

### Step 3: Verify Deployment
- [ ] Open application in browser
- [ ] Open DevTools Console (F12)
- [ ] Check for errors (should be clean or only pre-existing errors)
- [ ] Application should load without issues

---

## Phase 1: ItemMaster Verification Testing

### Test 1.1: ItemMaster Sheet Creation
- [ ] Navigate to Add Case tab
- [ ] Check browser console
- [ ] Look for message: `✓ ItemMaster loaded: 0 items []`
- [ ] Go to Google Sheet (`1Zw66PocKhrTHpPj20Tt2DwBep1vHfbrWw9soX0afss0`)
- [ ] Verify "ItemMaster" sheet tab exists at bottom
- [ ] Verify headers exist: ItemNumber | ItemName
- [ ] Verify formatting: Bold text, blue background

### Test 1.2: Add Test Data to ItemMaster
- [ ] In Google Sheet ItemMaster tab, add test items:
  ```
  ItemNumber | ItemName
  60001001   | Test Item 1
  100001     | Sample Product
  200005     | Demo Widget
  ```
- [ ] Save the sheet

### Test 1.3: Test Auto-Verification
- [ ] Go back to browser, refresh page
- [ ] Check console: `✓ ItemMaster loaded: 3 items [...]`
- [ ] Go to Add Case tab
- [ ] Enter ItemNumber: `60001001`
- [ ] Press Tab or blur field (leave the field)
- [ ] **Expected**: ItemName field auto-fills with "Test Item 1"
- [ ] **Expected**: Green checkmark shows: `✓ ชื่อรายการถูกเติมอัตโนมัติ`
- [ ] **Expected**: Console shows: `✓ Item matched: 60001001 → Test Item 1`

### Test 1.4: Test Verify Button for Existing Items
- [ ] Clear ItemNumber field and enter `100001`
- [ ] Click "ตรวจสอบ" (Verify) button
- [ ] **Expected**: ItemName auto-fills with "Sample Product"
- [ ] **Expected**: No modal appears (item exists, no modal needed)
- [ ] **Expected**: Console shows: `✓ Item matched: 100001 → Sample Product`

### Test 1.5: Test Modal for Non-Existent Items
- [ ] Clear ItemNumber field and enter `999999999`
- [ ] Click "ตรวจสอบ" (Verify) button
- [ ] **Expected**: Modal appears: "Create New Item?" 
- [ ] **Expected**: Console shows: `✗ Item not found: 999999999 (showing modal)`
- [ ] Click "ยกเลิก" (Cancel) button
- [ ] **Expected**: Modal closes

### Test 1.6: Test Create New Item Flow
- [ ] Clear ItemNumber and enter new: `300001`
- [ ] Click Verify button
- [ ] Modal appears
- [ ] Click "ตกลง" (Confirm) button
- [ ] **Expected**: ItemName field becomes enabled (editable)
- [ ] **Expected**: New item saved to ItemMaster sheet
- [ ] Go to Google Sheet ItemMaster tab
- [ ] **Expected**: New row with `300001 | (empty or you entered)`

**Result for Phase 1**: ✅ Pass / ❌ Fail

---

## Phase 2: Image Upload Testing

### Test 2.1: Prepare Test Case
- [ ] Go to Add Case tab
- [ ] Fill required fields:
  - Source: "Test Source 001"
  - ItemNumber: `60001001` (from ItemMaster)
  - Amount: `1`
  - Reason: "Test Reason"
  - Responsible: "Test User"
- [ ] Check console: Auto-verify works `✓ Item matched`

### Test 2.2: Upload Single Image
- [ ] Click "เลือกรูปภาพ" (Select Images) button
- [ ] Choose 1 image (JPG or PNG)
- [ ] **Expected**: Image appears in preview
- [ ] Check console:
  - [ ] Shows: `📸 Processing images for [itemid]`
  - [ ] Shows: `Image 1/1: data:image/jpeg;base64,...`

### Test 2.3: Submit Case with Image
- [ ] Click "บันทึก Case" (Save Case) button
- [ ] **Expected**: No error messages
- [ ] **Expected**: Success message appears
- [ ] Check console for messages:
  - [ ] `📸 Processing images`
  - [ ] `📦 Sending case to GAS`
  - [ ] `✓ Case inserted successfully: {caseId: "RW...", itemIds: [...]}`

### Test 2.4: Verify Image Saved to Drive
- [ ] Open Google Drive: `https://drive.google.com/drive/folders/1QVYbfWc_kEBs4jONGpA3l6ai0gzvDQfj`
- [ ] **Expected**: New folder created with pattern `Case_RW*`
- [ ] Open the new Case folder
- [ ] **Expected**: JPG file inside named like `RW*-001-001_[timestamp].jpg`
- [ ] Click on file → Preview image
- [ ] **Expected**: Image displays correctly (not corrupted)

### Test 2.5: Multiple Images Test
- [ ] Create new case
- [ ] Item 1: Add 2 images
- [ ] Item 2: Add 3 images
- [ ] Submit case
- [ ] Check console:
  - [ ] `📸 Processing images for [item1]` - 2 images
  - [ ] `📸 Processing images for [item2]` - 3 images
  - [ ] Total 5 images mentioned in logs
- [ ] Go to Drive case folder
- [ ] **Expected**: 5 JPG files present
- [ ] Check one image to verify it's not corrupted

### Test 2.6: Case Without Images
- [ ] Create case with NO images
- [ ] Submit case
- [ ] Check console:
  - [ ] `ℹ️ No images for [itemid]`
  - [ ] `✓ Case inserted successfully`
- [ ] **Expected**: Case saves successfully
- [ ] Go to Google Sheet "Rework Cases" tab
- [ ] **Expected**: New row with empty ImageUrls column

**Result for Phase 2**: ✅ Pass / ❌ Fail

---

## Phase 3: Database Verification

### Test 3.1: Check Rework Cases Sheet
- [ ] Open Google Sheets
- [ ] Go to "Rework Cases" sheet tab
- [ ] Look at latest rows (newest at bottom)
- [ ] Verify columns:
  - [ ] CaseId: Format `RW[YYMMDD][HHMM]`
  - [ ] ItemNumber: Shows entered number
  - [ ] ItemName: Shows from ItemMaster
  - [ ] Amount: Shows entered amount
  - [ ] Source: Shows entered source
  - [ ] Status: Shows "Pending"
  - [ ] ImageUrls: Shows Drive links for images (if any)

### Test 3.2: Verify Image URLs Work
- [ ] Copy an ImageUrl from the sheet
- [ ] Paste into new browser tab
- [ ] **Expected**: Drive preview shows the image
- [ ] Image should be viewable and not corrupted
- [ ] Check file is in correct case folder

### Test 3.3: Check ItemMaster Updates
- [ ] Go to ItemMaster sheet
- [ ] Verify rows:
  - [ ] Original test items present
  - [ ] Any new items from "Create New Item" flow
  - [ ] All items formatted with headers

**Result for Phase 3**: ✅ Pass / ❌ Fail

---

## Phase 4: Error Handling Tests

### Test 4.1: Invalid Base64 Handling (Developer Test)
- [ ] Open DevTools Console
- [ ] Manually send invalid image to GAS (requires coding)
- [ ] Check GAS logs for error message
- [ ] **Expected**: Clear error: `✗ Image upload error: Failed to decode base64: ...`

### Test 4.2: Permission Error Simulation
- [ ] Remove edit permission from Drive folder (carefully!)
- [ ] Try to upload image and case
- [ ] Check GAS logs for error
- [ ] **Expected**: Error logged: `✗ Folder creation error: Permission denied`
- [ ] **Re-enable permissions** after test

### Test 4.3: Network Error Handling
- [ ] Disconnect internet
- [ ] Try to save case
- [ ] **Expected**: Error message in UI
- [ ] Reconnect internet
- [ ] Try again
- [ ] **Expected**: Works correctly

**Result for Phase 4**: ✅ Pass / ❌ Fail / ⏭️ Skip (Optional)

---

## Phase 5: Performance & Edge Cases

### Test 5.1: Large Image Upload
- [ ] Try uploading 5-10MB image
- [ ] **Expected**: Upload completes (may take 30-60 seconds)
- [ ] **Expected**: Image appears in Drive
- [ ] Check if file size is preserved

### Test 5.2: Many Items in Case
- [ ] Create case with 20 items (max allowed)
- [ ] Each with 1-2 images
- [ ] Total: ~30-40 images
- [ ] Submit
- [ ] **Expected**: All items save successfully
- [ ] **Expected**: All images appear in Drive

### Test 5.3: ItemMaster with 100+ Items
- [ ] Add many items to ItemMaster sheet (bulk paste)
- [ ] Refresh app
- [ ] Enter ItemNumber
- [ ] **Expected**: Auto-fill works instantly (no lag)
- [ ] Check console for performance

### Test 5.4: Repeat Case Submission
- [ ] Create and submit same case 3 times
- [ ] **Expected**: All 3 cases save independently
- [ ] **Expected**: 3 separate CaseIds
- [ ] Check Drive for 3 separate folders

**Result for Phase 5**: ✅ Pass / ❌ Fail / ⏭️ Skip (Optional)

---

## Final Validation

### Before Declaring Success

- [ ] All Phase 1-3 tests PASSED
- [ ] Browser console has no RED errors (warnings OK)
- [ ] GAS logs show all expected messages
- [ ] Google Drive has case folders with images
- [ ] Google Sheets has case data with image URLs
- [ ] No issues found in 24-hour monitoring period

### Sign-Off

- [ ] QA Tester: _________________ Date: ________
- [ ] Dev Lead: _________________ Date: ________
- [ ] Product Owner: _________________ Date: ________

---

## Rollback Plan (If Issues Found)

1. **GAS Rollback**: 
   - Go to Apps Script editor
   - Click Deployments
   - Select previous deployment
   - Update frontend GAS URL to old deployment

2. **Frontend Rollback**:
   - Deploy previous version from git
   - Revert changes to src/App.tsx, src/services/api.ts

3. **Data Rollback**:
   - ItemMaster sheet: Delete test items only
   - Images: No action (already saved)
   - Cases: No action needed

---

## Success Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| ItemMaster Auto-Verification Works | 100% | ___% |
| Image Upload Success Rate | 100% | ___% |
| Case Submission Success Rate | 100% | ___% |
| Drive Image Storage Success | 100% | ___% |
| Console Log Accuracy | 100% | ___% |

---

**Status**: ⏳ READY FOR TESTING PHASE
**Next Step**: Follow Phase 1 testing above
**Questions**: See BUG_FIX_VERIFICATION.md or TECHNICAL_SUMMARY.md

---

*Deployment Checklist v1.0 - January 15, 2025*
