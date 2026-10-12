import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException
from ..models.database import get_connection, log_audit
from ..models.schemas import CaregiverAuthorization, CaregiverAuthRequest

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

    return [CaregiverAuthorization(
        id=r["id"],
        patient_id=r["patient_id"],
        caregiver_id=r["caregiver_id"],
        caregiver_name=r["caregiver_name"],
        relationship=r["relationship"],
        status=r["status"],
        created_at=r["created_at"]
    ) for r in rows]

@router.post("/authorize", response_model=CaregiverAuthorization)
def grant_authorization(req: CaregiverAuthRequest):
    auth_id = str(uuid.uuid4())
    caregiver_id = f"cg-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO caregiver_authorizations (
        id, patient_id, caregiver_id, caregiver_name, relationship, status, created_at
    ) VALUES (?, ?, ?, ?, ?, 'authorized', ?)
    """, (auth_id, req.patient_id, caregiver_id, req.caregiver_name, req.relationship, now_iso))
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
            "consent_status": "EXPLICIT_PATIENT_AUTHORIZATION"
        }
    )

    return CaregiverAuthorization(
        id=auth_id,
        patient_id=req.patient_id,
        caregiver_id=caregiver_id,
        caregiver_name=req.caregiver_name,
        relationship=req.relationship,
        status="authorized",
        created_at=now_iso
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
