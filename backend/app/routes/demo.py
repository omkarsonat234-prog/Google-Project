import uuid
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter
from ..models.database import get_connection, log_audit
from ..services.sample_prescriptions import SAMPLE_PRESETS
from ..services.sample_prescriptions import generate_sample_images
from ..services.ocr_service import run_vision_ocr
from ..services.gemini_service import structure_prescription
from ..services.verification_service import verify_and_activate_schedule
from ..models.schemas import VerificationRequest

router = APIRouter(prefix="/api/demo", tags=["demo"])

@router.get("/presets")
def get_presets():
    result = []
    for pid, data in SAMPLE_PRESETS.items():
        result.append({
            "id": data["id"],
            "title": data["title"],
            "category": data["category"],
            "filename": data["filename"],
            "file_url": f"/static/samples/{data['filename']}",
            "description": data["description"],
            "medicines_count": len(data["medicines"]),
            "default_times": data.get("default_times", [])
        })
    return result

@router.post("/seed-full")
def seed_full_demo():
    """
    Seeds a comprehensive hackathon demonstration state:
    1. Clear prescription verified -> active schedule -> today's reminders.
    2. Blurry prescription -> uncertainty flagged -> blocked from schedule.
    3. Missing instruction prescription -> needs review.
    4. Multi-item prescription ready for review.
    5. Authorized caregiver.
    """
    generate_sample_images()
    conn = get_connection()
    cursor = conn.cursor()

    # Clear tables
    for table in ["reminder_events", "medication_schedules", "verification_records", "medication_entries", "prescriptions", "caregiver_authorizations", "audit_logs"]:
        cursor.execute(f"DELETE FROM {table}")
    conn.commit()
    conn.close()

    # 1. Preset Clear -> verified and active schedule with reminders
    clear_data = SAMPLE_PRESETS["sample-clear"]
    p_clear_id = "demo-clear-prescription"
    now_iso = datetime.now(timezone.utc).isoformat()
    today_str = datetime.now().strftime("%Y-%m-%d")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO prescriptions (id, owner_id, filename, file_url, upload_timestamp, processing_status, overall_review_status, original_ocr_text, is_synthetic_demo, demo_preset_id, ocr_highlights_json)
    VALUES (?, 'demo-patient', ?, ?, ?, 'verified', 'verified', ?, 1, 'sample-clear', '[]')
    """, (p_clear_id, clear_data["filename"], f"/static/samples/{clear_data['filename']}", now_iso, clear_data["original_ocr_text"]))

    med_clear_id = "med-demo-clear-1"
    cursor.execute("""
    INSERT INTO medication_entries (
        id, prescription_id, name_as_written, strength_as_written, instructions_as_written,
        frequency_as_written, timing_as_written, duration_as_written, prescribed_date,
        source_text_json, source_locations_json, uncertain_fields_json, uncertainty_reasons_json,
        review_status, user_corrections_json, verification_checklist_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '{}', 'user_reviewed', '{}', '{"name_verified": true, "strength_verified": true, "instructions_verified": true, "timing_verified": true}')
    """, (
        med_clear_id, p_clear_id, "Amoxicillin", "500mg",
        "Take 1 capsule orally every 8 hours with meals for 7 days.",
        "Every 8 hours", "With meals", "7 days", "10/11/2026",
        json.dumps(["Amoxicillin 500mg capsules", "Sig: Take 1 capsule orally every 8 hours with meals for 7 days."]),
        json.dumps({"name_as_written": {"line": 7, "box": [0.42, 0.12, 0.48, 0.55]}})
    ))

    # Schedule
    sched_id = "sched-demo-clear-1"
    cursor.execute("""
    INSERT INTO medication_schedules (
        id, prescription_id, medication_entry_id, owner_id, medicine_name,
        confirmed_instructions, confirmed_schedule_times_json, start_date, end_date,
        status, verification_status, verified_at, verified_by, version, history_json
    ) VALUES (?, ?, ?, 'demo-patient', 'Amoxicillin 500mg', 'Take 1 capsule orally every 8 hours with meals for 7 days.', '["08:00", "14:00", "20:00"]', ?, NULL, 'active', 'user_reviewed', ?, 'Elena Vance (Caregiver)', 1, '[]')
    """, (sched_id, p_clear_id, med_clear_id, today_str, now_iso))

    # Verification Record
    v_id = str(uuid.uuid4())
    cursor.execute("""
    INSERT INTO verification_records (
        id, prescription_id, medication_entry_id, verifier_identity, verifier_role,
        verification_timestamp, fields_reviewed_json, changes_made_json, notes
    ) VALUES (?, ?, ?, 'Elena Vance', 'caregiver', ?, '["name", "dosage", "instructions", "timing"]', '{}', 'Full review completed. Verified with physical bottle instructions.')
    """, (v_id, p_clear_id, med_clear_id, now_iso))

    # Reminders: 08:00 acknowledged & taken, 14:00 acknowledged only, 20:00 scheduled
    cursor.execute("""
    INSERT INTO reminder_events (
        id, schedule_id, owner_id, medicine_name, confirmed_instructions,
        scheduled_time, date, notification_status, acknowledged, acknowledged_at,
        intake_reported, intake_reported_at, intake_notes
    ) VALUES ('rem-demo-1', ?, 'demo-patient', 'Amoxicillin 500mg', 'Take 1 capsule orally every 8 hours with meals', '08:00', ?, 'delivered', 1, ?, 1, ?, 'Taken with breakfast')
    """, (sched_id, today_str, now_iso, now_iso))

    cursor.execute("""
    INSERT INTO reminder_events (
        id, schedule_id, owner_id, medicine_name, confirmed_instructions,
        scheduled_time, date, notification_status, acknowledged, acknowledged_at,
        intake_reported, intake_reported_at, intake_notes
    ) VALUES ('rem-demo-2', ?, 'demo-patient', 'Amoxicillin 500mg', 'Take 1 capsule orally every 8 hours with meals', '14:00', ?, 'delivered', 1, ?, 0, NULL, NULL)
    """, (sched_id, today_str, now_iso))

    cursor.execute("""
    INSERT INTO reminder_events (
        id, schedule_id, owner_id, medicine_name, confirmed_instructions,
        scheduled_time, date, notification_status, acknowledged, acknowledged_at,
        intake_reported, intake_reported_at, intake_notes
    ) VALUES ('rem-demo-3', ?, 'demo-patient', 'Amoxicillin 500mg', 'Take 1 capsule orally every 8 hours with meals', '20:00', ?, 'scheduled', 0, NULL, 0, NULL, NULL)
    """, (sched_id, today_str))

    # 2. Preset Blurry -> Uncertainty Flagged
    blurry_data = SAMPLE_PRESETS["sample-blurry"]
    p_blurry_id = "demo-blurry-prescription"
    cursor.execute("""
    INSERT INTO prescriptions (id, owner_id, filename, file_url, upload_timestamp, processing_status, overall_review_status, original_ocr_text, is_synthetic_demo, demo_preset_id, ocr_highlights_json)
    VALUES (?, 'demo-patient', ?, ?, ?, 'needs_review', 'uncertain', ?, 1, 'sample-blurry', '[]')
    """, (p_blurry_id, blurry_data["filename"], f"/static/samples/{blurry_data['filename']}", now_iso, blurry_data["original_ocr_text"]))

    med_blurry = blurry_data["medicines"][0]
    cursor.execute("""
    INSERT INTO medication_entries (
        id, prescription_id, name_as_written, strength_as_written, instructions_as_written,
        frequency_as_written, timing_as_written, duration_as_written, prescribed_date,
        source_text_json, source_locations_json, uncertain_fields_json, uncertainty_reasons_json,
        review_status, user_corrections_json, verification_checklist_json
    ) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, 'uncertain', '{}', '{"name_verified": true}')
    """, (
        "med-demo-blurry-1", p_blurry_id, med_blurry["name_as_written"], med_blurry["strength_as_written"],
        med_blurry["instructions_as_written"], med_blurry["prescribed_date"],
        json.dumps(med_blurry["source_text"]), json.dumps(med_blurry["source_locations"]),
        json.dumps(med_blurry["uncertain_fields"]), json.dumps(med_blurry["uncertainty_reasons"])
    ))

    # 3. Preset Missing Instructions
    missing_data = SAMPLE_PRESETS["sample-missing"]
    p_missing_id = "demo-missing-prescription"
    cursor.execute("""
    INSERT INTO prescriptions (id, owner_id, filename, file_url, upload_timestamp, processing_status, overall_review_status, original_ocr_text, is_synthetic_demo, demo_preset_id, ocr_highlights_json)
    VALUES (?, 'demo-patient', ?, ?, ?, 'needs_review', 'needs_review', ?, 1, 'sample-missing', '[]')
    """, (p_missing_id, missing_data["filename"], f"/static/samples/{missing_data['filename']}", now_iso, missing_data["original_ocr_text"]))

    med_missing = missing_data["medicines"][0]
    cursor.execute("""
    INSERT INTO medication_entries (
        id, prescription_id, name_as_written, strength_as_written, instructions_as_written,
        frequency_as_written, timing_as_written, duration_as_written, prescribed_date,
        source_text_json, source_locations_json, uncertain_fields_json, uncertainty_reasons_json,
        review_status, user_corrections_json, verification_checklist_json
    ) VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, 'needs_review', '{}', '{}')
    """, (
        "med-demo-missing-1", p_missing_id, med_missing["name_as_written"], med_missing["strength_as_written"],
        med_missing["instructions_as_written"], med_missing["prescribed_date"],
        json.dumps(med_missing["source_text"]), json.dumps(med_missing["source_locations"]),
        json.dumps(med_missing["uncertain_fields"]), json.dumps(med_missing["uncertainty_reasons"])
    ))

    # Caregiver Authorization
    cursor.execute("""
    INSERT INTO caregiver_authorizations (id, patient_id, caregiver_id, caregiver_name, relationship, phone, email, notes, status, created_at)
    VALUES ('cg-auth-demo', 'demo-patient', 'cg-100', 'Elena Vance', 'Daughter & Primary Caregiver', '+1 (555) 234-5678', 'elena.vance@familycare.org', 'Healthcare Proxy & Power of Attorney', 'authorized', ?)
    """, (now_iso,))

    conn.commit()
    conn.close()

    log_audit("DEMO_FULL_DATA_SEEDED", "system", "admin", "demo", "all", {"status": "seeded_successfully"})

    return {
        "status": "success",
        "message": "Full hackathon demonstration dataset seeded successfully.",
        "verified_prescriptions": 1,
        "uncertain_flagged_prescriptions": 2,
        "active_schedules": 1,
        "today_reminders": 3
    }

@router.post("/reset")
def reset_database():
    conn = get_connection()
    cursor = conn.cursor()
    for table in ["reminder_events", "medication_schedules", "verification_records", "medication_entries", "prescriptions", "caregiver_authorizations", "audit_logs"]:
        cursor.execute(f"DELETE FROM {table}")
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Database reset to clean state."}
