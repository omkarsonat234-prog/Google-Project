import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = '/api';

// ── Offline demo IPD record ───────────────────────────────────────────────────
const DEMO_IPD = {
  id: 'ipd-demo-001',
  ipd_number: 'IPD/2026/001847',
  patient_name: 'Johnathan Doe',
  patient_id: 'demo-patient',
  admission_date: '2026-10-05',
  discharge_date: '2026-10-10',
  ward_bed: 'Ward-3B / Bed 12',
  admitting_doctor: 'Dr. Sarah Jenkins (Internal Medicine)',
  discharging_doctor: 'Dr. Sarah Jenkins (Internal Medicine)',
  diagnosis: 'Community-acquired Pneumonia (CAP) with secondary Type 2 Diabetes exacerbation',
  surgical_procedure: null,
  inpatient_course: 'Patient admitted with high-grade fever (39.8°C), productive cough, and respiratory distress. IV Ceftriaxone 1g OD administered for 5 days with IV fluids. Blood sugar controlled with sliding-scale insulin during admission. Patient responded well to treatment. Oxygen saturation improved from 91% to 98% by day 3. Oral transition commenced on day 5.',
  discharge_condition: 'Stable, afebrile, SpO₂ 98% on room air, tolerating oral feeds well.',
  vitals: {
    bp: '124/78 mmHg', hr: '78 bpm', rr: '18/min', temp: '36.8°C', spo2: '98% RA', weight: '74.5 kg', blood_group: 'A+ve'
  },
  ipd_medicines: [
    { name: 'Inj. Ceftriaxone 1g IV OD', route: 'IV Infusion', dose: '1g in 100mL NS', frequency: 'Once daily for 5 days', setting: 'IPD', instructions: 'Reconstitute in 10mL sterile water, dilute in 100mL NS, infuse over 30 min.' },
    { name: 'Inj. Paracetamol 1g IV TDS', route: 'IV Infusion', dose: '1g/100mL', frequency: '3 times daily (PRN fever)', setting: 'IPD', instructions: 'Give when temp > 38°C. Infuse over 15 min.' },
    { name: 'Inj. Regular Insulin (Sliding Scale)', route: 'Subcutaneous', dose: 'Per sliding scale', frequency: 'QID (before meals + bedtime)', setting: 'IPD', instructions: '0 IU if glucose < 140; 4 IU if 141–180; 6 IU if 181–220; 8 IU if 221–260; call doctor if > 260.' },
    { name: 'IV Fluids — NS 0.9% 1L', route: 'Intravenous Infusion', dose: '1000 mL', frequency: '8-hourly (Day 1–2)', setting: 'IPD', instructions: 'Maintain at 125 mL/hr until oral intake established.' },
  ],
  opd_transition_medicines: [
    { name: 'Tab. Amoxicillin-Clavulanate 625mg', dose: '625mg', frequency: 'Twice daily for 5 days', route: 'Oral', timing: 'With meals', instructions: 'Take with food. Complete full 5-day course.' },
    { name: 'Tab. Metformin 500mg', dose: '500mg', frequency: 'Twice daily', route: 'Oral', timing: 'With meals', instructions: 'Continue indefinitely. Monitor blood glucose.' },
    { name: 'Tab. Paracetamol 500mg', dose: '500mg', frequency: 'TDS if fever/pain (PRN)', route: 'Oral', timing: 'With or without food', instructions: 'Do not exceed 4g/24h. Stop when fever resolves.' },
    { name: 'Syp. Ambroxol 30mg/5mL', dose: '10 mL', frequency: 'Three times daily for 7 days', route: 'Oral (syrup)', timing: 'After meals', instructions: 'Shake well before use. Drink plenty of fluids.' },
  ],
  discharge_instructions: {
    activity: 'Rest at home for 5–7 days. Gradual return to normal activity. Avoid heavy exercise until follow-up.',
    diet: 'Diabetic diet: avoid refined carbohydrates, sugary drinks, and fried food. Stay well hydrated.',
    wound_care: 'Not applicable for this admission.',
    follow_up: 'OPD follow-up with Dr. Sarah Jenkins — 7 days post-discharge. Endocrinology (Diabetes) clinic — 14 days.',
    red_flags: 'Return immediately to Emergency if: fever > 38.5°C, difficulty breathing, SpO₂ drops, chest pain, confusion, or blood sugar < 60 or > 300 mg/dL.',
    blood_glucose_monitoring: 'Check fasting and post-meal blood glucose twice daily. Record in diary. Target: fasting 80–130 mg/dL, post-meal < 180 mg/dL.',
    vaccinations: 'Pneumococcal vaccine (PPSV23) and annual influenza vaccine recommended — discuss at follow-up.',
  }
};

