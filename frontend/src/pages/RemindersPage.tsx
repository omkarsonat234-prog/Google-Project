import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  CheckCheck, 
  AlertCircle, 
  Pill, 
  Sparkles, 
  ShieldAlert, 
  Volume2, 
  Calendar,
  X
} from 'lucide-react';
import { fetchReminders, acknowledgeReminder, reportIntake, triggerTestReminder } from '../services/api';
import { ReminderEvent } from '../types';
import { useAuth } from '../context/AuthContext';
import { useReminderAudio } from '../context/ReminderAudioContext';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const RemindersPage: React.FC = () => {
  const { user } = useAuth();
  const { triggerAudioAlert } = useReminderAudio();
  const [reminders, setReminders] = useState<ReminderEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Take Modal
  const [intakeModalRem, setIntakeModalRem] = useState<ReminderEvent | null>(null);
  const [intakeNote, setIntakeNote] = useState('');

  const loadReminders = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReminders(undefined, user.id);
      setReminders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, [user.id]);

  const handleAcknowledge = async (rem: ReminderEvent) => {
    setActionLoadingId(rem.id);
    try {
      await acknowledgeReminder(rem.id, user.name, 'Acknowledged by user on reminders timeline');
      await loadReminders();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmIntake = async () => {
    if (!intakeModalRem) return;
    setActionLoadingId(intakeModalRem.id);
    try {
      await reportIntake(
        intakeModalRem.id,
        user.name,
        intakeNote || 'Self-reported intake'
      );
      setIntakeModalRem(null);
      setIntakeNote('');
      await loadReminders();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTriggerLiveAlert = async () => {
    try {
      const rem = await triggerTestReminder('Amoxicillin 500mg', 'Take 1 capsule orally with meals (Instant Demo Alert)');
      triggerAudioAlert(rem);
      await loadReminders();
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
            Accountable Medication Reminders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Separating reminder acknowledgment from user-reported medication intake for clinical fidelity.
          </p>
        </div>

        <button
          onClick={handleTriggerLiveAlert}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-amber-700/20 self-start sm:self-auto cursor-pointer"
        >
          <Volume2 className="w-4 h-4" /> Trigger Live Web Audio Alert
        </button>
      </div>

      {/* Explanatory Safety Box */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-3xl p-6 text-xs text-teal-950 space-y-2">
        <h4 className="font-bold text-teal-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-teal-700" />
          The Clinical Distinction: Acknowledgment vs. Intake
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="bg-white/80 p-3.5 rounded-xl border border-teal-200/80">
            <span className="font-bold text-amber-900 block mb-0.5">1. Acknowledge Reminder</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Notes that the patient saw the notification. <em>Does not claim or establish that the medicine was taken.</em>
            </p>
          </div>
          <div className="bg-white/80 p-3.5 rounded-xl border border-teal-200/80">
            <span className="font-bold text-emerald-900 block mb-0.5">2. Report Intake (Mark as Taken)</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              A voluntary self-report by the patient or caregiver recording that the medicine was swallowed. Preserved distinctly in the audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* Reminder Cards Timeline */}
      {reminders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Reminders Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Reminders are spawned automatically once a prescription schedule is reviewed and verified.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reminders.map((rem) => {
            const isAck = rem.acknowledged;
            const isTaken = rem.intake_reported;

            return (
              <div
                key={rem.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 hover:border-teal-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Pill className="w-6 h-6 -rotate-45" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900">{rem.medicine_name}</h4>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-600" /> {rem.scheduled_time}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Date: {rem.date}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                      {rem.confirmed_instructions}
                    </p>

                    {/* Status Pills */}
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        isAck ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isAck ? `✓ Alert Acknowledged (${rem.acknowledged_at ? new Date(rem.acknowledged_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Logged'})` : 'Alert Pending Delivery'}
                      </span>

                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        isTaken ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isTaken ? `✓ Intake Reported (${rem.intake_reported_at ? new Date(rem.intake_reported_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Reported'})` : 'Intake Not Yet Reported'}
                      </span>
                    </div>

                    {rem.intake_notes && (
                      <p className="text-[11px] text-emerald-800 font-medium italic pt-1">
                        Note: "{rem.intake_notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side Buttons: Distinct actions */}
                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                  {!isAck && (
                    <button
                      onClick={() => handleAcknowledge(rem)}
                      disabled={actionLoadingId === rem.id}
                      className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Acknowledge Alert
                    </button>
                  )}

                  {!isTaken ? (
                    <button
                      onClick={() => {
                        setIntakeModalRem(rem);
                        setIntakeNote('');
                      }}
                      disabled={actionLoadingId === rem.id}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-teal-600/20 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark as Taken
                    </button>
                  ) : (
                    <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" /> Dose Complete
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Intake Self-Report */}
      {intakeModalRem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-600" />
                Report Intake Confirmation
              </h3>
              <button onClick={() => setIntakeModalRem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are recording that <strong>{intakeModalRem.medicine_name}</strong> was taken by the patient at this time.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Intake Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Swallowed with whole glass of water after lunch"
                value={intakeNote}
                onChange={(e) => setIntakeNote(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIntakeModalRem(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmIntake}
                disabled={actionLoadingId !== null}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                Confirm Dose Taken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
