# Deployment Guide - Hosting AgriRecord on Render

This guide explains how to deploy the entire **AgriRecord** application (FastAPI backend + React frontend) to [Render](https://render.com) as a **single unified Web Service** using your serverless **Firebase Firestore** database.

Using this approach:
* FastAPI serves both the API endpoints and the compiled React files.
* Render compiles the React files at build-time using your Firebase environment variables.
* There is no need for external PostgreSQL databases (like Neon or Supabase) because Firestore serves as your complete serverless database.

---

## 🔑 Step 1: Securely Configure Firebase Credentials on Render

Since committing security keys to GitHub is a major security risk, you will configure them securely in Render.

### 1. The Backend Key (Render Secret File)
Your FastAPI backend uses `backend/serviceAccountKey.json` to communicate with Firebase. On Render, you can create this file dynamically:
1. In your Render Dashboard, select your Web Service.
2. Click the **Environment** tab on the left sidebar.
3. Under the **Secret Files** section, click **Add Secret File**.
4. Set the filename/path to:
   `backend/serviceAccountKey.json`
5. Paste the entire content of your local `serviceAccountKey.json` file into the text box and click **Save**.

### 2. The Frontend Credentials (Vite Env Variables)
Vite injects variables starting with `VITE_` during build time. Add these standard variables to Render's **Environment Variables** section:

| Key | Value | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | *[Your Firebase Web API Key]* | Found in Firebase Console Settings. |
| `VITE_FIREBASE_APP_ID` | *[Your Firebase Web App ID]* | Found in Firebase Console Settings. |
| `CASHFREE_MOCK` | `true` | Set to `true` to use the simulated payment gateway for testing. |

---

## 🚀 Step 2: Create the Web Service on Render

1. Push your code repository to **GitHub** or **GitLab** (ensure `serviceAccountKey.json` is in your `.gitignore` and not pushed).
2. In the Render Dashboard, click **New +** and select **Web Service**.
3. Connect your repository.
4. Configure the Web Service:
   * **Name**: `agrirecord-app`
   * **Region**: Select a region close to your users (e.g. Singapore / Oregon).
   * **Branch**: `main`
   * **Runtime**: `Python`
   * **Build Command**:
     ```bash
     cd frontend && npm install && npm run build && cd ../ && pip install -r backend/requirements.txt
     ```
   * **Start Command**:
     ```bash
     uvicorn backend.main:app --host 0.0.0.0 --port $PORT
     ```
   * **Instance Type**: Select **Free**.

Click **Create Web Service**. Render will automatically download your code, mount your secure secret file, build the React static files, install the Python requirements, and launch the FastAPI server!

---

## 📡 Step 3: Verification

Once the deployment logs say `Application startup complete` and `Uvicorn running on http://0.0.0.0:xxxx`:

1. Open your Render Web Service URL (e.g., `https://agrirecord-app.onrender.com`).
2. Log in using Google Sign-in to test registration and profile creation.
3. If you log in with your super admin email (`surajsutar8154@gmail`), you will immediately get upgraded to `Admin` with unlimited credits. Go to the Admin Dashboard (URL `/admin` or via navigation dropdown) to monitor real-time user metrics, transaction logs, and cards in your Firestore database!
