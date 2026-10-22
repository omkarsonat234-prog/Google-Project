import secrets
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from ..models.database import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    verify_password,
    set_password_reset_code,
    verify_and_reset_password,
    log_audit
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str = "patient"
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[float] = None
    phone_number: Optional[str] = None
    birth_date: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_conditions: Optional[str] = None
    allergies: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

@router.post("/signup")
def signup(req: SignupRequest):
    clean_email = req.email.strip().lower()
    if not clean_email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")
    
    existing = get_user_by_email(clean_email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account is already registered with this email address. Please sign in instead."
        )
    
    user_data = req.model_dump()
    user = create_user(user_data)
    
    log_audit("USER_SIGNUP", user['id'], user['role'], "user", user['id'], {
        "email": clean_email,
        "name": user['full_name'],
        "role": user['role']
    })
    
    return {
        "status": "success",
        "message": "Account registered successfully.",
        "user": user
    }

@router.post("/login")
def login(req: LoginRequest):
    clean_email = req.email.strip().lower()
    user = get_user_by_email(clean_email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email. Please sign up first."
        )
    
    if user.get('role') in ['caregiver', 'pharmacist']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Caregiver and Pharmacist logins are disabled. Only Patients and Physicians can sign in."
        )

    if not verify_password(user['password_hash'], req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please verify your credentials or use Forgot Password."
        )
    
    safe_user = {k: v for k, v in user.items() if k not in ('password_hash', 'reset_code', 'reset_code_expires_at')}
    
    log_audit("USER_LOGIN", user['id'], user['role'], "user", user['id'], {
        "email": clean_email,
        "role": user['role']
    })
    
    return {
        "status": "success",
        "message": "Login successful.",
        "user": safe_user
    }

@router.post("/forgot-password/request")
def request_password_reset(req: ForgotPasswordRequest):
    clean_email = req.email.strip().lower()
    user = get_user_by_email(clean_email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address."
        )
    
    # Generate 6-digit secure numeric verification code
    code = f"{secrets.randbelow(900000) + 100000}"
    set_password_reset_code(clean_email, code)
    
    log_audit("PASSWORD_RESET_REQUESTED", user['id'], user['role'], "user", user['id'], {
        "email": clean_email
    })
    
    return {
        "status": "success",
        "message": f"A 6-digit verification code has been dispatched to {clean_email}.",
        "email": clean_email,
        # Preview code provided so user can verify immediately in prototype/hackathon demo
        "auth_code_preview": code
    }

@router.post("/forgot-password/reset")
def reset_password(req: ResetPasswordRequest):
    clean_email = req.email.strip().lower()
    if len(req.new_password.strip()) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters.")
    
    success = verify_and_reset_password(clean_email, req.code, req.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please check your email or request a new code."
        )
    
    user = get_user_by_email(clean_email)
    if user:
        log_audit("PASSWORD_RESET_COMPLETED", user['id'], user['role'], "user", user['id'], {
            "email": clean_email
        })
    
    return {
        "status": "success",
        "message": "Password reset successfully. You can now sign in with your new password."
    }
