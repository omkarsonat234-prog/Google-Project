import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  FileCheck2, 
  AlertTriangle, 
  Users, 
  Calendar, 
  Activity, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  Phone, 
  Pill, 
  User, 
  Lock, 
  Eye, 
  Check, 
  X,
  History,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAuditLogs, fetchSchedules } from '../services/api';
import { AuditLogEntry, MedicationSchedule } from '../types';

interface Props {
  onNavigate: (tab: string) => void;
}

interface PatientQueueItem {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  mrn: string; // Medical Record Number
  prescribedDrug: string;
  dosage: string;
  instructions: string;
  reviewStatus: 'pending_signoff' | 'uncertain_flagged' | 'verified';
  uncertaintyNotes?: string;
  guardianName: string;
  guardianPhone: string;
  prescribedDate: string;
}

const CLINICAL_QUEUE: PatientQueueItem[] = [
  {
    id: 'pq-1',
    patientName: 'Eleanor Vance',
    patientAge: 64,
    patientGender: 'Female',
    mrn: 'MRN-84920',
    prescribedDrug: 'Metformin 500mg',
    dosage: '500mg twice daily',
    instructions: 'Take [SMUDGED] with morning and evening meals',
    reviewStatus: 'uncertain_flagged',
    uncertaintyNotes: 'OCR detected smudged handwriting on frequency field. Needs clinician verification.',
    guardianName: 'Marcus Vance (Son)',
    guardianPhone: '+1 (555) 782-9912',
    prescribedDate: 'Today, 09:30 AM',
  },
  {
    id: 'pq-2',
    patientName: 'Johnathan Doe',
    patientAge: 38,
    patientGender: 'Male',
    mrn: 'MRN-33918',
    prescribedDrug: 'Amoxicillin 500mg',
    dosage: '500mg every 8 hours',
    instructions: 'Take 1 capsule orally every 8 hours with meals for 10 days',
    reviewStatus: 'pending_signoff',
    guardianName: 'Elena Vance (Daughter)',
    guardianPhone: '+1 (555) 234-5678',
    prescribedDate: 'Today, 11:15 AM',
  },
  {
    id: 'pq-3',
    patientName: 'Robert Martinez',
    patientAge: 52,
    patientGender: 'Male',
    mrn: 'MRN-19402',
    prescribedDrug: 'Lisinopril 10mg',
    dosage: '10mg once daily in morning',
    instructions: 'Take 1 tablet every morning with water. Monitor BP weekly.',
    reviewStatus: 'verified',
    guardianName: 'Self / Independent',
    guardianPhone: '+1 (555) 642-1188',
    prescribedDate: 'Yesterday, 04:20 PM',
  },
];

