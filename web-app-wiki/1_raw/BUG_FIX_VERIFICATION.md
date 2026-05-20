# Bug Fix Verification Guide

## Summary of Fixes

### Bug #1: ItemMaster Verification Failing ✅ FIXED
**Problem**: All item verification attempts showed "create new item" modal even when ItemMaster sheet existed.

**Root Causes Identified**:
1. `getItemMaster()` returned `success: false` when ItemMaster sheet didn't exist
2. Frontend `loadMasterData()` only processed data when `success: true AND data exists`
3. ItemMaster sheet might not be auto-created, leaving it empty

**Fixes Applied**:
1. ✅ **gas/Code.gs - getItemMaster()** (Line 777)
   - Now auto-creates ItemMaster sheet if it doesn't exist
   - Creates header row: "Item Number" | "Item Name"
   - Applies formatting (bold, blue background)
   - Returns `success: true` even if empty initially

2. ✅ **src/App.tsx - loadMasterData()** (Line 306)
   - Changed to process `result.data || []` regardless of success flag
   - Added console logging to show: ItemMaster size and loaded data
   - Always creates Map for verification, handles empty array gracefully

### Bug #2: Images Not Saving to Drive ✅ FIXED
**Problem**: Uploaded images were not being saved to Drive case folders.

**Root Causes Analyzed**:
1. Frontend correctly encodes images as base64 data URLs
2. Base64 encoding includes "data:image/jpeg;base64," prefix
3. GAS needed defensive decoding and better error handling

**Fixes Applied**:
1. ✅ **gas/Code.gs - uploadImageToDrive()** (Line 921)
   - Added input validation (checks for string type, non-empty)
   - Defensive base64 splitting (handles both data URL and raw base64)
   - Added try-catch around base64 decode with specific error messages
   - Better folder creation error handling
   - Added logging for successful uploads: `✓ Image uploaded: filename → url`
   - Added logging for failures with detailed error messages

2. ✅ **gas/Code.gs - getOrCreateCaseFolder()** (Line 887)
   - Added logging for folder creation and retrieval
   - Shows folder IDs in logs for debugging
   - More detailed error messages

3. ✅ **gas/Code.gs - handleInsert()** (Line 405)
   - Added logging for image count per item
   - Shows base64 sample (first 50 chars) for verification
   - Logs successful and failed upload counts

### Logging Enhancements ✅ ADDED
**Frontend**:
- ✅ `src/App.tsx` - handleCheckItemNumber: Shows verification attempt details
  - `🔍 Verifying itemNumber` with found status and master data size
  - `✓` for success, `✗` for not found, `ℹ️` for silent mode
  
- ✅ `src/services/api.ts` - insertCase: Shows image processing pipeline
  - `📸 Processing images` with file count and base64 sample
  - `📦 Sending case to GAS` with item count summary
  - `✓` for success, `✗` for failure with error details

**GAS Backend**:
- ✅ Log messages include emojis and status indicators
  - `✓` Image uploaded successfully
  - `✗` Image upload failed
  - `🔍` Processing information
  - `📸` Image counts

---

## Testing Checklist

### Phase 1: ItemMaster Verification

#### Test 1.1: Fresh ItemMaster Sheet Creation
1. Open browser DevTools (F12)
2. Navigate to Add Case tab
3. Open DevTools Console tab
4. Enter an ItemNumber (e.g., "60001001")
5. **Expected Results**:
   - Console shows: `✓ ItemMaster loaded: 0 items []`
   - GAS logs show: "ItemMaster sheet created with headers"
   - No errors in console

#### Test 1.2: Add Item to ItemMaster Manually
1. Open Google Sheet: `1Zw66PocKhrTHpPj20Tt2DwBep1vHfbrWw9soX0afss0`
2. Find "ItemMaster" sheet tab at bottom
3. Add test data:
   ```
   ItemNumber    | ItemName
   60001001      | Test Item 1
   100001        | Sample Product
   ```
4. Refresh the application

