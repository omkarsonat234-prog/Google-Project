import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = '/api';

interface SugarLog {
  id: string;
  glucose_mg_dl: number;
  reading_type: string;
  meal_context: string;
  clinical_flag: 'hypo' | 'optimal' | 'elevated' | 'hyper';
  suggested_steps: string[];
  measured_at: string;
  notes?: string;
}

interface DietaryGuide {
  strictly_avoid: string[];
  limit_carefully: string[];
  recommended: string[];
}

const FLAG_CONFIG = {
  hypo:     { label: 'Hypoglycemia',  color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   badge: 'bg-blue-100 text-blue-800',   icon: '🔵', barColor: 'bg-blue-500' },
  optimal:  { label: 'Normal Range',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200',  badge: 'bg-green-100 text-green-800', icon: '✅', barColor: 'bg-green-500' },
  elevated: { label: 'Elevated',      color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',  badge: 'bg-amber-100 text-amber-800', icon: '⚠️', barColor: 'bg-amber-400' },
  hyper:    { label: 'Hyperglycemia', color: 'text-red-700',    bg: 'bg-red-50 border-red-200',      badge: 'bg-red-100 text-red-800',     icon: '🔴', barColor: 'bg-red-500' },
};

const READING_TYPES = [
  { value: 'fasting_preprandial', label: 'Fasting / Pre-Meal (Preprandial)' },
  { value: 'postprandial_2hr',    label: '2 Hours After Meal (Postprandial)' },
  { value: 'bedtime',            label: 'Bedtime Reading' },
  { value: 'random',             label: 'Random Check' },
];

const MEAL_CONTEXTS = [
  { value: 'before_breakfast', label: 'Before Breakfast' },
  { value: 'after_breakfast',  label: 'After Breakfast (2h)' },
  { value: 'before_lunch',     label: 'Before Lunch' },
  { value: 'after_lunch',      label: 'After Lunch (2h)' },
  { value: 'before_dinner',    label: 'Before Dinner' },
  { value: 'after_dinner',     label: 'After Dinner (2h)' },
];

// Glucose meter bar (0–400 scale)
function GlucoseMeter({ value }: { value: number }) {
  const pct = Math.min(100, (value / 400) * 100);
  const color = value < 70 ? 'bg-blue-500' : value <= 130 ? 'bg-green-500' : value <= 180 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>0</span><span>70 (Hypo)</span><span>130</span><span>180</span><span>400+ mg/dL</span>
      </div>
      <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative">
        {/* Target zone */}
        <div className="absolute h-full bg-green-100 rounded-full" style={{ left: '17.5%', width: '30%' }} />
        {/* Value bar */}
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs mt-1 text-gray-400">
        <span className="text-blue-600 font-medium">↑ Hypoglycemia</span>
        <span className="text-green-600 font-medium">✓ Target Zone</span>
        <span className="text-red-600 font-medium">↑ Hyperglycemia</span>
      </div>
    </div>
  );
}

export function DiabetesTrackerPage() {
  const { user } = useAuth();
  const patientId = (user as any)?.id || 'demo-patient';

  const [logs, setLogs] = useState<SugarLog[]>([]);
  const [dietGuide, setDietGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'diet'>('log');
  const [form, setForm] = useState({
    glucose_mg_dl: '',
    reading_type: 'fasting_preprandial',
    meal_context: 'before_breakfast',
    notes: ''
  });

  const DEMO_LOGS: SugarLog[] = [
    { id: 'bsl-001', glucose_mg_dl: 118, reading_type: 'fasting_preprandial', meal_context: 'before_breakfast', clinical_flag: 'optimal', suggested_steps: ['✅ Excellent control. Maintain current routine.'], measured_at: new Date(Date.now() - 864e5).toISOString() },
    { id: 'bsl-002', glucose_mg_dl: 198, reading_type: 'postprandial_2hr', meal_context: 'after_lunch', clinical_flag: 'elevated', suggested_steps: ['⚠️ Slightly elevated. Avoid high-GI carbs.', 'Take a 15-min walk after meals.'], measured_at: new Date(Date.now() - 2*3600*1000).toISOString() },
    { id: 'bsl-003', glucose_mg_dl: 62, reading_type: 'bedtime', meal_context: 'before_dinner', clinical_flag: 'hypo', suggested_steps: ['⚠️ HYPOGLYCEMIA ALERT: Consume 15g fast-acting carbs immediately.'], measured_at: new Date(Date.now() - 3*864e5).toISOString() },
  ];

  async function loadData() {
    setLoading(true);
    try {
      const [logsRes, dietRes] = await Promise.all([
        fetch(`${API}/sugar/logs?patient_id=${patientId}&limit=20`),
        fetch(`${API}/sugar/dietary-guide`)
      ]);
      const logsData = logsRes.ok ? await logsRes.json() : DEMO_LOGS;
      const dietData = dietRes.ok ? await dietRes.json() : null;
      setLogs(logsData.length > 0 ? logsData : DEMO_LOGS);
      setDietGuide(dietData);
    } catch {
      setLogs(DEMO_LOGS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    const glucose = parseFloat(form.glucose_mg_dl);
    if (!glucose || glucose < 20 || glucose > 600) {
      alert('Please enter a valid blood glucose value (20–600 mg/dL).');
      return;
    }
    setLogging(true);
    try {
      const res = await fetch(`${API}/sugar/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, glucose_mg_dl: glucose, patient_id: patientId })
      });
      const data = res.ok ? await res.json() : {
        glucose_mg_dl: glucose,
        clinical_flag: glucose < 70 ? 'hypo' : glucose <= 130 ? 'optimal' : glucose <= 180 ? 'elevated' : 'hyper',
        flag_label: glucose < 70 ? 'Hypoglycemia' : glucose <= 130 ? 'Normal Range' : glucose <= 180 ? 'Elevated' : 'Hyperglycemia',
        suggested_steps: ['Monitor closely and consult your healthcare provider.']
      };
      setLatestResult(data);
      setActiveTab('log');
      loadData();
    } finally {
      setLogging(false);
    }
  }

  const avgGlucose = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + l.glucose_mg_dl, 0) / logs.length) : 0;
  const lastFlag = logs[0]?.clinical_flag || 'optimal';
  const lastCfg = FLAG_CONFIG[lastFlag];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">🩸 Diabetes & Blood Sugar Tracker</h1>
            <p className="text-slate-500 mt-1">Log, monitor, and manage your blood glucose levels</p>
          </div>
          <div className={`px-4 py-2 rounded-xl border text-sm font-semibold ${lastCfg.bg} ${lastCfg.color}`}>
            {lastCfg.icon} Last Reading: {lastCfg.label}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Average Glucose', value: `${avgGlucose} mg/dL`, icon: '📊', sub: 'Last 20 readings' },
            { label: 'Logs Recorded', value: logs.length, icon: '📝', sub: 'Total entries' },
            { label: 'Optimal Readings', value: logs.filter(l => l.clinical_flag === 'optimal').length, icon: '✅', sub: 'In range' },
            { label: 'High Alerts', value: logs.filter(l => ['elevated','hyper'].includes(l.clinical_flag)).length, icon: '⚠️', sub: 'Above target' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          {([['log','📝 Log Reading'], ['history','📈 History'], ['diet','🥗 Dietary Guide']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-rose-600 text-white shadow' : 'text-slate-600 hover:bg-gray-50'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* LOG TAB */}
        {activeTab === 'log' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">📝 Record Blood Glucose</h2>
              <form onSubmit={handleLogSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Blood Glucose (mg/dL) *</label>
                  <div className="relative">
                    <input type="number" min="20" max="600" step="0.1"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-2xl font-bold text-center focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="e.g. 126"
                      value={form.glucose_mg_dl}
                      onChange={e => setForm(f => ({ ...f, glucose_mg_dl: e.target.value }))} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">mg/dL</span>
                  </div>
                  {form.glucose_mg_dl && <GlucoseMeter value={parseFloat(form.glucose_mg_dl) || 0} />}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reading Type</label>
                  <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    value={form.reading_type} onChange={e => setForm(f => ({ ...f, reading_type: e.target.value }))}>
                    {READING_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Meal Context</label>
                  <select className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    value={form.meal_context} onChange={e => setForm(f => ({ ...f, meal_context: e.target.value }))}>
                    {MEAL_CONTEXTS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (optional)</label>
                  <input className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                    placeholder="e.g. Had rice for lunch, feeling dizzy"
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <button type="submit" disabled={logging}
                  className="w-full bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl py-3 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
                  {logging ? 'Analysing…' : '🩸 Log & Get Assessment'}
                </button>
              </form>
            </div>

            {/* Result panel */}
            <div>
              {latestResult ? (
                <div className={`rounded-2xl border-2 p-6 ${FLAG_CONFIG[latestResult.clinical_flag as keyof typeof FLAG_CONFIG]?.bg}`}>
                  <div className="text-center mb-4">
                    <div className="text-5xl font-black text-slate-900">{latestResult.glucose_mg_dl}</div>
                    <div className="text-gray-500 font-medium">mg/dL</div>
                    <div className={`mt-2 inline-flex items-center gap-1 px-4 py-1 rounded-full text-base font-bold ${FLAG_CONFIG[latestResult.clinical_flag as keyof typeof FLAG_CONFIG]?.badge}`}>
                      {FLAG_CONFIG[latestResult.clinical_flag as keyof typeof FLAG_CONFIG]?.icon} {latestResult.flag_label}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-gray-900 text-sm">📋 Clinical Recommendations:</h4>
                    {(latestResult.suggested_steps || []).map((step: string, i: number) => (
                      <div key={i} className="bg-white/80 rounded-lg p-3 text-sm text-gray-800">{step}</div>
                    ))}
                  </div>
                  {/* Target Ranges Reference */}
                  <div className="mt-4 bg-white/70 rounded-xl p-3">
                    <h4 className="text-xs font-bold text-gray-700 mb-2">🎯 ADA 2024 Target Ranges</h4>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                      <div>Pre-meal: <strong>80–130 mg/dL</strong></div>
                      <div>Post-meal (2h): <strong>&lt;180 mg/dL</strong></div>
                      <div>Bedtime: <strong>100–140 mg/dL</strong></div>
                      <div>Hypo alert: <strong>&lt;70 mg/dL</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 h-full flex flex-col justify-center">
                  <div className="text-6xl mb-3">🩺</div>
                  <p className="font-medium">Enter your blood glucose reading</p>
                  <p className="text-sm">You'll receive an instant clinical assessment</p>
                  <div className="mt-4 text-xs text-gray-300 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400"/> &lt;70: Hypoglycemia
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-400"/> 80–130: Target Range
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400"/> 131–180: Elevated
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"/> &gt;180: Hyperglycemia
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-slate-900">📈 Blood Glucose History</h2>
            </div>
            {loading ? (
              <div className="py-16 flex justify-center">
                <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {logs.map(log => {
                  const cfg = FLAG_CONFIG[log.clinical_flag];
                  return (
                    <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border-2 ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-lg">{log.glucose_mg_dl} <span className="text-sm font-normal text-gray-400">mg/dL</span></div>
                            <div className="text-xs text-gray-500">
                              {READING_TYPES.find(r => r.value === log.reading_type)?.label} · {MEAL_CONTEXTS.find(m => m.value === log.meal_context)?.label}
                            </div>
                            {log.notes && <div className="text-xs text-gray-400 mt-0.5 italic">"{log.notes}"</div>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>{cfg.label}</span>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(log.measured_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {new Date(log.measured_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DIET TAB */}
        {activeTab === 'diet' && (
          <div className="space-y-6">
            {/* Preprandial / Postprandial Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-5">
                <h3 className="font-bold text-green-900 text-base mb-3">🌅 Pre-Meal (Preprandial) Guide</h3>
                <ul className="space-y-2">
                  {(dietGuide?.preprandial_tips || [
                    'Check blood glucose 30 min before eating.',
                    'Take antidiabetic medications as prescribed.',
                    'Avoid skipping any meal — causes dangerous blood sugar swings.',
                    'Insulin patients: administer rapid-acting insulin 15–30 min pre-meal.'
                  ]).map((t: string, i: number) => (
                    <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✔</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5">
                <h3 className="font-bold text-blue-900 text-base mb-3">🌆 Post-Meal (Postprandial) Guide</h3>
                <ul className="space-y-2">
                  {(dietGuide?.postprandial_tips || [
                    'Check blood glucose 2 hours after first bite.',
                    'A 15–20 min walk after meals reduces post-meal spike.',
                    'Avoid lying down immediately after eating.',
                    'Avoid high-carb desserts or sweet drinks after meals.'
                  ]).map((t: string, i: number) => (
                    <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5 flex-shrink-0">✔</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Dietary lists */}
            {[
              { title: '🚫 Strictly Avoid', items: dietGuide?.guidelines?.strictly_avoid || [], bg: 'bg-red-50 border-red-200', textColor: 'text-red-800', dot: 'bg-red-400' },
              { title: '⚠️ Limit Carefully', items: dietGuide?.guidelines?.limit_carefully || [], bg: 'bg-amber-50 border-amber-200', textColor: 'text-amber-800', dot: 'bg-amber-400' },
              { title: '✅ Recommended Foods', items: dietGuide?.guidelines?.recommended || [], bg: 'bg-green-50 border-green-200', textColor: 'text-green-800', dot: 'bg-green-400' },
            ].map(section => (
              <div key={section.title} className={`rounded-2xl border p-5 ${section.bg}`}>
                <h3 className={`font-bold text-base mb-3 ${section.textColor}`}>{section.title}</h3>
                <ul className="space-y-1.5">
                  {section.items.map((item: string, i: number) => (
                    <li key={i} className={`text-sm flex items-start gap-2 ${section.textColor}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${section.dot}`}/>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DiabetesTrackerPage;
