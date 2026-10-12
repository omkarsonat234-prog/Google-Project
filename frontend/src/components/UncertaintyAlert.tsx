import React from 'react';
import { AlertTriangle, ShieldX, HelpCircle, ArrowRight } from 'lucide-react';

interface Props {
  uncertainFields: string[];
  reasons: Record<string, string>;
  onFocusField?: (fieldKey: string) => void;
}

export const UncertaintyAlert: React.FC<Props> = ({
  uncertainFields,
  reasons,
  onFocusField,
}) => {
  if (!uncertainFields || uncertainFields.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-5 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold">All visible prescription fields extracted with high legibility.</span>
        </div>
        <span className="text-emerald-700 font-medium">Ready for verification gate</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-5 mb-6 shadow-xs animate-in fade-in duration-200">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-700" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <span>Uncertainty Detected ({uncertainFields.length} field{uncertainFields.length > 1 ? 's' : ''} flagged)</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                Schedule Activation Blocked
              </span>
            </h4>
          </div>

          <p className="text-xs text-amber-900 mt-1 leading-relaxed">
            For patient safety, MedBridge strictly prohibits guessing illegible words or inventing missing dosing intervals. The following fields require manual correction or pharmacist confirmation:
          </p>

          <div className="mt-3.5 space-y-2">
            {uncertainFields.map((field) => {
              const label = field.replace('_as_written', '').replace('_', ' ');
              const reason = reasons[field] || 'Instruction text is ambiguous, illegible, or incomplete.';
              return (
                <div
                  key={field}
                  className="bg-white/80 border border-amber-200/90 rounded-xl p-3 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-amber-950 uppercase tracking-wide text-[10px]">
                      {label}
                    </span>
                    <p className="text-slate-700">{reason}</p>
                  </div>
                  {onFocusField && (
                    <button
                      onClick={() => onFocusField(field)}
                      className="text-amber-700 hover:text-amber-900 font-bold shrink-0 flex items-center gap-1 hover:underline text-[11px]"
                    >
                      Resolve <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
