import React from 'react';
import { Pill, Shield, HeartHandshake, Cloud } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 pb-16 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                <Pill className="w-4 h-4 -rotate-45" />
              </div>
              <span className="text-base font-bold text-slate-900">MedBridge</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs max-w-md">
              From prescription to a clearer medication routine. MedBridge empowers patients and caregivers through transparent OCR source linking, AI uncertainty detection, human verification gates, and distinct reminder tracking.
            </p>
            <div className="flex items-center gap-2 text-teal-800 font-semibold text-[11px]">
              <Cloud className="w-3.5 h-3.5 text-teal-600" />
              <span>Built for Healthcare & Wellness — Powered by Google Cloud Technologies</span>
            </div>
          </div>

          {/* Core Principles */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Safety Principles</h4>
            <ul className="space-y-1.5 text-slate-600">
              <li>• Never guess ambiguous handwriting</li>
              <li>• Zero unverified schedule activations</li>
              <li>• Transparent source-linked text traces</li>
              <li>• Distinct reminder acknowledgment vs intake</li>
              <li>• Explicit caregiver authorization</li>
            </ul>
          </div>

          {/* Google Stack */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Google Tech Stack</h4>
            <ul className="space-y-1.5 text-slate-600">
              <li>• Google Cloud Vision OCR</li>
              <li>• Google Gemini 2.0 / 1.5 Structuring</li>
              <li>• Google Cloud Run Architecture</li>
              <li>• High-Fidelity Local Fallback Adapters</li>
              <li>• Zero Hardcoded Secrets Standard</li>
            </ul>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            <strong>Medical Disclaimer:</strong> MedBridge is an assistive workflow assistant. It does not replace medical advice, diagnosis, or pharmacotherapy decisions. Confirm all medication schedules with your prescribing physician or pharmacist.
          </p>
          <p className="shrink-0">
            © 2026 MedBridge. Hackathon Demonstration Edition.
          </p>
        </div>
      </div>
    </footer>
  );
};