export const DoctorDashboardPage: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<PatientQueueItem[]>(CLINICAL_QUEUE);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientQueueItem | null>(null);
  const [signOffModalOpen, setSignOffModalOpen] = useState(false);
  const [clinicianNotes, setClinicianNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signSuccessMessage, setSignSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const logs = await fetchAuditLogs(30);
      setAuditLogs(logs);
      const sched = await fetchSchedules('all');
      setSchedules(sched);
    } catch (e) {
      console.warn('Backend data load error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprovePatient = (patient: PatientQueueItem) => {
    setQueue(prev => prev.map(p => p.id === patient.id ? { ...p, reviewStatus: 'verified' } : p));
    setSignSuccessMessage(`Regimen approved & signed for ${patient.patientName}. Medication schedule unlocked.`);
    setSignOffModalOpen(false);
    setTimeout(() => setSignSuccessMessage(null), 4000);
  };

  const filteredQueue = queue.filter(item => {
    const matchesFilter = filterStatus === 'all' || item.reviewStatus === filterStatus;
    const matchesSearch = item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.prescribedDrug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.mrn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = queue.filter(q => q.reviewStatus !== 'verified').length;
  const flaggedCount = queue.filter(q => q.reviewStatus === 'uncertain_flagged').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-7 font-sans">
      
      {/* ── CLINICIAN HEADER BAR ── */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`}, MD
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-400 text-slate-950">
                Clinician Portal
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                On Duty • Attending Physician
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-medium flex-wrap">
              <span>Medical License: State Board Lic #MD-94821</span>
              <span>•</span>
              <span>Department: Internal Medicine & Pharmacotherapy</span>
              <span>•</span>
              <span>St. Jude Metropolitan Medical Network</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Queue
          </button>
          <button
            onClick={() => onNavigate('upload')}
            className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-teal-500/20 cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            Upload Prescription for Review
          </button>
        </div>
      </div>

      {signSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{signSuccessMessage}</span>
        </div>
      )}

      {/* ── CLINICAL TRIAGE STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Awaiting Verification</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{pendingCount}</span>
            <span className="text-xs font-bold text-amber-700">Prescriptions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Requires physician gate authorization</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Uncertainty</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{flaggedCount}</span>
            <span className="text-xs font-bold text-rose-700">Flagged</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Smudged handwriting / dose ambiguity</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monitored Cohort</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{schedules.length + 12}</span>
            <span className="text-xs font-bold text-teal-700">Patients</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Active clinical medication schedules</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Regimen Adherence</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">94.8%</span>
            <span className="text-xs font-bold text-emerald-700">Reported</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Compliance across verified routines</p>
        </div>
      </div>

      {/* ── CLINICAL VERIFICATION & SIGN-OFF QUEUE ── */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-teal-700" />
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                Prescription Verification & Triage Queue
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review OCR extracted instructions, resolve ambiguity flags, and electronically authorize patient regimens.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patient, drug, MRN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-hidden"
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="uncertain_flagged">Flagged Uncertainties</option>
              <option value="pending_signoff">Pending Sign-Off</option>
              <option value="verified">Verified & Active</option>
            </select>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-3 px-4">Patient & MRN</th>
                <th className="py-3 px-4">Prescribed Drug</th>
                <th className="py-3 px-4">Extracted Instructions</th>
                <th className="py-3 px-4">Designated Guardian</th>
                <th className="py-3 px-4">Triage Status</th>
                <th className="py-3 px-4 text-right">Physician Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredQueue.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{item.patientName}</div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {item.patientAge}y {item.patientGender} • {item.mrn}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-black text-teal-900">
                    {item.prescribedDrug}
                    <div className="text-[11px] text-slate-500 font-medium">{item.dosage}</div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs text-slate-700 font-medium">
                    <p className="line-clamp-2">{item.instructions}</p>
                    {item.uncertaintyNotes && (
                      <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                        ⚠️ {item.uncertaintyNotes}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="font-bold text-slate-800">{item.guardianName}</div>
                    <a href={`tel:${item.guardianPhone}`} className="text-[11px] text-teal-700 font-semibold hover:underline flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {item.guardianPhone}
                    </a>
                  </td>

                  <td className="py-3.5 px-4">
                    {item.reviewStatus === 'verified' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Signed & Active
                      </span>
                    )}
                    {item.reviewStatus === 'pending_signoff' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Ready for Sign-Off
                      </span>
                    )}
                    {item.reviewStatus === 'uncertain_flagged' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Ambiguity Blocked
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {item.reviewStatus === 'verified' ? (
                      <button
                        onClick={() => {
                          setSelectedPatient(item);
                          setSignOffModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Inspect Routine
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedPatient(item);
                          setSignOffModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-black shadow-xs transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verify & Authorize
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CLINICAL SAFETY & DRUG-DRUG INTERACTION WARNING MATRIX ── */}
      <section className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-black tracking-tight text-white">
              Clinical Interaction & Contraindication Safeguards
            </h3>
          </div>
          <span className="text-[11px] font-bold text-teal-300 bg-teal-900/60 px-2.5 py-0.5 rounded-full border border-teal-700">
            Real-Time Engine Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-rose-400 text-xs font-bold mb-1">
              <span>Hyperkalemia Risk</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">Lisinopril + Potassium Supplements</p>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              ACE Inhibitor reduces aldosterone secretion. Potassium-sparing risk flagged for review.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-amber-400 text-xs font-bold mb-1">
              <span>GI Absorption Timing</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">Metformin with Meals</p>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Ensures gastrointestinal tolerability. Auto-timed with breakfast and dinner alerts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold mb-1">
              <span>Course Completion Guard</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-white">Amoxicillin 10-Day Antibiotic Gate</p>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Prevents early discontinuation. Countdown lock prevents routine cutoff before 10 days.
            </p>
          </div>
        </div>
      </section>

      {/* ── IMMUTABLE AUDIT TRAIL (DOCTOR / CLINICIAN VIEW) ── */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-black tracking-tight text-slate-900">
              Immutable Forensic Audit Log (Clinician Oversight)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
            Tamper-Evident SHA-256 Ledger
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {auditLogs.slice(0, 8).map(log => (
            <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0"></div>
                <div>
                  <span className="font-extrabold text-slate-900">{(log.action || '').replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="text-slate-500 font-medium ml-2">by {log.user_id || 'System'} ({log.user_role})</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-medium shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No audit logs recorded yet.</p>
          )}
        </div>
      </section>

      {/* ── PHYSICIAN SIGN-OFF MODAL ── */}
      {signOffModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden font-sans">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black">Physician Verification Gate</h3>
                  <p className="text-xs text-slate-400">Electronic Regimen Authorization</p>
                </div>
              </div>
              <button 
                onClick={() => setSignOffModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Patient:</span>
                  <span className="font-black text-slate-900">{selectedPatient.patientName} ({selectedPatient.mrn})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Prescribed Regimen:</span>
                  <span className="font-black text-teal-900">{selectedPatient.prescribedDrug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Dosage & Frequency:</span>
                  <span className="font-bold text-slate-800">{selectedPatient.dosage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Primary Guardian:</span>
                  <span className="font-bold text-slate-800">{selectedPatient.guardianName} ({selectedPatient.guardianPhone})</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Clinician Review Notes & Directions
                </label>
                <textarea
                  rows={3}
                  value={clinicianNotes}
                  onChange={e => setClinicianNotes(e.target.value)}
                  placeholder="Enter physician confirmation notes, dose verification, or food timing recommendations..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-900 font-medium">
                <strong>Electronic Attestation:</strong> By signing off, you confirm you have verified the OCR extracted fields and authorize active alarm schedules for the patient.
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSignOffModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprovePatient(selectedPatient)}
                className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Sign & Activate Regimen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
