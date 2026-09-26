export type UserRole = 'ADMIN' | 'ENGINEER' | 'OPERATOR';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export type EventType =
  | 'APPLICATION_OPENED'
  | 'BROWSER_NAVIGATION'
  | 'EMAIL_OPENED'
  | 'EMAIL_ATTACHMENT_DOWNLOADED'
  | 'FILE_CREATED'
  | 'FILE_UPLOADED'
  | 'FORM_SUBMITTED'
  | 'CRM_RECORD_SEARCHED'
  | 'CRM_RECORD_UPDATED'
  | 'MESSAGE_SENT'
  | 'BUTTON_CLICKED'
  | 'SPREADSHEET_ROW_ADDED'
  | 'DATA_EXPORTED';

export type ApplicationName = 'Gmail' | 'Slack' | 'HubSpot CRM' | 'Google Sheets' | 'Chrome' | 'Desktop Files' | 'System';

export interface ActivityEvent {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  source: 'PROTOTYPE_SIMULATOR' | 'DESKTOP_AGENT' | 'BROWSER_EXTENSION';
  application: ApplicationName;
  eventType: EventType;
  action: string;
  target: string;
  metadata: Record<string, any>;
  isSimulated: boolean;
  sensitiveDataScrubbed?: boolean;
}

export type CandidateStatus = 'DISCOVERED' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';

export interface WorkflowCandidate {
  id: string;
  userId: string;
  name: string;
  intent: string;
  applications: ApplicationName[];
  frequency: number;
  similarity: number; // e.g. 0.94 (94%)
  crossAppTransitions: number;
  avgDurationSecs: number;
  confidenceScore: number; // e.g. 0.91
  estimatedWeeklyTimeSavedSecs: number;
  status: CandidateStatus;
  discoveredAt: string;
  reviewedAt?: string;
  rawSequence: Array<{
    app: ApplicationName;
    action: string;
    eventType: EventType;
    target: string;
  }>;
  aiAnalysisId?: string;
  suggestedTrigger?: string;
  suggestedStepsCount?: number;
  potentialRisks?: string[];
}

export type WorkflowStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export type StepType = 'TRIGGER' | 'ACTION' | 'CONDITION' | 'WAIT' | 'HUMAN_APPROVAL';

export type ExecutionMethod = 'API' | 'APPLICATION' | 'SEMANTIC_UI' | 'BROWSER_AUTOMATION' | 'COMPUTER_VISION';

export interface WorkflowStep {
  id: string;
  stepIndex: number;
  name: string;
  type: StepType;
  application: ApplicationName;
  actionType: string;
  parameters: Record<string, any>;
  executionMethod: ExecutionMethod;
  timeoutMs: number;
  conditionTrueNextStepId?: string;
  conditionFalseNextStepId?: string;
  requiresApprovalPrompt?: string;
}

export interface WorkflowTrigger {
  id: string;
  type: string;
  application: ApplicationName;
  description: string;
  config: Record<string, any>;
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'EXISTS' | 'NOT_EMPTY';
  value: any;
}

export interface Workflow {
  id: string;
  userId: string;
  candidateId?: string;
  name: string;
  description: string;
  category: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  variables: Array<{ name: string; type: string; defaultValue?: string }>;
  version: number;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  totalExecutions?: number;
  successRate?: number;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  stepsSnapshot: WorkflowStep[];
  triggerSnapshot: WorkflowTrigger;
  conditionsSnapshot: WorkflowCondition[];
  changedBy: string;
  changelog: string;
  createdAt: string;
}

export type IntegrationType = 'GMAIL' | 'SLACK' | 'CRM' | 'SHEETS' | 'BROWSER';
export type IntegrationStatus = 'CONNECTED' | 'SIMULATED' | 'DISCONNECTED';

export interface Integration {
  id: string;
  userId: string;
  type: IntegrationType;
  name: string;
  application: ApplicationName;
  status: IntegrationStatus;
  config: Record<string, any>;
  lastTestedAt?: string;
  authType: 'OAUTH2' | 'API_KEY' | 'SIMULATED_MOCK';
  latencyMs?: number;
}

export interface Automation {
  id: string;
  userId: string;
  workflowId: string;
  name: string;
  triggerType: 'EVENT_BASED' | 'SCHEDULED' | 'WEBHOOK';
  scheduleCron?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunAt?: string;
  timeSavedSeconds: number;
}

export type ExecutionStatus = 'QUEUED' | 'RUNNING' | 'WAITING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type ExecutionStepStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'WAITING_APPROVAL';

export interface ExecutionStep {
  id: string;
  executionId: string;
  stepId: string;
  stepIndex: number;
  stepName: string;
  application: ApplicationName;
  executionMethod: ExecutionMethod;
  status: ExecutionStepStatus;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  errorDetails?: string;
  retryCount: number;
}

export interface Execution {
  id: string;
  userId: string;
  workflowId: string;
  workflowName: string;
  automationId?: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  triggerData: Record<string, any>;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  errors: string[];
  timeSavedSeconds: number;
  currentStepIndex: number;
  steps: ExecutionStep[];
  isWaitingApproval?: boolean;
  approvalPayload?: {
    prompt: string;
    stepIndex: number;
    stepId: string;
    details: Record<string, any>;
  };
}

export interface AIAnalysis {
  id: string;
  rawSequenceHash: string;
  workflowName: string;
  intent: string;
  entities: string[];
  potentialTrigger: string;
  suggestedConditions: string[];
  confidence: number;
  modelUsed: string;
  createdAt: string;
}

export type NotificationType =
  | 'WORKFLOW_DISCOVERED'
  | 'WORKFLOW_APPROVED'
  | 'AUTOMATION_FAILED'
  | 'APPROVAL_REQUIRED'
  | 'EXECUTION_COMPLETED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface UserSetting {
  id: string;
  userId: string;
  activityMonitoringEnabled: boolean;
  aiDiscoveryEnabled: boolean;
  autoSuggestionsEnabled: boolean;
  requireApprovalDefault: boolean;
  sensitiveDataFilterEnabled: boolean;
  excludedApps: string[];
  retentionDays: number;
  aiModelPreference: 'gemini-2.5-flash' | 'mock-offline';
}

export interface AnalyticsSummary {
  workflowsDiscovered: number;
  activeAutomations: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalExecutions: number;
  successRate: number; // percentage
  totalTimeSavedHours: number;
  totalTimeSavedMinutes: number;
  averageExecutionDurationSeconds: number;
  chartData: {
    timeSavedOverTime: Array<{ date: string; hoursSaved: number; minutesSaved: number }>;
    executionsPerDay: Array<{ date: string; success: number; failed: number; total: number }>;
    integrationsUsage: Array<{ app: ApplicationName; count: number; percentage: number }>;
    mostRepeatedWorkflows: Array<{ name: string; runs: number; timeSavedMinutes: number }>;
  };
}

export interface WorkflowSimulationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  apps: ApplicationName[];
  eventCount: number;
  steps: Array<{
    app: ApplicationName;
    action: string;
    target: string;
    details: string;
  }>;
}
