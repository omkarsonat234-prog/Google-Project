import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from ..models.database import get_connection, log_audit

router = APIRouter(prefix="/api/followups", tags=["Doctor Follow-ups"])


class FollowUpCreate(BaseModel):
    patient_id: str
    patient_name: str
    doctor_id: str
    doctor_name: str
    specialty: str
    department: str
    appointment_date: str
    appointment_time: str
    location_room: str
    reason: str
    clinical_notes: Optional[str] = None


class FollowUpUpdate(BaseModel):
    status: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_time: Optional[str] = None
    clinical_notes: Optional[str] = None


@router.get("")
def list_followups(patient_id: str = Query("demo-patient")):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM doctor_followups WHERE patient_id = ? ORDER BY appointment_date ASC, appointment_time ASC",
        (patient_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("")
def create_followup(data: FollowUpCreate):
    conn = get_connection()
    cursor = conn.cursor()
    fid = f"fu-{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO doctor_followups (
        id, patient_id, patient_name, doctor_id, doctor_name, specialty, department,
        appointment_date, appointment_time, location_room, reason, status, clinical_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        fid, data.patient_id, data.patient_name, data.doctor_id, data.doctor_name,
        data.specialty, data.department, data.appointment_date, data.appointment_time,
        data.location_room, data.reason, "scheduled", data.clinical_notes, now
    ))
    conn.commit()
    cursor.execute("SELECT * FROM doctor_followups WHERE id = ?", (fid,))
    row = cursor.fetchone()
    conn.close()
    log_audit("FOLLOWUP_SCHEDULED", data.patient_id, "patient", "doctor_followups", fid,
              {"doctor": data.doctor_name, "date": data.appointment_date})
    return dict(row)


@router.put("/{followup_id}")
def update_followup(followup_id: str, data: FollowUpUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctor_followups WHERE id = ?", (followup_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Follow-up appointment not found.")
    fields, values = [], []
    if data.status is not None:
        fields.append("status = ?")
        values.append(data.status)
    if data.appointment_date is not None:
        fields.append("appointment_date = ?")
        values.append(data.appointment_date)
    if data.appointment_time is not None:
        fields.append("appointment_time = ?")
        values.append(data.appointment_time)
    if data.clinical_notes is not None:
        fields.append("clinical_notes = ?")
        values.append(data.clinical_notes)
    if fields:
        values.append(followup_id)
        cursor.execute(f"UPDATE doctor_followups SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()
    cursor.execute("SELECT * FROM doctor_followups WHERE id = ?", (followup_id,))
    updated = cursor.fetchone()
    conn.close()
    return dict(updated)


@router.delete("/{followup_id}")
def cancel_followup(followup_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE doctor_followups SET status = 'cancelled' WHERE id = ?", (followup_id,))
    conn.commit()
    conn.close()
    return {"status": "cancelled", "followup_id": followup_id}