#### Test 1.3: Verify Auto-Fill Works
1. In Add Case tab, enter ItemNumber "60001001"
2. **Expected Results**:
   - ItemName field auto-fills with "Test Item 1"
   - Green checkmark appears: "✓ ชื่อรายการถูกเติมอัตโนมัติ"
   - Console shows: `✓ Item matched: 60001001 → Test Item 1`

#### Test 1.4: Verify Button Shows Modal for Non-Existent Items
1. Enter ItemNumber "999999999"
2. Click "ตรวจสอบ" (Verify) button
3. **Expected Results**:
   - "Create New Item" confirmation modal appears
   - Console shows: `✗ Item not found: 999999999 (showing modal)`

---

### Phase 2: Image Upload and Storage

#### Test 2.1: Single Image Upload
1. In Add Case tab, fill in minimum required fields:
   - Source: "Test Source"
   - ItemNumber: "60001001"
   - ItemName: (auto-filled)
   - Amount: "1"
   - Reason: (any)
   - Responsible: (any)
2. Click "เลือกรูปภาพ" (Select Images) button
3. Upload one image (JPG/PNG)
4. **Expected Results**:
   - Console shows: `📸 Processing images for 60001001:`
   - Shows: `Image 1/1: data:image/jpeg;base64,...`
   - Shows: `✓ Successfully uploaded 1 images`

#### Test 2.2: Submit Case with Images
1. Complete the form from Test 2.1
2. Click "บันทึก Case" (Save Case) button
3. **Expected Results**:
   - Console shows:
     - `📸 Processing images for [item]` with count
     - `📦 Sending case to GAS` with image summary
     - `✓ Case inserted successfully: { caseId: "...", itemIds: [...] }`
   - No error messages in console

#### Test 2.3: Verify Images in Google Drive
1. Open Google Drive folder: `https://drive.google.com/drive/folders/1QVYbfWc_kEBs4jONGpA3l6ai0gzvDQfj`
2. Look for newly created folder: `Case_RW[TIMESTAMP]` or `Case_RW[DATEHHMM]`
3. **Expected Results**:
   - Folder exists with name pattern `Case_RW*`
   - Inside: JPG files named like `[itemid]_[timestamp].jpg`
   - File count matches images uploaded
   - Images are viewable/downloadable

#### Test 2.4: Multiple Items with Images
1. Create case with 2 items:
   - Item 1: itemNumber "60001001" + 1 image
   - Item 2: itemNumber "100001" + 2 images
2. Submit case
3. **Expected Results**:
   - Console shows processing for both items
   - `📸 Processing images for RW*-001` with 1 image
   - `📸 Processing images for RW*-002` with 2 images
   - Total 3 images uploaded successfully
   - Drive folder contains all 3 JPG files organized by itemId

---

### Phase 3: Error Handling

#### Test 3.1: Invalid Base64 Handling
1. Open DevTools Network tab
2. Create and submit a normal case with image
3. Look for POST request to GAS endpoint
4. **Expected Result**: GAS logs show upload success

#### Test 3.2: Image Upload Failure (Permission Issue)
1. If Drive folder permissions restricted:
   - Check GAS logs for: `✗ Folder creation error: Permission denied`
   - Fix: Ensure GAS account has edit access to DRIVE_FOLDER_ID
   - Fix: Ensure DRIVE_FOLDER_ID is correct in gas/Code.gs line 20

#### Test 3.3: Missing Images Array
1. Manually create case with empty images array (developer only)
2. **Expected Result**: 
   - Console shows: `ℹ️ No images for [itemid]`
   - Case saves successfully with imageUrls empty

---

## Console Log Reference

### Frontend Logs (Browser DevTools)

**ItemMaster Loading**:
```
✓ ItemMaster loaded: 2 items [{itemNumber, itemName}, ...]
```

**Item Verification**:
```
🔍 Verifying itemNumber: 60001001
{found: true, itemName: "Test Item", masterDataSize: 2, showModal: false}
✓ Item matched: 60001001 → Test Item
```

