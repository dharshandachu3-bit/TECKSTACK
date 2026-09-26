import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle,
  ThumbsDown,
} from 'lucide-react';
import { WorkflowCandidate } from '../../shared/types.js';
import { api } from '../services/api.js';

interface CandidateReviewModalProps {
  candidate: WorkflowCandidate | null;
  onClose: () => void;
  onApproved: (workflow: any) => void;
  onRejected: () => void;
}

export const CandidateReviewModal: React.FC<CandidateReviewModalProps> = ({
  candidate,
  onClose,
  onApproved,
  onRejected,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!candidate) return null;

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.acceptCandidate(candidate.id);
      onApproved(res.workflow);
    } catch (err: any) {
      setError(err.message || 'Failed to approve candidate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.rejectCandidate(candidate.id);
      onRejected();
    } catch (err: any) {
      setError(err.message || 'Failed to reject candidate');
    } finally {
      setSubmitting(false);
    }
  };

  const timeSavedMinutes = Math.round(candidate.estimatedWeeklyTimeSavedSecs / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-cyan-400">AI Pattern Discovery</span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400 font-mono">
                  Confidence {Math.round(candidate.confidenceScore * 100)}%
                </span>
              </div>
              <h3 className="text-base font-semibold text-neutral-100">{candidate.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Discovery Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="text-[11px] text-neutral-500 font-mono">OBSERVED FREQUENCY</div>
              <div className="text-lg font-bold text-neutral-100 mt-0.5">
                {candidate.frequency} <span className="text-xs font-normal text-neutral-500">runs</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="text-[11px] text-neutral-500 font-mono">PATTERN SIMILARITY</div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5">
                {Math.round(candidate.similarity * 100)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="text-[11px] text-neutral-500 font-mono">CROSS-APP HOPS</div>
              <div className="text-lg font-bold text-neutral-100 mt-0.5">
                {candidate.crossAppTransitions} <span className="text-xs font-normal text-neutral-500">transitions</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="text-[11px] text-neutral-500 font-mono">ESTIMATED IMPACT</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                ~{timeSavedMinutes} <span className="text-xs font-normal text-neutral-400">m / wk</span>
              </div>
            </div>
          </div>

          {/* AI Semantic Interpretation */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Synthesized Intent</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">{candidate.intent}</p>
            {candidate.suggestedTrigger && (
              <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-2 text-xs text-neutral-400">
                <span className="font-mono text-[10px] uppercase text-cyan-400">Proposed Trigger:</span>
                <span>{candidate.suggestedTrigger}</span>
              </div>
            )}
          </div>

          {/* Observed Pattern Sequence */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Observed Action Sequence
              </span>
              <span className="text-[11px] text-neutral-500 font-mono">
                {candidate.rawSequence.length} Steps Across {candidate.applications.join(', ')}
              </span>
            </div>

            <div className="space-y-2">
              {candidate.rawSequence.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center font-mono text-[10px] text-neutral-400 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-28 font-mono text-[11px] text-cyan-400 shrink-0">
                    {step.app}
                  </div>
                  <div className="text-neutral-200 font-medium">{step.action}</div>
                  {step.target && (
                    <div className="ml-auto text-[11px] text-neutral-500 font-mono truncate max-w-xs">
                      {step.target}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Safety & Risks */}
          {candidate.potentialRisks && candidate.potentialRisks.length > 0 && (
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-amber-900/40 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Operational Governance & Safety Safeguards</span>
              </div>
              <ul className="list-disc list-inside text-neutral-400 space-y-1 text-[11px]">
                {candidate.potentialRisks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
                <li>Human confirmation will be enforced by default before production deployment.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-900/60 shrink-0">
          <button
            disabled={submitting}
            onClick={handleReject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-medium transition-colors"
          >
            <ThumbsDown className="w-3.5 h-3.5" /> Dismiss Candidate
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={submitting}
              onClick={handleApprove}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{submitting ? 'Generating Workflow...' : 'Approve & Generate Workflow'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
