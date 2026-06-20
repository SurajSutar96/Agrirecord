import os
import uuid
import datetime
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional

from . import schemas, payment

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# Initialize Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, auth, firestore

if not firebase_admin._apps:
    try:
        # Check multiple paths for serviceAccountKey.json
        # 1. Same directory as main.py (local development: backend/serviceAccountKey.json)
        key_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
        if not os.path.exists(key_path):
            # 2. Project root (Render Secret File: serviceAccountKey.json)
            key_path = os.path.join(os.path.dirname(__file__), "..", "serviceAccountKey.json")
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Firebase Admin SDK initialization failed: {e}")

db = firestore.client()

app = FastAPI(title="AgriRecordPro API")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("--- VALIDATION ERROR DETECTED ---")
    print(exc.errors())
    print("---------------------------------")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

def get_current_user_id(token: str) -> str:
    try:
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
        user_id = decoded_token.get("uid")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing UID")
        return user_id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def get_token(token: Optional[str] = None, authorization: Optional[str] = Header(None)) -> str:
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ")[1]
    if token:
        return token
    raise HTTPException(status_code=401, detail="Authentication token missing")

def ensure_datetime(val) -> datetime.datetime:
    if isinstance(val, datetime.datetime):
        return val
    if isinstance(val, str):
        try:
            return datetime.datetime.fromisoformat(val)
        except Exception:
            pass
    if val is not None:
        try:
            return val.to_datetime()
        except Exception:
            pass
    return datetime.datetime.utcnow()

from pydantic import BaseModel

