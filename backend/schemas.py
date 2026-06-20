from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime



class UserResponse(BaseModel):
    id: str
    name: str
    mobile: str
    email: Optional[str] = None
    role: str
    freeCredits: int
    createdAt: datetime

    class Config:
        from_attributes = True

class UserUpdateCredits(BaseModel):
    userId: str
    credits: int

class UserUpdateRole(BaseModel):
    userId: str
    role: str

class LandDetail(BaseModel):
    id: str
    district: Optional[str] = ""
    subDistrict: Optional[str] = ""
    village: Optional[str] = ""
    mOwnerNo: Optional[str] = ""
    khasra: Optional[str] = ""
    area: Optional[str] = ""

class CardCreate(BaseModel):
    id: Optional[str] = None
    nameHindi: str
    nameEnglish: str
    dob: str
    gender: str
    mobile: str
    aadhaar: str
    farmerId: str
    address: str
    photoUrl: Optional[str] = None
    downloadDate: Optional[str] = None
    state: str
    cardColor: Optional[str] = "default"
    landDetails: List[LandDetail] = []

class CardResponse(BaseModel):
    id: str
    userId: Optional[str] = None
    nameHindi: str
    nameEnglish: str
    dob: str
    gender: str
    mobile: str
    aadhaar: str
    farmerId: str
    address: str
    photoUrl: Optional[str] = None
    downloadDate: Optional[str] = None
    state: str
    cardColor: str
    landDetails: List[LandDetail]
    createdAt: datetime

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customerId: str
    customerPhone: str
    customerName: str
    amount: float
    packageId: str

class OrderVerify(BaseModel):
    order_id: str
    customerId: str
    creditsToAdd: int

class OrderResponse(BaseModel):
    order_id: str
    payment_session_id: str
    status: str
    env: str



class AdminAddUser(BaseModel):
    name: str
    mobile: str
    password: str
    email: Optional[str] = None
    role: Optional[str] = "User"
    credits: Optional[int] = 0

