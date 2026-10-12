import {
  Prescription,
  MedicationSchedule,
  ReminderEvent,
  CaregiverAuthorization,
  AuditLogEntry,
  DashboardStats,
  SystemStatus,
  DemoPreset,
  MedicineExtracted
} from '../types';

const API_BASE = '/api';

/* ── Offline Local Storage Utilities ── */
function getStorageItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`medbridge_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`medbridge_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to cache to localStorage', e);
  }
}

/* ── Built-in Offline Fallback Dataset ── */
const now = new Date();
const todayStr = now.toISOString().split('T')[0];
const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const in28Days = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const DEFAULT_OFFLINE_STATS: DashboardStats = {
  prescriptions_count: 3,
  awaiting_verification_count: 1,
  verified_schedules_count: 3,
  today_reminders_count: 3,
  reminders_acknowledged_count: 2,
  reminders_intake_reported_count: 1,
};

const DEFAULT_OFFLINE_SCHEDULES: MedicationSchedule[] = [
  {
    id: 'sched-offline-1',
    prescription_id: 'rx-offline-1',
    medication_entry_id: 'med-offline-1',
    owner_id: 'demo-patient',
    medicine_name: 'Amoxicillin 500mg',
    confirmed_instructions: 'Take 1 capsule orally every 8 hours with meals (Complete full 10-day course)',
    confirmed_schedule_times: ['08:00', '14:00', '20:00'],
    start_date: todayStr,
    end_date: in7Days,
    status: 'active',
    verification_status: 'clinical_verified',
    verified_at: todayStr,
    verified_by: 'Dr. Sarah Jenkins (Attending Physician)',
    version: 1,
    history: []
  },
  {
    id: 'sched-offline-2',
    prescription_id: 'rx-offline-2',
    medication_entry_id: 'med-offline-2',
    owner_id: 'demo-patient',
    medicine_name: 'Metformin 500mg',
    confirmed_instructions: 'Take 1 tablet twice daily with morning and evening meals',
    confirmed_schedule_times: ['08:30', '19:30'],
    start_date: todayStr,
    end_date: in28Days,
    status: 'active',
    verification_status: 'clinical_verified',
    verified_at: todayStr,
    verified_by: 'Dr. Michael Chen (Clinical Pharmacist)',
    version: 1,
    history: []
  },
  {
    id: 'sched-offline-3',
    prescription_id: 'rx-offline-3',
    medication_entry_id: 'med-offline-3',
    owner_id: 'demo-patient',
    medicine_name: 'Lisinopril 10mg',
    confirmed_instructions: 'Take 1 tablet once daily in the morning with a glass of water',
    confirmed_schedule_times: ['09:00'],
    start_date: todayStr,
    end_date: in14Days,
    status: 'active',
    verification_status: 'user_reviewed',
    verified_at: todayStr,
    verified_by: 'Johnathan Doe (Patient)',
    version: 1,
    history: []
  }
];

const DEFAULT_OFFLINE_REMINDERS: ReminderEvent[] = [
  {
    id: 'rem-offline-1',
    schedule_id: 'sched-offline-1',
    owner_id: 'demo-patient',
    medicine_name: 'Amoxicillin 500mg',
    confirmed_instructions: 'Take 1 capsule orally with meals',
    scheduled_time: '08:00',
    date: todayStr,
    notification_status: 'delivered',
    acknowledged: true,
    acknowledged_at: '08:05',
    intake_reported: true,
    intake_reported_at: '08:12',
    intake_notes: 'Taken with breakfast'
  },
  {
    id: 'rem-offline-2',
    schedule_id: 'sched-offline-1',
    owner_id: 'demo-patient',
    medicine_name: 'Amoxicillin 500mg',
    confirmed_instructions: 'Take 1 capsule orally with meals',
    scheduled_time: '14:00',
    date: todayStr,
    notification_status: 'delivered',
    acknowledged: true,
    acknowledged_at: '14:02',
    intake_reported: false
  },
  {
    id: 'rem-offline-3',
    schedule_id: 'sched-offline-2',
    owner_id: 'demo-patient',
    medicine_name: 'Metformin 500mg',
    confirmed_instructions: 'Take 1 tablet with evening meal',
    scheduled_time: '19:30',
    date: todayStr,
    notification_status: 'scheduled',
    acknowledged: false,
    intake_reported: false
  }
];