class UserSyncPayload(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None

# AUTH ENDPOINTS
@app.post("/api/auth/login")
def login(payload: Optional[UserSyncPayload] = None, token: str = Depends(get_token)):
    try:
        decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase Token: {str(e)}")
        
    firebase_uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    name = decoded_token.get("name", "User")
    phone_number = decoded_token.get("phone_number", "")
    
    sync_name = name
    sync_mobile = "".join(filter(str.isdigit, phone_number))[-10:] if phone_number else ""
    
    if payload:
        if payload.name:
            sync_name = payload.name
        if payload.mobile:
            sync_mobile = "".join(filter(str.isdigit, payload.mobile))[-10:]
            
    # Check if user exists in Firestore
    user_ref = db.collection("users").document(firebase_uid)
    user_doc = user_ref.get()
    
    # Check if target super admin
    is_super_admin = False
    if email:
        email_lower = email.lower()
        if "surajsutar8154@gmail" in email_lower or email_lower == "admin@agrirecord.com":
            is_super_admin = True
            
    if not user_doc.exists:
        role = "Admin" if is_super_admin else "User"
        credits = 100000 if is_super_admin else 0
        
        user_data = {
            "id": firebase_uid,
            "name": sync_name,
            "mobile": sync_mobile,
            "email": email or f"{firebase_uid}@agrirecord.com",
            "password_hash": "firebase_managed",
            "role": role,
            "freeCredits": credits,
            "createdAt": datetime.datetime.utcnow()
        }
        user_ref.set(user_data)
    else:
        user_data = user_doc.to_dict()
        # Sync updates if they occurred
        updated = False
        updates = {}
        if payload:
            if payload.name and user_data.get("name") != payload.name:
                user_data["name"] = payload.name
                updates["name"] = payload.name
                updated = True
            if payload.mobile and user_data.get("mobile") != payload.mobile:
                user_data["mobile"] = payload.mobile
                updates["mobile"] = payload.mobile
                updated = True
                
        if is_super_admin:
            if user_data.get("role") != "Admin":
                user_data["role"] = "Admin"
                updates["role"] = "Admin"
                updated = True
                
        if updated:
            user_ref.update(updates)
            
    return {
        "token": token,
        "user": {
            "id": firebase_uid,
            "name": user_data.get("name"),
            "mobile": user_data.get("mobile"),
            "email": user_data.get("email"),
            "freeCredits": user_data.get("freeCredits"),
            "role": user_data.get("role")
        }
    }

@app.post("/api/auth/register")
def register(payload: Optional[UserSyncPayload] = None, token: str = Depends(get_token)):
    return login(payload, token)

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(token: str = Depends(get_token)):
    user_id = get_current_user_id(token)
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    user_data = user_doc.to_dict()
    user_data["createdAt"] = ensure_datetime(user_data.get("createdAt"))
    return user_data

@app.post("/api/users/update-profile", response_model=schemas.UserResponse)
def update_profile(payload: UserSyncPayload, token: str = Depends(get_token)):
    user_id = get_current_user_id(token)
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = user_doc.to_dict()
    updates = {}
    
    if payload.name:
        updates["name"] = payload.name
        
    if payload.mobile is not None:
        clean_mobile = "".join(filter(str.isdigit, payload.mobile))[-10:] if payload.mobile else ""
        if clean_mobile:
            if len(clean_mobile) < 10:
                raise HTTPException(status_code=400, detail="Invalid mobile number (must be 10 digits)")
            # Check uniqueness
            existing_users = db.collection("users").where("mobile", "==", clean_mobile).limit(1).get()
            for doc in existing_users:
                if doc.id != user_id:
                    raise HTTPException(status_code=400, detail="Mobile number already registered by another user")
            updates["mobile"] = clean_mobile
        else:
            updates["mobile"] = ""
            
    if updates:
        user_ref.update(updates)
        user_data.update(updates)
        
    user_data["createdAt"] = ensure_datetime(user_data.get("createdAt"))
    return user_data

# PHOTO UPLOAD ENDPOINT
@app.post("/api/upload-photo")
async def upload_photo(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())
        
    return {"photoUrl": f"/uploads/{filename}"}

# CARDS MANAGEMENT
@app.post("/api/cards/create", response_model=schemas.CardResponse)
def create_card(card_data: schemas.CardCreate, token: str = Depends(get_token)):
    user_id = get_current_user_id(token)
    
    # Generate unique card ID if not provided
    card_id = card_data.id or f"card_{uuid.uuid4().hex[:12]}"
    
    card_ref = db.collection("cards").document(card_id)
    card_doc = card_ref.get()
    
    land_details_list = [d.dict() for d in card_data.landDetails]
    
    if card_doc.exists:
        # Update existing card
        updates = {
            "nameHindi": card_data.nameHindi,
            "nameEnglish": card_data.nameEnglish,
            "dob": card_data.dob,
            "gender": card_data.gender,
            "mobile": card_data.mobile,
            "aadhaar": card_data.aadhaar,
            "farmerId": card_data.farmerId,
            "address": card_data.address,
            "photoUrl": card_data.photoUrl,
            "downloadDate": card_data.downloadDate,
            "state": card_data.state,
            "cardColor": card_data.cardColor,
            "landDetails": land_details_list
        }
        card_ref.update(updates)
        updated_doc = card_ref.get().to_dict()
        updated_doc["createdAt"] = ensure_datetime(updated_doc.get("createdAt"))
        return updated_doc

    new_card_data = {
        "id": card_id,
        "userId": user_id,
        "nameHindi": card_data.nameHindi,
        "nameEnglish": card_data.nameEnglish,
        "dob": card_data.dob,
        "gender": card_data.gender,
        "mobile": card_data.mobile,
        "aadhaar": card_data.aadhaar,
        "farmerId": card_data.farmerId,
        "address": card_data.address,
        "photoUrl": card_data.photoUrl,
        "downloadDate": card_data.downloadDate or datetime.datetime.now().strftime("%d/%m/%Y"),
        "state": card_data.state,
        "cardColor": card_data.cardColor or "default",
        "landDetails": land_details_list,
        "createdAt": datetime.datetime.utcnow()
    }
    card_ref.set(new_card_data)
    new_card_data["createdAt"] = ensure_datetime(new_card_data.get("createdAt"))
    return new_card_data

@app.get("/api/cards/my-cards", response_model=List[schemas.CardResponse])
def my_cards(token: str = Depends(get_token)):
    user_id = get_current_user_id(token)
    docs = db.collection("cards").where("userId", "==", user_id).stream()
    cards = []
    for doc in docs:
        d = doc.to_dict()
        d["createdAt"] = ensure_datetime(d.get("createdAt"))
        cards.append(d)
    cards.sort(key=lambda x: x.get("createdAt"), reverse=True)
    return cards

@app.delete("/api/cards/{card_id}")
def delete_own_card(card_id: str, token: str = Depends(get_token)):
    user_id = get_current_user_id(token)
    card_ref = db.collection("cards").document(card_id)
    card_doc = card_ref.get()
    if not card_doc.exists:
        raise HTTPException(status_code=404, detail="Card not found or not owned by you")
    
    card_data = card_doc.to_dict()
    if card_data.get("userId") != user_id:
        raise HTTPException(status_code=404, detail="Card not found or not owned by you")
        
    card_ref.delete()
    return {"success": True}

# PAYMENT ENDPOINTS
@app.post("/api/create-cashfree-order")
def create_cashfree_order(order_data: schemas.OrderCreate):
    res = payment.create_order(
        customer_id=order_data.customerId,
        customer_phone=order_data.customerPhone,
        customer_name=order_data.customerName,
        amount=order_data.amount,
        package_id=order_data.packageId
    )
    
    order_id = res["order_id"]
    order_ref = db.collection("orders").document(order_id)
    order_ref.set({
        "order_id": order_id,
        "customer_id": order_data.customerId,
        "customer_phone": order_data.customerPhone,
        "customer_name": order_data.customerName,
        "amount": order_data.amount,
        "package_id": order_data.packageId,
        "status": "PENDING",
        "createdAt": datetime.datetime.utcnow()
    })
    
    return res

@app.post("/api/verify-cashfree-order")
def verify_cashfree_order(verify_data: schemas.OrderVerify):
    res = payment.verify_order(verify_data.order_id)
    
    order_ref = db.collection("orders").document(verify_data.order_id)
    order_doc = order_ref.get()
    
    if res["success"]:
        if order_doc.exists:
            order_ref.update({"status": "PAID"})
        
        user_ref = db.collection("users").document(verify_data.customerId)
        user_doc = user_ref.get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            current_credits = user_data.get("freeCredits", 0)
            user_ref.update({"freeCredits": current_credits + verify_data.creditsToAdd})
            
        return {"success": True, "order_status": "PAID", "credits": verify_data.creditsToAdd}
    else:
        if order_doc.exists:
            order_ref.update({"status": "FAILED"})
        return {"success": False, "order_status": res.get("order_status", "FAILED")}

# ADMIN ENDPOINTS
def check_admin(token: str) -> bool:
    user_id = get_current_user_id(token)
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Admin role required.")
    
    user_data = user_doc.to_dict()
    if user_data.get("role") != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Admin role required.")
    return True

@app.post("/api/users/deduct-credit")
def deduct_credit(token: str = Depends(get_token)):
    user_id = get_current_user_id(token)
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = user_doc.to_dict()
    role = user_data.get("role")
    
    if role == "Admin":
        return {"success": True, "freeCredits": 999999}
        
    free_credits = user_data.get("freeCredits", 0)
    if free_credits <= 0:
        raise HTTPException(status_code=400, detail="Insufficient credits")
    free_credits -= 1
    user_ref.update({"freeCredits": free_credits})
    
    return {"success": True, "freeCredits": free_credits}

@app.get("/api/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(token: str = Depends(get_token)):
    check_admin(token)
    docs = db.collection("users").stream()
    users = []
    for doc in docs:
        d = doc.to_dict()
        d["createdAt"] = ensure_datetime(d.get("createdAt"))
        users.append(d)
    users.sort(key=lambda x: x.get("createdAt"), reverse=True)
    return users

@app.post("/api/admin/update-credits")
def update_credits(data: schemas.UserUpdateCredits, token: str = Depends(get_token)):
    check_admin(token)
    user_ref = db.collection("users").document(data.userId)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = user_doc.to_dict()
    target_email = (user_data.get("email") or "").lower()
    if "surajsutar8154@gmail" in target_email or target_email == "admin@agrirecord.com" or user_data.get("mobile") == "0000000000":
        raise HTTPException(status_code=400, detail="Cannot modify credits for super-administrator account")
        
    user_ref.update({"freeCredits": data.credits})
    return {"success": True, "freeCredits": data.credits}

@app.post("/api/admin/update-role")
def update_role(data: schemas.UserUpdateRole, token: str = Depends(get_token)):
    check_admin(token)
    user_ref = db.collection("users").document(data.userId)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = user_doc.to_dict()
    target_email = (user_data.get("email") or "").lower()
    if "surajsutar8154@gmail" in target_email or target_email == "admin@agrirecord.com" or user_data.get("mobile") == "0000000000":
        raise HTTPException(status_code=400, detail="Cannot modify role for super-administrator account")
        
    user_ref.update({"role": data.role})
    return {"success": True, "role": data.role}

@app.post("/api/admin/add-user")
def admin_add_user(data: schemas.AdminAddUser, token: str = Depends(get_token)):
    check_admin(token)
    clean_mobile = "".join(filter(str.isdigit, data.mobile))[-10:]
    if not clean_mobile or len(clean_mobile) < 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number (must be 10 digits)")
    
    existing_users = db.collection("users").where("mobile", "==", clean_mobile).limit(1).get()
    if len(existing_users) > 0:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:10]}"
    new_user_data = {
        "id": user_id,
        "name": data.name,
        "mobile": clean_mobile,
        "email": data.email or f"{clean_mobile}@agrirecord.com",
        "password_hash": "firebase_managed",
        "role": data.role or "User",
        "freeCredits": data.credits or 0,
        "createdAt": datetime.datetime.utcnow()
    }
    db.collection("users").document(user_id).set(new_user_data)
    new_user_data["createdAt"] = ensure_datetime(new_user_data.get("createdAt"))
    return new_user_data

