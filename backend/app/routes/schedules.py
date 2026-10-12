import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from ..models.database import get_connection
from ..models.schemas import MedicationSchedule, ScheduleUpdateRequest
from ..services.verification_service import update_verified_schedule

router = APIRouter(prefix="/api/schedules", tags=["schedules"])

@router.get("", response_model=List[MedicationSchedule])
def list_schedules(owner_id: str = "demo-patient", status: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()

    if status:
        cursor.execute("SELECT * FROM medication_schedules WHERE owner_id = ? AND status = ? ORDER BY verified_at DESC", (owner_id, status))
    else:
        cursor.execute("SELECT * FROM medication_schedules WHERE owner_id = ? ORDER BY verified_at DESC", (owner_id,))

    rows = cursor.fetchall()
    conn.close()

    schedules = []
    for r in rows:
        schedules.append(MedicationSchedule(
            id=r["id"],
            prescription_id=r["prescription_id"],
            medication_entry_id=r["medication_entry_id"],
            owner_id=r["owner_id"],
            medicine_name=r["medicine_name"],
            confirmed_instructions=r["confirmed_instructions"],
            confirmed_schedule_times=json.loads(r["confirmed_schedule_times_json"] or "[]"),
            start_date=r["start_date"],
            end_date=r["end_date"],
            status=r["status"],
            verification_status=r["verification_status"],
            verified_at=r["verified_at"],
            verified_by=r["verified_by"],
            version=r["version"],
            history=json.loads(r["history_json"] or "[]")
        ))
    return schedules

@router.get("/{schedule_id}", response_model=MedicationSchedule)
def get_schedule(schedule_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medication_schedules WHERE id = ?", (schedule_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        raise HTTPException(status_code=404, detail="Schedule not found")

    return MedicationSchedule(
        id=r["id"],
        prescription_id=r["prescription_id"],
        medication_entry_id=r["medication_entry_id"],
        owner_id=r["owner_id"],
        medicine_name=r["medicine_name"],
        confirmed_instructions=r["confirmed_instructions"],
        confirmed_schedule_times=json.loads(r["confirmed_schedule_times_json"] or "[]"),
        start_date=r["start_date"],
        end_date=r["end_date"],
        status=r["status"],
        verification_status=r["verification_status"],
        verified_at=r["verified_at"],
        verified_by=r["verified_by"],
        version=r["version"],
        history=json.loads(r["history_json"] or "[]")
    )

@router.put("/{schedule_id}", response_model=MedicationSchedule)
def update_schedule(schedule_id: str, req: ScheduleUpdateRequest):
    if not req.edit_reason or not req.edit_reason.strip():
        raise HTTPException(status_code=400, detail="An edit reason is required for any clinical schedule amendment.")

    try:
        updated = update_verified_schedule(schedule_id=schedule_id, req=req)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
