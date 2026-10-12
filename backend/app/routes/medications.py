import json
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from ..models.database import get_connection
from ..models.schemas import (
    MedicineExtracted,
    MedicationCorrectionRequest,
    VerificationRequest,
    MedicationSchedule,
    ReminderEvent
)
from ..services.verification_service import (
    apply_medication_corrections,
    verify_and_activate_schedule,
    VerificationGateError
)

router = APIRouter(prefix="/api/medications", tags=["medications"])

@router.get("/{med_id}", response_model=MedicineExtracted)
def get_medication_entry(med_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medication_entries WHERE id = ?", (med_id,))
    r = cursor.fetchone()
    conn.close()
    if not r:
        raise HTTPException(status_code=404, detail="Medication entry not found")

    return MedicineExtracted(
        id=r["id"],
        name_as_written=r["name_as_written"],
        strength_as_written=r["strength_as_written"],
        instructions_as_written=r["instructions_as_written"],
        frequency_as_written=r["frequency_as_written"],
        timing_as_written=r["timing_as_written"],
        duration_as_written=r["duration_as_written"],
        prescribed_date=r["prescribed_date"],
        source_text=json.loads(r["source_text_json"] or "[]"),
        source_locations=json.loads(r["source_locations_json"] or "{}"),
        uncertain_fields=json.loads(r["uncertain_fields_json"] or "[]"),
        uncertainty_reasons=json.loads(r["uncertainty_reasons_json"] or "{}"),
        review_status=r["review_status"],
        user_corrections=json.loads(r["user_corrections_json"] or "{}"),
        verification_checklist=json.loads(r["verification_checklist_json"] or "{}")
    )

@router.put("/{med_id}/corrections")
def update_corrections(med_id: str, req: MedicationCorrectionRequest):
    try:
        updated = apply_medication_corrections(
            med_id=med_id,
            corrections=req.corrections,
            checklist=req.checklist,
            notes=req.notes
        )
        return {
            "status": "success",
            "message": "Corrections saved while preserving original OCR data.",
            "medication": updated
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{med_id}/verify")
def verify_medication(med_id: str, req: VerificationRequest):
    try:
        schedule, reminders = verify_and_activate_schedule(
            med_id=med_id,
            req=req
        )
        return {
            "status": "activated",
            "message": "Verification completed. Active medication schedule and reminders established.",
            "schedule": schedule,
            "reminders": reminders
        }
    except VerificationGateError as e:
        raise HTTPException(status_code=422, detail={
            "error_type": "VERIFICATION_GATE_BLOCKED",
            "message": str(e),
            "safety_action": "Resolve flagged uncertainty or obtain explicit pharmacist/physician instruction before creating an active schedule."
        })
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
