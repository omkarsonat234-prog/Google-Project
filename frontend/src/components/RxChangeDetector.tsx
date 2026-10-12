import React, { useState } from 'react';
import { 
  GitCompare, 
  ArrowRight, 
  AlertTriangle, 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  Pill,
  X,
  FileText
} from 'lucide-react';
import { MedicationSchedule, MedicineExtracted } from '../types';

interface ComparisonEntry {
  medicineName: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  previousText?: string;
  newText?: string;
  clinicalSignificance: string;
  isUncertain: boolean;
}

interface Props {
  previousSchedules: MedicationSchedule[];
  newPrescriptionMedicines: MedicineExtracted[];
  onConfirmChanges?: () => void;
  onClose?: () => void;
}

export const RxChangeDetector: React.FC<Props> = ({
  previousSchedules,
  newPrescriptionMedicines,
  onConfirmChanges,
  onClose,
}) => {
  // Built-in clinical comparison logic
  const comparisons: ComparisonEntry[] = [];

  // Check new medicines against previous schedules
  newPrescriptionMedicines.forEach(newMed => {
    const prev = previousSchedules.find(s => 
      s.medicine_name.toLowerCase().includes(newMed.name_as_written.toLowerCase()) ||
      newMed.name_as_written.toLowerCase().includes(s.medicine_name.toLowerCase())
    );

    if (!prev) {
      // Newly added medicine
      comparisons.push({
        medicineName: newMed.name_as_written,
        type: 'added',
        newText: newMed.instructions_as_written || `${newMed.strength_as_written || ''} - ${newMed.frequency_as_written || 'Prescribed'}`,
        clinicalSignificance: 'New therapy initiated. Check for drug interactions with existing regimens.',
        isUncertain: newMed.uncertain_fields.length > 0,
      });
    } else {
      // Compare instructions
      const prevInstructions = prev.confirmed_instructions.toLowerCase().trim();
      const newInstructions = (newMed.instructions_as_written || '').toLowerCase().trim();

      if (prevInstructions !== newInstructions && newInstructions !== '') {
        comparisons.push({
          medicineName: newMed.name_as_written,
          type: 'modified',
          previousText: prev.confirmed_instructions,
          newText: newMed.instructions_as_written || undefined,
          clinicalSignificance: 'Dosage or schedule modification detected. Requires clinical confirmation before updating routine.',
          isUncertain: newMed.uncertain_fields.includes('instructions_as_written') || newMed.uncertain_fields.includes('frequency_as_written'),
        });
      } else {
        comparisons.push({
          medicineName: newMed.name_as_written,
          type: 'unchanged',
          previousText: prev.confirmed_instructions,
          newText: prev.confirmed_instructions,
          clinicalSignificance: 'No alterations detected. Continuing existing schedule.',
          isUncertain: false,
        });
      }
    }
  });

  // Check for medicines present in previous schedules but absent in new prescription
  previousSchedules.forEach(prev => {
    const stillPresent = newPrescriptionMedicines.some(newMed => 
      newMed.name_as_written.toLowerCase().includes(prev.medicine_name.toLowerCase()) ||
      prev.medicine_name.toLowerCase().includes(newMed.name_as_written.toLowerCase())
    );

    if (!stillPresent) {
      comparisons.push({
        medicineName: prev.medicine_name,
        type: 'removed',
        previousText: prev.confirmed_instructions,
        clinicalSignificance: 'Medication absent from updated prescription slip. Verify if therapy was intentionally discontinued or completed.',
        isUncertain: false,
      });
    }
  });

  const addedCount = comparisons.filter(c => c.type === 'added').length;
  const modifiedCount = comparisons.filter(c => c.type === 'modified').length;
  const removedCount = comparisons.filter(c => c.type === 'removed').length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden font-sans max-w-4xl w-full mx-auto">
      
      {/* ── Top Header ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/40">
                RxChange™ Detector
              </span>
              <span className="text-xs text-slate-300 font-bold">Prescription Version Comparison</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
              Know what changed before updating the routine.
            </h2>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        
        {/* ── Clinical Safeguard Warning Banner (Required by Clinical Protocol) ── */}
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <h4 className="font-black text-amber-900">Mandatory Human Confirmation Safeguard</h4>
            <p className="mt-0.5 font-medium">
              Never assume that a textual difference means a clinically meaningful dose change. The user or attending pharmacist must confirm the new instructions with an appropriate healthcare professional before updating the active daily schedule.
            </p>
          </div>
        </div>

        {/* ── Comparison Summary Counts ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-xs font-black text-emerald-800">+{addedCount} Added</span>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">New Medications</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-xs font-black text-amber-800">Δ {modifiedCount} Modified</span>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">Dosage / Timing Shift</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
            <span className="text-xs font-black text-rose-800">-{removedCount} Discontinued</span>
            <p className="text-[10px] text-rose-600 font-bold mt-0.5">Not In New Slip</p>
          </div>
        </div>

        {/* ── Detailed Comparison List ── */}
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Detected Medication Alterations
          </h4>

          {comparisons.map((item, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                item.type === 'added'
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : item.type === 'removed'
                  ? 'bg-rose-50/50 border-rose-200'
                  : item.type === 'modified'
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.type === 'added' && <PlusCircle className="w-4 h-4 text-emerald-600" />}
                  {item.type === 'removed' && <MinusCircle className="w-4 h-4 text-rose-600" />}
                  {item.type === 'modified' && <RefreshCw className="w-4 h-4 text-amber-600" />}
                  {item.type === 'unchanged' && <CheckCircle2 className="w-4 h-4 text-slate-400" />}
                  <h5 className="text-sm font-black text-slate-900">{item.medicineName}</h5>
                </div>

                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  item.type === 'added'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : item.type === 'removed'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : item.type === 'modified'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {item.type.toUpperCase()}
                </span>
              </div>

              {/* Diff Content Box */}
              {item.type === 'modified' && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Previous Active Instruction:
                    </span>
                    <p className="font-semibold text-slate-700 mt-0.5 line-through decoration-rose-500">
                      {item.previousText}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-amber-300 shadow-2xs">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      New Detected Instruction:
                    </span>
                    <p className="font-extrabold text-slate-900 mt-0.5">
                      {item.newText}
                    </p>
                  </div>
                </div>
              )}

              {item.type === 'added' && (
                <div className="mt-2 text-xs text-emerald-950 font-semibold">
                  New Rx instruction: <span className="font-extrabold">{item.newText}</span>
                </div>
              )}

              {item.type === 'removed' && (
                <div className="mt-2 text-xs text-rose-900 font-semibold">
                  Previously taken as: <span className="line-through">{item.previousText}</span>
                </div>
              )}

              {/* Clinical rationale */}
              <p className="text-[11px] text-slate-500 font-medium mt-2 leading-snug">
                💡 {item.clinicalSignificance}
              </p>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Changes require Verification Gate confirmation before activating reminders.
          </span>

          {onConfirmChanges && (
            <button
              onClick={onConfirmChanges}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              Proceed to Verification Gate <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