@app.get("/api/admin/cards", response_model=List[schemas.CardResponse])
def get_all_cards(token: str = Depends(get_token)):
    check_admin(token)
    docs = db.collection("cards").stream()
    cards = []
    for doc in docs:
        d = doc.to_dict()
        d["createdAt"] = ensure_datetime(d.get("createdAt"))
        cards.append(d)
    cards.sort(key=lambda x: x.get("createdAt"), reverse=True)
    return cards

@app.get("/api/admin/stats")
def get_admin_stats(token: str = Depends(get_token)):
    check_admin(token)
    
    user_docs = db.collection("users").stream()
    total_users = sum(1 for _ in user_docs)
    
    card_docs = db.collection("cards").stream()
    total_cards = sum(1 for _ in card_docs)
    
    order_docs = db.collection("orders").stream()
    orders = [o.to_dict() for o in order_docs]
    
    paid_orders = [o for o in orders if o.get("status") == "PAID"]
    total_revenue = sum(o.get("amount", 0) for o in paid_orders)
    
    total_orders = len(orders)
    success_rate = 100.0
    if total_orders > 0:
        success_rate = round((len(paid_orders) / total_orders) * 100, 1)
        
    orders.sort(key=lambda x: ensure_datetime(x.get("createdAt")), reverse=True)
    recent_orders = orders[:15]
    
    orders_list = []
    for o in recent_orders:
        created_at_val = o.get("createdAt")
        created_at_dt = ensure_datetime(created_at_val)
        orders_list.append({
            "order_id": o.get("order_id"),
            "customer_id": o.get("customer_id"),
            "customer_phone": o.get("customer_phone"),
            "customer_name": o.get("customer_name"),
            "amount": o.get("amount"),
            "package_id": o.get("package_id"),
            "status": o.get("status"),
            "createdAt": created_at_dt.strftime("%Y-%m-%d %H:%M:%S")
        })
        
    return {
        "totalUsers": total_users,
        "totalCards": total_cards,
        "totalRevenue": total_revenue,
        "successRate": success_rate,
        "recentOrders": orders_list
    }

@app.delete("/api/admin/cards/{card_id}")
def delete_card(card_id: str, token: str = Depends(get_token)):
    check_admin(token)
    card_ref = db.collection("cards").document(card_id)
    card_doc = card_ref.get()
    if not card_doc.exists:
        raise HTTPException(status_code=404, detail="Card not found")
    card_ref.delete()
    return {"success": True}

@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: str, token: str = Depends(get_token)):
    check_admin(token)
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = user_doc.to_dict()
    target_email = (user_data.get("email") or "").lower()
    if "surajsutar8154@gmail" in target_email or target_email == "admin@agrirecord.com" or user_data.get("mobile") == "0000000000":
        raise HTTPException(status_code=400, detail="Cannot delete super-administrator account")
        
    user_ref.delete()
    return {"success": True}
# Serve compiled frontend static files in production (dist directory)
from fastapi.responses import FileResponse

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(FRONTEND_DIR):
    # Mount assets folder
    assets_dir = os.path.join(FRONTEND_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        # Serve target file directly if it exists in dist directory
        file_path = os.path.join(FRONTEND_DIR, catchall)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        # Fallback to index.html for frontend routing support
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

