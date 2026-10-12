import React from 'react';
import { FileText, Eye, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { MedicineExtracted, SourceHighlight } from '../types';

interface Props {
  imageUrl: string;
  filename: string;
  rawOcrText: string;
  activeFieldKey: string | null;
  activeMedicine: MedicineExtracted | null;
  ocrHighlights: SourceHighlight[];
}

export const SourceLinkedViewer: React.FC<Props> = ({
  imageUrl,
  filename,
  rawOcrText,
  activeFieldKey,
  activeMedicine,
  ocrHighlights,
}) => {
  // Determine if active field has specific bounding box
  const activeLocation = activeMedicine?.source_locations?.[activeFieldKey || ''];
  const activeBox = activeLocation?.box; // [ymin, xmin, ymax, xmax]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Viewer Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]" title={filename}>
            Original Document: {filename}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {activeFieldKey ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 flex items-center gap-1 animate-pulse">
              <Eye className="w-3 h-3" /> Linking: {activeFieldKey.replace('_as_written', '')}
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Eye className="w-3 h-3 text-slate-400" /> Hover field to locate source
            </span>
          )}
        </div>
      </div>

      {/* Image & Overlay Canvas */}
      <div className="relative flex-1 bg-slate-900/5 min-h-[380px] max-h-[560px] overflow-auto flex items-center justify-center p-4">
        <div className="relative inline-block max-w-full rounded-xl overflow-hidden shadow-md border border-slate-200 bg-white">
          <img
            src={imageUrl}
            alt="Prescription slip"
            className="w-auto max-h-[520px] object-contain select-none"
          />

          {/* Dynamic Interactive Bounding Box Highlight Overlay */}
          {activeBox && (
            <div
              className="absolute border-2 border-teal-500 bg-teal-400/25 rounded-sm transition-all duration-200 pointer-events-none shadow-[0_0_12px_rgba(20,184,166,0.6)]"
              style={{
                top: `${activeBox[0] * 100}%`,
                left: `${activeBox[1] * 100}%`,
                height: `${(activeBox[2] - activeBox[0]) * 100}%`,
                width: `${(activeBox[3] - activeBox[1]) * 100}%`,
              }}
            >
              <div className="absolute -top-6 left-0 bg-teal-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                Source: {activeFieldKey?.replace('_as_written', '')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Accordion: Raw OCR Text vs Extracted Comparison */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Raw OCR Text Stream (Verbatim)
          </span>
          <span className="text-[11px] text-slate-500">Unfiltered character feed</span>
        </div>
        <div className="bg-slate-900 text-slate-100 font-mono text-[11px] p-3 rounded-xl max-h-36 overflow-y-auto leading-relaxed border border-slate-800 shadow-inner">
          {rawOcrText ? (
            rawOcrText.split('\n').map((line, idx) => {
              const isMatch = activeMedicine?.source_text?.some(st => line.includes(st) || st.includes(line));
              return (
                <div
                  key={idx}
                  className={`py-0.5 px-1 rounded transition-colors ${
                    isMatch ? 'bg-teal-800/80 text-teal-200 font-bold' : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-500 mr-2 select-none">{String(idx + 1).padStart(2, '0')}:</span>
                  {line}
                </div>
              );
            })
          ) : (
            <span className="text-slate-500">No raw OCR text available</span>
          )}
        </div>
      </div>
    </div>
  );
};
