import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from ..models.database import get_connection

router = APIRouter(prefix="/api/patient-history", tags=["Patient Medical History"])


class MedicalHistoryUpdate(BaseModel):
    patient_id: str
    chronic_conditions: List[str]
    past_surgeries: List[dict]
    drug_allergies: List[str]
    family_history: List[dict]
    immunizations: List[dict]
    blood_group: Optional[str] = None


@router.get("/{patient_id}")
def get_medical_history(patient_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patient_medical_history WHERE patient_id = ?", (patient_id,))
    row = cursor.fetchone()
    # Also get user profile
    cursor.execute("SELECT * FROM users WHERE id = ?", (patient_id,))
    user_row = cursor.fetchone()
    conn.close()
    if not row:
        return {
            "patient_id": patient_id,
            "profile": dict(user_row) if user_row else {},
            "chronic_conditions": [],
            "past_surgeries": [],
            "drug_allergies": [],
            "family_history": [],
            "immunizations": [],
            "blood_group": None,
            "last_updated": None
        }
    d = dict(row)
    return {
        "patient_id": patient_id,
        "profile": dict(user_row) if user_row else {},
        "chronic_conditions": json.loads(d.get("chronic_conditions_json") or "[]"),
        "past_surgeries": json.loads(d.get("past_surgeries_json") or "[]"),
        "drug_allergies": json.loads(d.get("drug_allergies_json") or "[]"),
        "family_history": json.loads(d.get("family_history_json") or "[]"),
        "immunizations": json.loads(d.get("immunizations_json") or "[]"),
        "blood_group": d.get("blood_group"),
        "last_updated": d.get("last_updated")
    }


@router.put("/{patient_id}")
def upsert_medical_history(patient_id: str, data: MedicalHistoryUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("SELECT patient_id FROM patient_medical_history WHERE patient_id = ?", (patient_id,))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("""
        UPDATE patient_medical_history
        SET chronic_conditions_json=?, past_surgeries_json=?, drug_allergies_json=?,
            family_history_json=?, immunizations_json=?, blood_group=?, last_updated=?
        WHERE patient_id=?
        """, (
            json.dumps(data.chronic_conditions), json.dumps(data.past_surgeries),
            json.dumps(data.drug_allergies), json.dumps(data.family_history),
            json.dumps(data.immunizations), data.blood_group, now, patient_id
        ))
    else:
        cursor.execute("""
        INSERT INTO patient_medical_history (
            patient_id, chronic_conditions_json, past_surgeries_json, drug_allergies_json,
            family_history_json, immunizations_json, blood_group, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            patient_id, json.dumps(data.chronic_conditions), json.dumps(data.past_surgeries),
            json.dumps(data.drug_allergies), json.dumps(data.family_history),
            json.dumps(data.immunizations), data.blood_group, now
        ))
    conn.commit()
    conn.close()
    return {"status": "saved", "patient_id": patient_id, "last_updated": now}


@router.get("")
def list_all_patients_history(requester_role: str = Query("physician")):
    """Doctor-only: list all patients with their medical history."""
    if requester_role not in ["physician", "pharmacist"]:
        raise HTTPException(status_code=403, detail="Access restricted to clinical staff.")
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE role = 'patient'")
    patients = cursor.fetchall()
    result = []
    for p in patients:
        pd = dict(p)
        cursor.execute("SELECT * FROM patient_medical_history WHERE patient_id = ?", (pd["id"],))
        hist = cursor.fetchone()
        hd = {}
        if hist:
            hd = {
                "chronic_conditions": json.loads(dict(hist).get("chronic_conditions_json") or "[]"),
                "drug_allergies": json.loads(dict(hist).get("drug_allergies_json") or "[]"),
                "blood_group": dict(hist).get("blood_group"),
                "last_updated": dict(hist).get("last_updated")
            }
        pd.pop("password_hash", None)
        pd.pop("reset_code", None)
        result.append({**pd, **hd})
    conn.close()
    return result
