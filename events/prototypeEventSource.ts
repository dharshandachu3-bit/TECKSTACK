import { ActivityEvent, ApplicationName, EventType } from '../shared/types.js';

export interface WorkflowSimulationTemplate {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    app: ApplicationName;
    type: EventType;
    action: string;
    target: string;
    metadata?: Record<string, any>;
  }>;
}

export const SIMULATION_TEMPLATES: WorkflowSimulationTemplate[] = [
  {
    id: 'sim_customer_request',
    name: 'Customer Support Request Flow',
    description: 'User receives customer inquiry in Gmail, downloads attachment, searches CRM, updates ticket, and alerts team in Slack.',
    steps: [
      { app: 'Chrome', type: 'APPLICATION_OPENED', action: 'Launch Chrome browser', target: 'Desktop' },
      { app: 'Gmail', type: 'EMAIL_OPENED', action: 'Opened customer email', target: 'Subject: Urgent Renewal Question', metadata: { sender: 'billing@enterprise.com' } },
      { app: 'Gmail', type: 'EMAIL_ATTACHMENT_DOWNLOADED', action: 'Attachment downloaded', target: 'contract_renewal_signed.pdf', metadata: { size: '240KB' } },
      { app: 'HubSpot CRM', type: 'CRM_RECORD_SEARCHED', action: 'Customer searched', target: 'Acme Corp contact search' },
      { app: 'HubSpot CRM', type: 'CRM_RECORD_UPDATED', action: 'Customer record updated', target: 'Stage changed to Closed Won' },
      { app: 'Slack', type: 'MESSAGE_SENT', action: 'Message sent', target: '#customer-operations', metadata: { channel: '#customer-operations' } },
    ],
  },
  {
    id: 'sim_lead_intake',
    name: 'Inbound MQL Lead Intake Flow',
    description: 'User monitors incoming lead submissions in HubSpot CRM, qualifies contact, and broadcasts high-priority card to Slack.',
    steps: [
      { app: 'HubSpot CRM', type: 'CRM_RECORD_SEARCHED', action: 'Filter high score leads', target: 'New MQL submissions' },
      { app: 'HubSpot CRM', type: 'CRM_RECORD_UPDATED', action: 'Assign account executive', target: 'Assigned to Alex Morgan' },
      { app: 'Slack', type: 'MESSAGE_SENT', action: 'Broadcast lead card with quick links', target: '#sales-leads' },
    ],
  },
  {
    id: 'sim_invoice_reconcile',
    name: 'Portal Billing Export & Ledger Flow',
    description: 'User navigates to billing portal in Chrome, exports CSV report, opens file, and commits rows into Google Sheets financial ledger.',
    steps: [
      { app: 'Chrome', type: 'DATA_EXPORTED', action: 'Export payment report CSV', target: 'Stripe Settlement Table' },
      { app: 'Desktop Files', type: 'FILE_CREATED', action: 'Read downloaded CSV', target: 'payouts_week_latest.csv' },
      { app: 'Google Sheets', type: 'SPREADSHEET_ROW_ADDED', action: 'Append row to Q3 Ledger', target: 'Financial Ledger Sheet' },
    ],
  },
];

export class PrototypeEventSource {
  public static isSimulated = true;
  public static sourceName = 'Prototype Event Source';

  public static generateTemplateEvents(
    templateId: string,
    userId: string,
    sessionId?: string
  ): ActivityEvent[] {
    const template = SIMULATION_TEMPLATES.find((t) => t.id === templateId) || SIMULATION_TEMPLATES[0];
    const sId = sessionId || `sess_${Date.now()}`;
    const now = Date.now();

    return template.steps.map((step, idx) => ({
      id: `evt_sim_${now}_${idx}`,
      userId,
      sessionId: sId,
      timestamp: new Date(now + idx * 3000).toISOString(),
      source: 'PROTOTYPE_SIMULATOR',
      application: step.app,
      eventType: step.type,
      action: step.action,
      target: step.target,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        stepIndex: idx + 1,
        simulated: true,
        ...(step.metadata || {}),
      },
      isSimulated: true,
      sensitiveDataScrubbed: true,
    }));
  }
}
