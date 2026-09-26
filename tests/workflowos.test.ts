import assert from 'assert';
import test from 'node:test';
import { SensitiveDataFilter } from '../services/sensitiveDataFilter.js';
import { WorkflowDiscoveryEngine } from '../ai/workflow-discovery/discoveryEngine.js';
import { WorkflowValidator } from '../workflow-engine/validators/workflowValidator.js';
import { WorkflowGenerator } from '../ai/workflow-generation/workflowGenerator.js';
import { MockAIProvider } from '../ai/providers/MockAIProvider.js';
import { WorkflowExecutor } from '../workflow-engine/executor/workflowExecutor.js';
import { db } from '../database/store.js';
import { hashPassword, DEMO_USER_ID } from '../database/seedData.js';
import { ActivityEvent, Workflow } from '../shared/types.js';

test('1. Authentication password hashing and verification', () => {
  const hash = hashPassword('demo123');
  assert.strictEqual(typeof hash, 'string');
  assert.strictEqual(hash.length, 64); // sha256 hex length
  assert.strictEqual(hashPassword('demo123'), hash);
  assert.notStrictEqual(hashPassword('wrongpassword'), hash);
});

test('2. SensitiveDataFilter redaction of secrets and credentials', () => {
  const rawText = 'User token is bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID and credit card 4532-1234-5678-9010';
  const { cleanText, redacted } = SensitiveDataFilter.scrubText(rawText);
  assert.strictEqual(redacted, true);
  assert.ok(!cleanText.includes('4532-1234-5678-9010'));
  assert.ok(cleanText.includes('[REDACTED_CREDIT_CARD]'));

  const processed = SensitiveDataFilter.processEvent({
    action: 'Submitted password: supersecret123',
    target: 'Auth portal',
    metadata: { userApiKey: 'secret_token_1234567890' },
  });
  assert.strictEqual(processed.hasSensitiveData, true);
  assert.ok(!processed.scrubbedEvent.action.includes('supersecret123'));
});

test('3. WorkflowDiscoveryEngine pattern repetition and candidate scoring', () => {
  const mockEvents: ActivityEvent[] = [];
  const baseTime = Date.now();

  // Create 3 identical sequences of Gmail -> CRM -> Slack
  for (let s = 1; s <= 3; s++) {
    const sId = `session_${s}`;
    mockEvents.push(
      {
        id: `e_${s}_1`,
        userId: 'usr_test',
        sessionId: sId,
        timestamp: new Date(baseTime + s * 100000 + 1000).toISOString(),
        source: 'PROTOTYPE_SIMULATOR',
        application: 'Gmail',
        eventType: 'EMAIL_OPENED',
        action: 'Opened customer email',
        target: 'Inbox message',
        metadata: {},
        isSimulated: true,
      },
      {
        id: `e_${s}_2`,
        userId: 'usr_test',
        sessionId: sId,
        timestamp: new Date(baseTime + s * 100000 + 2000).toISOString(),
        source: 'PROTOTYPE_SIMULATOR',
        application: 'HubSpot CRM',
        eventType: 'CRM_RECORD_UPDATED',
        action: 'Update record status',
        target: 'Ticket 100',
        metadata: {},
        isSimulated: true,
      },
      {
        id: `e_${s}_3`,
        userId: 'usr_test',
        sessionId: sId,
        timestamp: new Date(baseTime + s * 100000 + 3000).toISOString(),
        source: 'PROTOTYPE_SIMULATOR',
        application: 'Slack',
        eventType: 'MESSAGE_SENT',
        action: 'Notify team in ops',
        target: '#ops',
        metadata: {},
        isSimulated: true,
      }
    );
  }

  const result = WorkflowDiscoveryEngine.analyze(mockEvents, 'usr_test');
  assert.ok(result.candidates.length > 0, 'Discovery should find repeated candidate');
  const candidate = result.candidates[0];
  assert.ok(candidate.confidenceScore > 0.6, 'Confidence score should be above threshold');
  assert.ok(candidate.frequency >= 2, 'Candidate frequency should be at least 2');
});

test('4. AIProvider analysis & WorkflowGenerator structure', async () => {
  const mockAI = new MockAIProvider();
  const sequence = [
    { app: 'Gmail' as const, action: 'Open email', eventType: 'EMAIL_OPENED', target: 'Urgent' },
    { app: 'HubSpot CRM' as const, action: 'Search contact', eventType: 'CRM_RECORD_SEARCHED', target: 'CRM' },
    { app: 'Slack' as const, action: 'Post message', eventType: 'MESSAGE_SENT', target: '#ops' },
  ];

  const analysis = await mockAI.analyzeWorkflowSequence(sequence);
  assert.ok(analysis.workflowName);
  assert.ok(analysis.suggestedSteps.length > 0);

  const workflow = WorkflowGenerator.generateWorkflowFromAI(analysis, 'usr_test', 'cand_01');
  assert.strictEqual(workflow.userId, 'usr_test');
  assert.strictEqual(workflow.candidateId, 'cand_01');
  assert.ok(workflow.steps.length > 0);
  assert.ok(workflow.trigger.application);
});

test('5. WorkflowValidator error and executable path detection', () => {
  const invalidWorkflow: Workflow = {
    id: 'wf_bad',
    userId: 'usr_test',
    name: '',
    description: '',
    category: 'General',
    version: 1,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    trigger: { id: 't1', type: '', application: 'Gmail', description: '', config: {} },
    steps: [],
    conditions: [],
    variables: [],
  };

  const validation = WorkflowValidator.validate(invalidWorkflow);
  assert.strictEqual(validation.valid, false);
  assert.ok(validation.errors.some((e) => e.includes('name is required')));
  assert.ok(validation.errors.some((e) => e.includes('at least one action step')));
});

test('6. Dynamic Analytics summary calculations', () => {
  const analytics = db.getAnalytics(DEMO_USER_ID);
  assert.ok(typeof analytics.workflowsDiscovered === 'number');
  assert.ok(typeof analytics.activeAutomations === 'number');
  assert.ok(typeof analytics.totalExecutions === 'number');
  assert.ok(analytics.successRate >= 0 && analytics.successRate <= 100);
  assert.ok(Array.isArray(analytics.chartData.executionsPerDay));
  assert.ok(Array.isArray(analytics.chartData.timeSavedOverTime));
});

test('7. Workflow execution and retry recovery handling', async () => {
  const workflow = db.getWorkflowById('wf_process_cust_req');
  assert.ok(workflow, 'Workflow wf_process_cust_req should exist');

  // Test execution with isRetry: true to verify fallback policy auto-provisioning
  const execution = await WorkflowExecutor.startExecution(
    workflow,
    DEMO_USER_ID,
    {
      senderEmail: 'unregistered.guest@example.org',
      isRetry: true,
    },
    'auto_cust_req',
    { sender: 'unregistered.guest@example.org', subject: 'Invoice Query' }
  );

  assert.strictEqual(execution.status, 'RUNNING');
  assert.strictEqual(execution.steps.length, workflow.steps.length);

  // Allow step-by-step runner to advance through all steps
  await new Promise((resolve) => setTimeout(resolve, 2800));

  const completed = db.getExecutionById(execution.id);
  assert.ok(completed, 'Completed execution record should exist');
  assert.strictEqual(completed.status, 'SUCCESS', 'Rerun with fallback policy should succeed');
  assert.ok(completed.steps.every((s) => s.status === 'SUCCESS'), 'All steps should succeed');
  assert.ok(completed.timeSavedSeconds > 0, 'Time saved should be recorded');
});
