import pytest
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.models.database import init_db, get_connection

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    # Clean tables before test
    for table in ["reminder_events", "medication_schedules", "verification_records", "medication_entries", "prescriptions", "caregiver_authorizations", "audit_logs"]:
        cursor.execute(f"DELETE FROM {table}")
    conn.commit()
    conn.close()
    yield

client = TestClient(app)

def test_system_status_and_stats():
    res = client.get("/api/system/status")
    assert res.status_code == 200
    data = res.json()
    assert "ocr_provider" in data
    assert "ai_provider" in data
    assert data["database_connected"] is True

    stats_res = client.get("/api/system/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["prescriptions_count"] == 0

def test_clear_prescription_loading_and_source_linking():
    res = client.post("/api/prescriptions/preset/sample-clear")
    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "sample_clear_amoxicillin.png"
    assert data["overall_review_status"] == "ready_for_verification"
    assert len(data["medicines"]) == 1
    med = data["medicines"][0]
    assert med["name_as_written"] == "Amoxicillin"
    assert med["strength_as_written"] == "500mg"
    assert len(med["uncertain_fields"]) == 0
    assert len(med["source_text"]) > 0

def test_uncertainty_flagging_on_blurry_prescription():
    res = client.post("/api/prescriptions/preset/sample-blurry")
    assert res.status_code == 200
    data = res.json()
    assert data["overall_review_status"] in ["uncertain", "needs_review"]
    med = data["medicines"][0]
    assert len(med["uncertain_fields"]) > 0
    assert "instructions_as_written" in med["uncertain_fields"]
    assert "instructions_as_written" in med["uncertainty_reasons"]

def test_missing_instructions_flagged():
    res = client.post("/api/prescriptions/preset/sample-missing")
    assert res.status_code == 200
    data = res.json()
    med = data["medicines"][0]
    assert "frequency_as_written" in med["uncertain_fields"]
    assert med["review_status"] == "needs_review"

def test_verification_gate_blocks_uncertain_activation():
    # Load blurry prescription
    p_res = client.post("/api/prescriptions/preset/sample-blurry")
    med_id = p_res.json()["medicines"][0]["id"]

    # Attempt to activate schedule directly without resolving uncertainty -> MUST BE BLOCKED
    verify_res = client.post(f"/api/medications/{med_id}/verify", json={
        "verifier_identity": "John Doe",
        "verifier_role": "patient",
        "confirmed_schedule_times": ["08:00"],
        "override_uncertainty": False
    })
    assert verify_res.status_code == 422
    err_detail = verify_res.json()["detail"]
    assert err_detail["error_type"] == "VERIFICATION_GATE_BLOCKED"

def test_verification_gate_success_after_corrections():
    # Load blurry prescription
    p_res = client.post("/api/prescriptions/preset/sample-blurry")
    med_id = p_res.json()["medicines"][0]["id"]

    # Provide explicit correction verified with pharmacy
    corr_res = client.put(f"/api/medications/{med_id}/corrections", json={
        "corrections": {
            "instructions_as_written": "Take 1 tablet twice daily with meals (verified with Dr. Martinez)",
            "frequency_as_written": "Twice daily",
            "timing_as_written": "With breakfast and dinner"
        },
        "checklist": {
            "instructions_verified": True,
            "timing_verified": True,
            "dosage_verified": True
        },
        "notes": "Spoke directly with Valley Endocrine clinic."
    })
    assert corr_res.status_code == 200

    # Now verify and activate schedule
    verify_res = client.post(f"/api/medications/{med_id}/verify", json={
        "verifier_identity": "John Doe",
        "verifier_role": "caregiver",
        "confirmed_schedule_times": ["08:00", "19:00"],
        "override_uncertainty": False
    })
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["status"] == "activated"
    assert v_data["schedule"]["status"] == "active"
    assert v_data["schedule"]["verification_status"] == "user_reviewed"
    assert len(v_data["reminders"]) == 2

def test_reminder_acknowledgement_distinct_from_intake():
    # Create verified schedule from clear preset
    p_res = client.post("/api/prescriptions/preset/sample-clear")
    med_id = p_res.json()["medicines"][0]["id"]

    verify_res = client.post(f"/api/medications/{med_id}/verify", json={
        "verifier_identity": "Jane Doe",
        "verifier_role": "patient",
        "confirmed_schedule_times": ["08:00", "20:00"]
    })
    reminders = verify_res.json()["reminders"]
    rem_id = reminders[0]["id"]

    # 1. Acknowledge reminder
    ack_res = client.post(f"/api/reminders/{rem_id}/acknowledge", json={
        "user_identity": "Jane Doe",
        "notes": "Saw notification"
    })
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["acknowledged"] is True
    assert ack_data["intake_reported"] is False  # CRITICAL: acknowledging does NOT mark as taken!

    # 2. Separately report intake
    intake_res = client.post(f"/api/reminders/{rem_id}/intake", json={
        "user_identity": "Jane Doe",
        "notes": "Swallowed with glass of water and lunch"
    })
    assert intake_res.status_code == 200
    intake_data = intake_res.json()
    assert intake_data["acknowledged"] is True
    assert intake_data["intake_reported"] is True
    assert intake_data["intake_notes"] == "Swallowed with glass of water and lunch"

def test_schedule_versioning_audit():
    p_res = client.post("/api/prescriptions/preset/sample-clear")
    med_id = p_res.json()["medicines"][0]["id"]
    verify_res = client.post(f"/api/medications/{med_id}/verify", json={
        "verifier_identity": "Jane Doe",
        "verifier_role": "patient",
        "confirmed_schedule_times": ["08:00"]
    })
    sched_id = verify_res.json()["schedule"]["id"]

    # Update schedule
    update_res = client.put(f"/api/schedules/{sched_id}", json={
        "confirmed_schedule_times": ["09:00"],
        "edit_reason": "Adjusted for shifted breakfast routine",
        "editor_identity": "Jane Doe"
    })
    assert update_res.status_code == 200
    u_data = update_res.json()
    assert u_data["version"] == 2
    assert len(u_data["history"]) >= 1

def test_caregiver_authorization_workflow():
    auth_res = client.post("/api/caregiver/authorize", json={
        "caregiver_name": "Elena Vance",
        "relationship": "Daughter",
        "patient_id": "demo-patient",
        "phone": "+1 (555) 234-5678",
        "email": "elena@familycare.org"
    })
    assert auth_res.status_code == 200
    auth_id = auth_res.json()["id"]

    list_res = client.get("/api/caregiver/authorizations?patient_id=demo-patient")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Update caregiver information
    update_res = client.put(f"/api/caregiver/update/{auth_id}", json={
        "caregiver_name": "Sarah Vance",
        "relationship": "Sister & Primary Caregiver",
        "phone": "+1 (555) 999-8877",
        "email": "sarah.vance@familycare.org",
        "notes": "Updated Primary Healthcare Proxy"
    })
    assert update_res.status_code == 200
    u_data = update_res.json()
    assert u_data["caregiver_name"] == "Sarah Vance"
    assert u_data["relationship"] == "Sister & Primary Caregiver"
    assert u_data["phone"] == "+1 (555) 999-8877"

    # Revoke
    revoke_res = client.post(f"/api/caregiver/revoke/{auth_id}?patient_id=demo-patient")
    assert revoke_res.status_code == 200

def test_caregiver_and_pharmacist_login_disabled():
    res = client.post("/api/auth/login", json={
        "email": "caregiver@medbridge.app",
        "password": "demo1234"
    })
    assert res.status_code == 403
    assert "disabled" in res.json()["detail"].lower()

    res_pharm = client.post("/api/auth/login", json={
        "email": "pharmacist@medbridge.app",
        "password": "demo1234"
    })
    assert res_pharm.status_code == 403
    assert "disabled" in res_pharm.json()["detail"].lower()

def test_audit_log_records_events():
    # Seed full demo
    seed_res = client.post("/api/demo/seed-full")
    assert seed_res.status_code == 200

    audit_res = client.get("/api/audit/logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    actions = [l["action"] for l in logs]
    assert "DEMO_FULL_DATA_SEEDED" in actions
