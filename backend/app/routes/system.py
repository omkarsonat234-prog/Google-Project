from datetime import datetime
from fastapi import APIRouter
from ..config import get_system_status, SystemStatus
from ..models.database import get_connection
from ..models.schemas import DashboardStats

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/status", response_model=SystemStatus)
def system_status():
    return get_system_status()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(owner_id: str = "demo-patient"):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM prescriptions WHERE owner_id = ?", (owner_id,))
    p_count = cursor.fetchone()[0]

    cursor.execute("""
    SELECT COUNT(*) FROM medication_entries m
    JOIN prescriptions p ON m.prescription_id = p.id
    WHERE p.owner_id = ? AND m.review_status IN ('needs_review', 'uncertain', 'ready_for_verification')
    """, (owner_id,))
    awaiting_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM medication_schedules WHERE owner_id = ? AND status = 'active'", (owner_id,))
    sched_count = cursor.fetchone()[0]

    today_str = datetime.now().strftime("%Y-%m-%d")
    cursor.execute("SELECT COUNT(*) FROM reminder_events WHERE owner_id = ? AND date = ?", (owner_id, today_str))
    rem_today_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM reminder_events WHERE owner_id = ? AND date = ? AND acknowledged = 1", (owner_id, today_str))
    rem_ack_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM reminder_events WHERE owner_id = ? AND date = ? AND intake_reported = 1", (owner_id, today_str))
    rem_intake_count = cursor.fetchone()[0]

    conn.close()

    return DashboardStats(
        prescriptions_count=p_count,
        awaiting_verification_count=awaiting_count,
        verified_schedules_count=sched_count,
        today_reminders_count=rem_today_count,
        reminders_acknowledged_count=rem_ack_count,
        reminders_intake_reported_count=rem_intake_count
    )
