import React, { useState } from 'react';
import { Bell, CheckCircle, CheckCheck, X, Pill, Clock, AlertCircle } from 'lucide-react';
import { useReminderAudio } from '../context/ReminderAudioContext';
import { acknowledgeReminder, reportIntake } from '../services/api';

export const ReminderNotification: React.FC = () => {
  const { activeNotification, dismissNotification } = useReminderAudio();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [intakeNote, setIntakeNote] = useState('');

  if (!activeNotification) return null;

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    try {
      await acknowledgeReminder(activeNotification.id, 'Patient', 'Alert seen on dashboard');
      dismissNotification();
    } catch (e) {
      // dismiss anyway for UI
      dismissNotification();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmIntake = async () => {
    setIsSubmitting(true);
    try {
      await reportIntake(activeNotification.id, 'Patient', intakeNote || 'Self-reported intake');
      setShowTakeModal(false);
      dismissNotification();
    } catch (e) {
      setShowTakeModal(false);
      dismissNotification();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-20 right-6 z-50 max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-teal-500 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider">Scheduled Medication Reminder</span>
          </div>
          <button onClick={dismissNotification} className="text-white/80 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
              <Pill className="w-5 h-5 -rotate-45" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900">{activeNotification.medicine_name}</h4>
              <p className="text-xs text-slate-600 mt-0.5">{activeNotification.confirmed_instructions}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-teal-800 font-semibold">
                <Clock className="w-3.5 h-3.5" /> Scheduled Time: {activeNotification.scheduled_time}
              </div>
            </div>
          </div>

          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-900">
            <strong>Clinical Safety Note:</strong> Acknowledging the alert does not record that medicine was taken. You must explicitly mark as taken if you swallowed your dose.
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={handleAcknowledge}
              disabled={isSubmitting}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              title="Record that you saw the reminder without confirming ingestion"
            >
              Acknowledge Alert
            </button>
            <button
              onClick={() => setShowTakeModal(true)}
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-teal-600/30"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Mark as Taken
            </button>
          </div>
        </div>
      </div>

      {/* Mark As Taken Confirmation Modal */}
      {showTakeModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" /> Confirm Medication Intake
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Are you reporting that you took <strong>{activeNotification.medicine_name}</strong> right now?
            </p>
            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Intake Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Taken with 1 glass of water and lunch"
                value={intakeNote}
                onChange={(e) => setIntakeNote(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowTakeModal(false)}
                className="px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmIntake}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl"
              >
                Yes, Record Intake
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