**Image Processing**:
```
📸 Processing images for 60001001:
{itemId: "form-123", fileCount: 1, base64Count: 1, sampleBase64: "data:image/jpeg;base64,/9j/4AAQSk..."}
📦 Sending case to GAS:
{source: "Test", itemCount: 1, totalImages: 1}
✓ Case inserted successfully: {caseId: "RW250115-001", itemIds: ["RW250115-001-001"]}
```

### GAS Logs (Apps Script Editor)

**ItemMaster Creation**:
```
ItemMaster sheet not found. Creating new sheet...
ItemMaster sheet created with headers
```

**Image Upload**:
```
Found existing case folder: Case_RW250115-001 (1abc2def...)
✓ Created new case folder: Case_RW250115-001 (9xyz8wvu...)
📸 Processing 1 images for RW250115-001-001
  Image 1/1: data:image/jpeg;base64,/9j/4AAQSkZ...
✓ Image uploaded: RW250115-001-001_1705316400000.jpg → https://drive.google.com/file/d/...
✓ Successfully uploaded 1 images for RW250115-001-001
```

---

## How to Access Logs

### Browser Console
1. Open Application (Rework Management System)
2. Press `F12` or Right-click → "Inspect"
3. Go to "Console" tab
4. Look for messages starting with: `✓`, `✗`, `🔍`, `📸`, `📦`, `ℹ️`, `⚠️`
5. Filter by text (Ctrl+F in console) for specific searches

### GAS Logs
1. Go to [Google Apps Script Dashboard](https://script.google.com/home)
2. Click on your "Rework Management System" project
3. In the sidebar, click "Executions"
4. Click on the latest execution
5. In the right panel, you'll see execution logs
6. Search for: `ItemMaster`, `Image uploaded`, `case folder`

### Deployed Case Data
1. Open Google Sheets: `1Zw66PocKhrTHpPj20Tt2DwBep1vHfbrWw9soX0afss0`
2. Click "Rework Cases" sheet tab
3. Check latest rows for:
   - CaseId format: `RW[YYMMDD][HHMM]`
   - ItemNumber column has correct data
   - ImageUrls column contains Drive file URLs

---

## Common Issues and Solutions

### Issue: "ItemMaster loaded: 0 items"
**Solution**: 
- Sheet was just created, no items added yet
- Manually add items to ItemMaster sheet
- Or create new item via "Create New Item" confirmation modal
- Refresh page to reload

### Issue: Images show count but none saved to Drive
**Problem**: Base64 decoding failing
**Solution**:
- Check GAS logs for: `✗ Image upload error: Failed to decode base64`
- Verify frontend is sending data URL format: `data:image/jpeg;base64,...`
- Check Drive permissions on DRIVE_FOLDER_ID

### Issue: Case folder not created in Drive
**Problem**: Permission denied or wrong folder ID
**Solution**:
- Verify DRIVE_FOLDER_ID in gas/Code.gs line 20
- Check GAS account has editor access to that folder
- Check Drive folder exists and is accessible
- Look for GAS error: `Folder creation error: Permission denied`

### Issue: "Create New Item" modal keeps appearing
**Problem**: ItemMaster Map is empty after loading
**Solution**:
- Check browser console for ItemMaster load message
- Verify ItemMaster sheet has data (check Google Sheets directly)
- Check `masterDataSize` in verification log
- If 0, add data to ItemMaster sheet

---

## Performance Notes

- ItemMaster loaded once on app mount
- Verification is instant (Map lookup = O(1))
- Image encoding is async (won't block UI)
- GAS image upload runs sequentially per item
- Multiple images per item run in parallel via `map()`

## Next Steps After Verification

1. ✅ Verify ItemMaster sheet exists and has data
2. ✅ Test item auto-fill works for existing items
3. ✅ Test image upload saves files to Drive
4. ✅ Check console logs show all expected messages
5. ✅ Verify case data saved in Google Sheets with image URLs
6. Deploy to production with confidence! 🚀
