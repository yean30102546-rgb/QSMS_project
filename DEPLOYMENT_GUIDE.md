# QSMS Rework Management System - Deployment Guide

Complete step-by-step instructions to deploy the Rework Management System as a fully functional web application.

---

## 📋 Table of Contents
1. [Backend Setup (Google Apps Script)](#backend-setup)
2. [Google Apps Script Properties](#google-apps-script-properties)
3. [Google Sheets Setup](#google-sheets-setup)
4. [Frontend Configuration](#frontend-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Testing & Troubleshooting](#testing--troubleshooting)
7. [Production Checklist](#production-checklist)

---

## Backend Setup (Google Apps Script)

### Step 1: Create a New Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"+ New Project"**
3. Rename the project to `QSMS Rework Management Backend`
4. Delete the default `myFunction` code

### Step 2: Copy the Backend Code

1. Copy the full contents of `gas/Code.gs` from this repository
2. Paste it into the Google Apps Script editor
3. Save the project

### Step 3: Set the Google Sheet ID

1. Open `gas/Code.gs`
2. Set `SHEET_ID` to your Google Sheet ID
   - Example URL: `https://docs.google.com/spreadsheets/d/1abc2def3ghi4jkl5mno6pqr/edit`
   - Sheet ID: `1abc2def3ghi4jkl5mno6pqr`
3. Save the project again

---

## Google Apps Script Properties

This project stores sensitive login configuration in Apps Script Properties instead of hardcoding it.

### Required Script Properties

Set these values in the Apps Script editor:

- `AUTH_TOKEN_SECRET` = A long random secret string
- `QSMS_PIN` = 123456 (or your chosen PIN)
- `QSMS_EMAIL` = qsms@company.com
- `QSMS_NAME` = QSMS
- `QSMS_ROLE` = operator
- `QSMS_DEPARTMENT` = Rework
- `WFG_PIN` = 654321 (or your chosen PIN)
- `WFG_EMAIL` = wfg@company.com
- `WFG_NAME` = WFG
- `WFG_ROLE` = operator
- `WFG_DEPARTMENT` = Rework

### How to Add Script Properties

1. In the Apps Script editor, click **File → Project properties**
2. Open the **Script properties** tab
3. Add each property name and value from the required list above
4. Save the properties

### Why this matters

- No secrets are stored in source code
- PIN values and token secret can be updated without editing code
- Keeps deployment safer and easier to maintain

---

## Google Sheets Setup

### Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"+ Blank"** to create a new spreadsheet
3. Rename it to `QSMS Rework Management`
4. Keep the sheet open to copy the ID later

### Step 2: Create Required Sheets

In the same spreadsheet, add these tabs:
- `Rework Cases`
- `ItemMaster`
- `Backup`

### Step 3: Initialize Column Headers

1. In the Apps Script editor, if the `initializeSheet()` function exists, run it
2. Confirm the `Rework Cases` sheet contains the required headers

Required headers:
- Item ID
- Case ID
- Date
- Source
- Item Number
- Item Name
- Item Code
- Amount (Box)
- Reason
- Responsible
- Details
- Status
- Image URLs

---

## Frontend Configuration

### Step 1: Set the GAS Web App URL

1. Copy the deployed GAS Web App URL from Deployment Steps below
2. Open `src/services/api.ts`
3. Ensure `GAS_WEB_APP_URL` uses the full URL

Example:
```ts
const GAS_AUTH_URL = process.env.REACT_APP_GAS_WEB_APP_URL ||
  'https://script.google.com/macros/s/AKfycbw.../exec';
```

### Step 2: Create `.env` Locally

1. Copy `.env.example` to `.env`
2. Update the values to match your environment
3. Set at minimum:
   - `REACT_APP_GAS_WEB_APP_URL`
   - `REACT_APP_ENVIRONMENT=development`

### Step 3: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 4: Verify Local Development

```bash
npm run dev
# or
yarn dev
```

Open the app in your browser and confirm the login page loads.

---

## Deployment Steps

### Step 1: Deploy Google Apps Script as Web App

1. In the Apps Script editor, click **Deploy** (arrow icon)
2. Choose **New deployment**
3. Select **Web app** as the deployment type
4. Configure:
   - **Execute as**: Me (the Google account that owns the sheet)
   - **Who has access**: Anyone
5. Click **Deploy**
6. Copy the **Web App URL** shown in the dialog

This URL is required for the frontend.

### Step 2: Update Frontend Environment

1. Open `.env` in your project root
2. Set:
   - `REACT_APP_GAS_WEB_APP_URL=<your GAS web app URL>`
3. Save the file

### Step 3: Build the Frontend for Production

```bash
npm run build
# or
yarn build
```

This generates the production bundle in `dist/`.

### Step 4: Deploy the Frontend

Recommended options:

#### Vercel
```bash
npm install -g vercel
vercel
```

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### GitHub Pages
1. Configure `vite.config.ts` base if needed
2. Run `npm run build`
3. Deploy `dist/` to GitHub Pages

#### Manual Static Hosting
Upload `dist/` to any web server and ensure `index.html` is served for all routes.

---

## Testing & Troubleshooting

### Verify Auth Flow

1. Open the deployed frontend
2. Log in with `QSMS` or `WFG`
3. Use the configured PIN values from GAS Script Properties
4. Confirm login succeeds and data operations work

### Quick Backend Test

- Run backend test functions from Apps Script editor
- Check logs for errors
- Confirm sheet updates correctly

### Common Issues

#### CORS or fetch failed
- Confirm GAS Web App is deployed with **Anyone** access
- Check `REACT_APP_GAS_WEB_APP_URL` in `.env`
- Use HTTPS URL only

#### Invalid profile or PIN
- Confirm values in GAS Script Properties:
  - `QSMS_PIN`
  - `WFG_PIN`
  - `QSMS_EMAIL`
  - `WFG_EMAIL`

#### Sheet write failure
- Confirm `SHEET_ID` is correct in `gas/Code.gs`
- Confirm the GAS account has edit access to the sheet

---

## Production Checklist

- [ ] `REACT_APP_GAS_WEB_APP_URL` set in `.env`
- [ ] GAS script properties configured
- [ ] `SHEET_ID` correct in `gas/Code.gs`
- [ ] Frontend build passes (`npm run build`)
- [ ] Frontend deployed over HTTPS
- [ ] Login works for both `QSMS` and `WFG`
- [ ] Data is saved and visible in Google Sheets
- [ ] Backup sheet exists and is accessible
