export type ReviewStatus = 
  | 'needs_review' 
  | 'uncertain' 
  | 'ready_for_verification' 
  | 'user_reviewed' 
  | 'clinical_verified' 
  | 'rejected';

export type ScheduleStatus = 'active' | 'paused' | 'completed' | 'unverified_blocked';

export type UserRole = 'patient' | 'caregiver' | 'pharmacist' | 'physician';

export interface SourceHighlight {
  text: string;
  box?: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  line_number?: number;
  field_key?: string;
}

export interface MedicineExtracted {
  id: string;
  name_as_written: string;
  strength_as_written?: string | null;
  instructions_as_written?: string | null;
  frequency_as_written?: string | null;
  timing_as_written?: string | null;
  duration_as_written?: string | null;
  prescribed_date?: string | null;
  source_text: string[];
  source_locations: Record<string, any>;
  uncertain_fields: string[];
  uncertainty_reasons: Record<string, string>;
  review_status: ReviewStatus;
  user_corrections: Record<string, string>;
  verification_checklist: Record<string, boolean>;
}

export interface Prescription {
  id: string;
  filename: string;
  file_url: string;
  upload_timestamp: string;
  processing_status: string;
  overall_review_status: ReviewStatus;
  original_ocr_text: string;
  medicines: MedicineExtracted[];
  is_synthetic_demo: boolean;
  demo_preset_id?: string | null;
  ocr_highlights: SourceHighlight[];
}

export interface MedicationSchedule {
  id: string;
  prescription_id: string;
  medication_entry_id: string;
  owner_id: string;
  medicine_name: string;
  confirmed_instructions: string;
  confirmed_schedule_times: string[];
  start_date?: string | null;
  end_date?: string | null;
  status: ScheduleStatus;
  verification_status: string; // 'user_reviewed' | 'clinical_verified'
  verified_at: string;
  verified_by: string;
  version: number;
  history: Array<{
    version: number;
    timestamp?: string;
    archived_at?: string;
    editor?: string;
    reason?: string;
    event?: string;
    previous_instructions?: string;
    previous_times?: string[];
    previous_status?: string;
  }>;
}

export interface ReminderEvent {
  id: string;
  schedule_id: string;
  owner_id: string;
  medicine_name: string;
  confirmed_instructions: string;
  scheduled_time: string;
  date: string;
  notification_status: 'scheduled' | 'delivered' | 'dismissed';
  acknowledged: boolean;
  acknowledged_at?: string | null;
  intake_reported: boolean;
  intake_reported_at?: string | null;
  intake_notes?: string | null;
}

export interface CaregiverAuthorization {
  id: string;
  patient_id: string;
  caregiver_id: string;
  caregiver_name: string;
  relationship: string;
  status: 'authorized' | 'revoked';
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  user_id: string;
  user_role: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
}

export interface DashboardStats {
  prescriptions_count: number;
  awaiting_verification_count: number;
  verified_schedules_count: number;
  today_reminders_count: number;
  reminders_acknowledged_count: number;
  reminders_intake_reported_count: number;
}

export interface SystemStatus {
  ocr_provider: string;
  ocr_connected: boolean;
  ai_provider: string;
  ai_connected: boolean;
  database_connected: boolean;
  database_type: string;
  environment: string;
  mode_description: string;
}

export interface DemoPreset {
  id: string;
  title: string;
  category: string;
  filename: string;
  file_url: string;
  description: string;
  medicines_count: number;
  default_times: string[];
}
