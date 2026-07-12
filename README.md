# Mine Deviation Reporting Portal

A premium, responsive, glassmorphic web application built to log, track, analyze, and rectify mine safety deviations (Unsafe Acts and Unsafe Conditions) at the **Pakri Barwadih North West (PBNW) Coal Mining Project**.

This portal integrates seamlessly with a serverless Google Cloud backend (Google Sheets, Google Drive, Gmail) using Google Apps Script and Google Identity Services for secure OAuth2 single sign-in.

---

## 🚀 Key Features

*   **Secure Authentication**: Secure Google Single Sign-In (GSI SDK) restricted to authorized corporate/domain accounts.
*   **Deviation Logger**: Detailed report logging including date, shifts, relays, shift incharge, main hazard category, description word counter, responsible department, and multi-file deviation photo uploads (directly saved to Google Drive).
*   **Manage Open Deviations**: An interactive manager interface showing all active deviations. Authorized safety personnel can submit close-out reports, upload post-rectification photos, and mark logs as closed.
*   **Real-time Analysis Dashboard**: A gorgeous glassmorphic dashboard tracking:
    *   Summary KPIs (Total, Open, Closed, and Resolution Rate %).
    *   **Status Classification Summary Table**: Breakdowns of UA Open, UA Closed, UC Open, UC Closed.
    *   **Hazard Category Distribution Table**: Breakdown of classifications per safety hazard, sorted in strictly decreasing order of frequency.
*   **Dynamic Month-Wise Filter**: Automatically extracts unique months from sheet data, populates a dropdown, and filters the entire dashboard dynamically with local timezone offset correction.
*   **Automated Email Alerts**: Direct email notification alerts sent to relevant safety teams immediately when an open safety deviation is logged.
*   **Fully Mobile Responsive**: Adapts elegantly across all devices, centering headers, resizing grids, scaling tables, and using shorthand labels (e.g. `UA O`, `UA C`) on small screens to fit perfectly.

---

## 🛠️ Technology Stack

*   **Frontend**: HTML5, Vanilla CSS3 (Custom variables, dark theme, glassmorphic panels), Modern JavaScript (ES6+).
*   **Backend & DB**: Google Apps Script (JSON Web App Endpoint), Google Sheets (Data Storage).
*   **Cloud Storage**: Google Drive API (Folder allocation and image hosting).
*   **Notifications**: Google Apps Script `MailApp` / `GmailApp`.

---

## 📁 Repository Structure

```text
├── index.html               # Main application layout, markup structure and modal templates
├── style.css                # Custom styling system, glassmorphic elements, and responsive overrides
├── app.js                   # Client-side routing, input validation, file uploads, and dashboard logic
├── google_apps_script.js    # Backend Google Apps Script code to deploy on Google Sheets
├── google_sign_in_setup.md  # Detailed reference document for configuring Google OAuth Credentials
└── README.md                # Project documentation and setup guide
```

---

## ⚙️ Backend Installation & Setup Guide

To connect this portal to your own Google Workspace account, follow these steps:

### Step 1: Set up the Google Sheet
1. Create a new Google Sheet.
2. The columns will be auto-generated on first form submission, but you can pre-format row 1 with these headers:
   `S No. | Date | Shift | Relay | Shift Incharge / Person Observed | Classification (UA/UC) | Main Hazard | Brief Description | Photos of Deviation (Drive Links) | Responsible Person | Action Taken | Photos after Rectification (Drive Links) | Status | Submitted By | Submitted By Email`

### Step 2: Deploy the Google Apps Script Backend
1. In your Google Sheet, click **Extensions** > **Apps Script**.
2. Erase any default code and copy the contents of [google_apps_script.js](file:///c:/Users/Anshuman%20Mohanty/Desktop/Deviation%20Recording%20Portal/google_apps_script.js).
3. Click **Save** (disk icon).
4. Click **Deploy** > **New deployment**.
5. Choose select type **Web app**.
6. Set the configuration details:
   *   **Description**: `Mine Deviation Web App Backend`
   *   **Execute as**: `Me (your-email@domain.com)`
   *   **Who has access**: `Anyone` (This is required to allow frontend fetch queries).
7. Click **Deploy**. Authorize permissions if prompted by Google.
8. Copy the **Web App URL** provided (it ends in `/exec`).

### Step 3: Configure Frontend Links
1. Open [app.js](file:///c:/Users/Anshuman%20Mohanty/Desktop/Deviation%20Recording%20Portal/app.js).
2. Update the `APPS_SCRIPT_URL` constant with your copied Web App URL:
   ```javascript
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/.../exec";
   ```
3. Update the `CLIENT_ID` with your Google Cloud Console OAuth 2.0 Client ID. (See [google_sign_in_setup.md](file:///c:/Users/Anshuman%20Mohanty/Desktop/Deviation%20Recording%20Portal/google_sign_in_setup.md) for full instructions).

---

## 💻 Running the Portal Locally

You can serve this application locally using any static web server.

### Option A: Serve using Node.js `http-server` (Recommended)
Launch a local node server inside the workspace root:
```bash
npx -y http-server -p 8082
```
Now navigate to `http://127.0.0.1:8082` in your browser.

### Option B: Offline Development / Mock Preview Mode
To work offline or run layout updates without hitting the real Google API, append `?mock=true` to your URL:
```text
http://127.0.0.1:8082/index.html?mock=true
```
This bypasses authentication checks and populates the dashboard/manager tables with pre-configured mock data instantly.

---

## 🛡️ License & Attribution
Developed for the **PBNW Safety Department** to ensure absolute compliance and maintain zero-harm standards across all mining operations.
