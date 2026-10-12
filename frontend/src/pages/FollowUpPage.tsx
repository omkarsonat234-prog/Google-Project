import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FollowUp {
  id: string;
  doctor_name: string;
  specialty: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  location_room: string;
  reason: string;
  status: string;
  clinical_notes?: string;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    scheduled:    { label: 'Scheduled',    cls: 'bg-blue-100 text-blue-800 border-blue-200' },
    completed:    { label: 'Completed',    cls: 'bg-green-100 text-green-800 border-green-200' },
    rescheduled:  { label: 'Rescheduled', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    urgent_triage:{ label: 'Urgent',      cls: 'bg-red-100 text-red-800 border-red-200' },
    cancelled:    { label: 'Cancelled',   cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── New Follow-up Modal ──────────────────────────────────────────────────────
function NewFollowUpModal({ onClose, onSaved, patientId, patientName }: {
  onClose: () => void;
  onSaved: () => void;
  patientId: string;
  patientName: string;
}) {
  const [form, setForm] = useState({
    doctor_id: 'dr-001',
    doctor_name: '',
    specialty: '',
    department: '',
    appointment_date: '',
    appointment_time: '',
    location_room: '',
    reason: '',
    clinical_notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const specialties = [
    { specialty: 'Internal Medicine', department: 'General Medicine OPD', room: 'OPD-101' },
    { specialty: 'Cardiology', department: 'Cardiac OPD', room: 'OPD-201' },
    { specialty: 'Endocrinology', department: 'Diabetes & Endocrine Clinic', room: 'OPD-305' },
    { specialty: 'Orthopaedics', department: 'Orthopaedic OPD', room: 'OPD-401' },
    { specialty: 'Nephrology', department: 'Renal OPD', room: 'OPD-502' },
    { specialty: 'Pulmonology', department: 'Chest & Respiratory OPD', room: 'OPD-208' },
    { specialty: 'Neurology', department: 'Neurology OPD', room: 'OPD-610' },
    { specialty: 'Dermatology', department: 'Skin & STD OPD', room: 'OPD-112' },
    { specialty: 'Psychiatry', department: 'Mental Health Clinic', room: 'OPD-701' },
    { specialty: 'Physiotherapy', department: 'Rehabilitation Unit', room: 'REHAB-001' },
  ];

  function handleSpecialtyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sel = specialties.find(s => s.specialty === e.target.value);
    if (sel) {
      setForm(f => ({ ...f, specialty: sel.specialty, department: sel.department, location_room: sel.room }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.doctor_name || !form.specialty || !form.appointment_date || !form.appointment_time || !form.reason) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, patient_id: patientId, patient_name: patientName })
      });
      if (!res.ok) throw new Error('Failed to save');
      onSaved();
      onClose();
    } catch {
      setError('Failed to save appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl p-6 text-white">
          <h2 className="text-xl font-bold">📅 Schedule Follow-up Appointment</h2>
          <p className="text-blue-100 text-sm mt-1">Patient: {patientName}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Doctor Name *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Dr. Full Name" value={form.doctor_name}
                onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Specialty *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.specialty} onChange={handleSpecialtyChange}>
                <option value="">Select Specialty</option>
                {specialties.map(s => <option key={s.specialty} value={s.specialty}>{s.specialty}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
              <input className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600" readOnly value={form.department} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Location / Room</label>
              <input className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600" readOnly value={form.location_room} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Appointment Date *</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.appointment_date} min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, appointment_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Appointment Time *</label>
              <input type="time" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.appointment_time}
                onChange={e => setForm(f => ({ ...f, appointment_time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Visit *</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Post-discharge wound review, Diabetes follow-up, Blood pressure check"
              value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Clinical Notes (optional)</label>
            <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Bring test reports, fasting blood sample required, etc."
              value={form.clinical_notes} onChange={e => setForm(f => ({ ...f, clinical_notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
              {saving ? 'Scheduling…' : '📅 Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function FollowUpPage() {
  const { user } = useAuth();
  const patientId = (user as any)?.id || 'demo-patient';
  const patientName = (user as any)?.name || (user as any)?.full_name || 'Patient';

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  const OFFLINE_FOLLOWUPS: FollowUp[] = [
    { id: 'fu-001', doctor_name: 'Dr. Priya Sharma', specialty: 'Endocrinology', department: 'Diabetes & Endocrine Clinic', appointment_date: new Date(Date.now() + 7*864e5).toISOString().split('T')[0], appointment_time: '10:30', location_room: 'OPD-305', reason: 'Quarterly HbA1c review and insulin dose adjustment', status: 'scheduled', clinical_notes: 'Bring 3-month blood glucose diary and last HbA1c report.' },
    { id: 'fu-002', doctor_name: 'Dr. Ramesh Kumar', specialty: 'Cardiology', department: 'Cardiac OPD', appointment_date: new Date(Date.now() + 14*864e5).toISOString().split('T')[0], appointment_time: '09:00', location_room: 'OPD-201', reason: 'Post-MI 3-week cardiac review and ECG', status: 'scheduled', clinical_notes: 'Fasting required. Bring all cardiac medications.' },
    { id: 'fu-003', doctor_name: 'Dr. Anita Patel', specialty: 'Internal Medicine', department: 'General Medicine OPD', appointment_date: new Date(Date.now() - 3*864e5).toISOString().split('T')[0], appointment_time: '11:00', location_room: 'OPD-101', reason: 'Wound suture removal follow-up', status: 'completed', clinical_notes: 'Sutures removed. Wound healing satisfactorily.' },
  ];

  async function loadFollowUps() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/followups?patient_id=${patientId}`);
      const data = res.ok ? await res.json() : OFFLINE_FOLLOWUPS;
      setFollowUps(data.length > 0 ? data : OFFLINE_FOLLOWUPS);
    } catch {
      setFollowUps(OFFLINE_FOLLOWUPS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFollowUps(); }, []);

  async function cancelFollowUp(id: string) {
    await fetch(`${API}/followups/${id}`, { method: 'DELETE' }).catch(() => {});
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: 'cancelled' } : f));
  }

  const filtered = filter === 'all' ? followUps : followUps.filter(f => f.status === filter);
  const upcoming = followUps.filter(f => f.status === 'scheduled' && new Date(f.appointment_date) >= new Date()).length;
  const total = followUps.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      {showModal && (
        <NewFollowUpModal
          onClose={() => setShowModal(false)}
          onSaved={loadFollowUps}
          patientId={patientId}
          patientName={patientName}
        />
      )}

      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">🗓️ Doctor Follow-up Schedule</h1>
            <p className="text-slate-500 mt-1">Manage your upcoming medical appointments and follow-ups</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            + Schedule Appointment
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Appointments', value: total, icon: '📋', color: 'blue' },
            { label: 'Upcoming', value: upcoming, icon: '⏰', color: 'indigo' },
            { label: 'Completed', value: followUps.filter(f => f.status === 'completed').length, icon: '✅', color: 'green' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          {(['all', 'scheduled', 'completed'] as const).map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${filter === tab ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-gray-50'}`}>
              {tab === 'all' ? 'All' : tab === 'scheduled' ? 'Upcoming' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Appointment Cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-lg font-medium">No appointments found</p>
            <p className="text-sm">Schedule your first follow-up with your doctor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(fu => {
              const apptDate = new Date(`${fu.appointment_date}T${fu.appointment_time}`);
              const isPast = apptDate < new Date() && fu.status === 'scheduled';
              return (
                <div key={fu.id}
                  className={`bg-white rounded-2xl shadow-sm border-l-4 p-5 transition-all hover:shadow-md ${
                    fu.status === 'completed' ? 'border-green-400' :
                    fu.status === 'cancelled' ? 'border-gray-300' :
                    isPast ? 'border-amber-400' : 'border-blue-500'
                  }`}>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <StatusBadge status={fu.status} />
                        {isPast && fu.status === 'scheduled' && (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-semibold">Overdue</span>
                        )}
                        <span className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-xs font-semibold">{fu.specialty}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{fu.doctor_name}</h3>
                      <p className="text-sm text-slate-500">{fu.department} · {fu.location_room}</p>
                      <p className="text-sm text-slate-700 mt-2 font-medium">📋 {fu.reason}</p>
                      {fu.clinical_notes && (
                        <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-800 border border-blue-100">
                          💡 {fu.clinical_notes}
                        </div>
                      )}
                    </div>
                    <div className="md:text-right flex-shrink-0">
                      <div className="text-lg font-bold text-slate-900">
                        {new Date(fu.appointment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-blue-600 font-semibold text-base">{fu.appointment_time}</div>
                      {fu.status === 'scheduled' && (
                        <button onClick={() => cancelFollowUp(fu.id)}
                          className="mt-2 text-xs text-red-500 hover:text-red-700 underline">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Patient Preparation Guide */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-6">
          <h3 className="text-lg font-bold text-indigo-900 mb-3">📌 Appointment Preparation Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              '📄 Bring original prescription slips and previous test reports',
              '💊 Carry all your current medication bottles/strips',
              '📊 Bring your blood glucose diary (if diabetic)',
              '🩸 Confirm if fasting blood test is required',
              '📝 Write down new symptoms or concerns to discuss',
              '🪪 Carry your hospital OPD card and insurance documents',
              '⏰ Arrive 15 minutes early for vitals recording',
              '📱 Save emergency contact numbers of the hospital'
            ].map(tip => (
              <div key={tip} className="flex items-start gap-2 text-sm text-indigo-800">
                <span className="mt-0.5 flex-shrink-0">{tip.substring(0, 2)}</span>
                <span>{tip.substring(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FollowUpPage;
