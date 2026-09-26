import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Pause,
  RotateCw,
  Clock,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Automation } from '../../shared/types.js';
import { api } from '../services/api.js';
import { useToast } from '../store/ToastContext.js';

interface AutomationsPageProps {
  onOpenExecution: (id: string) => void;
  onNavigateToExecutions: () => void;
}

export const AutomationsPage: React.FC<AutomationsPageProps> = ({
  onOpenExecution,
  onNavigateToExecutions,
}) => {
  const { showToast } = useToast();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAutomations = async () => {
    try {
      setLoading(true);
      const data = await api.getAutomations();
      setAutomations(data);
    } catch (err) {
      console.error('Failed to load automations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const res = await api.toggleAutomation(id);
      setAutomations((prev) => prev.map((a) => (a.id === id ? res : a)));
      showToast(`Automation status updated to ${res.status}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Toggle failed', 'error');
    }
  };

  const handleRunNow = async (id: string) => {
    try {
      const res = await api.runAutomation(id);
      showToast('Automation execution triggered', 'success');
      onOpenExecution(res.executionId);
    } catch (err: any) {
      showToast(err.message || 'Run failed', 'error');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-cyan-400">Automated Daemons</span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400 font-mono">
              {automations.filter((a) => a.status === 'ACTIVE').length} Active
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-1">Automations</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Event-driven triggers and continuous background workers executing approved business workflows.
          </p>
        </div>

        <button
          onClick={onNavigateToExecutions}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
        >
          View Execution Logs <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Automations Table */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
        <div className="divide-y divide-neutral-800/60">
          {automations.length === 0 ? (
            <div className="p-16 text-center text-xs text-neutral-500">
              No automations configured. Approve a workflow to create an automation.
            </div>
          ) : (
            automations.map((auto) => {
              const successRate =
                auto.totalRuns > 0
                  ? Math.round((auto.successfulRuns / auto.totalRuns) * 100)
                  : 100;
              const timeSavedMins = Math.round(auto.timeSavedSeconds / 60);

              return (
                <div
                  key={auto.id}
                  className="p-5 hover:bg-neutral-800/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          auto.status === 'ACTIVE'
                            ? 'bg-emerald-500 animate-pulse'
                            : 'bg-neutral-600'
                        }`}
                      />
                      <span className="text-xs font-semibold text-neutral-100">{auto.name}</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                        {auto.triggerType}
                        {auto.scheduleCron ? ` (${auto.scheduleCron})` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-neutral-500 font-mono">
                      <span>Total Runs: {auto.totalRuns}</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">
                        Success Rate: {successRate}%
                      </span>
                      <span>·</span>
                      <span>Time Saved: ~{timeSavedMins} mins</span>
                      {auto.lastRunAt && (
                        <>
                          <span>·</span>
                          <span>Last Run: {new Date(auto.lastRunAt).toLocaleTimeString()}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRunNow(auto.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Run Now
                    </button>

                    <button
                      onClick={() => handleToggle(auto.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        auto.status === 'ACTIVE'
                          ? 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          : 'border-emerald-900 bg-emerald-950 text-emerald-400 hover:bg-emerald-900'
                      }`}
                    >
                      {auto.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
