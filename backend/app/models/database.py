import sqlite3
import json
import uuid
import hashlib
import secrets
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from ..config import DB_PATH

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prescriptions (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        file_url TEXT NOT NULL,
        upload_timestamp TEXT NOT NULL,
        processing_status TEXT NOT NULL,
        overall_review_status TEXT NOT NULL,
        original_ocr_text TEXT NOT NULL,
        is_synthetic_demo INTEGER DEFAULT 0,
        demo_preset_id TEXT,
        ocr_highlights_json TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medication_entries (
        id TEXT PRIMARY KEY,
        prescription_id TEXT NOT NULL,
        name_as_written TEXT NOT NULL,
        strength_as_written TEXT,
        instructions_as_written TEXT,
        frequency_as_written TEXT,
        timing_as_written TEXT,
        duration_as_written TEXT,
        prescribed_date TEXT,
        source_text_json TEXT,
        source_locations_json TEXT,
        uncertain_fields_json TEXT,
        uncertainty_reasons_json TEXT,
        review_status TEXT NOT NULL,
        user_corrections_json TEXT,
        verification_checklist_json TEXT,
        basic_info_json TEXT,
        FOREIGN KEY (prescription_id) REFERENCES prescriptions (id)
    );
    """)

    # Safe migration: ensure basic_info_json exists if table already created
    try:
        cursor.execute("ALTER TABLE medication_entries ADD COLUMN basic_info_json TEXT;")
    except Exception:
        pass

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verification_records (
        id TEXT PRIMARY KEY,
        prescription_id TEXT NOT NULL,
        medication_entry_id TEXT NOT NULL,
        verifier_identity TEXT NOT NULL,
        verifier_role TEXT NOT NULL,
        verification_timestamp TEXT NOT NULL,
        fields_reviewed_json TEXT,
        changes_made_json TEXT,
        notes TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medication_schedules (
        id TEXT PRIMARY KEY,
        prescription_id TEXT NOT NULL,
        medication_entry_id TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        medicine_name TEXT NOT NULL,
        confirmed_instructions TEXT NOT NULL,
        confirmed_schedule_times_json TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        status TEXT NOT NULL,
        verification_status TEXT NOT NULL,
        verified_at TEXT NOT NULL,
        verified_by TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        history_json TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reminder_events (
        id TEXT PRIMARY KEY,
        schedule_id TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        medicine_name TEXT NOT NULL,
        confirmed_instructions TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        date TEXT NOT NULL,
        notification_status TEXT NOT NULL,
        acknowledged INTEGER DEFAULT 0,
        acknowledged_at TEXT,
        intake_reported INTEGER DEFAULT 0,
        intake_reported_at TEXT,
        intake_notes TEXT,
        FOREIGN KEY (schedule_id) REFERENCES medication_schedules (id)
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS caregiver_authorizations (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        caregiver_id TEXT NOT NULL,
        caregiver_name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        notes TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        weight REAL,
        phone_number TEXT,
        birth_date TEXT,
        emergency_contact TEXT,
        medical_conditions TEXT,
        allergies TEXT,
        created_at TEXT NOT NULL,
        reset_code TEXT,
        reset_code_expires_at TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        action TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_role TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        details_json TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctor_followups (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        doctor_id TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        department TEXT NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        location_room TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL, -- 'scheduled', 'completed', 'rescheduled', 'urgent_triage'
        clinical_notes TEXT,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ipd_records (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        ipd_number TEXT NOT NULL,
        admission_date TEXT NOT NULL,
        discharge_date TEXT NOT NULL,
        ward_bed TEXT NOT NULL,
        admitting_doctor TEXT NOT NULL,
        discharging_doctor TEXT NOT NULL,
        diagnosis TEXT NOT NULL,
        surgical_procedure TEXT,
        inpatient_course TEXT NOT NULL,
        discharge_condition TEXT NOT NULL,
        vitals_json TEXT NOT NULL,
        ipd_medicines_json TEXT NOT NULL,
        opd_transition_medicines_json TEXT NOT NULL,
        discharge_instructions_json TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blood_sugar_logs (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        reading_type TEXT NOT NULL, -- 'fasting_preprandial', 'postprandial_2hr', 'random', 'bedtime'
        glucose_mg_dl REAL NOT NULL,
        measured_at TEXT NOT NULL,
        meal_context TEXT NOT NULL, -- 'before_breakfast', 'after_breakfast', 'before_lunch', 'after_lunch', 'before_dinner', 'after_dinner'
        clinical_flag TEXT NOT NULL, -- 'hypo', 'optimal', 'elevated', 'hyper'
        suggested_steps TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wound_dressings (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        wound_type TEXT NOT NULL, -- 'trauma_laceration', 'post_op_surgical', 'abrasion', 'burn_dressing'
        anatomical_site TEXT NOT NULL,
        dressing_frequency_hours INTEGER NOT NULL,
        last_dressing_at TEXT,
        next_dressing_due TEXT NOT NULL,
        aseptic_protocol_json TEXT NOT NULL,
        infection_signs_monitored TEXT NOT NULL,
        suture_count INTEGER DEFAULT 0,
        suture_removal_date TEXT,
        status TEXT NOT NULL, -- 'active_care', 'healing_well', 'urgent_review', 'healed'
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medicines_formulary (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        generic_name TEXT NOT NULL,
        category TEXT NOT NULL,
        care_setting TEXT NOT NULL, -- 'OPD', 'IPD', 'BOTH'
        route TEXT NOT NULL, -- 'Oral', 'Subcutaneous Injection', 'Intramuscular Injection', 'Intravenous Infusion', 'Topical', 'Inhalation'
        dosage_forms TEXT NOT NULL,
        standard_dosage TEXT NOT NULL,
        syringe_specs_json TEXT, -- capacity_ml, gauge, angle_deg, needle_length_in
        meal_timing_json TEXT, -- timing_rule, preprandial_mins, postprandial_hours, food_instructions
        sugar_impact_notes TEXT,
        indications TEXT NOT NULL,
        contraindications TEXT NOT NULL,
        adverse_effects TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patient_medical_history (
        patient_id TEXT PRIMARY KEY,
        chronic_conditions_json TEXT NOT NULL,
        past_surgeries_json TEXT NOT NULL,
        drug_allergies_json TEXT NOT NULL,
        family_history_json TEXT NOT NULL,
        immunizations_json TEXT NOT NULL,
        blood_group TEXT,
        last_updated TEXT NOT NULL
    );
    """)

    # Seed initial demo accounts if table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        now_iso = datetime.now(timezone.utc).isoformat()
        demo_accounts = [
            ("user-demo-patient", "patient@medbridge.app", "demo1234", "Johnathan Doe", "patient", 42, "Male", 74.5, "+1-555-0192", "1984-06-12", "Jane Doe (+1-555-0199)", "Mild Hypertension", "Penicillin allergy flagged for review"),
            ("user-demo-caregiver", "caregiver@medbridge.app", "demo1234", "Elena Vance", "caregiver", 38, "Female", 62.0, "+1-555-0193", "1988-03-24", "Robert Vance (+1-555-0198)", "None", "None"),
            ("user-demo-physician", "physician@medbridge.app", "demo1234", "Dr. Sarah Jenkins", "physician", 45, "Female", 65.0, "+1-555-0194", "1981-11-09", "Clinic Dispatch (+1-555-0100)", "N/A (Attending MD)", "None"),
            ("user-demo-pharmacist", "pharmacist@medbridge.app", "demo1234", "Dr. Michael Chen", "pharmacist", 40, "Male", 76.0, "+1-555-0195", "1986-08-15", "Pharmacy Dispatch (+1-555-0101)", "N/A (Clinical PharmD)", "None"),
        ]
        for uid, email, pwd, name, role, age, gender, weight, phone, bdate, emerg, conds, aller in demo_accounts:
            salt = "demoseed12345678"
            key = hashlib.pbkdf2_hmac('sha256', pwd.encode('utf-8'), salt.encode('utf-8'), 100000)
            pwd_hash = f"{salt}:{key.hex()}"
            cursor.execute("""
            INSERT INTO users (id, email, password_hash, full_name, role, age, gender, weight, phone_number, birth_date, emergency_contact, medical_conditions, allergies, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (uid, email, pwd_hash, name, role, age, gender, weight, phone, bdate, emerg, conds, aller, now_iso))

    # Safe migrations for users table
    for col_def in [
        "is_verified INTEGER DEFAULT 0",
        "medical_license TEXT",
        "specialty TEXT",
        "hospital_affiliation TEXT",
        "face_id_verified INTEGER DEFAULT 0",
        "google_id TEXT",
        "photo_url TEXT",
        "auth_provider TEXT DEFAULT 'password'"
    ]:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_def};")
        except Exception:
            pass

    # Safe migrations for caregiver_authorizations table
    for col_def in [
        "phone TEXT",
        "email TEXT",
        "notes TEXT"
    ]:
        try:
            cursor.execute(f"ALTER TABLE caregiver_authorizations ADD COLUMN {col_def};")
        except Exception:
            pass

    # Ensure demo physician and pharmacist are verified with active credentials
    try:
        cursor.execute("""
        UPDATE users 
        SET is_verified = 1, 
            medical_license = 'NPI-994827104',
            specialty = 'Internal Medicine & Critical Care',
            hospital_affiliation = 'Metro General Hospital & Trauma Center',
            face_id_verified = 1
        WHERE email = 'physician@medbridge.app';
        """)
        cursor.execute("""
        UPDATE users 
        SET is_verified = 1, 
            medical_license = 'RPh-782190',
            specialty = 'Clinical Pharmacotherapy',
            hospital_affiliation = 'Metro Clinical Dispensary',
            face_id_verified = 1
        WHERE email = 'pharmacist@medbridge.app';
        """)
    except Exception:
        pass

    conn.commit()
    conn.close()

def log_audit(action: str, user_id: str, user_role: str, target_type: str, target_id: str, details: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    log_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO audit_logs (id, timestamp, action, user_id, user_role, target_type, target_id, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (log_id, now_iso, action, user_id, user_role, target_type, target_id, json.dumps(details)))
    conn.commit()
    conn.close()
    return log_id

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}:{key.hex()}"

def verify_password(stored_hash: str, provided_password: str) -> bool:
    if ":" not in stored_hash:
        return stored_hash == provided_password
    salt, key_hex = stored_hash.split(":", 1)
    new_key = hashlib.pbkdf2_hmac('sha256', provided_password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return new_key.hex() == key_hex

def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    user_id = f"user-{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    pwd_hash = hash_password(user_data['password'])

    cursor.execute("""
    INSERT INTO users (
        id, email, password_hash, full_name, role, age, gender, weight,
        phone_number, birth_date, emergency_contact, medical_conditions, allergies, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        user_data['email'].strip().lower(),
        pwd_hash,
        user_data['full_name'].strip(),
        user_data['role'],
        user_data.get('age'),
        user_data.get('gender'),
        user_data.get('weight'),
        user_data.get('phone_number'),
        user_data.get('birth_date'),
        user_data.get('emergency_contact'),
        user_data.get('medical_conditions'),
        user_data.get('allergies'),
        now_iso
    ))
    conn.commit()
    conn.close()
    return get_user_by_id(user_id)

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d.pop('password_hash', None)
    d.pop('reset_code', None)
    d.pop('reset_code_expires_at', None)
    return d

def set_password_reset_code(email: str, code: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("UPDATE users SET reset_code = ?, reset_code_expires_at = ? WHERE email = ?", (code, now_iso, email.strip().lower()))
    changed = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return changed

def verify_and_reset_password(email: str, code: str, new_password: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT reset_code FROM users WHERE email = ?", (email.strip().lower(),))
    row = cursor.fetchone()
    if not row or not row['reset_code'] or row['reset_code'] != code.strip():
        conn.close()
        return False
    
    new_hash = hash_password(new_password)
    cursor.execute("UPDATE users SET password_hash = ?, reset_code = NULL, reset_code_expires_at = NULL WHERE email = ?", (new_hash, email.strip().lower()))
    conn.commit()
    conn.close()
    return True
