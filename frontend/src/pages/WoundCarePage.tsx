import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = '/api';

interface WoundRecord {
  id: string;
  wound_type: string;
  anatomical_site: string;
  dressing_frequency_hours: number;
  last_dressing_at: string;
  next_dressing_due: string;
  aseptic_protocol: { steps: string[]; infection_signs: string[] };
  infection_signs_monitored: string[];
  suture_count: number;
  suture_removal_date?: string;
  status: string;
  created_at: string;
}

const WOUND_TYPES = [
  { value: 'trauma_laceration', label: 'Trauma / Laceration', icon: '🩹', color: 'text-red-700 bg-red-50 border-red-200' },
  { value: 'post_op_surgical',  label: 'Post-Operative Surgical', icon: '🔪', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { value: 'abrasion',          label: 'Abrasion / Graze', icon: '🩻', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { value: 'burn_dressing',     label: 'Burn Dressing', icon: '🔥', color: 'text-red-800 bg-red-100 border-red-300' },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active_care:   { label: 'Active Care',    cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  healing_well:  { label: 'Healing Well',   cls: 'bg-green-100 text-green-800 border-green-200' },
  urgent_review: { label: '⚠️ Urgent Review', cls: 'bg-red-100 text-red-800 border-red-200' },
  healed:        { label: '✅ Healed',       cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function getDueStatus(nextDue: string) {
  const diff = new Date(nextDue).getTime() - Date.now();
  const hrs = diff / (1000 * 3600);
  if (hrs < 0) return { label: 'OVERDUE', cls: 'text-red-600 bg-red-50 border-red-200', urgent: true };
  if (hrs < 4) return { label: `Due in ${Math.round(hrs)}h`, cls: 'text-amber-700 bg-amber-50 border-amber-200', urgent: true };
  return { label: `Due ${new Date(nextDue).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`, cls: 'text-green-700 bg-green-50 border-green-200', urgent: false };
}

function NewWoundModal({ onClose, onSaved, patientId }: { onClose: () => void; onSaved: () => void; patientId: string }) {
  const [form, setForm] = useState({ wound_type: 'trauma_laceration', anatomical_site: '', dressing_frequency_hours: '24', suture_count: '', suture_removal_date: '' });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API}/wound-care`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, patient_id: patientId, dressing_frequency_hours: parseInt(form.dressing_frequency_hours), suture_count: parseInt(form.suture_count || '0') })
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-t-2xl p-5 text-white">
          <h2 className="text-lg font-bold">🩹 Add Wound Care Record</h2>
          <p className="text-orange-100 text-sm">Register a new wound for dressing reminders</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Wound Type *</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              value={form.wound_type} onChange={e => setForm(f => ({ ...f, wound_type: e.target.value }))}>
              {WOUND_TYPES.map(w => <option key={w.value} value={w.value}>{w.icon} {w.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Anatomical Site *</label>
            <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="e.g. Right forearm, Left knee, Abdominal midline incision"
              value={form.anatomical_site} onChange={e => setForm(f => ({ ...f, anatomical_site: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Dressing Frequency</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                value={form.dressing_frequency_hours} onChange={e => setForm(f => ({ ...f, dressing_frequency_hours: e.target.value }))}>
                <option value="8">Every 8 hours</option>
                <option value="12">Every 12 hours</option>
                <option value="24">Every 24 hours (Daily)</option>
                <option value="48">Every 48 hours</option>
                <option value="72">Every 72 hours (3 days)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Suture Count</label>
              <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="0 if none" value={form.suture_count} onChange={e => setForm(f => ({ ...f, suture_count: e.target.value }))} />
            </div>
          </div>
          {parseInt(form.suture_count || '0') > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Suture Removal Date</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                value={form.suture_removal_date} onChange={e => setForm(f => ({ ...f, suture_removal_date: e.target.value }))} />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {saving ? 'Saving…' : '🩹 Add Wound Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function WoundCarePage() {
  const { user } = useAuth();
  const patientId = (user as any)?.id || 'demo-patient';
  const [wounds, setWounds] = useState<WoundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dressing, setDressing] = useState<string | null>(null);

  const DEMO_WOUNDS: WoundRecord[] = [
    {
      id: 'wd-001', wound_type: 'trauma_laceration', anatomical_site: 'Right forearm (7 cm laceration)',
      dressing_frequency_hours: 24, last_dressing_at: new Date(Date.now() - 20*3600*1000).toISOString(),
      next_dressing_due: new Date(Date.now() + 4*3600*1000).toISOString(),
      aseptic_protocol: {
        steps: ['Wash hands thoroughly.', 'Irrigate with normal saline.', 'Apply prescribed antiseptic dressing.', 'Secure with medical tape.'],
        infection_signs: ['Increasing redness or warmth', 'Purulent discharge', 'Fever > 38°C']
      },
      infection_signs_monitored: ['[]'], suture_count: 4, suture_removal_date: new Date(Date.now() + 7*864e5).toISOString().split('T')[0],
      status: 'active_care', created_at: new Date(Date.now() - 2*864e5).toISOString()
    },
    {
      id: 'wd-002', wound_type: 'post_op_surgical', anatomical_site: 'Abdominal midline incision (appendectomy)',
      dressing_frequency_hours: 48, last_dressing_at: new Date(Date.now() - 30*3600*1000).toISOString(),
      next_dressing_due: new Date(Date.now() + 18*3600*1000).toISOString(),
      aseptic_protocol: {
        steps: ['Maintain strict aseptic technique.', 'Inspect sutures for integrity.', 'Cleanse with normal saline only.', 'Apply sterile non-adherent dressing.'],
        infection_signs: ['Wound gaping', 'Purulent drainage', 'Unexplained fever']
      },
      infection_signs_monitored: ['[]'], suture_count: 12, suture_removal_date: new Date(Date.now() + 5*864e5).toISOString().split('T')[0],
      status: 'healing_well', created_at: new Date(Date.now() - 4*864e5).toISOString()
    }
  ];

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/wound-care?patient_id=${patientId}`);
      const data = res.ok ? await res.json() : DEMO_WOUNDS;
      setWounds(data.length > 0 ? data : DEMO_WOUNDS);
    } catch { setWounds(DEMO_WOUNDS); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function markDressingDone(id: string) {
    setDressing(id);
    try {
      await fetch(`${API}/wound-care/${id}/dress?patient_id=${patientId}`, { method: 'POST' });
      load();
    } finally { setDressing(null); }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`${API}/wound-care/${id}/status?status=${status}`, { method: 'PUT' });
    load();
  }

  const urgent = wounds.filter(w => {
    const d = getDueStatus(w.next_dressing_due);
    return d.urgent && w.status !== 'healed';
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 p-4 md:p-8">
      {showModal && <NewWoundModal onClose={() => setShowModal(false)} onSaved={load} patientId={patientId} />}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">🩹 Wound Care & Dressing Reminders</h1>
            <p className="text-slate-500 mt-1">Trauma & surgical wound monitoring with aseptic protocols</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
            + Register Wound
          </button>
        </div>

        {/* Urgent Banner */}
        {urgent.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="text-2xl">🚨</div>
            <div>
              <div className="font-bold text-red-800">{urgent.length} wound dressing(s) due soon or overdue!</div>
              <div className="text-sm text-red-600">Immediate attention required to prevent infection.</div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Wounds', value: wounds.filter(w => w.status === 'active_care').length, icon: '🩹', color: 'text-blue-700' },
            { label: 'Healing Well', value: wounds.filter(w => w.status === 'healing_well').length, icon: '💚', color: 'text-green-700' },
            { label: 'Urgent Review', value: wounds.filter(w => w.status === 'urgent_review').length, icon: '⚠️', color: 'text-red-700' },
            { label: 'Healed', value: wounds.filter(w => w.status === 'healed').length, icon: '✅', color: 'text-gray-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Wound Cards */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : wounds.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><div className="text-6xl mb-4">🩹</div><p>No wound records found</p></div>
        ) : (
          <div className="space-y-4">
            {wounds.map(w => {
              const due = getDueStatus(w.next_dressing_due);
              const wType = WOUND_TYPES.find(t => t.value === w.wound_type);
              const st = STATUS_CONFIG[w.status] || STATUS_CONFIG['active_care'];
              const isExpanded = expanded === w.id;
              return (
                <div key={w.id} className={`bg-white rounded-2xl shadow-sm border-l-4 overflow-hidden ${due.urgent && w.status !== 'healed' ? 'border-red-400' : w.status === 'healing_well' ? 'border-green-400' : 'border-orange-400'}`}>
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${wType?.color}`}>
                          {wType?.icon}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${st.cls}`}>{st.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${due.cls}`}>{due.label}</span>
                          </div>
                          <h3 className="font-bold text-slate-900">{wType?.label}</h3>
                          <p className="text-sm text-slate-500">📍 {w.anatomical_site}</p>
                          {w.suture_count > 0 && (
                            <p className="text-xs text-purple-700 mt-0.5">🧵 {w.suture_count} sutures · Removal: {w.suture_removal_date || 'TBD'}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => markDressingDone(w.id)} disabled={dressing === w.id || w.status === 'healed'}
                          className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 disabled:opacity-50 transition-colors">
                          {dressing === w.id ? '⏳ Recording…' : '✅ Dressing Done'}
                        </button>
                        {w.status !== 'healed' && (
                          <button onClick={() => updateStatus(w.id, 'healed')}
                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition-colors">
                            🏥 Mark Healed
                          </button>
                        )}
                        <button onClick={() => setExpanded(isExpanded ? null : w.id)}
                          className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors">
                          {isExpanded ? '▲ Less' : '▼ Protocol'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Protocol */}
                    {isExpanded && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div className="bg-blue-50 rounded-xl p-4">
                          <h4 className="font-bold text-blue-900 text-sm mb-2">🧼 Aseptic Dressing Protocol</h4>
                          <ol className="space-y-1.5">
                            {(w.aseptic_protocol?.steps || []).map((step, i) => (
                              <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                                <span className="font-bold text-blue-600 flex-shrink-0">{i + 1}.</span>{step}
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4">
                          <h4 className="font-bold text-red-900 text-sm mb-2">🚨 Infection Warning Signs</h4>
                          <p className="text-xs text-red-700 mb-2 font-medium">Seek immediate medical attention if you notice:</p>
                          <ul className="space-y-1.5">
                            {(w.aseptic_protocol?.infection_signs || []).map((sign, i) => (
                              <li key={i} className="text-xs text-red-800 flex items-start gap-2">
                                <span className="text-red-500 flex-shrink-0">⚠</span>{sign}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WoundCarePage;
