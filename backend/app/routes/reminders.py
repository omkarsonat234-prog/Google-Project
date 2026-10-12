from typing import List, Optional
from fastapi import APIRouter, HTTPException
from ..models.schemas import (
    ReminderEvent,
    ReminderAcknowledgeRequest,
    ReminderIntakeRequest
)
from ..services.reminder_service import (
    get_reminders_for_user,
    acknowledge_reminder,
    record_intake_reported,
    trigger_test_reminder
)

router = APIRouter(prefix="/api/reminders", tags=["reminders"])

@router.get("", response_model=List[ReminderEvent])
def list_reminders(owner_id: str = "demo-patient", date: Optional[str] = None):
    return get_reminders_for_user(owner_id=owner_id, date_filter=date)

@router.post("/{reminder_id}/acknowledge", response_model=ReminderEvent)
def ack_reminder(reminder_id: str, req: ReminderAcknowledgeRequest):
    try:
        updated = acknowledge_reminder(
            reminder_id=reminder_id,
            user_identity=req.user_identity,
            notes=req.notes
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{reminder_id}/intake", response_model=ReminderEvent)
def report_intake(reminder_id: str, req: ReminderIntakeRequest):
    try:
        updated = record_intake_reported(
            reminder_id=reminder_id,
            user_identity=req.user_identity,
            notes=req.notes,
            taken_timestamp=req.taken_timestamp
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger-test", response_model=ReminderEvent)
def trigger_instant_reminder(medicine_name: str = "Amoxicillin 500mg", instructions: str = "Take 1 capsule with food"):
    return trigger_test_reminder(medicine_name=medicine_name, instructions=instructions)
