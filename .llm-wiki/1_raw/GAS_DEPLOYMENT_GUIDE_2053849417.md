# Google Apps Script (GAS) Deployment Guide

## 🎯 How GAS Handles CORS

Google Apps Script Web App deployments automatically handle CORS (Cross-Origin Resource Sharing) when configured correctly. **You do NOT need to manually add CORS headers** - GAS handles this automatically.

## ✅ Correct GAS Web App Deployment Steps

Follow these steps to deploy the GAS backend for the QSMS Rework system:

### 1️⃣ Prepare Your Google Sheet
1. Create a Google Sheet or use existing one
2. Update `gas/Code.gs` line 15-19 with your Sheet ID and configuration:
   ```javascript
   const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // Replace with your actual Sheet ID
   const SHEET_NAME = 'Rework Cases';
   const ITEM_MASTER_SHEET_NAME = 'ItemMaster';
   const BACKUP_SHEET_NAME = 'Backup';
   const DRIVE_FOLDER_ID = 'YOUR_GOOGLE_DRIVE_FOLDER_ID'; // For image uploads
   ```

### 2️⃣ Create Google Apps Script Project
1. Go to [Google Apps Script Console](https://script.google.com/home)
2. Click **New project**
3. Name it "QSMS Rework GAS Backend"
4. Copy entire `gas/Code.gs` code
5. Paste into Apps Script editor
6. Save the project (Ctrl+S)

### 3️⃣ Initialize Sheet Headers
1. In Apps Script editor, find the `initializeSheet()` function
2. Click **Run** button to execute it once
3. This will create headers in your Google Sheet:
   - Item ID | Case ID | Date | Source | Item Number | Item Name | ... | Status | Image URLs

### 4️⃣ Deploy as Web App
**This is the CRITICAL step for CORS to work:**

1. Click **Deploy** → **New Deployment**
2. Select type dropdown → **Web app**
3. Execute as: **[Your Google Account]** (the one that owns the Sheet)
4. Who has access: **Anyone** ← **IMPORTANT: This enables CORS!**
5. Click **Deploy**
6. A popup will show your deployment URL, copy it:
   ```
   https://script.google.com/macros/s/AKfycbw.../exec
   ```

### 5️⃣ Update Frontend URL
1. Open `src/App.tsx` in your frontend project
2. Find line ~279: `const GAS_WEB_APP_URL = '...'`
3. Replace with your deployment URL from step 4
4. Save file
5. Frontend will use new URL on next reload

## ✅ Verification Checklist

After deployment, verify:

- [ ] Google Sheet created with correct ID in GAS code
- [ ] `initializeSheet()` function run successfully (headers in Sheet)
- [ ] GAS deployed as **Web app** (not API executable)
- [ ] Deployment access set to **Anyone**
- [ ] Deployment URL copied to `src/App.tsx`
- [ ] Frontend reloaded
- [ ] No CORS errors in browser console
- [ ] Data loading successfully on Dashboard tab ✅

## 🔄 Updating GAS Code

Whenever you modify `gas/Code.gs`:

1. Copy the updated code
2. Go to your Apps Script project
3. Replace old code with new code
4. Save
5. **Create NEW deployment** (not update old one):
   - Deploy → New Deployment
   - Select Web app
   - Execute as: Your Account
   - Who has access: Anyone
   - Deploy
6. Copy the **NEW** deployment URL
7. Update `src/App.tsx` with new URL
8. Reload frontend

**Important:** Each deployment gets a new unique URL. You must update the frontend URL every time you deploy.

## 🐛 Troubleshooting CORS Issues

### Problem: "CORS policy blocked"
- ✅ Make sure GAS is deployed as "Web app"
- ✅ Make sure "Who has access" is set to "Anyone"
- ✅ Make sure `src/App.tsx` URL matches your deployment URL
- ✅ Try refreshing the page

### Problem: 404 Error
- Check the deployment URL in `src/App.tsx` is correct
- Go to Google Apps Script → Deployments tab to see all active deployments
- Use the correct URL from the "Latest deployment" section

### Problem: "Cannot access spreadsheet"
- Make sure the Google Account in Apps Script can access the Sheet
- Go to Apps Script → Project Settings → check the GCP project
- Sheet and GAS project must be accessible by the same account

### Problem: Sheet data not loading
- Run `initializeSheet()` function in Apps Script to create headers
- Check your Sheet ID is correct in GAS code
- Check Sheet name matches `SHEET_NAME` variable (default: "Rework Cases")

## 📝 Important Notes

- **CORS is handled by GAS automatically** when "Anyone" access is set
- No need to modify CORS headers in code
- Each deployment gets a unique URL that never changes
- Multiple deployments can coexist (for testing different versions)
- The spreadsheet must have the correct column headers (run `initializeSheet()`)
- Images are uploaded to Google Drive folder specified in `DRIVE_FOLDER_ID`

## 🎯 Testing Your Deployment

Once deployed, test with this curl command:

```bash
curl -X POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec \
  -H "Content-Type: application/json" \
  -d '{"action":"readAll"}'
```

Should return: `{"success":true,"message":"Retrieved X cases","data":[...]}`

## ✨ You're Ready!

Once you complete all steps:
1. Frontend will connect to GAS backend
2. Data will load from Google Sheets
3. Case submissions will save to Sheets
4. Images will upload to Google Drive
5. Everything just works! 🚀
