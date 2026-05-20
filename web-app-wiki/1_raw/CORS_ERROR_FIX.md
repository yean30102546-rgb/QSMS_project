# CORS Error - How to Fix

## ❓ What's the Problem?

You're seeing this error in the browser console:
```
Access to fetch at 'https://script.google.com/macros/s/...' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

This means the frontend (running on `http://localhost:3007`) is trying to fetch data from Google Apps Script backend, but GAS is not allowing cross-origin requests.

## ✅ Solution: Deploy Updated GAS Code

### 1️⃣ Copy Updated GAS Code
The file `gas/Code.gs` has been updated with CORS headers support:
- `doOptions()` - Handles preflight requests
- `createResponse()` - Adds CORS headers to all responses

### 2️⃣ Deploy to Google Apps Script
1. Go to [Google Apps Script Console](https://script.google.com/home)
2. Create or open your QSMS Rework project
3. Delete old code, paste the NEW `gas/Code.gs` code
4. Save the project
5. **Deploy → New Deployment**
6. Type: **Web app**
7. Execute as: **Your Google Account (that owns the Sheet)**
8. Who has access: **Anyone**
9. Click **Deploy**

### 3️⃣ Update Frontend URL
After deploying, Google will give you a new URL. Copy it and:

1. Open `src/App.tsx`
2. Find line ~279: `const GAS_WEB_APP_URL = '...'`
3. Replace with your new deployment URL
4. Save and reload the frontend

### 4️⃣ Test the Connection
1. Reload `http://localhost:3007`
2. Look for the CORS error in the console
3. It should now work! ✅

## 🔗 Deployment URLs Look Like:
```
https://script.google.com/macros/s/AKfycbw.../exec
```
- ✅ The URL is **unique** for each deployment
- ✅ The URL **changes** every time you deploy
- ✅ The URL must match in `src/App.tsx`

## 📝 Important Notes
- CORS can ONLY be fixed by updating and re-deploying GAS
- You cannot fix CORS from the frontend
- Every code change in `gas/Code.gs` requires a new deployment
- Make sure to set "Who has access" to "Anyone"
- Make sure "Execute as" is your Google Account (that owns the spreadsheet)

## 🚀 Quick Checklist
- [ ] Opened Google Apps Script project
- [ ] Replaced code with updated `gas/Code.gs`
- [ ] Saved the project
- [ ] Deployed as Web app (new deployment)
- [ ] Copied the new deployment URL
- [ ] Updated `src/App.tsx` line ~279 with new URL
- [ ] Reloaded the frontend
- [ ] No more CORS error in console ✅

## 💡 If Still Having Issues
1. **Check browser console** - Look for more specific error messages
2. **Check GAS deployment settings** - Must be "Web app" with "Anyone" access
3. **Try incognito/private window** - Clear browser cache
4. **Check the URL** - Make sure `src/App.tsx` URL matches your deployment
5. **Check GAS logs** - In Apps Script: **Execution → View logs**

## 🎯 What Should Happen After Fix
When you reload the frontend after fixing CORS:
1. Page loads → Login screen (PIN auth)
2. Enter PIN (QSMS: 123456 or WFG: 654321)
3. Dashboard loads with data from Google Sheets
4. No more CORS errors! 🎉
