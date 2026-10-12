import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Eye, 
  Search, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  FileText,
  ShieldCheck,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { MedicineExtracted, SourceHighlight, MedicationSchedule } from '../types';

interface Props {
  imageUrl: string;
  filename: string;
  medicines: MedicineExtracted[];
  selectedMedicineIndex: number;
  onSelectMedicine: (index: number) => void;
  onUpdateField?: (fieldKey: string, newValue: string) => void;
  existingSchedules?: MedicationSchedule[];
}

export type FieldStatus = 'clear' | 'check' | 'unreadable';

export const ClearCheckViewer: React.FC<Props> = ({
  imageUrl,
  filename,
  medicines,
  selectedMedicineIndex,
  onSelectMedicine,
  onUpdateField,
  existingSchedules = [],
}) => {
  const [activeField, setActiveField] = useState<string | null>('name_as_written');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const currentMedicine = medicines[selectedMedicineIndex] || medicines[0];

  if (!currentMedicine) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
        <p className="text-sm text-slate-500 font-medium">No prescription data loaded.</p>
      </div>
    );
  }

  // 9. Duplicate Medicine Finder: check if this medicine overlaps with another or existing schedule
  const currentMedName = (currentMedicine.name_as_written || '').toLowerCase().trim();
  const duplicateInSchedule = existingSchedules.find(s => {
    const sName = s.medicine_name.toLowerCase().trim();
    return currentMedName && (sName.includes(currentMedName) || currentMedName.includes(sName));
  });

  const duplicateInPrescription = medicines.find((m, idx) => {
    if (idx === selectedMedicineIndex) return false;
    const otherName = (m.name_as_written || '').toLowerCase().trim();
    return currentMedName && (otherName.includes(currentMedName) || currentMedName.includes(otherName));
  });

  const duplicateEntry = duplicateInSchedule?.medicine_name || duplicateInPrescription?.name_as_written;

  // Determine status for a field matching Image 1 UI specification
  const getFieldEvidence = (fieldKey: string) => {
    const rawVal = (currentMedicine as any)[fieldKey] || '';
    const isUncertain = currentMedicine.uncertain_fields?.includes(fieldKey);
    const reason = currentMedicine.uncertainty_reasons?.[fieldKey];
    const loc = currentMedicine.source_locations?.[fieldKey];

    let status: FieldStatus = 'clear';
    let label = 'Reviewable';
    let description = 'Extracted text matches the visible source region.';

    if (!rawVal || rawVal.trim() === '' || rawVal.toLowerCase().includes('unspecified') || rawVal.toLowerCase().includes('missing')) {
      status = 'unreadable';
      label = 'Unresolved';
      description = reason || 'Could not be established from the available source text.';
    } else if (isUncertain) {
      status = 'check';
      label = 'Needs checking';
      description = reason || 'OCR detected text, but the characters may be ambiguous.';
    }

    return {
      value: rawVal,
      status,
      label,
      description,
      box: loc?.box as [number, number, number, number] | undefined,
      matchedText: loc?.text || rawVal,
    };
  };

  const FIELDS_TO_CHECK = [
    { key: 'name_as_written', title: 'Medicine Name', placeholder: 'e.g. Amoxicillin' },
    { key: 'strength_as_written', title: 'Strength / Dosage', placeholder: 'e.g. 500mg' },
    { key: 'frequency_as_written', title: 'Frequency', placeholder: 'e.g. 3 times daily' },
    { key: 'timing_as_written', title: 'Meal Timing', placeholder: 'e.g. With meals' },
    { key: 'instructions_as_written', title: 'Full Sig Instructions', placeholder: 'e.g. Take 1 capsule orally every 8 hours' },
    { key: 'duration_as_written', title: 'Duration of Course', placeholder: 'e.g. 10 days' },
  ];

  const activeEvidence = activeField ? getFieldEvidence(activeField) : null;
  const activeBox = activeEvidence?.box;

  const handleStartEdit = (key: string, val: string) => {
    setEditingField(key);
    setTempValue(val);
  };

  const handleSaveEdit = (key: string) => {
    if (onUpdateField) {
      onUpdateField(key, tempValue);
    }
    setEditingField(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden font-sans">
      
      {/* ── Top ClearCheck Banner ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40">
              ClearCheck™ Technology
            </span>
            <span className="text-xs font-bold text-slate-300">Prescription Uncertainty Map</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
            Don't just read the prescription. Show what you couldn't read.
          </h2>
          <p className="text-xs text-slate-300 font-medium max-w-2xl mt-0.5 leading-relaxed">
            Every extracted medical field is visually anchored to its source text region with an explicit clinical confidence state.
          </p>
        </div>

        {/* Medicine Selector Tabs */}
        {medicines.length > 1 && (
          <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl border border-white/10 self-start md:self-auto overflow-x-auto max-w-full">
            {medicines.map((m, idx) => (
              <button
                key={m.id || idx}
                onClick={() => onSelectMedicine(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  selectedMedicineIndex === idx
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {m.name_as_written || `Rx #${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* Left: Interactive Prescription Scan with Bounding Boxes (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/5 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-extrabold text-slate-800 truncate max-w-[200px]" title={filename}>
                  {filename}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => prev === 1 ? 1.3 : 1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Toggle zoom"
                >
                  {zoomLevel === 1 ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                  <span className="text-[10px]">{Math.round(zoomLevel * 100)}%</span>
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex items-center justify-center min-h-[380px] max-h-[500px]">
              <div 
                className="relative inline-block transition-transform duration-200 max-h-[480px]"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              >
                <img
                  src={imageUrl}
                  alt="Prescription Scan"
                  className="w-auto max-h-[480px] object-contain select-none"
                />

                {/* Active Dynamic Highlight Overlay */}
                {activeBox && (
                  <div
                    className={`absolute border-2 rounded-sm transition-all duration-200 pointer-events-none shadow-lg ${
                      activeEvidence?.status === 'unreadable'
                        ? 'border-rose-500 bg-rose-400/25 shadow-rose-500/40'
                        : activeEvidence?.status === 'check'
                        ? 'border-amber-500 bg-amber-400/30 shadow-amber-500/40 animate-pulse'
                        : 'border-teal-500 bg-teal-400/25 shadow-teal-500/40'
                    }`}
                    style={{
                      top: `${activeBox[0] * 100}%`,
                      left: `${activeBox[1] * 100}%`,
                      height: `${(activeBox[2] - activeBox[0]) * 100}%`,
                      width: `${(activeBox[3] - activeBox[1]) * 100}%`,
                    }}
                  >
                    <div className={`absolute -top-6 left-0 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm whitespace-nowrap ${
                      activeEvidence?.status === 'unreadable'
                        ? 'bg-rose-700'
                        : activeEvidence?.status === 'check'
                        ? 'bg-amber-700'
                        : 'bg-teal-700'
                    }`}>
                      {activeField?.replace('_as_written', '').toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Legend at bottom of left panel */}
          <div className="mt-4 p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Clear
            </span>
            <span className="flex items-center gap-1.5 text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Check
            </span>
            <span className="flex items-center gap-1.5 text-rose-800">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Unreadable
            </span>
          </div>
        </div>

        {/* Right: Field Evidence Map (7 cols) - Inspired by User's Slide Concept */}
        <div className="lg:col-span-7 p-5 sm:p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Field Evidence & Verification States
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Click any field to anchor evidence on the scan. Edit if clarification is needed.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                {currentMedicine.name_as_written}
              </span>
            </div>

            {/* List of Fields */}
            <div className="space-y-2.5">
              {FIELDS_TO_CHECK.map((field) => {
                const evidence = getFieldEvidence(field.key);
                const isSelected = activeField === field.key;
                const isFieldEditing = editingField === field.key;

                return (
                  <div
                    key={field.key}
                    onClick={() => setActiveField(field.key)}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-50/80 border-teal-500 shadow-sm ring-1 ring-teal-500/20'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1">
                        {/* Status Icon */}
                        <div className="mt-0.5 shrink-0">
                          {evidence.status === 'clear' && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          )}
                          {evidence.status === 'check' && (
                            <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                          )}
                          {evidence.status === 'unreadable' && (
                            <HelpCircle className="w-5 h-5 text-rose-500" />
                          )}
                        </div>

                        {/* Title and Value */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                              {field.title}
                            </h4>

                            {/* Badge */}
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              evidence.status === 'clear'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : evidence.status === 'check'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {evidence.label}
                            </span>
                          </div>

                          {/* Editable value vs Display value */}
                          {isFieldEditing ? (
                            <div className="mt-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <input
                                type="text"
                                value={tempValue}
                                onChange={e => setTempValue(e.target.value)}
                                placeholder={field.placeholder}
                                className="flex-1 px-3 py-1.5 rounded-xl border border-teal-500 text-xs font-bold text-slate-900 bg-white focus:outline-hidden"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(field.key)}
                                className="p-1.5 rounded-xl bg-teal-700 text-white hover:bg-teal-600 transition-colors cursor-pointer"
                                title="Save correction"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingField(null)}
                                className="p-1.5 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                                {evidence.value || <span className="text-rose-600 italic">Not detected / Blank</span>}
                              </p>
                              {onUpdateField && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(field.key, evidence.value);
                                  }}
                                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors ml-2 shrink-0 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                              )}
                            </div>
                          )}

                          {/* Descriptive Evidence Subtitle */}
                          <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                            {evidence.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Safety gate card directly from UI concept (Image 1) */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <ShieldCheck className="w-5 h-5 text-slate-800" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Safety gate
                  </h4>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                    The medication schedule stays inactive until the required instructions are resolved and appropriately confirmed.
                  </p>
                </div>
              </div>

              {/* 9. Duplicate Medicine Finder Alert (Image 5) */}
              {duplicateEntry && (
                <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/90 flex items-start gap-3 text-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px]">
                        Duplicate Medicine Finder
                      </span>
                      <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Possible Overlap
                      </span>
                    </div>
                    <p className="text-amber-900 mt-1 leading-relaxed">
                      Matches existing regimen: <strong>{duplicateEntry}</strong>. Patients maintaining multiple prescriptions from different visits risk accidental duplicate intake. Requires professional review before scheduling.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Callout: Visual Link Summary */}
          <div className="mt-4 p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/90 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-teal-950 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Evidence confirmed. Never accept an hallucinated prescription without source visual proof.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
