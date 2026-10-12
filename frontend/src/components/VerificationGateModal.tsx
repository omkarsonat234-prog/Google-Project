import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Clock, 
  Plus, 
  Trash2, 
  UserCheck, 
  Calendar 
} from 'lucide-react';
import { MedicineExtracted } from '../types';
import { useAuth } from '../context/AuthContext';
import { verifyMedication } from '../services/api';

interface Props {
  medicine: MedicineExtracted;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export const VerificationGateModal: React.FC<Props> = ({
  medicine,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  // Verification Checklist State
  const [checklist, setChecklist] = useState({
    name: true,
    strength: true,
    instructions: medicine.uncertain_fields.length === 0,
    timing: medicine.uncertain_fields.length === 0,
    contraindications: false,
  });

  // Daily schedule times
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(['08:00', '20:00']);
  const [newTimeInput, setNewTimeInput] = useState('14:00');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [verifierNotes, setVerifierNotes] = useState('');
  const [overrideUncertainty, setOverrideUncertainty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasUnresolvedUncertainties = medicine.uncertain_fields.length > 0;
  const isClinician = ['pharmacist', 'physician'].includes(user.role);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addTime = () => {
    if (newTimeInput && !scheduleTimes.includes(newTimeInput)) {
      setScheduleTimes([...scheduleTimes, newTimeInput].sort());
    }
  };

  const removeTime = (timeToRemove: string) => {
    setScheduleTimes(scheduleTimes.filter(t => t !== timeToRemove));
  };

  const handleConfirmVerification = async () => {
    setErrorMsg(null);

    // Validation
    if (!checklist.name || !checklist.strength || !checklist.instructions) {
      setErrorMsg("Please complete the required checklist items (Name, Strength, and Instructions).");
      return;
    }

    if (scheduleTimes.length === 0) {
      setErrorMsg("At least one scheduled intake time must be confirmed before activating reminders.");
      return;
    }

    if (hasUnresolvedUncertainties && !overrideUncertainty) {
      setErrorMsg(
        `Cannot activate schedule: Uncertain fields [${medicine.uncertain_fields.join(', ')}] remain unresolved. Either correct them or provide documented clinical override.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyMedication(medicine.id, {
        verifier_identity: user.name,
        verifier_role: user.role,
        confirmed_schedule_times: scheduleTimes,
        confirmed_start_date: startDate,
        confirmed_end_date: endDate || undefined,
        notes: verifierNotes || undefined,
        override_uncertainty: overrideUncertainty,
      });

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Verification gate blocked schedule activation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Verification Gate & Schedule Activation</h3>
              <p className="text-xs text-teal-100/90">Human confirmation required before generating active reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Honest Status Label Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-teal-700" />
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Verifier: <span className="text-teal-900 font-bold">{user.name}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Designated Role: <span className="font-semibold">{user.roleTitle}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                isClinician 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {isClinician ? 'Will record: Clinically Verified' : 'Will record: User-Reviewed Schedule'}
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isClinician ? 'Licensed Healthcare Credential' : 'Awaiting Clinician Verification'}
              </p>
            </div>
          </div>

          {/* Uncertainty Warning if exists */}
          {hasUnresolvedUncertainties && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-xs text-amber-950">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">Uncertain Fields Flagged</h5>
                  <p className="mt-0.5">
                    Fields [{medicine.uncertain_fields.join(', ')}] were flagged by AI. MedBridge blocks activation unless explicitly resolved.
                  </p>
                  <label className="mt-3 flex items-center gap-2 cursor-pointer font-semibold text-amber-900">
                    <input
                      type="checkbox"
                      checked={overrideUncertainty}
                      onChange={(e) => setOverrideUncertainty(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span>I have verbally confirmed the instructions with the doctor/pharmacist and wish to proceed.</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Verification Checklist */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              1. Verification Safety Checklist (Mandatory)
            </h4>
            <div className="space-y-2">
              <label 
                onClick={() => toggleCheck('name')} 
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs"
              >
                {checklist.name ? <CheckSquare className="w-4 h-4 text-teal-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span className="font-semibold text-slate-800">
                  Medicine Name matches prescription: <span className="text-teal-700 font-bold">{medicine.name_as_written}</span>
                </span>
              </label>

              <label 
                onClick={() => toggleCheck('strength')} 
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs"
              >
                {checklist.strength ? <CheckSquare className="w-4 h-4 text-teal-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span className="font-semibold text-slate-800">
                  Strength / Dosage verified: <span className="text-teal-700 font-bold">{medicine.strength_as_written || 'As written'}</span>
                </span>
              </label>

              <label 
                onClick={() => toggleCheck('instructions')} 
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs"
              >
                {checklist.instructions ? <CheckSquare className="w-4 h-4 text-teal-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span className="font-semibold text-slate-800">
                  Instructions & route confirmed: <span className="text-teal-700 font-bold">{medicine.instructions_as_written || 'N/A'}</span>
                </span>
              </label>

              <label 
                onClick={() => toggleCheck('timing')} 
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs"
              >
                {checklist.timing ? <CheckSquare className="w-4 h-4 text-teal-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                <span className="font-semibold text-slate-800">
                  Dosing frequency & meal relation confirmed ({medicine.frequency_as_written || 'Confirmed with reviewer'})
                </span>
              </label>
            </div>
          </div>

          {/* Step 2: Confirmed Schedule Times */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              2. Confirmed Daily Schedule Times (24-Hour Clock)
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {scheduleTimes.map(time => (
                <span 
                  key={time} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold"
                >
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  {time}
                  <button 
                    onClick={() => removeTime(time)}
                    className="text-teal-600 hover:text-red-600 p-0.5"
                    title="Remove time"
                  >
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
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={addTime}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Time
              </button>
            </div>
          </div>

          {/* Step 3: Dates & Audit Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
                placeholder="Indefinite if empty"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Verification Audit Note (Optional)
            </label>
            <textarea
              value={verifierNotes}
              onChange={(e) => setVerifierNotes(e.target.value)}
              placeholder="e.g. Verified with prescription bottle label and confirmed dosage with Dr. Jenkins."
              rows={2}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmVerification}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-700/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            {isSubmitting ? 'Recording Verification...' : 'Confirm & Activate Routine'}
          </button>
        </div>
      </div>
    </div>
  );
};
