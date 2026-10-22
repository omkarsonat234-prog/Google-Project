import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  CalendarClock, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  HeartHandshake, 
  FileText,
  Clock,
  Pill,
  Pencil,
  Phone,
  Mail,
  Info,
  X
} from 'lucide-react';
import { 
  fetchCaregiverAuthorizations, 
  grantCaregiverAuthorization, 
  updateCaregiverAuthorization,
  revokeCaregiverAuthorization, 
  fetchSchedules 
} from '../services/api';
import { CaregiverAuthorization, MedicationSchedule } from '../types';
import { useAuth } from '../context/AuthContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const CaregiverPage: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.id || 'demo-patient';
  const patientName = user?.name || 'Patient';

  const [authorizations, setAuthorizations] = useState<CaregiverAuthorization[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Authorize Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [caregiverName, setCaregiverName] = useState('');
  const [relationship, setRelationship] = useState('Daughter & Primary Caregiver');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('Designated person responsible for patient care & medication oversight');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Caregiver State
  const [editingAuth, setEditingAuth] = useState<CaregiverAuthorization | null>(null);
  const [editName, setEditName] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [auths, scheds] = await Promise.all([
        fetchCaregiverAuthorizations(patientId),
        fetchSchedules('active', patientId)
      ]);
      setAuthorizations(auths);
      setSchedules(scheds);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleGrantConsent = async () => {
    if (!caregiverName.trim()) return;
    setIsSubmitting(true);
    try {
      await grantCaregiverAuthorization(
        caregiverName.trim(), 
        relationship.trim(), 
        patientId,
        phone.trim() || undefined,
        email.trim() || undefined,
        notes.trim() || undefined
      );
      setShowAddModal(false);
      setCaregiverName('');
      setPhone('+1 (555) 234-5678');
      setEmail('');
      setNotes('Designated person responsible for patient care & medication oversight');
      await loadData();
      showNotification('Caregiver authorized successfully. Consent recorded in audit trail.');
    } catch (e: any) {
      console.error(e);
      showNotification(e.message || 'Failed to authorize caregiver.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditCaregiver = (auth: CaregiverAuthorization) => {
    setEditingAuth(auth);
    setEditName(auth.caregiver_name || '');
    setEditRelationship(auth.relationship || '');
    setEditPhone(auth.phone || '');
    setEditEmail(auth.email || '');
    setEditNotes(auth.notes || '');
  };

  const handleUpdateCaregiver = async () => {
    if (!editingAuth || !editName.trim()) return;
    setIsUpdating(true);
    try {
      await updateCaregiverAuthorization(
        editingAuth.id,
        {
          caregiver_name: editName.trim(),
          relationship: editRelationship.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          notes: editNotes.trim(),
        },
        patientId
      );
      setEditingAuth(null);
      await loadData();
      showNotification('Caregiver information updated successfully!');
    } catch (e: any) {
      console.error(e);
      showNotification(e.message || 'Failed to update caregiver details.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke consent for ${name}? They will immediately lose access to your schedules.`)) {
      return;
    }
    try {
      await revokeCaregiverAuthorization(id, patientId);
      await loadData();
      showNotification(`Revoked authorization for ${name}.`);
    } catch (e: any) {
      console.error(e);
      showNotification(e.message || 'Failed to revoke authorization.', 'error');
    }
  };

  const activeAuthorizations = authorizations.filter(a => a.status === 'authorized');
  const isAuthorized = activeAuthorizations.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Disclaimer */}
      <DisclaimerBanner variant="compact" />

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition-all shadow-md ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-400 hover:text-slate-700 ml-3"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-200">
              Patient Privacy & Consent
            </span>
            <span className="text-xs text-slate-400 font-semibold">• Fully Customizable</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Caregiver Access & Guardian Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explicit patient consent is required before any schedule or health information is shared with family or caregivers. You can update or replace your caregiver at any time.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-700/20 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Authorize New Caregiver
        </button>
      </div>

      {/* Transparency Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 flex items-start gap-3">
        <Lock className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900">Patient Data Ownership Guarantee:</p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            MedBridge guarantees that caregiver details are never fixed or immutable. As a patient, you hold sole authority to update your designated caregiver's name, phone, email, and care responsibilities, or revoke authorization instantly.
          </p>
        </div>
      </div>

      {/* Active Caregiver Authorizations List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Authorized Caregiver Roster ({activeAuthorizations.length})
          </h3>
          <span className="text-[11px] text-teal-700 font-semibold">
            {activeAuthorizations.length > 0 ? '✓ Live Care Oversight Active' : 'Private Mode'}
          </span>
        </div>

        {activeAuthorizations.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No active caregiver authorizations.</p>
            <p className="text-[11px] text-slate-400">Your medication schedule is strictly private to your account.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-teal-700 hover:border-teal-400"
            >
              <UserPlus className="w-3.5 h-3.5" /> Designate a Caregiver
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAuthorizations.map((auth) => (
              <div
                key={auth.id}
                className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                        {auth.caregiver_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{auth.caregiver_name}</h4>
                        <p className="text-[11px] text-teal-800 font-semibold">{auth.relationship}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      Authorized
                    </span>
                  </div>

                  {/* Rich Details */}
                  <div className="mt-3 pt-2.5 border-t border-teal-100 space-y-1.5 text-xs text-slate-600">
                    {auth.phone && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <Phone className="w-3 h-3 text-teal-700 shrink-0" />
                        <span className="font-semibold text-slate-800">{auth.phone}</span>
                      </div>
                    )}
                    {auth.email && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <Mail className="w-3 h-3 text-teal-700 shrink-0" />
                        <span className="truncate text-slate-700">{auth.email}</span>
                      </div>
                    )}
                    {auth.notes && (
                      <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-white/70 p-2 rounded-xl border border-teal-100 mt-1">
                        <Info className="w-3 h-3 text-teal-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-tight">{auth.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-teal-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Granted: {new Date(auth.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEditCaregiver(auth)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-teal-700 hover:text-teal-900 hover:bg-white rounded-lg transition-colors cursor-pointer border border-teal-200"
                      title="Update caregiver information"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleRevoke(auth.id, auth.caregiver_name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                      title="Revoke caregiver authorization"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caregiver Schedule Monitoring View */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Caregiver Schedule View (Patient: {patientName})
          </h3>
          <p className="text-xs text-slate-500">
            {isAuthorized ? 'Authorized view enabled by explicit patient consent.' : 'Access restricted — authorization required.'}
          </p>
        </div>

        {!isAuthorized ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
            <Lock className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">Caregiver Access Locked</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please authorize a caregiver above to inspect the verified medication schedule.
            </p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-xs text-slate-500">
            No active schedules currently established for this patient.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((sched) => (
              <div
                key={sched.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <h4 className="text-sm font-bold text-slate-900">{sched.medicine_name}</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {sched.verification_status === 'clinical_verified' ? 'Clinically Verified' : 'User-Reviewed'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {sched.confirmed_instructions}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>Scheduled Intake: {sched.confirmed_schedule_times.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Caregiver Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                Authorize New Caregiver
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Designate a trusted individual to monitor your medication schedule. You can update or replace their information at any time.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Caregiver Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Maria Gonzalez"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship to Patient *</label>
                <input
                  type="text"
                  placeholder="e.g. Daughter & Primary Caregiver"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    'Daughter & Primary Caregiver',
                    'Son & Family Proxy',
                    'Spouse / Partner',
                    'Parent',
                    'Home Health Aide',
                    'Legal Guardian'
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setRelationship(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Direct Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="caregiver@familycare.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Care Authority & Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Healthcare Proxy, power of attorney, medication compliance monitor"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantConsent}
                disabled={isSubmitting || !caregiverName.trim()}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md shadow-teal-700/20"
              >
                {isSubmitting ? 'Granting Consent…' : 'Grant Explicit Consent'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Caregiver Modal ── */}
      {editingAuth && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Update Caregiver Information
                  </h3>
                  <p className="text-[11px] text-slate-500">Modify details for this caregiver or replace with a new guardian.</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingAuth(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Caregiver Full Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship to Patient *</label>
                <input
                  type="text"
                  value={editRelationship}
                  onChange={(e) => setEditRelationship(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden font-medium"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    'Daughter & Primary Caregiver',
                    'Son & Family Proxy',
                    'Spouse / Partner',
                    'Parent',
                    'Home Health Aide',
                    'Legal Guardian'
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setEditRelationship(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Care Responsibilities & Authority Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingAuth(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCaregiver}
                disabled={isUpdating || !editName.trim()}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md shadow-teal-700/20"
              >
                {isUpdating ? 'Saving Changes…' : 'Save Caregiver Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiverPage;