export async function fetchSystemStatus(): Promise<SystemStatus> {
  try {
    const res = await fetch(`${API_BASE}/system/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return await res.json();
  } catch {
    return {
      ocr_provider: 'Local Offline Clinical OCR',
      ocr_connected: false,
      ai_provider: 'Local Offline Rule Engine',
      ai_connected: false,
      database_connected: true,
      database_type: 'Indexed Local Storage (Offline Ready)',
      environment: 'offline',
      mode_description: 'Operating in self-contained offline mode with local clinical data.'
    };
  }
}

export async function fetchDashboardStats(ownerId = 'demo-patient'): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE}/system/stats?owner_id=${ownerId}`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    const data = await res.json();
    setStorageItem('stats', data);
    return data;
  } catch {
    return getStorageItem('stats', DEFAULT_OFFLINE_STATS);
  }
}

export async function uploadPrescription(file: File, ownerId = 'demo-patient'): Promise<Prescription> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('owner_id', ownerId);

  const res = await fetch(`${API_BASE}/prescriptions/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function loadPresetPrescription(presetId: string, ownerId = 'demo-patient'): Promise<Prescription> {
  const res = await fetch(`${API_BASE}/prescriptions/preset/${presetId}?owner_id=${ownerId}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to load preset' }));
    throw new Error(err.detail || 'Failed to load preset');
  }
  return res.json();
}

export async function fetchPrescriptions(ownerId = 'demo-patient'): Promise<Prescription[]> {
  try {
    const res = await fetch(`${API_BASE}/prescriptions?owner_id=${ownerId}`);
    if (!res.ok) throw new Error('Failed to list prescriptions');
    const data = await res.json();
    setStorageItem('prescriptions', data);
    return data;
  } catch {
    return getStorageItem('prescriptions', []);
  }
}

export async function fetchPrescription(id: string): Promise<Prescription> {
  const res = await fetch(`${API_BASE}/prescriptions/${id}`);
  if (!res.ok) throw new Error('Prescription not found');
  return res.json();
}

export async function saveMedicationCorrections(
  medId: string,
  corrections: Record<string, string>,
  checklist: Record<string, boolean>,
  notes?: string
): Promise<{ status: string; medication: any }> {
  const res = await fetch(`${API_BASE}/medications/${medId}/corrections`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ corrections, checklist, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Correction failed' }));
    throw new Error(err.detail || 'Failed to save corrections');
  }
  return res.json();
}

export async function verifyMedication(
  medId: string,
  data: {
    verifier_identity: string;
    verifier_role: string;
    confirmed_schedule_times: string[];
    confirmed_start_date?: string;
    confirmed_end_date?: string;
    notes?: string;
    override_uncertainty?: boolean;
  }
): Promise<{ status: string; schedule: MedicationSchedule; reminders: ReminderEvent[] }> {
  const res = await fetch(`${API_BASE}/medications/${medId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Verification failed' }));
    const msg = typeof err.detail === 'object' ? err.detail.message : err.detail;
    throw new Error(msg || 'Verification gate blocked schedule activation');
  }
  return res.json();
}

export async function fetchSchedules(status?: string, ownerId = 'demo-patient'): Promise<MedicationSchedule[]> {
  try {
    const query = status ? `?status=${status}&owner_id=${ownerId}` : `?owner_id=${ownerId}`;
    const res = await fetch(`${API_BASE}/schedules${query}`);
    if (!res.ok) throw new Error('Failed to fetch schedules');
    const data = await res.json();
    setStorageItem('schedules', data);
    return data;
  } catch {
    const cached = getStorageItem<MedicationSchedule[]>('schedules', DEFAULT_OFFLINE_SCHEDULES);
    return status && status !== 'all' ? cached.filter(s => s.status === status) : cached;
  }
}

export async function updateSchedule(
  scheduleId: string,
  data: {
    confirmed_instructions?: string;
    confirmed_schedule_times?: string[];
    start_date?: string;
    end_date?: string;
    status?: string;
    edit_reason: string;
    editor_identity: string;
  }
): Promise<MedicationSchedule> {
  try {
    const res = await fetch(`${API_BASE}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Network update failed');
    return await res.json();
  } catch {
    // Local offline update
    const schedules = getStorageItem<MedicationSchedule[]>('schedules', DEFAULT_OFFLINE_SCHEDULES);
    const idx = schedules.findIndex(s => s.id === scheduleId);
    if (idx !== -1) {
      schedules[idx] = {
        ...schedules[idx],
        confirmed_instructions: data.confirmed_instructions ?? schedules[idx].confirmed_instructions,
        confirmed_schedule_times: data.confirmed_schedule_times ?? schedules[idx].confirmed_schedule_times,
        start_date: data.start_date ?? schedules[idx].start_date,
        end_date: data.end_date ?? schedules[idx].end_date,
        status: (data.status as any) ?? schedules[idx].status,
        version: schedules[idx].version + 1
      };
      setStorageItem('schedules', schedules);
      return schedules[idx];
    }
    throw new Error('Schedule not found in offline storage');
  }
}

