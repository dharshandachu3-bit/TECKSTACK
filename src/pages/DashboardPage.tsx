import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Play,
  RotateCw,
  ExternalLink,
} from 'lucide-react';
import { AnalyticsSummary, WorkflowCandidate, Execution, Workflow } from '../../shared/types.js';
import { api } from '../services/api.js';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenCandidateReview: (cand: WorkflowCandidate) => void;
  onOpenExecution: (id: string) => void;
  onRunWorkflow: (wf: Workflow) => void;
  refreshNonce?: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenCandidateReview,
  onOpenExecution,
  onRunWorkflow,
  refreshNonce,
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [candidates, setCandidates] = useState<WorkflowCandidate[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, candidatesData, executionsData, workflowsData] = await Promise.all([
        api.getAnalytics(),
        api.getCandidates(),
        api.getExecutions(8),
        api.getWorkflows(),
      ]);
      setAnalytics(analyticsData);
      setCandidates(candidatesData.filter((c) => c.status !== 'REJECTED'));
      setExecutions(executionsData);
      setWorkflows(workflowsData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshNonce]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-cyan-400">Autonomous Operations</span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400 font-mono">Prototype Console</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-1">
            Operational Intelligence Center
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            WorkFlowOS is continuously analyzing desktop activities across connected business applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh metrics"
            className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('discovery')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Discover Patterns</span>
          </button>
        </div>
      </div>

      {/* Real Calculated Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-mono text-neutral-500 uppercase">Workflows Discovered</div>
          <div className="text-2xl font-bold text-neutral-100 mt-1">
            {analytics?.workflowsDiscovered ?? '...'}
          </div>
          <div className="text-[11px] text-cyan-400 font-mono mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Auto-discovered patterns
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-mono text-neutral-500 uppercase">Active Automations</div>
          <div className="text-2xl font-bold text-neutral-100 mt-1">
            {analytics?.activeAutomations ?? '...'}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Live runners active
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-mono text-neutral-500 uppercase">Successful Executions</div>
          <div className="text-2xl font-bold text-neutral-100 mt-1">
            {analytics?.successfulExecutions ?? '...'}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            of {analytics?.totalExecutions ?? 0} total runs
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-mono text-neutral-500 uppercase">Time Saved</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {analytics?.totalTimeSavedHours ?? 0} <span className="text-xs font-normal text-neutral-400">hours</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            ~{analytics?.totalTimeSavedMinutes ?? 0} minutes total
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-mono text-neutral-500 uppercase">Success Rate</div>
          <div className="text-2xl font-bold text-neutral-100 mt-1">
            {analytics?.successRate ?? 100}%
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Production reliability
          </div>
        </div>
      </div>

      {/* AI Discovery Spotlight Carousel / Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-neutral-200">
              AI Workflow Discoveries Requiring Review
            </h3>
          </div>
          <button
            onClick={() => onNavigate('discovery')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            View all ({candidates.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.slice(0, 2).map((cand) => (
            <div
              key={cand.id}
              className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                    Confidence: {Math.round(cand.confidenceScore * 100)}%
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    ~{Math.round(cand.estimatedWeeklyTimeSavedSecs / 60)} min / wk saved
                  </span>
                </div>

                <h4 className="text-base font-semibold text-neutral-100 mt-3">{cand.name}</h4>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                  {cand.intent}
                </p>

                <div className="mt-4 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono text-neutral-400">
                  {cand.applications.map((app, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-300"
                    >
                      {app}
                    </span>
                  ))}
                  <span className="text-neutral-500">· {cand.frequency} observations</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500 font-mono">
                  {cand.rawSequence.length} Steps Sequence
                </span>
                <button
                  onClick={() => onOpenCandidateReview(cand)}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-medium transition-colors"
                >
                  Review & Automate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Recent Executions & Ready Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Executions (Left 7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-neutral-200">Recent Executions</h3>
            </div>
            <button
              onClick={() => onNavigate('executions')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              All executions <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-800/60">
            {executions.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">No executions recorded yet.</div>
            ) : (
              executions.slice(0, 5).map((exec) => (
                <div
                  key={exec.id}
                  onClick={() => onOpenExecution(exec.id)}
                  className="py-3 flex items-center justify-between hover:bg-neutral-800/30 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {exec.status === 'SUCCESS' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {exec.status === 'RUNNING' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                    )}
                    {exec.status === 'WAITING' && (
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    {exec.status === 'FAILED' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                    )}

                    <div className="min-w-0">
                      <div className="text-xs font-medium text-neutral-200 truncate">
                        {exec.workflowName}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {new Date(exec.startTime).toLocaleTimeString()} · {exec.steps.length} steps ·{' '}
                        {exec.durationMs ? `${exec.durationMs}ms` : 'Running'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                        exec.status === 'SUCCESS'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40'
                          : exec.status === 'FAILED'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-900/40'
                          : 'bg-amber-950/60 text-amber-400 border border-amber-900/40'
                      }`}
                    >
                      {exec.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ready Workflows (Right 5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-neutral-200">Active Workflows</h3>
            </div>
            <button
              onClick={() => onNavigate('workflows')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {workflows.slice(0, 4).map((wf) => (
              <div
                key={wf.id}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between hover:border-neutral-700 transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="text-xs font-semibold text-neutral-200 truncate">{wf.name}</div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    {wf.steps.length} steps · {wf.trigger.application}
                  </div>
                </div>
                <button
                  onClick={() => onRunWorkflow(wf)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-medium transition-colors shrink-0"
                >
                  <Play className="w-3 h-3 fill-current" /> Run
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
