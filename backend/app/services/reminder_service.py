import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from ..models.database import get_connection, log_audit
from ..models.schemas import ReminderEvent

def get_reminders_for_user(owner_id: str = "demo-patient", date_filter: Optional[str] = None) -> List[ReminderEvent]:
    conn = get_connection()
    cursor = conn.cursor()

    if date_filter:
        cursor.execute("""
        SELECT * FROM reminder_events
        WHERE owner_id = ? AND date = ?
        ORDER BY scheduled_time ASC
        """, (owner_id, date_filter))
    else:
        cursor.execute("""
        SELECT * FROM reminder_events
        WHERE owner_id = ?
        ORDER BY date DESC, scheduled_time ASC
        """, (owner_id,))

    rows = cursor.fetchall()
    conn.close()

    reminders = []
    for r in rows:
        reminders.append(ReminderEvent(
            id=r["id"],
            schedule_id=r["schedule_id"],
            owner_id=r["owner_id"],
            medicine_name=r["medicine_name"],
            confirmed_instructions=r["confirmed_instructions"],
            scheduled_time=r["scheduled_time"],
            date=r["date"],
            notification_status=r["notification_status"],
            acknowledged=bool(r["acknowledged"]),
            acknowledged_at=r["acknowledged_at"],
            intake_reported=bool(r["intake_reported"]),
            intake_reported_at=r["intake_reported_at"],
            intake_notes=r["intake_notes"]
        ))
    return reminders

def acknowledge_reminder(reminder_id: str, user_identity: str = "Patient", notes: Optional[str] = None) -> ReminderEvent:
    """
    CRITICAL DISTINCTION:
    Acknowledging a reminder notes that the patient saw the alert.
    It DOES NOT claim or record that the pill was taken.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM reminder_events WHERE id = ?", (reminder_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Reminder {reminder_id} not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    UPDATE reminder_events
    SET acknowledged = 1,
        acknowledged_at = ?,
        notification_status = 'delivered'
    WHERE id = ?
    """, (now_iso, reminder_id))
    conn.commit()

    log_audit(
        action="REMINDER_ACKNOWLEDGED_ONLY",
        user_id=row["owner_id"],
        user_role="patient",
        target_type="reminder_event",
        target_id=reminder_id,
        details={
            "medicine_name": row["medicine_name"],
            "scheduled_time": row["scheduled_time"],
            "user_identity": user_identity,
            "clinical_notice": "Alert acknowledged by user; medication intake NOT confirmed."
        }
    )

    cursor.execute("SELECT * FROM reminder_events WHERE id = ?", (reminder_id,))
    updated = cursor.fetchone()
    conn.close()

    return ReminderEvent(
        id=updated["id"],
        schedule_id=updated["schedule_id"],
        owner_id=updated["owner_id"],
        medicine_name=updated["medicine_name"],
        confirmed_instructions=updated["confirmed_instructions"],
        scheduled_time=updated["scheduled_time"],
        date=updated["date"],
        notification_status=updated["notification_status"],
        acknowledged=bool(updated["acknowledged"]),
        acknowledged_at=updated["acknowledged_at"],
        intake_reported=bool(updated["intake_reported"]),
        intake_reported_at=updated["intake_reported_at"],
        intake_notes=updated["intake_notes"]
    )

def record_intake_reported(
    reminder_id: str,
    user_identity: str = "Patient",
    notes: Optional[str] = None,
    taken_timestamp: Optional[str] = None
) -> ReminderEvent:
    """
    CRITICAL DISTINCTION:
    Records that the patient self-reported taking the dose.
    Distinct from acknowledgment.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM reminder_events WHERE id = ?", (reminder_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Reminder {reminder_id} not found")

    now_iso = taken_timestamp or datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    UPDATE reminder_events
    SET intake_reported = 1,
        intake_reported_at = ?,
        intake_notes = ?
    WHERE id = ?
    """, (now_iso, notes, reminder_id))
    conn.commit()

    log_audit(
        action="MEDICATION_INTAKE_REPORTED_BY_USER",
        user_id=row["owner_id"],
        user_role="patient",
        target_type="reminder_event",
        target_id=reminder_id,
        details={
            "medicine_name": row["medicine_name"],
            "scheduled_time": row["scheduled_time"],
            "taken_at": now_iso,
            "intake_notes": notes,
            "clinical_notice": "Self-reported by user. Not independently verified clinical evidence."
        }
    )

    cursor.execute("SELECT * FROM reminder_events WHERE id = ?", (reminder_id,))
    updated = cursor.fetchone()
    conn.close()

    return ReminderEvent(
        id=updated["id"],
        schedule_id=updated["schedule_id"],
        owner_id=updated["owner_id"],
        medicine_name=updated["medicine_name"],
        confirmed_instructions=updated["confirmed_instructions"],
        scheduled_time=updated["scheduled_time"],
        date=updated["date"],
        notification_status=updated["notification_status"],
        acknowledged=bool(updated["acknowledged"]),
        acknowledged_at=updated["acknowledged_at"],
        intake_reported=bool(updated["intake_reported"]),
        intake_reported_at=updated["intake_reported_at"],
        intake_notes=updated["intake_notes"]
    )

def trigger_test_reminder(medicine_name: str = "Amoxicillin 500mg", instructions: str = "1 capsule with water") -> ReminderEvent:
    """Creates an instant test reminder for demonstration purposes."""
    conn = get_connection()
    cursor = conn.cursor()

    rem_id = str(uuid.uuid4())
    now = datetime.now()
    now_time = now.strftime("%H:%M")
    now_date = now.strftime("%Y-%m-%d")

    cursor.execute("""
    INSERT INTO reminder_events (
        id, schedule_id, owner_id, medicine_name, confirmed_instructions,
        scheduled_time, date, notification_status, acknowledged,
        acknowledged_at, intake_reported, intake_reported_at, intake_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'delivered', 0, NULL, 0, NULL, 'Live Demo Test Trigger')
    """, (
        rem_id,
        "demo-instant-schedule",
        "demo-patient",
        medicine_name,
        instructions,
        now_time,
        now_date
    ))
    conn.commit()
    conn.close()

    return ReminderEvent(
        id=rem_id,
        schedule_id="demo-instant-schedule",
        owner_id="demo-patient",
        medicine_name=medicine_name,
        confirmed_instructions=instructions,
        scheduled_time=now_time,
        date=now_date,
        notification_status="delivered",
        acknowledged=False,
        acknowledged_at=None,
        intake_reported=False,
        intake_reported_at=None,
        intake_notes="Live Demo Test Trigger"
    )
