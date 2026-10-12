import React, { useState, useEffect } from 'react';

const API = '/api';

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  category: string;
  care_setting: string;
  route: string;
  dosage_forms: string;
  standard_dosage: string;
  syringe_specs?: any;
  meal_timing?: any;
  sugar_impact_notes?: string;
  indications: string;
  contraindications: string;
  adverse_effects: string;
  avoid_foods?: string[];
  avoid_drinks?: string[];
  patient_instructions?: string;
}

const CARE_SETTING_CONFIG = {
  OPD: { label: 'OPD', fullLabel: 'Outpatient (OPD)', icon: '🏥', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  IPD: { label: 'IPD', fullLabel: 'Inpatient (IPD)',  icon: '🛏️', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  BOTH: { label: 'OPD + IPD', fullLabel: 'OPD & IPD', icon: '🔀', cls: 'bg-teal-100 text-teal-800 border-teal-200' },
};

const ROUTE_ICONS: Record<string, string> = {
  'Oral': '💊',
  'Subcutaneous Injection': '💉',
  'Intramuscular Injection': '💉',
  'Intravenous Infusion': '🩺',
  'Intravenous Push': '🩺',
  'Intravenous / Intramuscular / Subcutaneous Injection': '💉',
  'Intravenous / Intramuscular / Oral Tablet': '💊💉',
};

function SyringeSpecsCard({ specs }: { specs: any }) {
  if (!specs) return null;
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mt-3">
      <h5 className="font-bold text-purple-900 text-sm mb-3">💉 Injection / Syringe Specifications</h5>
      <div className="grid grid-cols-2 gap-2 text-xs text-purple-800 mb-3">
        {specs.type && <div><span className="font-semibold">Type:</span> {specs.type}</div>}
        {specs.capacity_ml && <div><span className="font-semibold">Capacity:</span> {specs.capacity_ml} mL</div>}
        {specs.needle_gauge && <div><span className="font-semibold">Needle Gauge:</span> {specs.needle_gauge}</div>}
        {specs.needle_length_mm && <div><span className="font-semibold">Needle Length:</span> {specs.needle_length_mm} mm</div>}
        {specs.injection_angle_degrees && <div><span className="font-semibold">Angle:</span> {specs.injection_angle_degrees}</div>}
        {specs.im_needle_gauge && <div><span className="font-semibold">IM Gauge:</span> {specs.im_needle_gauge}</div>}
        {specs.concentration && <div className="col-span-2"><span className="font-semibold">Concentration:</span> {specs.concentration}</div>}
        {specs.iv_rate && <div className="col-span-2 text-red-700"><span className="font-semibold">IV Rate:</span> {specs.iv_rate}</div>}
        {specs.infusion_duration_min && <div className="col-span-2"><span className="font-semibold">Infusion Duration:</span> {specs.infusion_duration_min} min</div>}
      </div>
      {specs.injection_sites && (
        <div className="mb-2">
          <span className="text-xs font-bold text-purple-900">📍 Injection Sites:</span>
          <ul className="mt-1 space-y-0.5">
            {specs.injection_sites.map((site: string, i: number) => (
              <li key={i} className="text-xs text-purple-700 flex items-start gap-1">
                <span className="text-purple-400">•</span>{site}
              </li>
            ))}
          </ul>
        </div>
      )}
      {specs.technique && (
        <div>
          <span className="text-xs font-bold text-purple-900">📋 Administration Technique:</span>
          <ol className="mt-1 space-y-0.5">
            {specs.technique.map((step: string, i: number) => (
              <li key={i} className="text-xs text-purple-700 flex items-start gap-1.5">
                <span className="font-bold text-purple-500 flex-shrink-0">{i + 1}.</span>{step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function MealTimingCard({ timing, route }: { timing: any; route: string }) {
  if (!timing || route.includes('Intravenous') || timing.timing_rule === 'independent_of_meals' || timing.timing_rule === 'emergency_as_needed') return null;
  const rules: Record<string, { icon: string; color: string; label: string }> = {
    with_meal:         { icon: '🍽️', color: 'bg-green-50 border-green-200 text-green-900', label: 'Take WITH Meals' },
    preprandial_30_min:{ icon: '⏰', color: 'bg-amber-50 border-amber-200 text-amber-900', label: '30 Minutes BEFORE Meal' },
    with_or_without_food: { icon: '✅', color: 'bg-blue-50 border-blue-200 text-blue-900', label: 'With or Without Food' },
    any_time_consistent: { icon: '🕐', color: 'bg-gray-50 border-gray-200 text-gray-900', label: 'Same Time Daily' },
    evening_or_bedtime: { icon: '🌙', color: 'bg-indigo-50 border-indigo-200 text-indigo-900', label: 'Evening or Bedtime Preferred' },
    with_food_morning:  { icon: '☀️', color: 'bg-orange-50 border-orange-200 text-orange-900', label: 'Morning WITH Food' },
    morning_preferred:  { icon: '🌅', color: 'bg-yellow-50 border-yellow-200 text-yellow-900', label: 'Morning Preferred' },
  };
  const rule = rules[timing.timing_rule] || { icon: '💊', color: 'bg-gray-50 border-gray-200 text-gray-900', label: 'As Prescribed' };
  return (
    <div className={`rounded-xl border p-3 mt-3 ${rule.color}`}>
      <div className="font-bold text-sm mb-1">{rule.icon} Meal Timing: {rule.label}</div>
      {timing.food_instructions && <p className="text-xs opacity-80">{timing.food_instructions}</p>}
      {timing.preprandial_mins && (
        <div className="mt-1 text-xs font-semibold">Take {timing.preprandial_mins} min before eating</div>
      )}
    </div>
  );
}

function MedicineCard({ med }: { med: Medicine }) {
  const [expanded, setExpanded] = useState(false);
  const settingCfg = CARE_SETTING_CONFIG[med.care_setting as keyof typeof CARE_SETTING_CONFIG] || CARE_SETTING_CONFIG.OPD;
  const routeIcon = ROUTE_ICONS[med.route] || '💊';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div>
            <div className="flex flex-wrap gap-2 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${settingCfg.cls}`}>
                {settingCfg.icon} {settingCfg.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold border bg-gray-100 text-gray-700 border-gray-200">
                {routeIcon} {med.route}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{med.name}</h3>
            <p className="text-sm text-slate-500">{med.generic_name} · {med.category}</p>
          </div>
        </div>

        {/* Standard Dosage — always visible */}
        <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
          <div className="text-xs font-bold text-slate-700 mb-1">📋 Standard Dosage</div>
          <p className="text-sm text-slate-800">{med.standard_dosage}</p>
        </div>

        <MealTimingCard timing={med.meal_timing} route={med.route} />

        {/* Patient instructions */}
        {med.patient_instructions && (
          <div className="bg-blue-50 rounded-xl p-3 mt-3 border border-blue-100">
            <div className="text-xs font-bold text-blue-900 mb-1">👤 Patient Instructions</div>
            <p className="text-xs text-blue-800">{med.patient_instructions}</p>
          </div>
        )}

        {/* Expand button */}
        <button onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 border border-gray-200 rounded-xl py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          {expanded ? '▲ Show Less' : '▼ Full Clinical Details'}
        </button>

        {expanded && (
          <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
            {/* Avoid foods & drinks */}
            {((med.avoid_foods?.length || 0) > 0 || (med.avoid_drinks?.length || 0) > 0) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h5 className="font-bold text-red-900 text-sm mb-2">🚫 Foods & Drinks to Avoid</h5>
                {(med.avoid_foods?.length || 0) > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-red-800 mb-1">Foods:</div>
                    <ul className="space-y-0.5">
                      {med.avoid_foods!.map((f, i) => (
                        <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                          <span className="text-red-400 flex-shrink-0">✗</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(med.avoid_drinks?.length || 0) > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-red-800 mb-1">Drinks:</div>
                    <ul className="space-y-0.5">
                      {med.avoid_drinks!.map((d, i) => (
                        <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                          <span className="text-red-400 flex-shrink-0">🚫</span>{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <SyringeSpecsCard specs={med.syringe_specs} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <div className="text-xs font-bold text-green-900 mb-1">✅ Indications</div>
                <p className="text-xs text-green-800">{med.indications}</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <div className="text-xs font-bold text-red-900 mb-1">❌ Contraindications</div>
                <p className="text-xs text-red-800">{med.contraindications}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <div className="text-xs font-bold text-amber-900 mb-1">⚠️ Adverse Effects</div>
                <p className="text-xs text-amber-800">{med.adverse_effects}</p>
              </div>
            </div>

            {med.sugar_impact_notes && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <div className="text-xs font-bold text-rose-900 mb-1">🩸 Blood Sugar Impact</div>
                <p className="text-xs text-rose-800">{med.sugar_impact_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function FormularyPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ALL' | 'OPD' | 'IPD'>('ALL');
  const [search, setSearch] = useState('');

  async function load(setting: string) {
    setLoading(true);
    try {
      const res = await fetch(`${API}/formulary?care_setting=${setting}&search=${encodeURIComponent(search)}`);
      setMedicines(res.ok ? await res.json() : []);
    } catch { setMedicines([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(tab); }, [tab, search]);

  const opdCount = medicines.filter(m => m.care_setting !== 'IPD').length;
  const ipdCount = medicines.filter(m => m.care_setting !== 'OPD').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">💊 Medicines Formulary</h1>
          <p className="text-slate-500 mt-1">OPD & IPD medicine reference — dosage, syringe specs, dietary restrictions</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">💊</div>
            <div className="text-xl font-bold text-blue-700">{medicines.filter(m => m.care_setting === 'OPD').length + medicines.filter(m => m.care_setting === 'BOTH').length}</div>
            <div className="text-xs text-slate-500">OPD Medicines</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">💉</div>
            <div className="text-xl font-bold text-purple-700">{medicines.filter(m => m.care_setting === 'IPD').length + medicines.filter(m => m.care_setting === 'BOTH').length}</div>
            <div className="text-xs text-slate-500">IPD / Injectable</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className="text-2xl mb-1">📋</div>
            <div className="text-xl font-bold text-slate-700">{medicines.length}</div>
            <div className="text-xs text-slate-500">Total Formulary</div>
          </div>
        </div>

        {/* Search + Tabs */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none shadow-sm bg-white"
            placeholder="🔍 Search by medicine name, generic name, or category…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            {(['ALL', 'OPD', 'IPD'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-teal-600 text-white shadow' : 'text-slate-600 hover:bg-gray-50'}`}>
                {t === 'ALL' ? 'All' : t === 'OPD' ? '🏥 OPD' : '🛏️ IPD'}
              </button>
            ))}
          </div>
        </div>

        {/* OPD Section */}
        {(tab === 'ALL' || tab === 'OPD') && (
          <div className="mb-8">
            {tab === 'ALL' && (
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-blue-200"/>
                <span className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-0.5">🏥 Outpatient (OPD) Medicines — Oral</span>
                <div className="h-px flex-1 bg-blue-200"/>
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"/></div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {medicines.filter(m => m.care_setting === 'OPD' || m.care_setting === 'BOTH').map(m => (
                  <MedicineCard key={m.id} med={m} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* IPD Section */}
        {(tab === 'ALL' || tab === 'IPD') && (
          <div>
            {tab === 'ALL' && (
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-purple-200"/>
                <span className="text-sm font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-3 py-0.5">🛏️ Inpatient (IPD) — Injections & IV</span>
                <div className="h-px flex-1 bg-purple-200"/>
              </div>
            )}
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"/></div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {medicines.filter(m => m.care_setting === 'IPD' || m.care_setting === 'BOTH').map(m => (
                  <MedicineCard key={m.id} med={m} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FormularyPage;
