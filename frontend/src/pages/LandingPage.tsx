import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  BellRing, 
  FileSearch, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  HeartHandshake, 
  FileText,
  Clock,
  Pill
} from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

interface Props {
  onGetStarted: () => void;
  onExplorePresets: () => void;
}

export const LandingPage: React.FC<Props> = ({ onGetStarted, onExplorePresets }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Safety Notice */}
      <DisclaimerBanner variant="standard" />

      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto pt-6 pb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-800 text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Google Healthcare & Wellness Track MVP</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          From prescription to a <span className="text-brand-700">clearer medication routine.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          MedBridge helps patients and caregivers turn prescriptions into understandable daily routines through source-linked extraction, uncertainty detection, human verification gates, and distinct reminder tracking.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <button
            onClick={onGetStarted}
            className="px-6 py-3.5 bg-brand-700 hover:bg-brand-800 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-700/25 hover:shadow-brand-700/35 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            Launch MedBridge Dashboard <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExplorePresets}
            className="px-5 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-2xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            Explore Synthetic Demo Prescriptions
          </button>
        </div>
      </div>

      {/* The 5-Step Workflow */}
      <div className="my-16 bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900">How MedBridge Closes the Safety Gap</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Most reminder apps assume transcription is flawless. MedBridge links every field directly to the original physical prescription before any routine is activated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm mb-3">1</div>
            <h4 className="font-bold text-slate-800 text-xs mb-1">Upload / Capture</h4>
            <p className="text-[11px] text-slate-500">Secure backend processing of physical Rx slips or PDFs.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm mb-3">2</div>
            <h4 className="font-bold text-slate-800 text-xs mb-1">OCR Text Extraction</h4>
            <p className="text-[11px] text-slate-500">Extracts verbatim written text preserving raw unedited lines.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm mb-3">3</div>
            <h4 className="font-bold text-slate-800 text-xs mb-1">Source Linking</h4>
            <p className="text-[11px] text-slate-500">Side-by-side view highlighting exact bounding boxes on the slip.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm mb-3">4</div>
            <h4 className="font-bold text-slate-800 text-xs mb-1">Uncertainty Gate</h4>
            <p className="text-[11px] text-slate-500">Blocks schedule creation if instructions are blurry, vague, or missing.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-3">5</div>
            <h4 className="font-bold text-slate-800 text-xs mb-1">Verified Schedule</h4>
            <p className="text-[11px] text-slate-500">Daily routine with distinct alert acknowledgment vs reported intake.</p>
          </div>
        </div>
      </div>

      {/* 3 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-16">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-brand-300 transition-all">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">Prescription Understanding</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Never trust a black-box AI model blindly. Every extracted medicine name, dosage, frequency, and duration is explicitly tied to its corresponding line and coordinate box on the physical slip.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-brand-300 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">Safer Schedule Creation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Strict safety rules prevent hallucinating missing dosing times or guessing ambiguous handwriting. If instructions state "Use as directed", the routine cannot be activated until confirmed.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-brand-300 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
            <BellRing className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">Accountable Reminders</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            MedBridge keeps reminder acknowledgment distinct from medication intake. Acknowledging an alert records visibility; marking a dose as taken requires explicit self-report confirmation.
          </p>
        </div>
      </div>

      {/* Ready CTA */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-800 rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ready to test the interactive workflow?</h2>
        <p className="text-xs sm:text-sm text-brand-100 max-w-xl mx-auto leading-relaxed">
          Test real OCR extraction, blurry handwriting uncertainty triggers, human verification gates, and reminder delivery on synthetic clinical samples.
        </p>
        <button
          onClick={onGetStarted}
          className="mt-2 px-8 py-3.5 bg-white hover:bg-brand-50 text-brand-900 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-black/10 transition-transform transform hover:-translate-y-0.5 cursor-pointer"
        >
          Open MedBridge Application
        </button>
      </div>
    </div>
  );
};
