# GAS CORS Configuration Guide

## ❌ Current Issue
The frontend cannot connect to the Google Apps Script (GAS) backend due to CORS policy restrictions:
```
Access to fetch at 'https://script.google.com/macros/s/...' has been blocked by CORS policy
```

## ✅ Solution: Update GAS Deployment

### Step 1: Update Gas Code.gs with CORS Headers
The CORS headers have already been added to `gas/Code.gs`:
- `doOptions()` function now handles preflight requests
- `createResponse()` function adds CORS headers to all responses

### Step 2: Deploy GAS to Apps Script
1. Go to [Google Apps Script Console](https://script.google.com/)
2. Open your project
3. Copy the latest `gas/Code.gs` code
4. Paste it into your Google Apps Script editor
5. Save the project
6. Click **Deploy** → **New Deployment**
7. Select type: **Web app**
8. Execute as: **[Your Google Account]**
9. Allow access to: **Anyone**
10. Click **Deploy**
11. Copy the new deployment URL (it will look like: `https://script.google.com/macros/s/AKfycbw.../exec`)

### Step 3: Update Frontend URL
If the deployment URL changed:
1. Open `src/App.tsx` (line ~279)
2. Find: `const GAS_WEB_APP_URL = '...'`
3. Replace with the new deployment URL from Step 2
4. The frontend will automatically use the new URL

### Step 4: Test Connection
1. Reload the frontend
2. If CORS error persists, verify:
   - ✅ GAS code includes CORS headers (check `gas/Code.gs`)
   - ✅ GAS is deployed as "Web app"
   - ✅ Access is set to "Anyone"
   - ✅ Frontend URL in `src/App.tsx` is correct

## 🔍 Debugging
Check browser console for detailed error messages:
- `❌ CORS Error - GAS endpoint may not be configured for cross-origin requests`
- `📝 Make sure the GAS deployment allows CORS from this origin`
- `🔗 GAS URL: [your-deployment-url]`

## 📝 Notes
- CORS headers must be added at the GAS level (not fixable from frontend)
- Every time you update `gas/Code.gs`, you must re-deploy to Apps Script
- The deployment URL changes each time you deploy
- Check the GAS deployment URL in `src/App.tsx` matches your current deployment

## 🚀 What to Do Now
1. Update `gas/Code.gs` in your Google Apps Script project
2. Deploy the updated code as a new Web App deployment
3. Copy the new deployment URL
4. Update `src/App.tsx` line ~279 with the new URL
5. Reload the frontend
