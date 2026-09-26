import React, { useState, useEffect } from 'react';
import { X, Play, Activity, Check, Sparkles, AlertCircle } from 'lucide-react';
import { WorkflowSimulationTemplate } from '../../shared/types.js';
import { api } from '../services/api.js';
import { useToast } from '../store/ToastContext.js';

interface EventSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulated: () => void;
}

export const EventSimulatorModal: React.FC<EventSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSimulated,
}) => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<WorkflowSimulationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('sim_customer_request');
  const [simulating, setSimulating] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getSimulationTemplates().then(setTemplates).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setSimulating(true);
    setResultMessage(null);
    try {
      const res = await api.simulateActivity(selectedTemplate);
      setResultMessage(res.message);
      showToast(res.message, 'success');
      onSimulated();
      setTimeout(() => {
        onClose();
        setResultMessage(null);
      }, 1500);
    } catch (err: any) {
      showToast(err.message || 'Simulation trigger failed', 'error');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-800 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Simulate Human Activity</h3>
              <p className="text-[11px] text-neutral-500 font-mono">
                Prototype Event Source · Ingestion pipeline verification
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

        {/* Notice box */}
        <div className="px-6 pt-4">
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-900/50 flex items-start gap-2.5 text-xs text-cyan-300">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              This emits realistic digital action sequences into the live event ingestion pipeline.
              The AI discovery engine analyzes these sequences to discover workflows.
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Select Knowledge Worker Sequence
          </div>

          <div className="space-y-2.5">
            {templates.map((tpl) => {
              const isSelected = selectedTemplate === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800/80 border-cyan-500/70 shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200">{tpl.name}</span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {tpl.steps.length} steps
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {tpl.description}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono text-neutral-400">
                    {tpl.steps.map((st: { app: string }, sIdx: number) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 shrink-0"
                      >
                        {st.app}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {resultMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{resultMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-end gap-2 bg-neutral-900/60 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={simulating}
            onClick={handleSimulate}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{simulating ? 'Emitting Actions...' : 'Start Simulation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
