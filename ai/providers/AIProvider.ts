import { ActivityEvent, ApplicationName, StepType, ExecutionMethod } from '../../shared/types.js';

export interface AIAnalysisOutput {
  workflowName: string;
  intent: string;
  entities: string[];
  potentialTrigger: {
    application: ApplicationName;
    type: string;
    description: string;
    config: Record<string, any>;
  };
  suggestedConditions: Array<{
    field: string;
    operator: 'EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'EXISTS' | 'NOT_EMPTY';
    value: any;
    explanation: string;
  }>;
  suggestedSteps: Array<{
    name: string;
    type: StepType;
    application: ApplicationName;
    actionType: string;
    parameters: Record<string, any>;
    executionMethod: ExecutionMethod;
    requiresApprovalPrompt?: string;
  }>;
  confidence: number;
  modelUsed: string;
  estimatedTimeSavedMinutes: number;
}

export interface AIProvider {
  analyzeWorkflowSequence(
    sequence: Array<{ app: ApplicationName; action: string; eventType: string; target: string }>,
    candidateContext?: { name?: string; intent?: string }
  ): Promise<AIAnalysisOutput>;
}
