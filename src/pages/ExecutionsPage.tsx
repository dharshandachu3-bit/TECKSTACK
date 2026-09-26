import React, { useState, useEffect } from 'react';
import {
  PlaySquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCw,
  Search,
  Filter,
  ShieldAlert,
} from 'lucide-react';
import { Execution, ExecutionStatus } from '../../shared/types.js';
import { api } from '../services/api.js';

interface ExecutionsPageProps {
  onOpenExecution: (id: string) => void;
  refreshNonce?: number;
}

export const ExecutionsPage: React.FC<ExecutionsPageProps> = ({ onOpenExecution, refreshNonce }) => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [filter, setFilter] = useState<'ALL' | ExecutionStatus>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const data = await api.getExecutions(100);
      setExecutions(data);
    } catch (err) {
      console.error('Failed to load executions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
  }, [refreshNonce]);

  const filtered = executions.filter((e) => {
    if (filter !== 'ALL' && e.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.workflowName.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        (e.errors && e.errors.some((err) => err.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-cyan-400">Execution Audit Trail</span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400 font-mono">Real-time state records</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-1">
            Execution Logs & Runner
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Full traces of every workflow run, step outputs, latency timings, and human approvals.
          </p>
        </div>

        <button
          onClick={fetchExecutions}
          title="Refresh"
          className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors shrink-0"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Human Approval Pending Alert if any exists */}
      {executions.some((e) => e.isWaitingApproval) && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-amber-200">
                Action Required: 1 or more workflows paused for operator authorization
              </span>
              <p className="text-amber-300/80 mt-0.5">
                Click on the paused execution below to review parameters and confirm continuation.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const pending = executions.find((e) => e.isWaitingApproval);
              if (pending) onOpenExecution(pending.id);
            }}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs shadow transition-colors shrink-0"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs overflow-x-auto">
          {(['ALL', 'SUCCESS', 'RUNNING', 'WAITING', 'FAILED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                filter === st
                  ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {st === 'ALL'
                ? 'All Executions'
                : st === 'WAITING'
                ? 'Waiting Approval'
                : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by workflow or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 w-64"
          />
        </div>
      </div>

      {/* Executions Table */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/60 text-neutral-400 font-mono text-[11px] uppercase border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-6">Workflow</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Start Time</th>
                <th className="py-3.5 px-6">Duration</th>
                <th className="py-3.5 px-6">Method</th>
                <th className="py-3.5 px-6">Impact</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    No executions found matching filter.
                  </td>
                </tr>
              ) : (
                filtered.map((exec) => (
                  <tr
                    key={exec.id}
                    onClick={() => onOpenExecution(exec.id)}
                    className="hover:bg-neutral-800/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-6">
                      <div className="font-medium text-neutral-200">{exec.workflowName}</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{exec.id}</div>
                    </td>

                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2 py-0.5 rounded ${
                          exec.status === 'SUCCESS'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                            : exec.status === 'RUNNING'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/60'
                            : exec.status === 'WAITING'
                            ? 'bg-amber-950 text-amber-400 border border-amber-900/60'
                            : 'bg-rose-950 text-rose-400 border border-rose-900/60'
                        }`}
                      >
                        {exec.status === 'SUCCESS' && <CheckCircle2 className="w-3 h-3" />}
                        {exec.status === 'RUNNING' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        )}
                        {exec.status === 'WAITING' && <Clock className="w-3 h-3" />}
                        {exec.status === 'FAILED' && <AlertCircle className="w-3 h-3" />}
                        {exec.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 font-mono text-[11px] text-neutral-400">
                      {new Date(exec.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-6 font-mono text-[11px] text-neutral-300">
                      {exec.durationMs ? `${exec.durationMs}ms` : '...'}
                    </td>

                    <td className="py-3.5 px-6 font-mono text-[11px] text-neutral-400">
                      {exec.steps[0]?.executionMethod || 'API'}
                    </td>

                    <td className="py-3.5 px-6 font-mono text-[11px] text-emerald-400">
                      {exec.timeSavedSeconds > 0
                        ? `+${Math.round(exec.timeSavedSeconds / 60)}m saved`
                        : '0m'}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <span className="text-cyan-400 hover:text-cyan-300 font-medium">Inspect</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
