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
  Pill
} from 'lucide-react';
import { 
  fetchCaregiverAuthorizations, 
  grantCaregiverAuthorization, 
  revokeCaregiverAuthorization, 
  fetchSchedules 
} from '../services/api';
import { CaregiverAuthorization, MedicationSchedule } from '../types';
import { useAuth } from '../context/AuthContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const CaregiverPage: React.FC = () => {
  const { user } = useAuth();
  const [authorizations, setAuthorizations] = useState<CaregiverAuthorization[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Authorize Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [caregiverName, setCaregiverName] = useState('');
  const [relationship, setRelationship] = useState('Daughter & Primary Caregiver');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [auths, scheds] = await Promise.all([
        fetchCaregiverAuthorizations('demo-patient'),
        fetchSchedules('active', 'demo-patient')
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
  }, []);

  const handleGrantConsent = async () => {
    if (!caregiverName.trim()) return;
    setIsSubmitting(true);
    try {
      await grantCaregiverAuthorization(caregiverName, relationship, 'demo-patient');
      setShowAddModal(false);
      setCaregiverName('');
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeCaregiverAuthorization(id, 'demo-patient');
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const activeAuthorizations = authorizations.filter(a => a.status === 'authorized');
  const isAuthorized = activeAuthorizations.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Disclaimer */}
      <DisclaimerBanner variant="compact" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Caregiver Access & Consent Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explicit patient consent is required before any schedule or health information is shared with family or caregivers.
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
          <p className="font-bold text-slate-900">Privacy Safeguard Principle:</p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            MedBridge does not enable open cross-user indexing. In this prototype, schedule monitoring requires an active consent record granted by the patient. If consent is revoked, access is immediately blocked.
          </p>
        </div>
      </div>

      {/* Active Caregiver Authorizations List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Authorized Caregiver Roster ({activeAuthorizations.length})
        </h3>

        {activeAuthorizations.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No active caregiver authorizations. The patient's schedule remains strictly private.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAuthorizations.map((auth) => (
              <div
                key={auth.id}
                className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                    {auth.caregiver_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{auth.caregiver_name}</h4>
                    <p className="text-[11px] text-teal-800 font-medium">{auth.relationship}</p>
                    <span className="text-[10px] text-slate-400">
                      Granted: {new Date(auth.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(auth.id)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                  title="Revoke caregiver authorization"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caregiver Schedule Monitoring View */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Caregiver Schedule View (Patient: Johnathan Doe)
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

      {/* Add Caregiver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-teal-600" />
              Grant Caregiver Authorization
            </h3>
            <p className="text-xs text-slate-600">
              The authorized caregiver will be able to view today's medication routine and verification status.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Caregiver Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Elena Vance"
                  value={caregiverName}
                  onChange={(e) => setCaregiverName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Daughter & Primary Caregiver"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantConsent}
                disabled={isSubmitting || !caregiverName.trim()}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Grant Explicit Consent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
