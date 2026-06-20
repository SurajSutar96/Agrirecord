# AgriRecordPro | Farmer ID & Land Records Card Generator

A fully replicated, self-contained portal to generate, preview, and print secure Farmer ID cards (Kisan Pehchan Patra) complete with QR codes, land record tables, and state visual themes.

Built with **FastAPI (Backend)**, **SQLite (Database)**, **React + Vite (Frontend)**, and **Tailwind CSS**.

---

## Getting Started

### Prerequisites
*   Python 3.10+
*   Node.js 18+

### Step 1: Run the Backend API
The backend runs in the pre-configured Python virtual environment (`.venv`) and stores user profiles, card records, and payment logs in a local SQLite database (`agrirecord.db`).

1. Activate your virtual environment and run the FastAPI server:
   ```bash
   # From the project root directory
   .venv\Scripts\uvicorn backend.main:app --reload
   ```
2. The API docs will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 2: Run the Frontend Development Server
The frontend is configured to automatically proxy requests from `/api` to the backend running on port 8000.

1. Go to the `frontend/` directory, install packages (if not already done), and start:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open your browser and navigate to: [http://localhost:5173/](http://localhost:5173/)

---

## Platform Features & Credentials

### Wallet & Printing Credits
*   Generating a card requires **1 Credit** in the user's wallet.
*   By default, the platform is configured in **Mock Payment Mode** (`CASHFREE_MOCK=true` in `.env`). 
*   If a user has 0 credits, clicking print/download will open a checkout popup. Clicking through the modal will automatically mock a successful transaction and credit the wallet.

### Admin Dashboard Control & Login
Administrators can oversee all users, manually add/deduct credits, change roles, and audit all printed farmer cards.

*   **Regular Login Form**: Relaxed input constraints allow you to log in using either a **10-Digit Mobile Number** (for farmers/members) or **Email** (for administrators).
*   **Direct Admin Login**: You can visit [http://localhost:5173/#/admin](http://localhost:5173/#/admin) to log in directly through the dedicated Admin Login Form.
*   **Default Admin Credentials**:
    *   **Email**: `admin@agrirecord.com` (or numeric bypass `0000000000`)
    *   **Password**: `Ajnabi@7479`
