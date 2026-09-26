import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  RotateCw,
  Clock,
  Layers,
  CheckCircle,
  AlertTriangle,
  Play,
  Filter,
} from 'lucide-react';
import { WorkflowCandidate } from '../../shared/types.js';
import { api } from '../services/api.js';
import { useToast } from '../store/ToastContext.js';

interface DiscoveryPageProps {
  onOpenCandidateReview: (candidate: WorkflowCandidate) => void;
  onNavigateToWorkflows: () => void;
}

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({
  onOpenCandidateReview,
  onNavigateToWorkflows,
}) => {
  const { showToast } = useToast();
  const [candidates, setCandidates] = useState<WorkflowCandidate[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'DISCOVERED' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);

  const fetchCandidates = async () => {
    try {
      const data = await api.getCandidates();
      setCandidates(data);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleRunDiscoveryAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisSummary(null);
    try {
      const res = await api.analyzeActivity();
      setCandidates(res.allCandidates);
      setAnalysisSummary(
        `Analysis complete: Scanned ${res.analysis.analyzedEventsCount} events across ${res.analysis.sessionsIdentified} sessions. ${res.newCandidatesCreated} new pattern(s) identified.`
      );
      showToast('Pattern discovery analysis complete', 'success');
    } catch (err: any) {
      showToast(err.message || 'Discovery analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-cyan-400">Autonomous Pattern Intelligence</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-1">
            AI Workflow Discovery Engine
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Observes human desktop interactions, extracts high-frequency multi-application sequences, and proposes executable automations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={analyzing}
            onClick={handleRunDiscoveryAnalysis}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-neutral-950 text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>{analyzing ? 'Analyzing Event Stream...' : 'Run Discovery Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Analysis Output Banner if recently run */}
      {analysisSummary && (
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800 text-xs text-cyan-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{analysisSummary}</span>
          </div>
          <button
            onClick={() => setAnalysisSummary(null)}
            className="text-neutral-400 hover:text-neutral-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Centerpiece Pipeline Infographic */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
          How WorkFlowOS Discovers Automation
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
            <div className="text-[10px] font-mono text-cyan-400">01 · OBSERVE</div>
            <div className="font-semibold text-neutral-200">Session Ingestion</div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Desktop events pass through client-side zero-trust sensitive data filtering.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
            <div className="text-[10px] font-mono text-purple-400">02 · EXTRACT</div>
            <div className="font-semibold text-neutral-200">Sequence Extraction</div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Clusters sliding action windows across cross-app application boundaries.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
            <div className="text-[10px] font-mono text-indigo-400">03 · UNDERSTAND</div>
            <div className="font-semibold text-neutral-200">AI Semantic Synthesis</div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Synthesizes intent, core entities, safe triggers, and required validation conditions.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
            <div className="text-[10px] font-mono text-emerald-400">04 · AUTOMATE</div>
            <div className="font-semibold text-neutral-200">User Approval & Run</div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Workflow is reviewed by human operator and compiled into an active runner.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-medium">
          {(['ALL', 'DISCOVERED', 'ACCEPTED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === tab
                  ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab === 'ALL' ? 'All Candidates' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <span className="text-xs text-neutral-500 font-mono">
          Showing {filteredCandidates.length} candidate(s)
        </span>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCandidates.length === 0 ? (
          <div className="md:col-span-2 p-16 text-center rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <Sparkles className="w-8 h-8 text-neutral-600 mx-auto" />
            <div className="text-sm font-semibold text-neutral-300">No candidates match this filter</div>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Simulate or generate activity in the Activity Monitor, then click &ldquo;Run Discovery Analysis&rdquo;.
            </p>
          </div>
        ) : (
          filteredCandidates.map((cand) => (
            <div
              key={cand.id}
              className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                        cand.status === 'ACCEPTED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                          : cand.status === 'REJECTED'
                          ? 'bg-neutral-800 text-neutral-500'
                          : 'bg-cyan-950 text-cyan-400 border border-cyan-800/40'
                      }`}
                    >
                      {cand.status}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      Confidence: {Math.round(cand.confidenceScore * 100)}%
                    </span>
                  </div>

                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    ~{Math.round(cand.estimatedWeeklyTimeSavedSecs / 60)} min / wk
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-neutral-100">{cand.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{cand.intent}</p>
                </div>

                {/* Pattern Flow Strip */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-2">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">
                    Observed Flow ({cand.frequency} times)
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-mono text-neutral-300">
                    {cand.rawSequence.map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 shrink-0 text-cyan-300">
                          {step.app}
                        </span>
                        {idx < cand.rawSequence.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-neutral-600 shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-neutral-500 font-mono">
                  <span>Cross-App Hops: {cand.crossAppTransitions}</span>
                  <span>·</span>
                  <span>Avg Duration: {cand.avgDurationSecs}s</span>
                  <span>·</span>
                  <span>Similarity: {Math.round(cand.similarity * 100)}%</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500 font-mono">
                  Discovered {new Date(cand.discoveredAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onOpenCandidateReview(cand)}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-medium transition-colors"
                >
                  Review Details & Automate
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
