# Firebase Email & Password Authentication Setup

This document outlines the step-by-step modifications required to migrate **AgriRecord** to **Firebase Authentication** for Email & Password (including automatic Forgot Password handling), while maintaining wallet credits in your SQL database.

---

## 🛠️ Step 1: Firebase Console Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create/select your project.
2. Navigate to **Build** > **Authentication** > **Sign-in method**.
3. Enable the **Email/Password** provider (keep passwordless sign-in disabled).
4. Go to **Project Settings** (gear icon next to Project Overview) and click **Service Accounts** at the top.
5. Click **Generate new private key** to download a service account JSON file (e.g. `serviceAccountKey.json`). Place this file in your `backend/` directory.
6. Scroll down to "Your apps", add a new **Web App**, and copy your `firebaseConfig` credentials object:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

---

## 💻 Step 2: Frontend Modifications (React)

### 1. Install Firebase SDK
Run inside your `frontend/` directory:
```bash
npm install firebase
```

### 2. Create Firebase Connection
Create a file at [frontend/src/firebase.js](file:///d:/AgriRecord/frontend/src/firebase.js):
```javascript
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut 
};
```

### 3. Replace Auth Forms Logic (Login, Signup, Forgot Password)
Update your authentication forms (usually in `App.jsx` modals):

#### Signup Handler:
```javascript
import { auth, createUserWithEmailAndPassword } from "./firebase";

const handleSignup = async (email, password, name, mobile) => {
  try {
    // 1. Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    
    // 2. Register user in local database (syncs name, mobile, and registers credits)
    const response = await fetch("/api/auth/register-sync", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ name, mobile })
    });
    
    if (response.ok) {
      localStorage.setItem("agri_record_token", idToken);
      // Trigger success redirects / UI login state
    }
  } catch (error) {
    alert(error.message);
  }
};
```

#### Login Handler:
```javascript
import { auth, signInWithEmailAndPassword } from "./firebase";

const handleLogin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    
    // Store Firebase token locally
    localStorage.setItem("agri_record_token", idToken);
    // Reload / update application state
  } catch (error) {
    alert("Login failed: " + error.message);
  }
};
```

#### Forgot Password Handler:
```javascript
import { auth, sendPasswordResetEmail } from "./firebase";

const handleForgotPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset link sent to your email!");
  } catch (error) {
    alert(error.message);
  }
};
```

---

## 🐍 Step 3: Backend Modifications (FastAPI)

### 1. Install Firebase Admin
Add `firebase-admin` to your `backend/requirements.txt` file and run:
```bash
pip install firebase-admin
```

### 2. Verify Firebase Token in API Gateway
In `backend/main.py`, load Firebase Admin SDK and replace the standard JWT verification dependency:

```python
import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Header

# Load service credentials
cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), "serviceAccountKey.json"))
firebase_admin.initialize_app(cred)

def get_current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token header")
    token = authorization.split(" ")[1]
    try:
        # Verify incoming Firebase JWT
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']  # Return Firebase unique User ID
    except Exception:
        raise HTTPException(status_code=401, detail="Session expired or invalid token")
```

### 3. Add Sync Endpoint
When a user signs up on Firebase, the local database needs to create a record to track their wallet credits. Create an endpoint in `backend/main.py`:

```python
class UserSync(BaseModel):
    name: str
    mobile: str

@app.post("/api/auth/register-sync")
def register_sync(data: UserSync, token: str = Depends(get_token), db: Session = Depends(get_db)):
    firebase_uid = get_current_user_id(token)
    
    # Check if user already registered locally
    existing = db.query(models.User).filter(models.User.id == firebase_uid).first()
    if existing:
        return {"status": "already_synced"}
        
    # Create the user reference record in SQLite/PostgreSQL to store credits
    new_user = models.User(
        id=firebase_uid,
        name=data.name,
        mobile=data.mobile,
        email=None,  # Handled by Firebase
        role="User",
        freeCredits=0  # Initial wallet balance
    )
    db.add(new_user)
    db.commit()
    return {"status": "synced"}
```
