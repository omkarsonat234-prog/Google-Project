import os
import uuid
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from ..config import UPLOAD_DIR, SAMPLES_DIR
from ..models.database import get_connection, log_audit
from ..models.schemas import PrescriptionCreateResponse, MedicineExtracted, SourceHighlight
from ..services.ocr_service import run_vision_ocr
from ..services.gemini_service import structure_prescription
from ..services.sample_prescriptions import SAMPLE_PRESETS

router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.get("", response_model=List[dict])
def list_prescriptions(owner_id: str = "demo-patient"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, filename, file_url, upload_timestamp, processing_status,
           overall_review_status, is_synthetic_demo, demo_preset_id
    FROM prescriptions
    WHERE owner_id = ?
    ORDER BY upload_timestamp DESC
    """, (owner_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@router.get("/{prescription_id}", response_model=PrescriptionCreateResponse)
def get_prescription(prescription_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM prescriptions WHERE id = ?", (prescription_id,))
    p_row = cursor.fetchone()
    if not p_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Prescription not found")

    cursor.execute("SELECT * FROM medication_entries WHERE prescription_id = ?", (prescription_id,))
    m_rows = cursor.fetchall()
    conn.close()

    medicines = []
    for r in m_rows:
        medicines.append(MedicineExtracted(
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
        ))

    raw_highlights = json.loads(p_row["ocr_highlights_json"] or "[]")
    highlights = [SourceHighlight(**h) for h in raw_highlights]

    return PrescriptionCreateResponse(
        id=p_row["id"],
        filename=p_row["filename"],
        file_url=p_row["file_url"],
        upload_timestamp=p_row["upload_timestamp"],
        processing_status=p_row["processing_status"],
        overall_review_status=p_row["overall_review_status"],
        original_ocr_text=p_row["original_ocr_text"],
        medicines=medicines,
        is_synthetic_demo=bool(p_row["is_synthetic_demo"]),
        demo_preset_id=p_row["demo_preset_id"],
        ocr_highlights=highlights
    )

@router.post("/upload", response_model=PrescriptionCreateResponse)
async def upload_prescription(
    file: UploadFile = File(...),
    owner_id: str = Form("demo-patient")
):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Please upload JPG, PNG, or PDF."
        )

    # Secure unique filename
    prescription_id = str(uuid.uuid4())
    safe_filename = f"{prescription_id}_{Path(file.filename).name}"
    save_path = UPLOAD_DIR / safe_filename

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

    with open(save_path, "wb") as f:
        f.write(content)

    file_url = f"/static/uploads/{safe_filename}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # Step 1: Run OCR
    ocr_result = run_vision_ocr(save_path)

    # Step 2: Gemini or Clinical Structuring
    medicines, overall_status, ai_provider = structure_prescription(ocr_result.raw_text)

    # Step 3: Persist to DB
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO prescriptions (
        id, owner_id, filename, file_url, upload_timestamp,
        processing_status, overall_review_status, original_ocr_text,
        is_synthetic_demo, demo_preset_id, ocr_highlights_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?)
    """, (
        prescription_id,
        owner_id,
        file.filename,
        file_url,
        now_iso,
        "needs_review",
        overall_status,
        ocr_result.raw_text,
        json.dumps(ocr_result.highlights)
    ))

    for m in medicines:
        cursor.execute("""
        INSERT INTO medication_entries (
            id, prescription_id, name_as_written, strength_as_written,
            instructions_as_written, frequency_as_written, timing_as_written,
            duration_as_written, prescribed_date, source_text_json,
            source_locations_json, uncertain_fields_json, uncertainty_reasons_json,
            review_status, user_corrections_json, verification_checklist_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            m.id,
            prescription_id,
            m.name_as_written,
            m.strength_as_written,
            m.instructions_as_written,
            m.frequency_as_written,
            m.timing_as_written,
            m.duration_as_written,
            m.prescribed_date,
            json.dumps(m.source_text),
            json.dumps(m.source_locations),
            json.dumps(m.uncertain_fields),
            json.dumps(m.uncertainty_reasons),
            m.review_status,
            json.dumps(m.user_corrections),
            json.dumps(m.verification_checklist)
        ))

    conn.commit()
    conn.close()

    log_audit(
        action="PRESCRIPTION_UPLOADED_AND_STRUCTURED",
        user_id=owner_id,
        user_role="patient",
        target_type="prescription",
        target_id=prescription_id,
        details={
            "filename": file.filename,
            "ocr_provider": ocr_result.provider,
            "ai_provider": ai_provider,
            "medicines_extracted": len(medicines),
            "overall_review_status": overall_status
        }
    )

    return PrescriptionCreateResponse(
        id=prescription_id,
        filename=file.filename,
        file_url=file_url,
        upload_timestamp=now_iso,
        processing_status="needs_review",
        overall_review_status=overall_status,
        original_ocr_text=ocr_result.raw_text,
        medicines=medicines,
        is_synthetic_demo=False,
        demo_preset_id=None,
        ocr_highlights=[SourceHighlight(**h) for h in ocr_result.highlights]
    )

@router.post("/preset/{preset_id}", response_model=PrescriptionCreateResponse)
def load_preset_prescription(preset_id: str, owner_id: str = "demo-patient"):
    if preset_id not in SAMPLE_PRESETS:
        raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' not found.")

    preset = SAMPLE_PRESETS[preset_id]
    filepath = SAMPLES_DIR / preset["filename"]
    file_url = f"/static/samples/{preset['filename']}"
    now_iso = datetime.now(timezone.utc).isoformat()

    prescription_id = str(uuid.uuid4())
    ocr_result = run_vision_ocr(filepath, preset_id=preset_id)
    medicines, overall_status, ai_provider = structure_prescription(ocr_result.raw_text, preset_id=preset_id)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO prescriptions (
        id, owner_id, filename, file_url, upload_timestamp,
        processing_status, overall_review_status, original_ocr_text,
        is_synthetic_demo, demo_preset_id, ocr_highlights_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    """, (
        prescription_id,
        owner_id,
        preset["filename"],
        file_url,
        now_iso,
        "needs_review",
        overall_status,
        ocr_result.raw_text,
        preset_id,
        json.dumps(ocr_result.highlights)
    ))

    for m in medicines:
        # Give each instance unique IDs so users can manipulate multiple presets
        m_id = f"med-{uuid.uuid4().hex[:8]}"
        m.id = m_id
        cursor.execute("""
        INSERT INTO medication_entries (
            id, prescription_id, name_as_written, strength_as_written,
            instructions_as_written, frequency_as_written, timing_as_written,
            duration_as_written, prescribed_date, source_text_json,
            source_locations_json, uncertain_fields_json, uncertainty_reasons_json,
            review_status, user_corrections_json, verification_checklist_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            m_id,
            prescription_id,
            m.name_as_written,
            m.strength_as_written,
            m.instructions_as_written,
            m.frequency_as_written,
            m.timing_as_written,
            m.duration_as_written,
            m.prescribed_date,
            json.dumps(m.source_text),
            json.dumps(m.source_locations),
            json.dumps(m.uncertain_fields),
            json.dumps(m.uncertainty_reasons),
            m.review_status,
            json.dumps(m.user_corrections),
            json.dumps(m.verification_checklist)
        ))

    conn.commit()
    conn.close()

    log_audit(
        action="SYNTHETIC_PRESET_LOADED",
        user_id=owner_id,
        user_role="reviewer",
        target_type="prescription",
        target_id=prescription_id,
        details={
            "preset_id": preset_id,
            "title": preset["title"],
            "uncertain_fields_count": sum(len(m.uncertain_fields) for m in medicines),
            "medicines_count": len(medicines)
        }
    )

    return PrescriptionCreateResponse(
        id=prescription_id,
        filename=preset["filename"],
        file_url=file_url,
        upload_timestamp=now_iso,
        processing_status="needs_review",
        overall_review_status=overall_status,
        original_ocr_text=ocr_result.raw_text,
        medicines=medicines,
        is_synthetic_demo=True,
        demo_preset_id=preset_id,
        ocr_highlights=[SourceHighlight(**h) for h in ocr_result.highlights]
    )
