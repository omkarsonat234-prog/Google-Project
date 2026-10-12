import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Clock, 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle, 
  Edit3, 
  History, 
  Pill, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  X,
  Save,
  Plus,
  Trash2
} from 'lucide-react';
import { fetchSchedules, updateSchedule } from '../services/api';
import { MedicationSchedule, ScheduleStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal State
  const [editingSchedule, setEditingSchedule] = useState<MedicationSchedule | null>(null);
  const [editInstructions, setEditInstructions] = useState('');
  const [editTimes, setEditTimes] = useState<string[]>([]);
  const [newTimeInput, setNewTimeInput] = useState('12:00');
  const [editReason, setEditReason] = useState('');
  const [editStatus, setEditStatus] = useState<ScheduleStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // History Inspector Modal
  const [inspectHistorySchedule, setInspectHistorySchedule] = useState<MedicationSchedule | null>(null);

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSchedules(filterStatus === 'all' ? undefined : filterStatus, user.id);
      setSchedules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, [user.id, filterStatus]);

  const openEditModal = (sched: MedicationSchedule) => {
    setEditingSchedule(sched);
    setEditInstructions(sched.confirmed_instructions);
    setEditTimes([...sched.confirmed_schedule_times]);
    setEditStatus(sched.status);
    setEditReason('');
    setErrorMsg(null);
  };

  const handleSaveScheduleEdit = async () => {
    if (!editingSchedule) return;
    if (!editReason.trim()) {
      setErrorMsg("A clinical reason or rationale is required to amend a verified schedule.");
      return;
    }
    if (editTimes.length === 0) {
      setErrorMsg("At least one scheduled intake time must remain active.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSchedule(editingSchedule.id, {
        confirmed_instructions: editInstructions,
        confirmed_schedule_times: editTimes,
        status: editStatus,
        edit_reason: editReason,
        editor_identity: `${user.name} (${user.roleTitle})`,
      });

      setEditingSchedule(null);
      await loadSchedules();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update schedule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePause = async (sched: MedicationSchedule) => {
    const nextStatus = sched.status === 'active' ? 'paused' : 'active';
    try {
      await updateSchedule(sched.id, {
        status: nextStatus,
        edit_reason: `Status toggled to ${nextStatus} by ${user.roleTitle}`,
        editor_identity: user.name,
      });
      await loadSchedules();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Disclaimer */}
      <DisclaimerBanner variant="compact" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verified Medication Schedules
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Active daily medication routines backed by human verification audit records.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          {['all', 'active', 'paused', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                filterStatus === st
                  ? 'bg-white text-teal-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule List */}
      {schedules.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <CalendarClock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Verified Schedules Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            MedBridge never automatically generates dosing frequencies. Upload a prescription and complete the verification gate to establish an active routine.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((sched) => {
            const isActive = sched.status === 'active';
            const isClinical = sched.verification_status === 'clinical_verified';

            return (
              <div
                key={sched.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isClinical
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <ShieldCheck className="w-3 h-3" />
                      {isClinical ? 'Clinically Verified' : 'User-Reviewed Routine'}
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {sched.status.toUpperCase()} (v{sched.version})
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <Pill className="w-5 h-5 -rotate-45" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{sched.medicine_name}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {sched.confirmed_instructions}
                      </p>
                    </div>
                  </div>

                  {/* Scheduled Times */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Daily Intake Times
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sched.confirmed_schedule_times.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 font-bold rounded-lg text-xs flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3 text-teal-600" /> {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Dates & Verifier Info */}
                  <div className="mt-4 text-[11px] text-slate-500 space-y-1">
                    <div>
                      <span className="font-semibold text-slate-700">Started:</span> {sched.start_date || 'Today'}
                      {sched.end_date && <span> • <span className="font-semibold text-slate-700">Ends:</span> {sched.end_date}</span>}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700">Verified By:</span> {sched.verified_by}
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Non-destructive reviewable edit */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setInspectHistorySchedule(sched)}
                    className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" /> Version Log ({sched.history?.length || 0})
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePause(sched)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                      title={isActive ? 'Pause schedule' : 'Resume schedule'}
                    >
                      {isActive ? <PauseCircle className="w-4 h-4 text-amber-600" /> : <PlayCircle className="w-4 h-4 text-emerald-600" />}
                    </button>
                    <button
                      onClick={() => openEditModal(sched)}
                      className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Amend
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Edit Modal (Version-Preserving) */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Amend Schedule — {editingSchedule.medicine_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Current Version: v{editingSchedule.version} → Will advance to v{editingSchedule.version + 1}
                </p>
              </div>
              <button onClick={() => setEditingSchedule(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              <strong>Non-Destructive Amendment:</strong> Changes are versioned in history with your identity and reason for clinical safety.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmed Instructions</label>
                <textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Intake Times</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editTimes.map((t) => (
                    <span key={t} className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-bold flex items-center gap-1">
                      {t}
                      <button onClick={() => setEditTimes(editTimes.filter(x => x !== t))} className="text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newTimeInput}
                    onChange={(e) => setNewTimeInput(e.target.value)}
                    className="p-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    onClick={() => {
                      if (newTimeInput && !editTimes.includes(newTimeInput)) {
                        setEditTimes([...editTimes, newTimeInput].sort());
                      }
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Time
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amendment Reason / Rationale <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Adjusted morning time to align with delayed breakfast per Dr. Jenkins"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingSchedule(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScheduleEdit}
                disabled={isSubmitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" /> Save Schedule Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {inspectHistorySchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                Version History: {inspectHistorySchedule.medicine_name}
              </h3>
              <button onClick={() => setInspectHistorySchedule(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2.5">
              {inspectHistorySchedule.history && inspectHistorySchedule.history.length > 0 ? (
                inspectHistorySchedule.history.map((h, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>Version {h.version}</span>
                      <span className="text-[10px] text-slate-400">{h.archived_at || h.timestamp}</span>
                    </div>
                    {h.reason && <p className="text-slate-600"><strong>Reason:</strong> {h.reason}</p>}
                    {h.editor && <p className="text-slate-500 text-[11px]"><strong>Editor:</strong> {h.editor}</p>}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Initial version active (v1). No amendments recorded yet.</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectHistorySchedule(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