function SectionHeader({ icon, title, color }: { icon: string; title: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 font-bold text-sm ${color}`}>
      <span className="text-lg">{icon}</span>
      <span className="uppercase tracking-wide">{title}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide sm:w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value || '—'}</span>
    </div>
  );
}

export function IPDDischargePage() {
  const { user } = useAuth();
  const patientId = (user as any)?.id || 'demo-patient';
  const [records, setRecords] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/ipd?patient_id=${patientId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const recs = data.length > 0 ? data : [DEMO_IPD];
        setRecords(recs);
        setSelected(recs[0]);
      })
      .catch(() => {
        setRecords([DEMO_IPD]);
        setSelected(DEMO_IPD);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const r = selected;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">🏥 IPD Discharge Summary</h1>
            <p className="text-slate-500 mt-1">Inpatient admission records and discharge documentation</p>
          </div>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-opacity">
            🖨️ Print Discharge Summary
          </button>
        </div>

        {/* IPD selector */}
        {records.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {records.map(rec => (
              <button key={rec.id} onClick={() => setSelected(rec)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-colors ${selected?.id === rec.id ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                {rec.ipd_number}
              </button>
            ))}
          </div>
        )}

        {r && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Document Header */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">MedBridge Clinical Centre</div>
                  <h2 className="text-2xl font-black">DISCHARGE SUMMARY</h2>
                  <div className="text-purple-200 text-sm mt-1">IPD No: <span className="text-white font-bold">{r.ipd_number}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-purple-200">Admission: <span className="text-white font-semibold">{r.admission_date}</span></div>
                  <div className="text-xs text-purple-200">Discharge: <span className="text-white font-semibold">{r.discharge_date}</span></div>
                  <div className="text-xs text-purple-200 mt-1">Duration: {Math.round((new Date(r.discharge_date).getTime() - new Date(r.admission_date).getTime()) / 864e5)} days</div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Details */}
              <div>
                <SectionHeader icon="👤" title="Patient Identification" color="bg-blue-50 text-blue-900" />
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <InfoRow label="Patient Name" value={r.patient_name} />
                  <InfoRow label="Ward / Bed" value={r.ward_bed} />
                  <InfoRow label="Admitting Doctor" value={r.admitting_doctor} />
                  <InfoRow label="Discharging Doctor" value={r.discharging_doctor} />
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <SectionHeader icon="🔬" title="Diagnosis & Clinical Course" color="bg-red-50 text-red-900" />
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <InfoRow label="Final Diagnosis" value={r.diagnosis} />
                  {r.surgical_procedure && <InfoRow label="Surgical Procedure" value={r.surgical_procedure} />}
                  <InfoRow label="Inpatient Course" value={r.inpatient_course} />
                  <InfoRow label="Discharge Condition" value={r.discharge_condition} />
                </div>
              </div>

              {/* Vitals at Discharge */}
              <div>
                <SectionHeader icon="💓" title="Vitals at Discharge" color="bg-green-50 text-green-900" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(r.vitals || {}).map(([k, v]) => (
                    <div key={k} className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                      <div className="text-xs text-green-700 font-semibold uppercase">{k.replace('_', ' ')}</div>
                      <div className="text-sm font-bold text-green-900 mt-0.5">{v as string}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IPD Medicines */}
              <div>
                <SectionHeader icon="💉" title="Medicines Administered During Admission (IPD)" color="bg-purple-50 text-purple-900" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-50 text-purple-900">
                        <th className="text-left px-4 py-2.5 font-bold text-xs uppercase rounded-tl-xl">Medicine</th>
                        <th className="text-left px-4 py-2.5 font-bold text-xs uppercase">Route</th>
                        <th className="text-left px-4 py-2.5 font-bold text-xs uppercase">Dose</th>
                        <th className="text-left px-4 py-2.5 font-bold text-xs uppercase rounded-tr-xl">Frequency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(r.ipd_medicines || []).map((med: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900">{med.name}</td>
                          <td className="px-4 py-3 text-purple-700 font-medium text-xs">{med.route}</td>
                          <td className="px-4 py-3 text-gray-700 text-xs">{med.dose}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{med.frequency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* OPD Transition Medicines */}
              <div>
                <SectionHeader icon="💊" title="Discharge Medicines (OPD — Continue at Home)" color="bg-blue-50 text-blue-900" />
                <div className="space-y-3">
                  {(r.opd_transition_medicines || []).map((med: any, i: number) => (
                    <div key={i} className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-blue-900">{med.name}</div>
                          <div className="text-xs text-blue-700 mt-0.5">
                            {med.dose} · {med.frequency} · <span className="font-semibold">Take: {med.timing}</span>
                          </div>
                        </div>
                        <div className="text-xs bg-white border border-blue-200 text-blue-800 rounded-lg px-3 py-1.5 max-w-xs">
                          {med.instructions}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discharge Instructions */}
              <div>
                <SectionHeader icon="📋" title="Discharge Instructions & Follow-up" color="bg-amber-50 text-amber-900" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(r.discharge_instructions || {}).map(([key, val]) => (
                    <div key={key} className={`rounded-xl p-4 border ${key === 'red_flags' ? 'bg-red-50 border-red-200 md:col-span-2' : 'bg-amber-50 border-amber-100'}`}>
                      <div className={`text-xs font-bold uppercase tracking-wide mb-1 ${key === 'red_flags' ? 'text-red-800' : 'text-amber-900'}`}>
                        {key === 'red_flags' ? '🚨' : '📌'} {key.replace(/_/g, ' ')}
                      </div>
                      <p className={`text-xs ${key === 'red_flags' ? 'text-red-800 font-semibold' : 'text-amber-800'}`}>{val as string}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
                <p>This discharge summary has been digitally generated by MedBridge Clinical System.</p>
                <p className="mt-1 font-semibold text-gray-500">For queries, contact the ward nurse station or your treating physician.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IPDDischargePage;
