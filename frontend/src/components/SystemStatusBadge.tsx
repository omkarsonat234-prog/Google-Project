import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, Info, Sparkles, Database, Bell, X } from 'lucide-react';
import { fetchSystemStatus } from '../services/api';
import { SystemStatus } from '../types';

export const SystemStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchSystemStatus().then(setStatus).catch(() => {});
  }, []);

  if (!status) return null;

  return (
    <>
      <button
        onClick={() => setOpenModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 bg-teal-50/70 text-teal-800 border-teal-200 hover:bg-teal-100/80 cursor-pointer"
        title="View Genuine Cloud Integration & Adapter Status"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
        </span>
        <span className="font-semibold">System Architecture:</span>
        <span className="hidden sm:inline text-teal-700 truncate max-w-[170px]">
          {status.ocr_connected && status.ai_connected ? 'Full GCP Connected' : 'Transparent Adapter Active'}
        </span>
      </button>

      {openModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">System Integration & Adapters</h3>
                <p className="text-xs text-slate-500">Transparent Google Cloud Architecture Audit</p>
              </div>
            </div>

            <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3.5 mb-5 text-xs text-teal-900 leading-relaxed">
              <p className="font-semibold mb-1">Hackathon Transparency Notice:</p>
              {status.mode_description}
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">OCR Engine</p>
                    <p className="text-xs text-slate-500">{status.ocr_provider}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.ocr_connected ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                  {status.ocr_connected ? 'GCP Live' : 'Demo Adapter'}
                </span>
              </div>

              <div className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-start gap-3">
                  <Activity className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">AI Structuring & Uncertainty Engine</p>
                    <p className="text-xs text-slate-500">{status.ai_provider}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.ai_connected ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                  {status.ai_connected ? 'Gemini Live' : 'Clinical Adapter'}
                </span>
              </div>

              <div className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Data Persistence</p>
                    <p className="text-xs text-slate-500">{status.database_type}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800">
                  Genuinely Live
                </span>
              </div>

              <div className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Medication Reminders</p>
                    <p className="text-xs text-slate-500">In-App Web Audio, Timeline & Intake Audit</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800">
                  Genuinely Live
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
