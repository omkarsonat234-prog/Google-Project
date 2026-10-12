import React, { useState, useEffect } from 'react';
import { 
  History, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Bell, 
  Edit3, 
  UserCheck, 
  Activity, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { fetchAuditLogs } from '../services/api';
import { AuditLogEntry } from '../types';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const HistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAuditLogs(150);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionBadge = (action: string) => {
    if (action.includes('ACTIVATION') || action.includes('VERIFIED')) {
      return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: ShieldCheck, label: 'Verified Activation' };
    }
    if (action.includes('INTAKE')) {
      return { color: 'bg-teal-100 text-teal-800 border-teal-200', icon: CheckCircle2, label: 'Reported Intake' };
    }
    if (action.includes('ACKNOWLEDGED')) {
      return { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Bell, label: 'Alert Acknowledged' };
    }
    if (action.includes('CORRECTION') || action.includes('VERSION')) {
      return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Edit3, label: 'Field Amendment' };
    }
    if (action.includes('UPLOAD') || action.includes('STRUCTURED')) {
      return { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: FileText, label: 'OCR Ingestion' };
    }
    return { color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Activity, label: action };
  };

  const filteredLogs = filterAction === 'all' ? logs : logs.filter(l => l.action.toLowerCase().includes(filterAction.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Disclaimer */}
      <DisclaimerBanner variant="compact" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Immutable Activity & Audit Log
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Forensic audit trail preserving original prescriptions, human corrections, verification gates, and distinct intake events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs flex items-center gap-1.5"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recorded Timeline ({filteredLogs.length} events)
            </h3>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1">
            {['all', 'upload', 'correction', 'activation', 'acknowledged', 'intake'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterAction(cat)}
                className={`px-2.5 py-1 text-xs rounded-lg capitalize font-medium ${
                  filterAction === cat ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No audit records match the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const badge = getActionBadge(log.action);
              const Icon = badge.icon;

              return (
                <div key={log.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${badge.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900">{badge.label}</span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Target: {log.target_type} ({log.target_id.slice(0, 12)}...)
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5 max-w-xl font-mono">
                        {JSON.stringify(log.details)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center sm:justify-end gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-teal-800 font-bold capitalize">
                      Role: {log.user_role} ({log.user_id})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
