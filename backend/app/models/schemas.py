from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SourceHighlight(BaseModel):
    text: str
    box: Optional[List[float]] = None  # [ymin, xmin, ymax, xmax] normalized 0-1
    line_number: Optional[int] = None
    field_key: Optional[str] = None

class MedicineBasicInfo(BaseModel):
    purpose: str
    category: str
    food_relation: str
    safety_tips: List[str] = Field(default_factory=list)
    common_side_effects: List[str] = Field(default_factory=list)
    when_to_call_doctor: str
    disclaimer: str = "Informational clinical overview. Always follow your physician's exact prescription."

class MedicineExtracted(BaseModel):
    id: str
    name_as_written: str
    strength_as_written: Optional[str] = None
    instructions_as_written: Optional[str] = None
    frequency_as_written: Optional[str] = None
    timing_as_written: Optional[str] = None
    duration_as_written: Optional[str] = None
    prescribed_date: Optional[str] = None
    source_text: List[str] = Field(default_factory=list)
    source_locations: Dict[str, Any] = Field(default_factory=dict)
    uncertain_fields: List[str] = Field(default_factory=list)
    uncertainty_reasons: Dict[str, str] = Field(default_factory=dict)
    review_status: str = "needs_review"  # needs_review, uncertain, ready_for_verification, user_reviewed, clinical_verified
    user_corrections: Dict[str, str] = Field(default_factory=dict)
    verification_checklist: Dict[str, bool] = Field(default_factory=dict)
    basic_info: Optional[MedicineBasicInfo] = None

class PrescriptionCreateResponse(BaseModel):
    id: str
    filename: str
    file_url: str
    upload_timestamp: str
    processing_status: str
    overall_review_status: str
    original_ocr_text: str
    medicines: List[MedicineExtracted]
    is_synthetic_demo: bool = False
    demo_preset_id: Optional[str] = None
    ocr_highlights: List[SourceHighlight] = Field(default_factory=list)

class MedicationCorrectionRequest(BaseModel):
    corrections: Dict[str, str]  # e.g. {"instructions_as_written": "Take 1 tablet every 8 hours with food"}
    checklist: Dict[str, bool] = Field(default_factory=dict)
    notes: Optional[str] = None

class VerificationRequest(BaseModel):
    verifier_identity: str = "Caregiver / Patient"
    verifier_role: str = "user_reviewer"  # "patient", "caregiver", "pharmacist", "physician"
    confirmed_schedule_times: List[str] = Field(default_factory=list)  # e.g. ["08:00", "20:00"]
    confirmed_start_date: Optional[str] = None
    confirmed_end_date: Optional[str] = None
    notes: Optional[str] = None
    override_uncertainty: bool = False

class VerificationRecord(BaseModel):
    id: str
    prescription_id: str
    medication_entry_id: str
    verifier_identity: str
    verifier_role: str
    verification_timestamp: str
    fields_reviewed: List[str]
    changes_made: Dict[str, Any]
    notes: Optional[str] = None

class MedicationSchedule(BaseModel):
    id: str
    prescription_id: str
    medication_entry_id: str
    owner_id: str = "demo-patient"
    medicine_name: str
    confirmed_instructions: str
    confirmed_schedule_times: List[str]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str = "active"  # "active", "paused", "completed", "unverified_blocked"
    verification_status: str  # "user_reviewed" or "clinical_verified"
    verified_at: str
    verified_by: str
    version: int = 1
    history: List[Dict[str, Any]] = Field(default_factory=list)

class ScheduleUpdateRequest(BaseModel):
    confirmed_instructions: Optional[str] = None
    confirmed_schedule_times: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    edit_reason: str
    editor_identity: str = "Patient / Caregiver"

class ReminderEvent(BaseModel):
    id: str
    schedule_id: str
    owner_id: str = "demo-patient"
    medicine_name: str
    confirmed_instructions: str
    scheduled_time: str  # "08:00"
    date: str  # "YYYY-MM-DD"
    notification_status: str = "scheduled"  # "scheduled", "delivered", "dismissed"
    acknowledged: bool = False
    acknowledged_at: Optional[str] = None
    intake_reported: bool = False
    intake_reported_at: Optional[str] = None
    intake_notes: Optional[str] = None

class ReminderAcknowledgeRequest(BaseModel):
    user_identity: str = "Patient"
    notes: Optional[str] = None

class ReminderIntakeRequest(BaseModel):
    user_identity: str = "Patient"
    notes: Optional[str] = None
    taken_timestamp: Optional[str] = None

class CustomReminderCreateRequest(BaseModel):
    medicine_name: str
    confirmed_instructions: str
    scheduled_time: str  # "08:30"
    date: str  # "YYYY-MM-DD"
    owner_id: str = "demo-patient"
    notes: Optional[str] = None

class ReminderUpdateRequest(BaseModel):
    scheduled_time: Optional[str] = None
    date: Optional[str] = None
    medicine_name: Optional[str] = None
    confirmed_instructions: Optional[str] = None
    intake_notes: Optional[str] = None

class AutoRegisterResponse(BaseModel):
    prescription: PrescriptionCreateResponse
    schedules: List[MedicationSchedule] = Field(default_factory=list)
    reminders: List[ReminderEvent] = Field(default_factory=list)
    registered_count: int = 0
    message: str = "Medication registered and reminder times set automatically."

class CaregiverAuthRequest(BaseModel):
    caregiver_name: str
    relationship: str
    patient_id: str = "demo-patient"

class CaregiverAuthorization(BaseModel):
    id: str
    patient_id: str
    caregiver_id: str
    caregiver_name: str
    relationship: str
    status: str
    created_at: str

class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    action: str
    user_id: str
    user_role: str
    target_type: str
    target_id: str
    details: Dict[str, Any]

class DashboardStats(BaseModel):
    prescriptions_count: int
    awaiting_verification_count: int
    verified_schedules_count: int
    today_reminders_count: int
    reminders_acknowledged_count: int
    reminders_intake_reported_count: int