export async function fetchReminders(date?: string, ownerId = 'demo-patient'): Promise<ReminderEvent[]> {
  try {
    const query = date ? `?date=${date}&owner_id=${ownerId}` : `?owner_id=${ownerId}`;
    const res = await fetch(`${API_BASE}/reminders${query}`);
    if (!res.ok) throw new Error('Failed to fetch reminders');
    const data = await res.json();
    setStorageItem('reminders', data);
    return data;
  } catch {
    return getStorageItem('reminders', DEFAULT_OFFLINE_REMINDERS);
  }
}

export async function acknowledgeReminder(reminderId: string, userIdentity = 'Patient', notes?: string): Promise<ReminderEvent> {
  try {
    const res = await fetch(`${API_BASE}/reminders/${reminderId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_identity: userIdentity, notes }),
    });
    if (!res.ok) throw new Error('Server acknowledge failed');
    return await res.json();
  } catch {
    // Offline update in local cache
    const reminders = getStorageItem<ReminderEvent[]>('reminders', DEFAULT_OFFLINE_REMINDERS);
    const r = reminders.find(item => item.id === reminderId);
    if (r) {
      r.acknowledged = true;
      r.acknowledged_at = new Date().toTimeString().slice(0, 5);
      setStorageItem('reminders', reminders);
      return r;
    }
    throw new Error('Reminder not found offline');
  }
}

export async function reportIntake(reminderId: string, userIdentity = 'Patient', notes?: string, taken_timestamp?: string): Promise<ReminderEvent> {
  try {
    const res = await fetch(`${API_BASE}/reminders/${reminderId}/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_identity: userIdentity, notes, taken_timestamp }),
    });
    if (!res.ok) throw new Error('Server report intake failed');
    return await res.json();
  } catch {
    // Offline update in local cache
    const reminders = getStorageItem<ReminderEvent[]>('reminders', DEFAULT_OFFLINE_REMINDERS);
    const r = reminders.find(item => item.id === reminderId);
    if (r) {
      r.intake_reported = true;
      r.intake_reported_at = taken_timestamp || new Date().toTimeString().slice(0, 5);
      r.intake_notes = notes || null;
      setStorageItem('reminders', reminders);
      return r;
    }
    throw new Error('Reminder not found offline');
  }
}

export async function triggerTestReminder(medicineName = 'Amoxicillin 500mg', instructions = 'Take 1 capsule orally with meals'): Promise<ReminderEvent> {
  try {
    const res = await fetch(`${API_BASE}/reminders/trigger-test?medicine_name=${encodeURIComponent(medicineName)}&instructions=${encodeURIComponent(instructions)}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to trigger test reminder');
    return await res.json();
  } catch {
    return {
      id: `rem-test-${Date.now()}`,
      schedule_id: 'sched-offline-1',
      owner_id: 'demo-patient',
      medicine_name: medicineName,
      confirmed_instructions: instructions,
      scheduled_time: new Date().toTimeString().slice(0, 5),
      date: todayStr,
      notification_status: 'delivered',
      acknowledged: false,
      intake_reported: false
    };
  }
}

export async function fetchCaregiverAuthorizations(patientId = 'demo-patient'): Promise<CaregiverAuthorization[]> {
  try {
    const res = await fetch(`${API_BASE}/caregiver/authorizations?patient_id=${patientId}`);
    if (!res.ok) throw new Error('Failed to fetch authorizations');
    return await res.json();
  } catch {
    return [];
  }
}

export async function grantCaregiverAuthorization(caregiver_name: string, relationship: string, patient_id = 'demo-patient'): Promise<CaregiverAuthorization> {
  const res = await fetch(`${API_BASE}/caregiver/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caregiver_name, relationship, patient_id }),
  });
  if (!res.ok) throw new Error('Failed to grant authorization');
  return res.json();
}

