import json
from typing import List, Optional
from fastapi import APIRouter
from ..models.database import get_connection
from ..models.schemas import AuditLogEntry

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/logs", response_model=List[AuditLogEntry])
def get_audit_logs(limit: int = 100):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT * FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    logs = []
    for r in rows:
        logs.append(AuditLogEntry(
            id=r["id"],
            timestamp=r["timestamp"],
            action=r["action"],
            user_id=r["user_id"],
            user_role=r["user_role"],
            target_type=r["target_type"],
            target_id=r["target_id"],
            details=json.loads(r["details_json"] or "{}")
        ))
    return logs
