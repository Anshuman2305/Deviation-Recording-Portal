# Google Sign-In Integration Guide

This guide details the step-by-step process to configure the Google Sign-In authentication feature for the **Deviation Recording Portal**.

---

## 🛠️ Step 1: Create a Google Cloud Platform (GCP) Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Log in with your Google account.
3. Click the project dropdown at the top left of the navbar and select **New Project**.
4. Name the project `Deviation Recording Portal` (or any custom name) and click **Create**.

---

## 🔒 Step 2: Configure the OAuth Consent Screen

Before generating credentials, you must configure how users see the login page.

1. In the left navigation menu, click **APIs & Services** > **OAuth consent screen**.
2. Select **External** (accessible to any Google account) or **Internal** (if you are on a Google Workspace / organization account) and click **Create**.
3. Fill in the **App information**:
   - **App name**: `Deviation Recording Portal`
   - **User support email**: Choose your email.
   - **Developer contact information**: Enter your email address.
4. Click **Save and Continue**.
5. For **Scopes** and **Test Users**, you can click **Save and Continue** to skip or add test users if your project is in testing status.
6. Click **Back to Dashboard** on the final summary screen.

---

## 🔑 Step 3: Create OAuth 2.0 Web Client ID

1. In the left menu, select **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Under **Application type**, choose **Web application**.
4. Set the **Name** to `Deviation Recording Web Client`.
5. **Authorized JavaScript origins** (CRITICAL):
   - Click **+ ADD URI** under **Authorized JavaScript origins**.
   - If testing locally:
     - Add: `http://localhost`
     - Add: `http://localhost:8000`
     - Add: `http://127.0.0.1`
     - Add: `http://127.0.0.1:8000`
   - If hosting on a custom domain (e.g. GitHub Pages or hosting server):
     - Add your production URL (e.g. `https://yourdomain.github.io`).
6. **Authorized redirect URIs**:
   - You can leave this blank as the Google Identity Services SDK uses the Javascript popup mechanism (no redirects required).
7. Click **Create**.
8. A modal will pop up displaying **Your Client ID** (e.g., `1008064974246-abcdef.apps.googleusercontent.com`). Copy this Client ID!

---

## ⚙️ Step 4: Configure the Portal Settings

Now that you have your Client ID, apply it to the portal:

1. Launch your portal website (e.g., run the web server and open the page).
2. Click the **Google Sheets Integration** configuration button in the header to reveal the Settings panel.
3. Paste the copied Client ID into the **Google OAuth Client ID** input field.
4. Paste your Apps Script Web App URL into the **Google Apps Script Web App URL** input.
5. Click **Save Settings**.
6. **Reload the page** to initialize the Google SDK with your new OAuth Client ID.
7. Now, when users click the **Sign In with Google** button, it will launch the Google authentication popup linked to your custom GCP project!