export async function revokeCaregiverAuthorization(auth_id: string, patient_id = 'demo-patient'): Promise<void> {
  const res = await fetch(`${API_BASE}/caregiver/revoke/${auth_id}?patient_id=${patient_id}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to revoke authorization');
}

export async function fetchAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/audit/logs?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchDemoPresets(): Promise<DemoPreset[]> {
  const res = await fetch(`${API_BASE}/demo/presets`);
  if (!res.ok) throw new Error('Failed to fetch presets');
  return res.json();
}

export async function seedFullDemo(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/seed-full`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to seed demo data');
  return res.json();
}

export async function resetDemo(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset database');
  return res.json();
}

/* ── User Authentication API ── */
export interface SignupPayload {
  full_name: string;
  email: string;
  password: string;
  role: 'patient' | 'caregiver' | 'physician' | 'pharmacist';
  age?: number;
  gender?: string;
  weight?: number;
  phone_number?: string;
  birth_date?: string;
  emergency_contact?: string;
  medical_conditions?: string;
  allergies?: string;
}

export async function signUpUser(data: SignupPayload): Promise<{ status: string; message: string; user: any }> {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.detail || 'Registration failed');
    }
    // Mirror in local offline storage
    const localUsers = getStorageItem<any[]>('registered_users', []);
    localUsers.push({ ...resData.user, password: data.password });
    setStorageItem('registered_users', localUsers);
    return resData;
  } catch (err: any) {
    if (err.message && err.message.includes('already registered')) throw err;
    // Offline local database fallback
    const localUsers = getStorageItem<any[]>('registered_users', []);
    if (localUsers.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('An account is already registered with this email address.');
    }
    const newUser = {
      id: `user-${Date.now()}`,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      age: data.age,
      gender: data.gender,
      weight: data.weight,
      phone_number: data.phone_number,
      birth_date: data.birth_date,
      password: data.password,
      created_at: new Date().toISOString()
    };
    localUsers.push(newUser);
    setStorageItem('registered_users', localUsers);
    return { status: 'success', message: 'Account registered successfully.', user: newUser };
  }
}

export async function loginUser(email: string, password: string): Promise<{ status: string; user: any }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.detail || 'Login failed');
    }
    return resData;
  } catch (err: any) {
    if (err.message && (err.message.includes('No account found') || err.message.includes('Incorrect password'))) {
      throw err;
    }
    // Check local registered users fallback
    const localUsers = getStorageItem<any[]>('registered_users', []);
    const found = localUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      // Check built-in demo credentials
      const DEMOS: Record<string, any> = {
        'patient@medbridge.app': { id: 'demo-patient', full_name: 'Johnathan Doe', role: 'patient', password: 'demo1234' },
        'caregiver@medbridge.app': { id: 'demo-caregiver', full_name: 'Elena Vance', role: 'caregiver', password: 'demo1234' },
        'physician@medbridge.app': { id: 'demo-physician', full_name: 'Dr. Sarah Jenkins', role: 'physician', password: 'demo1234' },
        'pharmacist@medbridge.app': { id: 'demo-pharmacist', full_name: 'Dr. Michael Chen', role: 'pharmacist', password: 'demo1234' },
      };
      if (DEMOS[cleanEmail]) {
        if (DEMOS[cleanEmail].password !== password) {
          throw new Error('Incorrect password. Please verify your credentials.');
        }
        return { status: 'success', user: DEMOS[cleanEmail] };
      }
      throw new Error('No account found with this email. Please sign up first.');
    }
    if (found.password && found.password !== password) {
      throw new Error('Incorrect password. Please verify your credentials.');
    }
    return { status: 'success', user: found };
  }
}

export async function requestPasswordReset(email: string): Promise<{ status: string; message: string; auth_code_preview?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.detail || 'Password reset request failed');
    return resData;
  } catch (err: any) {
    if (err.message && err.message.includes('No account found')) throw err;
    // Offline code generator
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    setStorageItem(`reset_code_${cleanEmail}`, code);
    return {
      status: 'success',
      message: `A 6-digit authentication code has been dispatched to ${cleanEmail}.`,
      auth_code_preview: code
    };
  }
}

export async function resetPassword(email: string, code: string, new_password: string): Promise<{ status: string; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code, new_password }),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.detail || 'Password reset failed');
    return resData;
  } catch (err: any) {
    if (err.message && err.message.includes('Invalid or expired')) throw err;
    const storedCode = getStorageItem<string>(`reset_code_${cleanEmail}`, '');
    if (storedCode && storedCode === code.trim()) {
      const localUsers = getStorageItem<any[]>('registered_users', []);
      const idx = localUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (idx !== -1) {
        localUsers[idx].password = new_password;
        setStorageItem('registered_users', localUsers);
      }
      return { status: 'success', message: 'Password updated successfully. You can now log in.' };
    }
    throw new Error('Invalid or expired verification code.');
  }
}
