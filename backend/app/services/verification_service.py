import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from ..models.database import get_connection, log_audit
from ..models.schemas import (
    MedicationSchedule,
    VerificationRecord,
    ReminderEvent,
    VerificationRequest,
    ScheduleUpdateRequest
)

class VerificationGateError(Exception):
    pass

def apply_medication_corrections(
    med_id: str,
    corrections: Dict[str, str],
    checklist: Dict[str, bool],
    notes: Optional[str],
    user_id: str = "patient-1",
    user_role: str = "patient"
) -> Dict[str, Any]:
    """
    Applies user corrections to a medication entry while preserving the original OCR extracted values.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medication_entries WHERE id = ?", (med_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Medication entry {med_id} not found")

    existing_corrections = json.loads(row["user_corrections_json"] or "{}")
    existing_corrections.update(corrections)

    existing_checklist = json.loads(row["verification_checklist_json"] or "{}")
    existing_checklist.update(checklist)

    # Check if previously uncertain fields are now resolved by user corrections
    uncertain_fields = json.loads(row["uncertain_fields_json"] or "[]")
    resolved_fields = [f for f in uncertain_fields if f in corrections and corrections[f].strip()]
    remaining_uncertain = [f for f in uncertain_fields if f not in resolved_fields]

    new_review_status = "ready_for_verification" if len(remaining_uncertain) == 0 else "needs_review"

    cursor.execute("""
    UPDATE medication_entries
    SET user_corrections_json = ?,
        verification_checklist_json = ?,
        uncertain_fields_json = ?,
        review_status = ?
    WHERE id = ?
    """, (
        json.dumps(existing_corrections),
        json.dumps(existing_checklist),
        json.dumps(remaining_uncertain),
        new_review_status,
        med_id
    ))
    conn.commit()

    log_audit(
        action="MEDICATION_FIELD_CORRECTION",
        user_id=user_id,
        user_role=user_role,
        target_type="medication_entry",
        target_id=med_id,
        details={
            "corrections": corrections,
            "checklist": checklist,
            "resolved_uncertainties": resolved_fields,
            "remaining_uncertainties": remaining_uncertain,
            "notes": notes
        }
    )

    cursor.execute("SELECT * FROM medication_entries WHERE id = ?", (med_id,))
    updated_row = dict(cursor.fetchone())
    conn.close()
    return updated_row

def verify_and_activate_schedule(
    med_id: str,
    req: VerificationRequest,
    user_id: str = "patient-1"
) -> Tuple[MedicationSchedule, List[ReminderEvent]]:
    """
    THE VERIFICATION GATE:
    Strictly verifies that all required checklist items are confirmed,
    blocks unverified or unresolved ambiguous instructions unless explicit clinical override is documented,
    creates the immutable verification record and activates the schedule with initial reminders.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medication_entries WHERE id = ?", (med_id,))
    med_row = cursor.fetchone()
    if not med_row:
        conn.close()
        raise ValueError(f"Medication entry {med_id} not found")

    uncertain_fields = json.loads(med_row["uncertain_fields_json"] or "[]")
    user_corrections = json.loads(med_row["user_corrections_json"] or "{}")
    checklist = json.loads(med_row["verification_checklist_json"] or "{}")

    # Safety Enforcement: Check for unaddressed uncertainties
    unresolved_uncertainties = [f for f in uncertain_fields if f not in user_corrections or not user_corrections[f].strip()]
    if unresolved_uncertainties and not req.override_uncertainty:
        conn.close()
        raise VerificationGateError(
            f"Cannot activate schedule: Uncertain fields [{', '.join(unresolved_uncertainties)}] "
            "have not been verified or corrected. Patient safety requires explicit verification."
        )

    # Must provide at least one scheduled time if frequency/timing instructions exist
    instructions = user_corrections.get("instructions_as_written") or med_row["instructions_as_written"] or ""
    if not req.confirmed_schedule_times:
        conn.close()
        raise VerificationGateError(
            "Cannot activate schedule without confirmed schedule times (e.g. 08:00, 20:00). "
            "MedBridge does not guess dosing times automatically."
        )

    # Honest verification status label:
    # If the user role is not verified MD/PharmD, label as 'user_reviewed'
    is_clinician = req.verifier_role in ["pharmacist", "physician", "doctor"]
    verification_status = "clinical_verified" if is_clinician else "user_reviewed"

    now_iso = datetime.now(timezone.utc).isoformat()
    prescription_id = med_row["prescription_id"]

    # 1. Create Verification Record (Immutable Audit)
    verification_id = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO verification_records (
        id, prescription_id, medication_entry_id, verifier_identity,
        verifier_role, verification_timestamp, fields_reviewed_json,
        changes_made_json, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        verification_id,
        prescription_id,
        med_id,
        req.verifier_identity,
        req.verifier_role,
        now_iso,
        json.dumps(list(checklist.keys())),
        json.dumps(user_corrections),
        req.notes
    ))

    # 2. Update Medication Entry status
    cursor.execute("""
    UPDATE medication_entries
    SET review_status = ?
    WHERE id = ?
    """, (verification_status, med_id))

    # 3. Create Activated Medication Schedule
    schedule_id = str(uuid.uuid4())
    medicine_name = user_corrections.get("name_as_written") or med_row["name_as_written"]
    confirmed_inst = user_corrections.get("instructions_as_written") or med_row["instructions_as_written"]

    cursor.execute("""
    INSERT INTO medication_schedules (
        id, prescription_id, medication_entry_id, owner_id, medicine_name,
        confirmed_instructions, confirmed_schedule_times_json, start_date,
        end_date, status, verification_status, verified_at, verified_by,
        version, history_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        schedule_id,
        prescription_id,
        med_id,
        user_id,
        medicine_name,
        confirmed_inst,
        json.dumps(req.confirmed_schedule_times),
        req.confirmed_start_date or datetime.now().strftime("%Y-%m-%d"),
        req.confirmed_end_date,
        "active",
        verification_status,
        now_iso,
        f"{req.verifier_identity} ({req.verifier_role})",
        1,
        json.dumps([{
            "version": 1,
            "timestamp": now_iso,
            "event": "INITIAL_VERIFICATION_ACTIVATION",
            "verified_by": req.verifier_identity,
            "role": req.verifier_role
        }])
    ))

    # 4. Generate Initial Today / Upcoming Reminders for this active schedule
    today_str = datetime.now().strftime("%Y-%m-%d")
    created_reminders = []

    for time_str in req.confirmed_schedule_times:
        reminder_id = str(uuid.uuid4())
        cursor.execute("""
        INSERT INTO reminder_events (
            id, schedule_id, owner_id, medicine_name, confirmed_instructions,
            scheduled_time, date, notification_status, acknowledged,
            acknowledged_at, intake_reported, intake_reported_at, intake_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, 0, NULL, NULL)
        """, (
            reminder_id,
            schedule_id,
            user_id,
            medicine_name,
            confirmed_inst,
            time_str,
            today_str,
            "scheduled"
        ))
        created_reminders.append(ReminderEvent(
            id=reminder_id,
            schedule_id=schedule_id,
            owner_id=user_id,
            medicine_name=medicine_name,
            confirmed_instructions=confirmed_inst,
            scheduled_time=time_str,
            date=today_str,
            notification_status="scheduled",
            acknowledged=False,
            acknowledged_at=None,
            intake_reported=False,
            intake_reported_at=None,
            intake_notes=None
        ))

    # Also update overall prescription review status
    cursor.execute("""
    UPDATE prescriptions
    SET overall_review_status = 'verified'
    WHERE id = ?
    """, (prescription_id,))

    conn.commit()

    log_audit(
        action="SCHEDULE_ACTIVATION_VERIFIED",
        user_id=user_id,
        user_role=req.verifier_role,
        target_type="medication_schedule",
        target_id=schedule_id,
        details={
            "medicine_name": medicine_name,
            "verification_status": verification_status,
            "scheduled_times": req.confirmed_schedule_times,
            "reminders_count": len(created_reminders)
        }
    )

    sched_obj = MedicationSchedule(
        id=schedule_id,
        prescription_id=prescription_id,
        medication_entry_id=med_id,
        owner_id=user_id,
        medicine_name=medicine_name,
        confirmed_instructions=confirmed_inst,
        confirmed_schedule_times=req.confirmed_schedule_times,
        start_date=req.confirmed_start_date or today_str,
        end_date=req.confirmed_end_date,
        status="active",
        verification_status=verification_status,
        verified_at=now_iso,
        verified_by=f"{req.verifier_identity} ({req.verifier_role})",
        version=1,
        history=[{"version": 1, "timestamp": now_iso, "event": "INITIAL_VERIFICATION_ACTIVATION"}]
    )

    conn.close()
    return sched_obj, created_reminders

def update_verified_schedule(
    schedule_id: str,
    req: ScheduleUpdateRequest,
    user_id: str = "patient-1",
    user_role: str = "patient"
) -> MedicationSchedule:
    """
    Non-destructive schedule editing with version history preservation.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medication_schedules WHERE id = ?", (schedule_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Schedule {schedule_id} not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    old_version = row["version"]
    new_version = old_version + 1

    history = json.loads(row["history_json"] or "[]")
    history.append({
        "version": old_version,
        "archived_at": now_iso,
        "editor": req.editor_identity,
        "reason": req.edit_reason,
        "previous_instructions": row["confirmed_instructions"],
        "previous_times": json.loads(row["confirmed_schedule_times_json"] or "[]"),
        "previous_status": row["status"]
    })

    new_instructions = req.confirmed_instructions or row["confirmed_instructions"]
    new_times = req.confirmed_schedule_times if req.confirmed_schedule_times is not None else json.loads(row["confirmed_schedule_times_json"])
    new_status = req.status or row["status"]
    new_start = req.start_date if req.start_date is not None else row["start_date"]
    new_end = req.end_date if req.end_date is not None else row["end_date"]

    cursor.execute("""
    UPDATE medication_schedules
    SET confirmed_instructions = ?,
        confirmed_schedule_times_json = ?,
        status = ?,
        start_date = ?,
        end_date = ?,
        version = ?,
        history_json = ?
    WHERE id = ?
    """, (
        new_instructions,
        json.dumps(new_times),
        new_status,
        new_start,
        new_end,
        new_version,
        json.dumps(history),
        schedule_id
    ))
    conn.commit()

    log_audit(
        action="SCHEDULE_VERSION_UPDATED",
        user_id=user_id,
        user_role=user_role,
        target_type="medication_schedule",
        target_id=schedule_id,
        details={
            "new_version": new_version,
            "reason": req.edit_reason,
            "editor": req.editor_identity
        }
    )

    cursor.execute("SELECT * FROM medication_schedules WHERE id = ?", (schedule_id,))
    updated_row = dict(cursor.fetchone())
    conn.close()

    return MedicationSchedule(
        id=updated_row["id"],
        prescription_id=updated_row["prescription_id"],
        medication_entry_id=updated_row["medication_entry_id"],
        owner_id=updated_row["owner_id"],
        medicine_name=updated_row["medicine_name"],
        confirmed_instructions=updated_row["confirmed_instructions"],
        confirmed_schedule_times=json.loads(updated_row["confirmed_schedule_times_json"]),
        start_date=updated_row["start_date"],
        end_date=updated_row["end_date"],
        status=updated_row["status"],
        verification_status=updated_row["verification_status"],
        verified_at=updated_row["verified_at"],
        verified_by=updated_row["verified_by"],
        version=updated_row["version"],
        history=json.loads(updated_row["history_json"])
    )

def determine_recommended_times(frequency: Optional[str], timing: Optional[str], instructions: Optional[str]) -> List[str]:
    combined = f"{frequency or ''} {timing or ''} {instructions or ''}".lower()
    if any(k in combined for k in ["3 times", "three times", "every 8 hours", "8 hours", "tid"]):
        return ["08:00", "14:00", "20:00"]
    elif any(k in combined for k in ["twice", "2 times", "every 12 hours", "12 hours", "bid"]):
        return ["08:00", "20:00"]
    elif any(k in combined for k in ["4 times", "four times", "every 6 hours", "qid"]):
        return ["08:00", "12:00", "16:00", "20:00"]
    elif any(k in combined for k in ["bedtime", "night", "evening", "qhs"]):
        return ["21:00"]
    elif any(k in combined for k in ["morning", "breakfast", "once daily", "qd", "daily"]):
        return ["08:00"]
    return ["09:00"]

def auto_register_prescription_medications(
    prescription_id: str,
    owner_id: str = "demo-patient",
    user_identity: str = "Patient"
) -> Tuple[List[MedicationSchedule], List[ReminderEvent]]:
    """
    Automatically registers extracted prescription medications into active daily schedules
    and seeds corresponding today's reminders based on clinically recommended timings.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM medication_entries WHERE prescription_id = ?", (prescription_id,))
    rows = cursor.fetchall()
    if not rows:
        conn.close()
        return [], []

    now_iso = datetime.now(timezone.utc).isoformat()
    today_str = datetime.now().strftime("%Y-%m-%d")

    schedules: List[MedicationSchedule] = []
    reminders: List[ReminderEvent] = []

    for row in rows:
        med_id = row["id"]
        med_name = row["name_as_written"]
        inst = row["instructions_as_written"] or "Take as directed by doctor."
        freq = row["frequency_as_written"]
        timing = row["timing_as_written"]

        recommended_times = determine_recommended_times(freq, timing, inst)

        # Check if schedule already exists for this entry
        cursor.execute("SELECT * FROM medication_schedules WHERE medication_entry_id = ?", (med_id,))
        existing_sched = cursor.fetchone()
        if existing_sched:
            sched_id = existing_sched["id"]
        else:
            sched_id = str(uuid.uuid4())
            cursor.execute("""
            INSERT INTO medication_schedules (
                id, prescription_id, medication_entry_id, owner_id, medicine_name,
                confirmed_instructions, confirmed_schedule_times_json, start_date,
                end_date, status, verification_status, verified_at, verified_by,
                version, history_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'active', 'auto_registered', ?, ?, 1, ?)
            """, (
                sched_id,
                prescription_id,
                med_id,
                owner_id,
                med_name,
                inst,
                json.dumps(recommended_times),
                today_str,
                now_iso,
                f"{user_identity} (Auto-Registered Routine)",
                json.dumps([{
                    "version": 1,
                    "timestamp": now_iso,
                    "event": "AUTOMATIC_ROUTINE_REGISTRATION",
                    "registered_by": user_identity
                }])
            ))

            # Update entry status
            cursor.execute("UPDATE medication_entries SET review_status = 'auto_registered' WHERE id = ?", (med_id,))

        sched_obj = MedicationSchedule(
            id=sched_id,
            prescription_id=prescription_id,
            medication_entry_id=med_id,
            owner_id=owner_id,
            medicine_name=med_name,
            confirmed_instructions=inst,
            confirmed_schedule_times=recommended_times,
            start_date=today_str,
            end_date=None,
            status="active",
            verification_status="auto_registered",
            verified_at=now_iso,
            verified_by=f"{user_identity} (Auto-Registered)",
            version=1,
            history=[]
        )
        schedules.append(sched_obj)

        # Generate today's reminders for this schedule
        for t in recommended_times:
            # Check if reminder already exists for today at this time
            cursor.execute("""
            SELECT id FROM reminder_events 
            WHERE schedule_id = ? AND date = ? AND scheduled_time = ?
            """, (sched_id, today_str, t))
            existing_rem = cursor.fetchone()
            if not existing_rem:
                rem_id = str(uuid.uuid4())
                cursor.execute("""
                INSERT INTO reminder_events (
                    id, schedule_id, owner_id, medicine_name, confirmed_instructions,
                    scheduled_time, date, notification_status, acknowledged,
                    acknowledged_at, intake_reported, intake_reported_at, intake_notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', 0, NULL, 0, NULL, NULL)
                """, (
                    rem_id,
                    sched_id,
                    owner_id,
                    med_name,
                    inst,
                    t,
                    today_str
                ))
                reminders.append(ReminderEvent(
                    id=rem_id,
                    schedule_id=sched_id,
                    owner_id=owner_id,
                    medicine_name=med_name,
                    confirmed_instructions=inst,
                    scheduled_time=t,
                    date=today_str,
                    notification_status="scheduled",
                    acknowledged=False,
                    acknowledged_at=None,
                    intake_reported=False,
                    intake_reported_at=None,
                    intake_notes=None
                ))

    # Update prescription status
    cursor.execute("UPDATE prescriptions SET processing_status = 'auto_registered', overall_review_status = 'auto_registered' WHERE id = ?", (prescription_id,))
    conn.commit()

    log_audit(
        action="MEDICATIONS_AUTO_REGISTERED_FROM_PRESCRIPTION",
        user_id=owner_id,
        user_role="patient",
        target_type="prescription",
        target_id=prescription_id,
        details={
            "schedules_created": len(schedules),
            "reminders_created": len(reminders),
            "user_identity": user_identity
        }
    )

    conn.close()
    return schedules, reminders
