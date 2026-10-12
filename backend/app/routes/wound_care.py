import uuid
import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from ..models.database import get_connection, log_audit

router = APIRouter(prefix="/api/wound-care", tags=["Wound Dressing & Trauma Care"])

ASEPTIC_PROTOCOLS = {
    "trauma_laceration": {
        "steps": [
            "Wash hands thoroughly with soap for 20 seconds or use 70% alcohol hand rub.",
            "Open sterile dressing pack on a clean surface — do NOT touch inner sterile field.",
            "Wear sterile gloves before touching the wound.",
            "Gently irrigate wound with normal saline (0.9% NaCl) using a 10 mL syringe from 10–15 cm distance.",
            "Pat wound dry with sterile gauze using light dabbing motions — do NOT rub.",
            "Inspect wound edges: check for signs of dehiscence, necrotic tissue, or infection.",
            "Apply prescribed antiseptic or antimicrobial dressing as directed (e.g. povidone-iodine, silver dressing).",
            "Secure dressing with medical adhesive tape without compressing the wound.",
            "Dispose of all used materials in a clinical waste bag.",
            "Document dressing change time, wound appearance, and any discharge."
        ],
        "infection_signs": [
            "Increasing redness or warmth around the wound (erythema spreading > 2 cm)",
            "Purulent (pus) or foul-smelling discharge",
            "Wound edges not approximating or opening (dehiscence)",
            "Fever > 38°C (100.4°F)",
            "Excessive swelling or pain increasing rather than decreasing"
        ]
    },
    "post_op_surgical": {
        "steps": [
            "Strictly maintain aseptic technique — use sterile gloves and sterile dressing pack.",
            "Remove old dressing carefully using forceps — never touch wound with bare hands.",
            "Inspect surgical incision: check staples/sutures for integrity.",
            "Cleanse incision with normal saline only — do NOT apply hydrogen peroxide to healing wounds.",
            "Allow incision to air-dry for 60 seconds before applying new dressing.",
            "Apply sterile non-adherent dressing (e.g. Telfa pad) then cover with gauze.",
            "Tape all four edges securely.",
            "Record suture/staple count and any signs of complications."
        ],
        "infection_signs": [
            "Serosanguineous or purulent drainage from incision",
            "Wound gaping or suture/staple popping",
            "Localised heat, swelling, or unexpected tenderness",
            "Fever or elevated WBC on next blood test"
        ]
    },
    "abrasion": {
        "steps": [
            "Rinse abrasion thoroughly under running clean water for 5–10 minutes.",
            "Use sterile gauze to gently remove embedded debris.",
            "Apply a thin layer of antiseptic cream (e.g. Betadine or mupirocin) if prescribed.",
            "Cover with a non-stick dressing (hydrocolloid or Telfa pad).",
            "Change daily or when dressing becomes wet/soiled.",
            "Expose to air briefly each day to promote healing."
        ],
        "infection_signs": [
            "Persistent redness extending beyond wound edges",
            "Yellow or green crusting",
            "Increased tenderness after 48 hours"
        ]
    },
    "burn_dressing": {
        "steps": [
            "Use ONLY sterile technique. Never apply ice or butter to burns.",
            "Gently remove old dressing soaked in sterile saline if adherent — never force removal.",
            "Assess burn depth: superficial (pink, painful), partial-thickness (blisters, weeping), full-thickness (white/brown, painless).",
            "Irrigate with cool sterile saline.",
            "Apply prescribed burn dressing (e.g. silver sulfadiazine, mepilex AG, or Jelonet).",
            "Wrap loosely with gauze — allow slight compression without restricting circulation.",
            "Elevate affected limb if possible to reduce oedema.",
            "Reassess at every dressing change for signs of wound progression."
        ],
        "infection_signs": [
            "Wound deepening or colour change (superficial becoming deep)",
            "Cellulitis (spreading skin infection around burn)",
            "Septic shock signs: fever, rapid heart rate, confusion",
            "Foul odour or heavy exudate"
        ]
    }
}


class WoundCreate(BaseModel):
    patient_id: str
    wound_type: str  # trauma_laceration | post_op_surgical | abrasion | burn_dressing
    anatomical_site: str
    dressing_frequency_hours: int  # e.g. 24, 48, 72
    suture_count: Optional[int] = 0
    suture_removal_date: Optional[str] = None
    last_dressing_at: Optional[str] = None


@router.get("")
def list_wounds(patient_id: str = Query("demo-patient")):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM wound_dressings WHERE patient_id = ? ORDER BY next_dressing_due ASC",
        (patient_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        try:
            d["aseptic_protocol"] = json.loads(d.pop("aseptic_protocol_json") or "{}")
        except Exception:
            d["aseptic_protocol"] = {}
        result.append(d)
    return result


@router.post("")
def create_wound_record(data: WoundCreate):
    protocol = ASEPTIC_PROTOCOLS.get(data.wound_type, ASEPTIC_PROTOCOLS["trauma_laceration"])
    now = datetime.now(timezone.utc)
    last_dress = datetime.fromisoformat(data.last_dressing_at) if data.last_dressing_at else now
    next_due = (last_dress + timedelta(hours=data.dressing_frequency_hours)).isoformat()
    wid = f"wd-{uuid.uuid4().hex[:12]}"
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO wound_dressings (
        id, patient_id, wound_type, anatomical_site, dressing_frequency_hours,
        last_dressing_at, next_dressing_due, aseptic_protocol_json, infection_signs_monitored,
        suture_count, suture_removal_date, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        wid, data.patient_id, data.wound_type, data.anatomical_site,
        data.dressing_frequency_hours, data.last_dressing_at or now.isoformat(),
        next_due, json.dumps(protocol), json.dumps(protocol["infection_signs"]),
        data.suture_count or 0, data.suture_removal_date, "active_care", now.isoformat()
    ))
    conn.commit()
    conn.close()
    log_audit("WOUND_RECORD_CREATED", data.patient_id, "physician", "wound_dressings", wid,
              {"type": data.wound_type, "site": data.anatomical_site})
    return {"status": "created", "wound_id": wid, "next_dressing_due": next_due, "protocol": protocol}


@router.post("/{wound_id}/dress")
def record_dressing_done(wound_id: str, patient_id: str = Query("demo-patient")):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM wound_dressings WHERE id = ?", (wound_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Wound record not found.")
    d = dict(row)
    now = datetime.now(timezone.utc)
    next_due = (now + timedelta(hours=d["dressing_frequency_hours"])).isoformat()
    cursor.execute(
        "UPDATE wound_dressings SET last_dressing_at = ?, next_dressing_due = ? WHERE id = ?",
        (now.isoformat(), next_due, wound_id)
    )
    conn.commit()
    conn.close()
    log_audit("WOUND_DRESSING_DONE", patient_id, "patient", "wound_dressings", wound_id,
              {"next_due": next_due})
    return {"status": "dressing_recorded", "wound_id": wound_id, "next_dressing_due": next_due}


@router.put("/{wound_id}/status")
def update_wound_status(wound_id: str, status: str = Query(...)):
    valid = ["active_care", "healing_well", "urgent_review", "healed"]
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid}")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE wound_dressings SET status = ? WHERE id = ?", (status, wound_id))
    conn.commit()
    conn.close()
    return {"status": "updated", "wound_id": wound_id, "new_status": status}
