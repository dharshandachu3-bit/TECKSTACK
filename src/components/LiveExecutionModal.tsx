import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  RotateCw,
  Terminal,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Execution, ExecutionStep } from '../../shared/types.js';
import { api } from '../services/api.js';
import { useToast } from '../store/ToastContext.js';

interface LiveExecutionModalProps {
  executionId: string | null;
  onClose: () => void;
  onExecutionCompleted?: () => void;
  onExecutionRetried?: (newExecutionId: string) => void;
}

export const LiveExecutionModal: React.FC<LiveExecutionModalProps> = ({
  executionId,
  onClose,
  onExecutionCompleted,
  onExecutionRetried,
}) => {
  const { showToast } = useToast();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  useEffect(() => {
    if (!executionId) return;

    let unsub: (() => void) | null = null;
    let completedNotified = false;

    async function init() {
      try {
        setLoading(true);
        const initialData = await api.getExecutionById(executionId!);
        if (initialData) {
          setExecution(initialData);
          if (initialData.steps.length > 0) {
            setSelectedStep(initialData.currentStepIndex || 1);
          }
        }

        // Subscribe to live SSE updates for the active execution
        unsub = api.subscribeToExecutionStream(executionId!, (updated) => {
          setExecution(updated);
          if (updated.steps && updated.currentStepIndex) {
            setSelectedStep((prev) => (prev === null ? updated.currentStepIndex : prev));
          }
          if ((updated.status === 'SUCCESS' || updated.status === 'FAILED') && !completedNotified) {
            completedNotified = true;
            onExecutionCompleted?.();
          }
        });
      } catch (err) {
        console.error('Failed to load execution:', err);
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      if (unsub) unsub();
    };
  }, [executionId]);

  if (!executionId) return null;

  const handleApprove = async () => {
    if (!execution) return;
    setActionInProgress(true);
    try {
      const updated = await api.approveExecutionStep(execution.id, 'APPROVE');
      setExecution(updated);
      showToast('Step execution approved and resumed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to approve', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReject = async () => {
    if (!execution) return;
    setActionInProgress(true);
    try {
      const updated = await api.approveExecutionStep(
        execution.id,
        'REJECT',
        'Rejected by operator in console'
      );
      setExecution(updated);
      showToast('Step rejected: workflow execution terminated', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to reject', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRetry = async () => {
    if (!execution || actionInProgress) return;
    setActionInProgress(true);
    try {
      const res = await api.retryExecution(execution.id);
      showToast('Workflow rerun initiated · streaming live execution', 'info');
      onExecutionRetried?.(res.executionId);
    } catch (err: any) {
      showToast(err.message || 'Retry failed', 'error');
      setActionInProgress(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
          </span>
        );
      case 'RUNNING':
        return (
          <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> RUNNING
          </span>
        );
      case 'WAITING':
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
            <Clock className="w-3.5 h-3.5" /> WAITING APPROVAL
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1.5 text-xs text-rose-400 font-mono">
            <AlertCircle className="w-3.5 h-3.5" /> FAILED
          </span>
        );
      default:
        return (
          <span className="text-xs text-neutral-400 font-mono">{status}</span>
        );
    }
  };

  const activeStepData = execution?.steps.find((s) => s.stepIndex === selectedStep);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-100">
                  {execution?.workflowName || 'Workflow Execution'}
                </h3>
                {execution && getStatusBadge(execution.status)}
              </div>
              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                ID: {execution?.id} · Started{' '}
                {execution ? new Date(execution.startTime).toLocaleTimeString() : '...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Human in the loop pause banner */}
        {execution?.isWaitingApproval && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-amber-200">
                  Human-in-the-Loop: Approval Required
                </div>
                <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                  {execution.approvalPayload?.prompt ||
                    'WorkFlowOS needs your confirmation before continuing this automation step.'}
                </p>
                {execution.approvalPayload?.details && (
                  <div className="mt-2 text-[11px] font-mono text-amber-200/80 bg-amber-950/60 p-2 rounded border border-amber-900/50">
                    {JSON.stringify(execution.approvalPayload.details, null, 2)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                disabled={actionInProgress}
                onClick={handleReject}
                className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
              >
                Reject & Abort
              </button>
              <button
                disabled={actionInProgress}
                onClick={handleApprove}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold shadow transition-colors"
              >
                Approve & Resume
              </button>
            </div>
          </div>
        )}

        {/* Failure Banner */}
        {execution?.status === 'FAILED' && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-rose-200">
                  Execution Stopped: Step Failure
                </div>
                <p className="text-xs text-rose-300/90 mt-1">
                  {execution.errors[0] || 'Unknown step failure encountered.'}
                </p>
              </div>
            </div>
            <button
              disabled={actionInProgress}
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Modal Body: Split view (Timeline on Left, Details/Payload on Right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-neutral-800 p-6 gap-6">
          {/* Timeline column */}
          <div className="md:col-span-6 overflow-y-auto space-y-3 pr-2">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Execution Sequence
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-neutral-500">Loading trace...</div>
            ) : (
              execution?.steps.map((step) => {
                const isSelected = selectedStep === step.stepIndex;
                return (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStep(step.stepIndex)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-800/80 border-cyan-500/60 shadow-sm'
                        : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {step.status === 'SUCCESS' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {step.status === 'RUNNING' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                        )}
                        {step.status === 'WAITING_APPROVAL' && (
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        {step.status === 'FAILED' && (
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        {step.status === 'PENDING' && (
                          <span className="w-2 h-2 rounded-full bg-neutral-600 shrink-0" />
                        )}
                        {step.status === 'SKIPPED' && (
                          <span className="w-2 h-2 rounded-full bg-neutral-700 shrink-0" />
                        )}
                        <span className="text-xs font-medium text-neutral-200">
                          {step.stepIndex}. {step.stepName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-neutral-400">{step.application}</span>
                        {step.durationMs ? (
                          <span className="text-neutral-500">{step.durationMs}ms</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                      <span className="font-mono text-[10px] text-cyan-400/80">
                        Method: {step.executionMethod}
                      </span>
                      <span className="text-[10px] uppercase font-mono">{step.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Step Details Column */}
          <div className="md:col-span-6 overflow-y-auto pl-2 flex flex-col">
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Step Inspector & Logs
            </div>

            {activeStepData ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="text-xs font-medium text-neutral-200">
                    {activeStepData.stepName}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono grid grid-cols-2 gap-2">
                    <div>
                      Application:{' '}
                      <span className="text-neutral-200">{activeStepData.application}</span>
                    </div>
                    <div>
                      Execution Method:{' '}
                      <span className="text-cyan-400">{activeStepData.executionMethod}</span>
                    </div>
                    <div>
                      Status:{' '}
                      <span
                        className={
                          activeStepData.status === 'SUCCESS'
                            ? 'text-emerald-400'
                            : activeStepData.status === 'FAILED'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }
                      >
                        {activeStepData.status}
                      </span>
                    </div>
                    <div>
                      Duration:{' '}
                      <span className="text-neutral-200">
                        {activeStepData.durationMs ? `${activeStepData.durationMs}ms` : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {activeStepData.errorDetails && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
                    <span className="font-semibold">Error:</span> {activeStepData.errorDetails}
                  </div>
                )}

                {activeStepData.outputData && (
                  <div>
                    <div className="text-[11px] font-mono text-neutral-400 mb-1">
                      Step Output Payload
                    </div>
                    <pre className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-56">
                      {JSON.stringify(activeStepData.outputData, null, 2)}
                    </pre>
                  </div>
                )}

                {activeStepData.inputData && (
                  <div>
                    <div className="text-[11px] font-mono text-neutral-400 mb-1">Step Inputs</div>
                    <pre className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-400 overflow-x-auto max-h-40">
                      {JSON.stringify(activeStepData.inputData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-neutral-500">
                Select a step on the left to inspect its parameters and outputs
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 flex items-center justify-between bg-neutral-900/60 shrink-0">
          <div className="text-xs text-neutral-400 font-mono">
            {execution?.status === 'SUCCESS' && (
              <span className="text-emerald-400">
                Completed in {execution.durationMs}ms · Saved ~
                {Math.round(execution.timeSavedSeconds / 60)} minutes
              </span>
            )}
            {execution?.status === 'RUNNING' && <span>Advancing automation sequence...</span>}
            {execution?.status === 'WAITING' && (
              <span className="text-amber-400">Action paused awaiting operator confirmation</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
          >
            Close Runner
          </button>
        </div>
      </div>
    </div>
  );
};
