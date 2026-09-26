import { AIProvider, AIAnalysisOutput } from './AIProvider.js';
import { ApplicationName, StepType, ExecutionMethod } from '../../shared/types.js';

export class MockAIProvider implements AIProvider {
  async analyzeWorkflowSequence(
    sequence: Array<{ app: ApplicationName; action: string; eventType: string; target: string }>,
    candidateContext?: { name?: string; intent?: string }
  ): Promise<AIAnalysisOutput> {
    const apps = Array.from(new Set(sequence.map((s) => s.app)));
    const hasGmail = apps.includes('Gmail');
    const hasCRM = apps.includes('HubSpot CRM');
    const hasSlack = apps.includes('Slack');
    const hasSheets = apps.includes('Google Sheets');
    const hasChrome = apps.includes('Chrome');

    if (hasGmail && hasCRM && hasSlack) {
      return {
        workflowName: candidateContext?.name || 'Process Customer Request',
        intent:
          candidateContext?.intent ||
          'Process incoming customer requests by parsing email attachments, updating the CRM record, and notifying the relevant operations team on Slack.',
        entities: ['Customer', 'Email Attachment', 'CRM Record', 'Support Team'],
        potentialTrigger: {
          application: 'Gmail',
          type: 'EMAIL_RECEIVED',
          description: 'New customer request email received with subject or label matching customer support',
          config: { label: 'Customer Support', hasAttachments: true },
        },
        suggestedConditions: [
          {
            field: 'customerFound',
            operator: 'EQUALS',
            value: true,
            explanation: 'Customer must exist in CRM before updating status, otherwise route to account creation.',
          },
        ],
        suggestedSteps: [
          {
            name: 'Extract Customer Information',
            type: 'ACTION' as StepType,
            application: 'Gmail',
            actionType: 'PARSE_EMAIL_METADATA',
            parameters: { extractFields: ['sender', 'subject', 'body', 'attachments'] },
            executionMethod: 'API' as ExecutionMethod,
          },
          {
            name: 'Download & Verify Attachment',
            type: 'ACTION' as StepType,
            application: 'Gmail',
            actionType: 'DOWNLOAD_ATTACHMENTS',
            parameters: { maxFiles: 3, allowedExtensions: ['.pdf', '.png', '.docx'] },
            executionMethod: 'API' as ExecutionMethod,
          },
          {
            name: 'Search Customer in CRM',
            type: 'ACTION' as StepType,
            application: 'HubSpot CRM',
            actionType: 'SEARCH_CONTACT',
            parameters: { searchBy: 'email', fallbackCreate: true },
            executionMethod: 'API' as ExecutionMethod,
          },
          {
            name: 'Verify Account Active Status',
            type: 'CONDITION' as StepType,
            application: 'HubSpot CRM',
            actionType: 'EVALUATE_CONDITION',
            parameters: { field: 'status', expected: 'ACTIVE' },
            executionMethod: 'API' as ExecutionMethod,
          },
          {
            name: 'Update Customer Ticket Details',
            type: 'ACTION' as StepType,
            application: 'HubSpot CRM',
            actionType: 'UPDATE_RECORD',
            parameters: { stage: 'IN_REVIEW', priority: 'HIGH' },
            executionMethod: 'API' as ExecutionMethod,
          },
          {
            name: 'Broadcast Operations Alert',
            type: 'ACTION' as StepType,
            application: 'Slack',
            actionType: 'SEND_NOTIFICATION',
            parameters: { channel: '#customer-operations', mentionRole: '@support-leads' },
            executionMethod: 'API' as ExecutionMethod,
          },
        ],
        confidence: 0.94,
        modelUsed: 'WorkFlowOS-Deterministic-Inference-Engine (Offline Fallback)',
        estimatedTimeSavedMinutes: 7,
      };
    }

    if (hasChrome && hasSheets) {
      return {
        workflowName: candidateContext?.name || 'Weekly Invoice Spreadsheet Sync',
        intent:
          candidateContext?.intent ||
          'Automate data export from internal web portals and append sanitized, validated financial rows to Google Sheets ledgers.',
        entities: ['Billing Portal', 'CSV Export', 'Google Sheets Ledger'],
        potentialTrigger: {
          application: 'Google Sheets',
          type: 'SCHEDULED_CRON',
          description: 'Scheduled weekly trigger or portal CSV file detected in downloads',
          config: { cron: '0 8 * * 1' },
        },
        suggestedConditions: [
          {
            field: 'fileSize',
            operator: 'GREATER_THAN',
            value: 100,
            explanation: 'Exported file must contain non-zero data records.',
          },
        ],
        suggestedSteps: [
          {
            name: 'Export Portal Settlement Report',
            type: 'ACTION' as StepType,
            application: 'Chrome',
            actionType: 'AUTOMATED_PORTAL_EXPORT',
            parameters: { portal: 'Billing Portal', reportType: 'settlement' },
            executionMethod: 'BROWSER_AUTOMATION' as ExecutionMethod,
          },
          {
            name: 'Validate Financial Row Integrity',
            type: 'CONDITION' as StepType,
            application: 'Google Sheets',
            actionType: 'CHECK_TAX_INTEGRITY',
            parameters: { varianceThresholdPct: 0.01 },
            executionMethod: 'API' as ExecutionMethod,
          },
          {
            name: 'Append Ledger Records',
            type: 'ACTION' as StepType,
            application: 'Google Sheets',
            actionType: 'BATCH_APPEND_ROWS',
            parameters: { targetSheet: 'Q3 Financial Ledger' },
            executionMethod: 'API' as ExecutionMethod,
          },
        ],
        confidence: 0.91,
        modelUsed: 'WorkFlowOS-Deterministic-Inference-Engine (Offline Fallback)',
        estimatedTimeSavedMinutes: 8,
      };
    }

    // Default dynamic workflow generator from steps
    const dynamicSteps = sequence.map((step, idx) => ({
      name: step.action || `Step ${idx + 1}`,
      type: 'ACTION' as StepType,
      application: step.app,
      actionType: `${step.app.toUpperCase().replace(/\s+/g, '_')}_ACTION`,
      parameters: { target: step.target, sourceEvent: step.eventType },
      executionMethod: (step.app === 'Chrome' ? 'BROWSER_AUTOMATION' : 'API') as ExecutionMethod,
    }));

    return {
      workflowName: candidateContext?.name || `${apps[0] || 'App'} to ${apps[apps.length - 1] || 'App'} Streamlined Workflow`,
      intent:
        candidateContext?.intent ||
        `Automated digital workflow coordinating actions across ${apps.join(', ')} to eliminate repetitive manual human labor.`,
      entities: apps.map((a) => `${a} Entity`),
      potentialTrigger: {
        application: apps[0] || 'Gmail',
        type: 'APP_EVENT_DETECTED',
        description: `Triggered upon activity in ${apps[0] || 'Application'}`,
        config: { sourceApp: apps[0] },
      },
      suggestedConditions: [],
      suggestedSteps: dynamicSteps,
      confidence: 0.88,
      modelUsed: 'WorkFlowOS-Deterministic-Inference-Engine (Offline Fallback)',
      estimatedTimeSavedMinutes: Math.max(3, sequence.length * 2),
    };
  }
}
