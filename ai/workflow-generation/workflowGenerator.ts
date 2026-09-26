import { Workflow, WorkflowStep, WorkflowTrigger, WorkflowCondition } from '../../shared/types.js';
import { AIAnalysisOutput } from '../providers/AIProvider.js';

export class WorkflowGenerator {
  public static generateWorkflowFromAI(
    analysis: AIAnalysisOutput,
    userId: string,
    candidateId?: string
  ): Workflow {
    const workflowId = `wf_${Math.random().toString(36).substr(2, 9)}`;

    const trigger: WorkflowTrigger = {
      id: `trig_${Date.now()}`,
      type: analysis.potentialTrigger.type || 'EVENT_TRIGGER',
      application: analysis.potentialTrigger.application || 'Gmail',
      description: analysis.potentialTrigger.description,
      config: analysis.potentialTrigger.config || {},
    };

    const steps: WorkflowStep[] = analysis.suggestedSteps.map((s, idx) => ({
      id: `step_${idx + 1}_${Math.random().toString(36).substr(2, 5)}`,
      stepIndex: idx + 1,
      name: s.name,
      type: s.type,
      application: s.application,
      actionType: s.actionType,
      parameters: s.parameters || {},
      executionMethod: s.executionMethod || 'API',
      timeoutMs: s.type === 'HUMAN_APPROVAL' ? 86400000 : 30000,
      requiresApprovalPrompt: s.requiresApprovalPrompt,
    }));

    const conditions: WorkflowCondition[] = (analysis.suggestedConditions || []).map((c, idx) => ({
      id: `cond_${idx + 1}`,
      field: c.field,
      operator: c.operator,
      value: c.value,
    }));

    const variables = analysis.entities.map((e) => ({
      name: e.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      type: 'string',
    }));

    return {
      id: workflowId,
      userId,
      candidateId,
      name: analysis.workflowName,
      description: analysis.intent,
      category: 'Discovered Automation',
      trigger,
      steps,
      conditions,
      variables,
      version: 1,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalExecutions: 0,
      successRate: 100,
    };
  }
}
