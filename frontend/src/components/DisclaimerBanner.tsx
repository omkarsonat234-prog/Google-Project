import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface Props {
  variant?: 'standard' | 'warning' | 'compact';
  customMessage?: string;
}

export const DisclaimerBanner: React.FC<Props> = ({ variant = 'standard', customMessage }) => {
  if (variant === 'compact') {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>
          {customMessage || "MedBridge helps organize prescription information. It does not replace medical advice. Confirm unclear instructions with your doctor or pharmacist."}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-900">Important Healthcare Safety Notice</p>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            {customMessage || "MedBridge is an assistive organization tool and does not provide clinical diagnosis, medical advice, or independent dosage validation. An unverified extraction must never be used to initiate drug intake. Always confirm unclear or flagged instructions directly with your prescribing physician or licensed pharmacist."}
          </p>
        </div>
      </div>
    </div>
  );
};
