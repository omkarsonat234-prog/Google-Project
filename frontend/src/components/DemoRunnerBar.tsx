import React, { useState } from 'react';
import { Sparkles, Play, RotateCcw, ChevronUp, ChevronDown, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { seedFullDemo, resetDemo, triggerTestReminder } from '../services/api';
import { useReminderAudio } from '../context/ReminderAudioContext';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh?: () => void;
}

const DEMO_STEPS = [
  { step: 1, tab: 'dashboard', label: '1. Dashboard Overview', tip: 'View real stats, medication supplies, and routine overview.' },
  { step: 2, tab: 'upload', label: '2. Select / Upload Prescription', tip: 'Try the 5 clinical presets (Clear, Blurry, Missing, Multi, Conflicting).' },
  { step: 3, tab: 'upload', label: '3. Source-Linked Extraction', tip: 'Hover fields on the right to see exact bounding boxes on the Rx slip.' },
  { step: 4, tab: 'upload', label: '4. Uncertainty Detection', tip: 'Notice blurry & missing fields flagged in amber with clinical reasons.' },
  { step: 5, tab: 'upload', label: '5. Verification Gate', tip: 'Notice activation is blocked until checklist is confirmed or clinician overrides.' },
  { step: 6, tab: 'schedules', label: '6. Active Daily Schedule', tip: 'Inspect the non-destructive versioned schedule timeline.' },
  { step: 7, tab: 'reminders', label: '7. Reminders (Ack vs Taken)', tip: 'Acknowledge alert without claiming pill was swallowed; mark taken separately.' },
  { step: 8, tab: 'dashboard', label: '8. Care Guardian', tip: 'Designated person responsible for patient care (Elena Vance).' },
  { step: 9, tab: 'dashboard', label: '9. Clinical Audit & Security', tip: 'Tamper-evident forensic audit logs preserved securely in the backend.' },
];

export const DemoRunnerBar: React.FC<Props> = ({ activeTab, setActiveTab, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const { triggerAudioAlert } = useReminderAudio();

  const handleSeedDemo = async () => {
    setLoadingAction('seeding');
    try {
      await seedFullDemo();
      if (onRefresh) onRefresh();
      setActiveTab('dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    setLoadingAction('resetting');
    try {
      await resetDemo();
      if (onRefresh) onRefresh();
      setActiveTab('dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTriggerInstantAlert = async () => {
    try {
      const rem = await triggerTestReminder('Amoxicillin 500mg', 'Take 1 capsule orally with meals (Demo Alert)');
      triggerAudioAlert(rem);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside aria-label="Hackathon Demo Assistant" className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900 text-white border-t border-slate-800 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Left: Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hackathon 90s Demo Suite</span>
          </div>
          <span className="hidden md:inline text-xs text-slate-400">
            One-click interactive demonstration flow for judges
          </span>
        </div>

        {/* Center: Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedDemo}
            disabled={loadingAction !== null}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="Populate complete hackathon state (1 verified schedule, 2 flagged prescriptions, today's reminders)"
          >
            <Play className="w-3 h-3 fill-current" />
            {loadingAction === 'seeding' ? 'Seeding...' : 'Seed Full Demo Data'}
          </button>

          <button
            onClick={handleTriggerInstantAlert}
            className="px-3 py-1.5 bg-amber-600/90 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Trigger instant Web Audio chime and live notification toast"
          >
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
            Test Live Alert
          </button>

          <button
            onClick={handleReset}
            disabled={loadingAction !== null}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
            title="Clean database back to fresh state"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1 transition-all"
            title="Toggle step-by-step walkthrough"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable 9-Step Guide */}
      {isExpanded && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 max-w-7xl mx-auto animate-in slide-in-from-bottom-2 duration-150">
          <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">
            90-Second Structured Presentation Flow
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {DEMO_STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => {
                  setActiveTab(s.tab);
                  setIsExpanded(false);
                }}
                className={`text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  activeTab === s.tab
                    ? 'bg-teal-950/70 border-teal-500/50 text-teal-100'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between w-full font-bold mb-1">
                  <span>{s.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </div>
                <span className="text-[11px] text-slate-400 leading-tight">{s.tip}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
