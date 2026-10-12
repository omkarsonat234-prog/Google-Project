import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Clock, 
  FileText, 
  RefreshCw, 
  Eye, 
  Edit3, 
  Save, 
  ShieldCheck, 
  X,
  UploadCloud,
  Layers
} from 'lucide-react';
import { 
  uploadPrescription, 
  loadPresetPrescription, 
  fetchDemoPresets, 
  saveMedicationCorrections 
} from '../services/api';
import { 
  Prescription, 
  MedicineExtracted, 
  DemoPreset 
} from '../types';
import { SourceLinkedViewer } from '../components/SourceLinkedViewer';
import { UncertaintyAlert } from '../components/UncertaintyAlert';
import { VerificationGateModal } from '../components/VerificationGateModal';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

interface Props {
  onScheduleActivated?: () => void;
}

export const UploadPage: React.FC<Props> = ({ onScheduleActivated }) => {
  const [presets, setPresets] = useState<DemoPreset[]>([]);
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active medicine & field linking
  const [selectedMedicineIndex, setSelectedMedicineIndex] = useState(0);
  const [hoveredFieldKey, setHoveredFieldKey] = useState<string | null>(null);

  // Editing state for corrections
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Verification modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDemoPresets().then(setPresets).catch(() => {});
  }, []);

  const activeMedicine: MedicineExtracted | null = 
    currentPrescription && currentPrescription.medicines.length > 0
      ? currentPrescription.medicines[selectedMedicineIndex] || currentPrescription.medicines[0]
      : null;

  // Initialize edited values when medicine changes
  useEffect(() => {
    if (activeMedicine) {
      setEditedValues({
        name_as_written: activeMedicine.user_corrections?.name_as_written || activeMedicine.name_as_written || '',
        strength_as_written: activeMedicine.user_corrections?.strength_as_written || activeMedicine.strength_as_written || '',
        instructions_as_written: activeMedicine.user_corrections?.instructions_as_written || activeMedicine.instructions_as_written || '',
        frequency_as_written: activeMedicine.user_corrections?.frequency_as_written || activeMedicine.frequency_as_written || '',
        timing_as_written: activeMedicine.user_corrections?.timing_as_written || activeMedicine.timing_as_written || '',
        duration_as_written: activeMedicine.user_corrections?.duration_as_written || activeMedicine.duration_as_written || '',
      });
      setIsEditing(false);
      setSaveSuccessMsg(null);
    }
  }, [activeMedicine?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setErrorMessage(`Unsupported format '${ext}'. Please choose a JPG, PNG, or PDF prescription file.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds 10MB limit. Please upload a smaller scan or image.");
      return;
    }

    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
    setErrorMessage(null);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await uploadPrescription(selectedFile);
      setCurrentPrescription(res);
      setSelectedMedicineIndex(0);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process prescription.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadPreset = async (presetId: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSelectedFile(null);
    setFilePreviewUrl(null);

    try {
      const res = await loadPresetPrescription(presetId);
      setCurrentPrescription(res);
      setSelectedMedicineIndex(0);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load preset prescription.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveCorrections = async () => {
    if (!activeMedicine) return;
    try {
      const res = await saveMedicationCorrections(
        activeMedicine.id,
        editedValues,
        { instructions_verified: true, timing_verified: true },
        "Manual correction applied in MedBridge source-linked review"
      );

      // Update local state
      const updatedMeds = [...currentPrescription!.medicines];
      updatedMeds[selectedMedicineIndex] = {
        ...activeMedicine,
        user_corrections: editedValues,
        uncertain_fields: res.medication.uncertain_fields ? JSON.parse(res.medication.uncertain_fields_json) : [],
        review_status: res.medication.review_status,
      };
      setCurrentPrescription({
        ...currentPrescription!,
        medicines: updatedMeds,
      });

      setIsEditing(false);
      setSaveSuccessMsg("Corrections saved while preserving original OCR data.");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save corrections.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Safety Notice */}
      <DisclaimerBanner variant="compact" />

      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Prescription Understanding & Review
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Upload a prescription slip or select a synthetic test case to inspect source-linked text, uncertainty flags, and the verification gate.
        </p>
      </div>

      {/* Synthetic Presets Showcase Bar (5 Test Scenarios) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Synthetic Test Prescriptions (Select to Test Pipeline)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Fictional labeled clinical benchmarks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {presets.map((p) => {
            const isCurrent = currentPrescription?.demo_preset_id === p.id;
            const badgeColor = 
              p.category.includes('Ideal') ? 'bg-emerald-100 text-emerald-800' :
              p.category.includes('Uncertainty') ? 'bg-amber-100 text-amber-800' :
              p.category.includes('Missing') ? 'bg-orange-100 text-orange-800' :
              p.category.includes('Multi') ? 'bg-blue-100 text-blue-800' :
              'bg-red-100 text-red-800';

            return (
              <button
                key={p.id}
                onClick={() => handleLoadPreset(p.id)}
                disabled={isProcessing}
                className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-50/70 shadow-md ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mb-1.5 ${badgeColor}`}>
                    {p.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-brand-700">
                  <span>{isCurrent ? 'Active View' : 'Load Sample'}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload Zone (or collapse if prescription already loaded) */}
      {!currentPrescription && (
        <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-300 hover:border-brand-500 transition-colors text-center space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".jpg,.jpeg,.png,.pdf,.webp"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Upload physical prescription or digital PDF
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Supports JPG, PNG, PDF up to 10MB. Files are mediated securely through backend OCR and never exposed publicly.
            </p>
          </div>

          {selectedFile ? (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 max-w-md mx-auto text-xs space-y-3">
              <div className="flex items-center justify-between font-semibold text-brand-900">
                <span className="truncate">{selectedFile.name}</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <button
                  onClick={() => { setSelectedFile(null); setFilePreviewUrl(null); }}
                  className="px-3 py-1.5 border border-slate-300 bg-white rounded-xl text-slate-700 font-medium hover:bg-slate-50"
                >
                  Change File
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                >
                  {isProcessing ? 'Processing OCR...' : 'Process Prescription'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Browse Files to Upload
            </button>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs max-w-md mx-auto flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* CORE WORKFLOW: Side-by-Side Source Linked Review Screen */}
      {currentPrescription && activeMedicine && (
        <div className="space-y-6">
          {/* Top Bar for active prescription */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                  Active Document: {currentPrescription.filename}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                  <span>Processed: {new Date(currentPrescription.upload_timestamp).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{currentPrescription.medicines.length} medicine{currentPrescription.medicines.length > 1 ? 's' : ''} detected</span>
                </div>
              </div>
            </div>

            {/* If multi-medication prescription, allow selecting item tab */}
            <div className="flex items-center gap-2 flex-wrap">
              {currentPrescription.medicines.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  {currentPrescription.medicines.map((m, idx) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMedicineIndex(idx)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        selectedMedicineIndex === idx
                          ? 'bg-white text-teal-800 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Med #{idx + 1}: {m.name_as_written}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => { setCurrentPrescription(null); setSelectedFile(null); }}
                className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Upload Different Rx
              </button>
            </div>
          </div>

          {/* Uncertainty Alert Component */}
          <UncertaintyAlert
            uncertainFields={activeMedicine.uncertain_fields}
            reasons={activeMedicine.uncertainty_reasons}
            onFocusField={(fieldKey) => {
              setHoveredFieldKey(fieldKey);
              setIsEditing(true);
            }}
          />

          {saveSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* SIDE-BY-SIDE SPLIT VIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 5 Cols: Original Physical Prescription + Interactive Bounding Box Overlays */}
            <div className="lg:col-span-5 h-full">
              <SourceLinkedViewer
                imageUrl={currentPrescription.file_url}
                filename={currentPrescription.filename}
                rawOcrText={currentPrescription.original_ocr_text}
                activeFieldKey={hoveredFieldKey}
                activeMedicine={activeMedicine}
                ocrHighlights={currentPrescription.ocr_highlights}
              />
            </div>

            {/* Right 7 Cols: Extracted & Structured Fields with Corrections & Verification */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Extracted Medication Instruction Set
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hover over any field to trace its exact physical source location on the Rx slip.
                    </p>
                  </div>
                  <div>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                      activeMedicine.review_status === 'ready_for_verification' ? 'bg-teal-100 text-teal-800' :
                      activeMedicine.review_status === 'uncertain' ? 'bg-amber-100 text-amber-800' :
                      activeMedicine.review_status === 'user_reviewed' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      Status: {activeMedicine.review_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Field 1: Medicine Name */}
                <div
                  onMouseEnter={() => setHoveredFieldKey('name_as_written')}
                  onMouseLeave={() => setHoveredFieldKey(null)}
                  className={`p-4 rounded-2xl border transition-all ${
                    hoveredFieldKey === 'name_as_written'
                      ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Medicine Name As Written
                    </span>
                    <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Linked to Rx line
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedValues.name_as_written}
                      onChange={(e) => setEditedValues({ ...editedValues, name_as_written: e.target.value })}
                      className="w-full text-sm font-bold p-2 border border-slate-300 rounded-xl bg-white"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-900">
                      {activeMedicine.user_corrections?.name_as_written ? (
                        <span className="text-teal-900">
                          {activeMedicine.user_corrections.name_as_written}{' '}
                          <span className="text-[10px] font-normal text-slate-400">
                            (Original OCR: {activeMedicine.name_as_written})
                          </span>
                        </span>
                      ) : (
                        activeMedicine.name_as_written
                      )}
                    </div>
                  )}
                </div>

                {/* Field 2: Strength / Dosage */}
                <div
                  onMouseEnter={() => setHoveredFieldKey('strength_as_written')}
                  onMouseLeave={() => setHoveredFieldKey(null)}
                  className={`p-4 rounded-2xl border transition-all ${
                    hoveredFieldKey === 'strength_as_written'
                      ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Strength / Dosage
                    </span>
                    <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Linked to Rx line
                    </span>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedValues.strength_as_written}
                      onChange={(e) => setEditedValues({ ...editedValues, strength_as_written: e.target.value })}
                      className="w-full text-sm p-2 border border-slate-300 rounded-xl bg-white font-medium"
                    />
                  ) : (
                    <div className="text-sm font-semibold text-slate-800">
                      {activeMedicine.strength_as_written || (
                        <span className="text-amber-700 italic">Not specified on prescription slip</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Field 3: Instructions as written */}
                <div
                  onMouseEnter={() => setHoveredFieldKey('instructions_as_written')}
                  onMouseLeave={() => setHoveredFieldKey(null)}
                  className={`p-4 rounded-2xl border transition-all ${
                    hoveredFieldKey === 'instructions_as_written'
                      ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                      : activeMedicine.uncertain_fields.includes('instructions_as_written')
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Full Instructions (Sig)
                      </span>
                      {activeMedicine.uncertain_fields.includes('instructions_as_written') && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                          Uncertain / Ambiguous
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Linked to Rx line
                    </span>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editedValues.instructions_as_written}
                      onChange={(e) => setEditedValues({ ...editedValues, instructions_as_written: e.target.value })}
                      rows={2}
                      className="w-full text-sm p-2 border border-slate-300 rounded-xl bg-white"
                    />
                  ) : (
                    <div className="text-sm text-slate-800 leading-relaxed">
                      {activeMedicine.user_corrections?.instructions_as_written ? (
                        <div>
                          <p className="font-semibold text-teal-950">
                            {activeMedicine.user_corrections.instructions_as_written}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Original OCR: {activeMedicine.instructions_as_written}
                          </p>
                        </div>
                      ) : (
                        activeMedicine.instructions_as_written || (
                          <span className="text-red-700 italic">No instructions detectable on document</span>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Sub-fields grid: Frequency, Timing, Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Frequency */}
                  <div 
                    onMouseEnter={() => setHoveredFieldKey('frequency_as_written')}
                    onMouseLeave={() => setHoveredFieldKey(null)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Frequency</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedValues.frequency_as_written}
                        onChange={(e) => setEditedValues({ ...editedValues, frequency_as_written: e.target.value })}
                        className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
                        placeholder="e.g. Twice daily"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">
                        {activeMedicine.frequency_as_written || <span className="text-amber-700">Not explicitly stated</span>}
                      </span>
                    )}
                  </div>

                  {/* Timing */}
                  <div 
                    onMouseEnter={() => setHoveredFieldKey('timing_as_written')}
                    onMouseLeave={() => setHoveredFieldKey(null)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Timing</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedValues.timing_as_written}
                        onChange={(e) => setEditedValues({ ...editedValues, timing_as_written: e.target.value })}
                        className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
                        placeholder="e.g. With meals"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">
                        {activeMedicine.timing_as_written || <span className="text-amber-700">Not explicitly stated</span>}
                      </span>
                    )}
                  </div>

                  {/* Duration */}
                  <div 
                    onMouseEnter={() => setHoveredFieldKey('duration_as_written')}
                    onMouseLeave={() => setHoveredFieldKey(null)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Duration</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedValues.duration_as_written}
                        onChange={(e) => setEditedValues({ ...editedValues, duration_as_written: e.target.value })}
                        className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
                        placeholder="e.g. 7 days"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800">
                        {activeMedicine.duration_as_written || <span className="text-slate-400">Not specified</span>}
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit & Save Controls */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveCorrections}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Verified Corrections
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit & Correct Fields
                    </button>
                  )}

                  {/* The Primary Gate Trigger */}
                  <button
                    onClick={() => setIsVerifyModalOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-700/20 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Review & Activate Routine
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Gate Modal */}
          {activeMedicine && (
            <VerificationGateModal
              medicine={activeMedicine}
              isOpen={isVerifyModalOpen}
              onClose={() => setIsVerifyModalOpen(false)}
              onSuccess={(result) => {
                if (onScheduleActivated) {
                  onScheduleActivated();
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
