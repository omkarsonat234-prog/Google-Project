import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..models.database import get_connection, log_audit

router = APIRouter(prefix="/api/ipd", tags=["IPD Records & Discharge"])


class IPDRecordCreate(BaseModel):
    patient_id: str
    patient_name: str
    ipd_number: str
    admission_date: str
    discharge_date: str
    ward_bed: str
    admitting_doctor: str
    discharging_doctor: str
    diagnosis: str
    surgical_procedure: Optional[str] = None
    inpatient_course: str
    discharge_condition: str
    vitals: Dict[str, Any]
    ipd_medicines: List[Dict[str, Any]]
    opd_transition_medicines: List[Dict[str, Any]]
    discharge_instructions: Dict[str, Any]


@router.get("")
def list_ipd_records(patient_id: str = Query("demo-patient")):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ipd_records WHERE patient_id = ? ORDER BY admission_date DESC", (patient_id,))
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        for field in ["vitals_json", "ipd_medicines_json", "opd_transition_medicines_json", "discharge_instructions_json"]:
            try:
                d[field.replace("_json", "")] = json.loads(d.pop(field, "{}") or "{}")
            except Exception:
                d[field.replace("_json", "")] = {}
        result.append(d)
    return result


@router.get("/{ipd_id}")
def get_ipd_record(ipd_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ipd_records WHERE id = ?", (ipd_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="IPD record not found.")
    d = dict(row)
    for field in ["vitals_json", "ipd_medicines_json", "opd_transition_medicines_json", "discharge_instructions_json"]:
        try:
            d[field.replace("_json", "")] = json.loads(d.pop(field, "{}") or "{}")
        except Exception:
            d[field.replace("_json", "")] = {}
    return d


@router.post("")
def create_ipd_record(data: IPDRecordCreate):
    conn = get_connection()
    cursor = conn.cursor()
    iid = f"ipd-{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO ipd_records (
        id, patient_id, patient_name, ipd_number, admission_date, discharge_date,
        ward_bed, admitting_doctor, discharging_doctor, diagnosis, surgical_procedure,
        inpatient_course, discharge_condition, vitals_json, ipd_medicines_json,
        opd_transition_medicines_json, discharge_instructions_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        iid, data.patient_id, data.patient_name, data.ipd_number,
        data.admission_date, data.discharge_date, data.ward_bed,
        data.admitting_doctor, data.discharging_doctor, data.diagnosis,
        data.surgical_procedure, data.inpatient_course, data.discharge_condition,
        json.dumps(data.vitals), json.dumps(data.ipd_medicines),
        json.dumps(data.opd_transition_medicines), json.dumps(data.discharge_instructions),
        now
    ))
    conn.commit()
    conn.close()
    log_audit("IPD_RECORD_CREATED", data.patient_id, "physician", "ipd_records", iid,
              {"ipd_number": data.ipd_number, "diagnosis": data.diagnosis})
    return {"status": "created", "ipd_id": iid, "ipd_number": data.ipd_number}


@router.get("/{ipd_id}/discharge-summary")
def get_discharge_summary(ipd_id: str):
    """Returns a structured discharge summary document."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ipd_records WHERE id = ?", (ipd_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="IPD record not found.")
    d = dict(row)
    vitals = json.loads(d.get("vitals_json") or "{}")
    ipd_meds = json.loads(d.get("ipd_medicines_json") or "[]")
    opd_meds = json.loads(d.get("opd_transition_medicines_json") or "[]")
    instructions = json.loads(d.get("discharge_instructions_json") or "{}")
    return {
        "document_type": "IPD Discharge Summary",
        "hospital": "MedBridge Clinical Centre",
        "ipd_number": d["ipd_number"],
        "patient": {"name": d["patient_name"], "id": d["patient_id"]},
        "admission_date": d["admission_date"],
        "discharge_date": d["discharge_date"],
        "ward_bed": d["ward_bed"],
        "admitting_doctor": d["admitting_doctor"],
        "discharging_doctor": d["discharging_doctor"],
        "diagnosis": d["diagnosis"],
        "surgical_procedure": d.get("surgical_procedure"),
        "inpatient_course": d["inpatient_course"],
        "discharge_condition": d["discharge_condition"],
        "vitals_at_discharge": vitals,
        "ipd_medicines_administered": ipd_meds,
        "opd_transition_medicines": opd_meds,
        "discharge_instructions": instructions,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
