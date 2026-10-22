import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException
from ..models.database import get_connection, log_audit
from ..models.schemas import CaregiverAuthorization, CaregiverAuthRequest, CaregiverAuthUpdateRequest

router = APIRouter(prefix="/api/caregiver", tags=["caregiver"])

@router.get("/authorizations", response_model=List[CaregiverAuthorization])
def get_authorizations(patient_id: str = "demo-patient"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM caregiver_authorizations
    WHERE patient_id = ?
    ORDER BY created_at DESC
    """, (patient_id,))
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        result.append(CaregiverAuthorization(
            id=d["id"],
            patient_id=d["patient_id"],
            caregiver_id=d["caregiver_id"],
            caregiver_name=d["caregiver_name"],
            relationship=d["relationship"],
            phone=d.get("phone"),
            email=d.get("email"),
            notes=d.get("notes"),
            status=d["status"],
            created_at=d["created_at"]
        ))
    return result

@router.post("/authorize", response_model=CaregiverAuthorization)
def grant_authorization(req: CaregiverAuthRequest):
    auth_id = str(uuid.uuid4())
    caregiver_id = f"cg-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO caregiver_authorizations (
        id, patient_id, caregiver_id, caregiver_name, relationship, phone, email, notes, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'authorized', ?)
    """, (auth_id, req.patient_id, caregiver_id, req.caregiver_name, req.relationship, req.phone, req.email, req.notes, now_iso))
    conn.commit()
    conn.close()

    log_audit(
        action="CAREGIVER_CONSENT_GRANTED",
        user_id=req.patient_id,
        user_role="patient",
        target_type="caregiver_authorization",
        target_id=auth_id,
        details={
            "caregiver_name": req.caregiver_name,
            "relationship": req.relationship,
            "phone": req.phone,
            "email": req.email,
            "consent_status": "EXPLICIT_PATIENT_AUTHORIZATION"
        }
    )

    return CaregiverAuthorization(
        id=auth_id,
        patient_id=req.patient_id,
        caregiver_id=caregiver_id,
        caregiver_name=req.caregiver_name,
        relationship=req.relationship,
        phone=req.phone,
        email=req.email,
        notes=req.notes,
        status="authorized",
        created_at=now_iso
    )

@router.put("/authorizations/{auth_id}", response_model=CaregiverAuthorization)
@router.put("/update/{auth_id}", response_model=CaregiverAuthorization)
def update_authorization(auth_id: str, req: CaregiverAuthUpdateRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM caregiver_authorizations WHERE id = ?", (auth_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Caregiver authorization record not found.")

    curr = dict(row)
    new_name = req.caregiver_name if req.caregiver_name is not None else curr["caregiver_name"]
    new_rel = req.relationship if req.relationship is not None else curr["relationship"]
    new_phone = req.phone if req.phone is not None else curr.get("phone")
    new_email = req.email if req.email is not None else curr.get("email")
    new_notes = req.notes if req.notes is not None else curr.get("notes")
    new_status = req.status if req.status is not None else curr["status"]

    cursor.execute("""
    UPDATE caregiver_authorizations
    SET caregiver_name = ?, relationship = ?, phone = ?, email = ?, notes = ?, status = ?
    WHERE id = ?
    """, (new_name, new_rel, new_phone, new_email, new_notes, new_status, auth_id))
    conn.commit()
    conn.close()

    patient_id = curr["patient_id"]
    log_audit(
        action="CAREGIVER_INFO_UPDATED",
        user_id=patient_id,
        user_role="patient",
        target_type="caregiver_authorization",
        target_id=auth_id,
        details={
            "caregiver_name": new_name,
            "relationship": new_rel,
            "phone": new_phone,
            "email": new_email,
            "notes": new_notes,
            "status": new_status
        }
    )

    return CaregiverAuthorization(
        id=auth_id,
        patient_id=patient_id,
        caregiver_id=curr["caregiver_id"],
        caregiver_name=new_name,
        relationship=new_rel,
        phone=new_phone,
        email=new_email,
        notes=new_notes,
        status=new_status,
        created_at=curr["created_at"]
    )

@router.post("/revoke/{auth_id}")
def revoke_authorization(auth_id: str, patient_id: str = "demo-patient"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE caregiver_authorizations
    SET status = 'revoked'
    WHERE id = ? AND patient_id = ?
    """, (auth_id, patient_id))
    conn.commit()
    conn.close()

    log_audit(
        action="CAREGIVER_CONSENT_REVOKED",
        user_id=patient_id,
        user_role="patient",
        target_type="caregiver_authorization",
        target_id=auth_id,
        details={"status": "revoked"}
    )
    return {"status": "success", "message": "Caregiver access revoked."}
