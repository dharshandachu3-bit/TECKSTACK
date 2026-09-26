import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  AlertTriangle,
  Play,
  Save,
  Zap,
  Shield,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  Workflow,
  WorkflowStep,
  StepType,
  ApplicationName,
  ExecutionMethod,
} from '../../shared/types.js';
import { api } from '../services/api.js';
import { useToast } from '../store/ToastContext.js';

interface VisualWorkflowBuilderProps {
  workflow: Workflow;
  onSave: (updated: Workflow) => void;
  onRun: (workflow: Workflow) => void;
  onCancel: () => void;
}

export const VisualWorkflowBuilder: React.FC<VisualWorkflowBuilderProps> = ({
  workflow: initialWorkflow,
  onSave,
  onRun,
  onCancel,
}) => {
  const { showToast } = useToast();
  const [workflow, setWorkflow] = useState<Workflow>(JSON.parse(JSON.stringify(initialWorkflow)));
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    workflow.steps[0]?.id || null
  );
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedStep = workflow.steps.find((s) => s.id === selectedStepId);

  const handleValidate = async () => {
    try {
      const res = await api.validateWorkflow(workflow.id, workflow);
      setValidation(res);
    } catch (err) {
      console.error('Validation error:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateWorkflow(workflow.id, workflow);
      setWorkflow(updated);
      onSave(updated);
      handleValidate();
      showToast('Workflow saved successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save workflow', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = (type: StepType) => {
    const nextIndex = workflow.steps.length + 1;
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      stepIndex: nextIndex,
      name:
        type === 'CONDITION'
          ? 'Check Business Condition'
          : type === 'HUMAN_APPROVAL'
          ? 'Human Verification Check'
          : 'New Automation Action',
      type,
      application: type === 'HUMAN_APPROVAL' ? 'System' : 'HubSpot CRM',
      actionType: type === 'CONDITION' ? 'EVALUATE' : 'GENERIC_ACTION',
      parameters: {},
      executionMethod: type === 'HUMAN_APPROVAL' ? 'APPLICATION' : 'API',
      timeoutMs: type === 'HUMAN_APPROVAL' ? 86400000 : 30000,
      requiresApprovalPrompt:
        type === 'HUMAN_APPROVAL' ? 'Please approve continuation of this workflow.' : undefined,
    };

    const newSteps = [...workflow.steps, newStep];
    setWorkflow({ ...workflow, steps: newSteps });
    setSelectedStepId(newStep.id);
  };

  const handleDeleteStep = (id: string) => {
    const filtered = workflow.steps.filter((s) => s.id !== id);
    const reindexed = filtered.map((s, idx) => ({ ...s, stepIndex: idx + 1 }));
    setWorkflow({ ...workflow, steps: reindexed });
    if (selectedStepId === id) {
      setSelectedStepId(reindexed[0]?.id || null);
    }
  };

  const handleDuplicateStep = (step: WorkflowStep) => {
    const nextIndex = workflow.steps.length + 1;
    const duplicated: WorkflowStep = {
      ...JSON.parse(JSON.stringify(step)),
      id: `step_${Date.now()}_copy`,
      name: `${step.name} (Copy)`,
      stepIndex: nextIndex,
    };
    setWorkflow({ ...workflow, steps: [...workflow.steps, duplicated] });
    setSelectedStepId(duplicated.id);
  };

  const handleMoveStep = (index: number, direction: 'UP' | 'DOWN') => {
    const steps = [...workflow.steps];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    const temp = steps[index];
    steps[index] = steps[targetIdx];
    steps[targetIdx] = temp;

    const reindexed = steps.map((s, idx) => ({ ...s, stepIndex: idx + 1 }));
    setWorkflow({ ...workflow, steps: reindexed });
  };

  const handleUpdateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    const updatedSteps = workflow.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s));
    setWorkflow({ ...workflow, steps: updatedSteps });
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Builder Top Bar */}
      <div className="h-14 px-6 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={workflow.name}
            onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
            className="bg-transparent font-semibold text-sm text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800 focus:ring-1 focus:ring-cyan-500 rounded px-2 py-1 transition-colors"
          />
          <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
            {workflow.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleValidate}
            className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
          >
            Validate Syntax
          </button>
          <button
            onClick={() => onRun(workflow)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold shadow transition-colors active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Test Run
          </button>
          <button
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold shadow transition-colors active:scale-95"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Workflow'}
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-medium transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Validation Banner if validated */}
      {validation && (
        <div
          className={`px-6 py-2.5 border-b text-xs flex items-center justify-between shrink-0 ${
            validation.valid
              ? 'bg-emerald-950/40 border-emerald-900 text-emerald-300'
              : 'bg-rose-950/40 border-rose-900 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {validation.valid ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>
              {validation.valid
                ? 'Workflow passed all execution integrity checks.'
                : `Validation Issues: ${validation.errors.join('; ')}`}
            </span>
          </div>
          {validation.warnings.length > 0 && (
            <span className="text-[11px] text-amber-400/90 font-mono">
              {validation.warnings.length} warning(s)
            </span>
          )}
        </div>
      )}

      {/* Main Canvas: Left visual flow, Right step parameter editor */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-neutral-800">
        {/* Left Column: Visual Canvas */}
        <div className="md:col-span-7 overflow-y-auto p-8 space-y-4 bg-neutral-950/50">
          {/* Trigger Card */}
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm relative group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                    WORKFLOW TRIGGER
                  </div>
                  <div className="text-xs font-semibold text-neutral-100">
                    {workflow.trigger.type || 'EVENT_TRIGGER'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                {workflow.trigger.application}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-2">{workflow.trigger.description}</p>
          </div>

          <div className="flex justify-center text-neutral-600">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Steps List */}
          {workflow.steps.map((step, idx) => {
            const isSelected = selectedStepId === step.id;
            return (
              <React.Fragment key={step.id}>
                <div
                  onClick={() => setSelectedStepId(step.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-neutral-900 border-cyan-500 shadow-lg shadow-cyan-500/10'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-mono text-neutral-300">
                        {step.stepIndex}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-100">{step.name}</span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                            {step.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          {step.application} · {step.actionType}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveStep(idx, 'UP');
                        }}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-neutral-800"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveStep(idx, 'DOWN');
                        }}
                        disabled={idx === workflow.steps.length - 1}
                        title="Move Down"
                        className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-neutral-800"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateStep(step);
                        }}
                        title="Duplicate"
                        className="p-1 text-neutral-400 hover:text-neutral-200 rounded hover:bg-neutral-800"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStep(step.id);
                        }}
                        title="Delete"
                        className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {step.type === 'HUMAN_APPROVAL' && (
                    <div className="mt-2.5 p-2 rounded bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-300 flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <span>Pauses execution for operator authorization</span>
                    </div>
                  )}
                </div>

                {idx < workflow.steps.length - 1 && (
                  <div className="flex justify-center text-neutral-600">
                    <ArrowDown className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Add Step Action Bar */}
          <div className="pt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => handleAddStep('ACTION')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Action
            </button>
            <button
              onClick={() => handleAddStep('CONDITION')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Condition
            </button>
            <button
              onClick={() => handleAddStep('HUMAN_APPROVAL')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Human Approval
            </button>
          </div>
        </div>

        {/* Right Column: Step Configuration Inspector */}
        <div className="md:col-span-5 overflow-y-auto p-6 bg-neutral-900/40 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Step Inspector
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              {selectedStep ? `Step #${selectedStep.stepIndex}` : 'None Selected'}
            </span>
          </div>

          {selectedStep ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                  Step Name
                </label>
                <input
                  type="text"
                  value={selectedStep.name}
                  onChange={(e) => handleUpdateStep(selectedStep.id, { name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                    Application
                  </label>
                  <select
                    value={selectedStep.application}
                    onChange={(e) =>
                      handleUpdateStep(selectedStep.id, {
                        application: e.target.value as ApplicationName,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Gmail">Gmail</option>
                    <option value="Slack">Slack</option>
                    <option value="HubSpot CRM">HubSpot CRM</option>
                    <option value="Google Sheets">Google Sheets</option>
                    <option value="Chrome">Chrome</option>
                    <option value="System">System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                    Step Type
                  </label>
                  <select
                    value={selectedStep.type}
                    onChange={(e) =>
                      handleUpdateStep(selectedStep.id, { type: e.target.value as StepType })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ACTION">Action</option>
                    <option value="CONDITION">Condition</option>
                    <option value="HUMAN_APPROVAL">Human Approval</option>
                    <option value="WAIT">Wait</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                  Execution Method Priority
                </label>
                <select
                  value={selectedStep.executionMethod}
                  onChange={(e) =>
                    handleUpdateStep(selectedStep.id, {
                      executionMethod: e.target.value as ExecutionMethod,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="API">API Integration</option>
                  <option value="APPLICATION">Application Level</option>
                  <option value="SEMANTIC_UI">Semantic UI</option>
                  <option value="BROWSER_AUTOMATION">Browser Automation (Playwright)</option>
                  <option value="COMPUTER_VISION">Computer Vision Fallback</option>
                </select>
              </div>

              {selectedStep.type === 'HUMAN_APPROVAL' && (
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                    Approval Prompt Text
                  </label>
                  <textarea
                    rows={3}
                    value={selectedStep.requiresApprovalPrompt || ''}
                    onChange={(e) =>
                      handleUpdateStep(selectedStep.id, {
                        requiresApprovalPrompt: e.target.value,
                      })
                    }
                    placeholder="Message to display to human reviewer..."
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                  Parameters (JSON)
                </label>
                <textarea
                  rows={6}
                  value={JSON.stringify(selectedStep.parameters, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      handleUpdateStep(selectedStep.id, { parameters: parsed });
                    } catch (err) {
                      // ignore parse errors while typing
                    }
                  }}
                  className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-neutral-500">
              Select a step in the visual diagram to configure its parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
