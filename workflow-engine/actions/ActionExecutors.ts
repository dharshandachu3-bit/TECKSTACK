import { WorkflowStep, ExecutionMethod, ApplicationName } from '../../shared/types.js';

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  userId: string;
  triggerData: Record<string, any>;
  variables: Record<string, any>;
  stepOutputs: Record<string, any>;
}

export interface StepExecutionResult {
  success: boolean;
  outputData: Record<string, any>;
  error?: string;
  requiresHumanApproval?: boolean;
  approvalPrompt?: string;
  executionMethodUsed: ExecutionMethod;
  durationMs: number;
}

export interface ActionExecutor {
  execute(step: WorkflowStep, context: ExecutionContext): Promise<StepExecutionResult>;
}

export class EmailExecutor implements ActionExecutor {
  async execute(step: WorkflowStep, context: ExecutionContext): Promise<StepExecutionResult> {
    const startTime = Date.now();
    await new Promise((res) => setTimeout(res, 350));

    if (step.actionType === 'PARSE_EMAIL_METADATA') {
      const sender =
        context.variables?.senderEmail ||
        context.triggerData.sender ||
        context.triggerData.emailSender ||
        'billing@acmecorp.com';
      const subject = context.triggerData.subject || 'Customer Invoice and Renewal Request';
      return {
        success: true,
        outputData: {
          parsedSender: sender,
          parsedSubject: subject,
          extractedEntities: ['Customer Account', 'Invoice #9821'],
          hasAttachments: true,
          attachmentCount: 1,
        },
        executionMethodUsed: 'API',
        durationMs: Date.now() - startTime,
      };
    }

    if (step.actionType === 'DOWNLOAD_ATTACHMENTS') {
      return {
        success: true,
        outputData: {
          downloadedFiles: ['invoice_statement_acme.pdf'],
          storagePath: '/secure-vault/attachments/invoice_statement_acme.pdf',
          fileSizeBytes: 248100,
          virusCheckPassed: true,
        },
        executionMethodUsed: 'API',
        durationMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      outputData: { status: 'Email processed successfully' },
      executionMethodUsed: 'API',
      durationMs: Date.now() - startTime,
    };
  }
}

export class CRMExecutor implements ActionExecutor {
  async execute(step: WorkflowStep, context: ExecutionContext): Promise<StepExecutionResult> {
    const startTime = Date.now();
    await new Promise((res) => setTimeout(res, 450));

    const senderEmail =
      context.stepOutputs['step_1']?.parsedSender ||
      context.variables?.senderEmail ||
      context.triggerData.sender ||
      context.triggerData.emailSender ||
      'billing@acmecorp.com';

    if (step.actionType === 'SEARCH_CONTACT') {
      // Test failure scenario if email contains "unregistered" or "notfound"
      if (senderEmail.includes('unregistered') || senderEmail.includes('notfound')) {
        if (step.parameters?.fallbackCreate || context.variables?.isRetry || context.variables?.retry) {
          return {
            success: true,
            outputData: {
              contactId: 'crm_cnt_fallback_provisioned',
              company: 'Guest Enterprise (Created on Fallback Policy)',
              status: 'ACTIVE',
              tier: 'Enterprise Tier 2',
              accountExecutive: 'Sarah Chen (Lead Operations)',
              fallbackCreated: true,
              note: `Auto-provisioned contact for "${senderEmail}" via fallback policy`,
            },
            executionMethodUsed: 'API',
            durationMs: Date.now() - startTime,
          };
        }

        return {
          success: false,
          error: `Customer record could not be found in HubSpot CRM (Search by email "${senderEmail}" returned 0 records).`,
          outputData: {},
          executionMethodUsed: 'API',
          durationMs: Date.now() - startTime,
        };
      }

      return {
        success: true,
        outputData: {
          contactId: 'crm_cnt_98412',
          company: 'Acme International',
          status: 'ACTIVE',
          tier: 'Enterprise Tier 1',
          accountExecutive: 'Sarah Chen',
        },
        executionMethodUsed: 'API',
        durationMs: Date.now() - startTime,
      };
    }

    if (step.actionType === 'UPDATE_RECORD') {
      const contactId =
        context.stepOutputs['step_3']?.contactId ||
        context.stepOutputs['step_1']?.contactId ||
        'crm_cnt_98412';
      return {
        success: true,
        outputData: {
          updatedRecordId: contactId,
          newStage: 'IN_REVIEW',
          ticketAssigned: true,
          timestamp: new Date().toISOString(),
        },
        executionMethodUsed: 'API',
        durationMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      outputData: { status: 'CRM updated' },
      executionMethodUsed: 'API',
      durationMs: Date.now() - startTime,
    };
  }
}

export class SlackExecutor implements ActionExecutor {
  async execute(step: WorkflowStep, context: ExecutionContext): Promise<StepExecutionResult> {
    const startTime = Date.now();
    await new Promise((res) => setTimeout(res, 350));

    const channel = step.parameters.channel || '#customer-operations';
    return {
      success: true,
      outputData: {
        channel,
        messageId: `msg_slack_${Date.now()}`,
        broadcastDelivered: true,
        summaryPosted: `Processed customer action for ${context.triggerData.emailSender || 'Acme International'}`,
      },
      executionMethodUsed: 'API',
      durationMs: Date.now() - startTime,
    };
  }
}

export class SheetsExecutor implements ActionExecutor {
  async execute(step: WorkflowStep, context: ExecutionContext): Promise<StepExecutionResult> {
    const startTime = Date.now();
    await new Promise((res) => setTimeout(res, 500));

    return {
      success: true,
      outputData: {
        sheetName: step.parameters.targetSheet || 'Q3 Financial Ledger',
        rowsAppended: 1,
        rowRange: 'A43:G43',
        integrityHash: 'sha256:7f83b1657ff1fc53',
      },
      executionMethodUsed: 'API',
      durationMs: Date.now() - startTime,
    };
  }
}

export class BrowserExecutor implements ActionExecutor {
  async execute(step: WorkflowStep, context: ExecutionContext): Promise<StepExecutionResult> {
    const startTime = Date.now();
    // Simulate Playwright browser execution abstraction
    await new Promise((res) => setTimeout(res, 800));

    return {
      success: true,
      outputData: {
        browserSessionId: `playwright_headless_${Date.now()}`,
        urlNavigated: step.parameters.url || 'https://billing.internal.portal/export',
        domElementsInteracted: ['button#export-csv', 'table.settlement-history'],
        screenshotCaptured: true,
        downloadedFileName: 'settlement_export_batch.csv',
      },
      executionMethodUsed: 'BROWSER_AUTOMATION',
      durationMs: Date.now() - startTime,
    };
  }
}

export class ConditionExecutor implements ActionExecutor {
  async execute(step: WorkflowStep, context: ExecutionContext): Promise<StepExecutionResult> {
    const startTime = Date.now();
    await new Promise((res) => setTimeout(res, 100));

    return {
      success: true,
      outputData: {
        conditionPassed: true,
        evaluationField: step.parameters.field || 'status',
        evaluatedValue: 'ACTIVE',
        targetBranch: 'TRUE_BRANCH',
      },
      executionMethodUsed: 'API',
      durationMs: Date.now() - startTime,
    };
  }
}

export class HumanApprovalExecutor implements ActionExecutor {
  async execute(step: WorkflowStep, context: ExecutionContext): Promise<StepExecutionResult> {
    const startTime = Date.now();
    const prompt =
      step.requiresApprovalPrompt ||
      `WorkFlowOS human approval required for step "${step.name}". Review and authorize execution?`;

    return {
      success: true,
      requiresHumanApproval: true,
      approvalPrompt: prompt,
      outputData: {
        prompt,
        waitingSince: new Date().toISOString(),
        reviewerTarget: step.parameters.reviewerRole || 'Administrator',
      },
      executionMethodUsed: 'APPLICATION',
      durationMs: Date.now() - startTime,
    };
  }
}

export class ActionExecutorFactory {
  private static emailExecutor = new EmailExecutor();
  private static crmExecutor = new CRMExecutor();
  private static slackExecutor = new SlackExecutor();
  private static sheetsExecutor = new SheetsExecutor();
  private static browserExecutor = new BrowserExecutor();
  private static conditionExecutor = new ConditionExecutor();
  private static approvalExecutor = new HumanApprovalExecutor();

  public static getExecutor(step: WorkflowStep): ActionExecutor {
    if (step.type === 'HUMAN_APPROVAL') {
      return this.approvalExecutor;
    }
    if (step.type === 'CONDITION') {
      return this.conditionExecutor;
    }

    switch (step.application) {
      case 'Gmail':
        return this.emailExecutor;
      case 'HubSpot CRM':
        return this.crmExecutor;
      case 'Slack':
        return this.slackExecutor;
      case 'Google Sheets':
        return this.sheetsExecutor;
      case 'Chrome':
        return this.browserExecutor;
      default:
        return this.emailExecutor;
    }
  }
}
