import { db } from '../../database/store.js';
import {
  Workflow,
  Execution,
  ExecutionStep,
  ExecutionStatus,
  WorkflowStep,
} from '../../shared/types.js';
import { ActionExecutorFactory, ExecutionContext } from '../actions/ActionExecutors.js';

export type ExecutionProgressCallback = (execution: Execution) => void;

export class WorkflowExecutor {
  private static listeners = new Map<string, Set<ExecutionProgressCallback>>();

  public static subscribe(executionId: string, callback: ExecutionProgressCallback): () => void {
    if (!this.listeners.has(executionId)) {
      this.listeners.set(executionId, new Set());
    }
    this.listeners.get(executionId)!.add(callback);

    return () => {
      this.listeners.get(executionId)?.delete(callback);
      if (this.listeners.get(executionId)?.size === 0) {
        this.listeners.delete(executionId);
      }
    };
  }

  private static notify(execution: Execution) {
    const callbacks = this.listeners.get(execution.id);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(execution);
        } catch (err) {
          console.error('Error notifying execution listener:', err);
        }
      });
    }
  }

  /**
   * Start a new workflow execution
   */
  public static async startExecution(
    workflow: Workflow,
    userId: string,
    inputs: Record<string, any> = {},
    automationId?: string,
    triggerData?: Record<string, any>
  ): Promise<Execution> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const startTime = new Date().toISOString();

    const initialSteps: ExecutionStep[] = workflow.steps.map((s, idx) => ({
      id: `es_${executionId}_${idx + 1}`,
      executionId,
      stepId: s.id,
      stepIndex: s.stepIndex,
      stepName: s.name,
      application: s.application,
      executionMethod: s.executionMethod || 'API',
      status: 'PENDING',
      retryCount: 0,
    }));

    const execution: Execution = {
      id: executionId,
      userId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      automationId,
      status: 'RUNNING',
      startTime,
      durationMs: 0,
      triggerData: triggerData || inputs.triggerData || { source: 'Manual Run', timestamp: startTime },
      inputs,
      outputs: {},
      errors: [],
      timeSavedSeconds: 0,
      currentStepIndex: 1,
      steps: initialSteps,
    };

    db.createExecution(execution);
    this.notify(execution);

    // Asynchronously advance the execution in background
    setTimeout(() => {
      this.runNextSteps(execution.id, workflow);
    }, 100);

    return execution;
  }

  /**
   * Advance through steps until completion, failure, or human-approval pause
   */
  public static async runNextSteps(executionId: string, workflow?: Workflow) {
    const execution = db.getExecutionById(executionId);
    if (!execution || execution.status !== 'RUNNING') return;

    const wf = workflow || db.getWorkflowById(execution.workflowId);
    if (!wf) return;

    const context: ExecutionContext = {
      workflowId: wf.id,
      executionId,
      userId: execution.userId,
      triggerData: execution.triggerData,
      variables: execution.inputs,
      stepOutputs: execution.outputs,
    };

    while (execution.currentStepIndex <= wf.steps.length) {
      const stepIdx = execution.currentStepIndex;
      const stepConfig = wf.steps.find((s) => s.stepIndex === stepIdx);
      if (!stepConfig) break;

      const stepRecord = execution.steps.find((s) => s.stepIndex === stepIdx);
      if (!stepRecord) break;

      // Mark step running
      stepRecord.status = 'RUNNING';
      stepRecord.startTime = new Date().toISOString();
      db.updateExecution(execution.id, { steps: execution.steps, currentStepIndex: stepIdx });
      this.notify(execution);

      try {
        const executor = ActionExecutorFactory.getExecutor(stepConfig);
        const result = await executor.execute(stepConfig, context);

        stepRecord.endTime = new Date().toISOString();
        stepRecord.durationMs = result.durationMs;
        stepRecord.executionMethod = result.executionMethodUsed;
        stepRecord.outputData = result.outputData;

        // Check if step requires human approval
        if (result.requiresHumanApproval) {
          stepRecord.status = 'WAITING_APPROVAL';
          execution.status = 'WAITING';
          execution.isWaitingApproval = true;
          execution.approvalPayload = {
            prompt: result.approvalPrompt || 'Approval required to continue',
            stepIndex: stepIdx,
            stepId: stepConfig.id,
            details: result.outputData,
          };
          db.updateExecution(execution.id, {
            steps: execution.steps,
            status: 'WAITING',
            isWaitingApproval: true,
            approvalPayload: execution.approvalPayload,
          });

          // Create notification for human approval
          db.addNotification({
            id: `notif_appr_${Date.now()}`,
            userId: execution.userId,
            type: 'APPROVAL_REQUIRED',
            title: 'Human Approval Required',
            message: `Execution "${wf.name}" is waiting for your review at step "${stepConfig.name}".`,
            link: '/executions',
            read: false,
            createdAt: new Date().toISOString(),
          });

          this.notify(execution);
          return; // Pause execution until resumed
        }

        if (!result.success) {
          stepRecord.status = 'FAILED';
          stepRecord.errorDetails = result.error || 'Execution step error';
          execution.status = 'FAILED';
          execution.errors.push(stepRecord.errorDetails);
          execution.endTime = new Date().toISOString();
          execution.durationMs =
            new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();

          // Mark remaining steps skipped
          execution.steps.forEach((s) => {
            if (s.stepIndex > stepIdx) s.status = 'SKIPPED';
          });

          db.updateExecution(execution.id, {
            steps: execution.steps,
            status: 'FAILED',
            errors: execution.errors,
            endTime: execution.endTime,
            durationMs: execution.durationMs,
          });

          // Update automation stats if triggered from automation
          if (execution.automationId) {
            const auto = db.getAutomationById(execution.automationId);
            if (auto) {
              db.updateAutomation(auto.id, {
                totalRuns: auto.totalRuns + 1,
                failedRuns: auto.failedRuns + 1,
                lastRunAt: execution.endTime,
              });
            }
          }

          db.addNotification({
            id: `notif_err_${Date.now()}`,
            userId: execution.userId,
            type: 'AUTOMATION_FAILED',
            title: 'Automation Execution Failed',
            message: `Workflow "${wf.name}" failed: ${stepRecord.errorDetails}`,
            link: '/executions',
            read: false,
            createdAt: new Date().toISOString(),
          });

          this.notify(execution);
          return;
        }

        // Step succeeded
        stepRecord.status = 'SUCCESS';
        context.stepOutputs[`step_${stepIdx}`] = result.outputData;
        execution.outputs[`step_${stepIdx}`] = result.outputData;

        execution.currentStepIndex++;
        db.updateExecution(execution.id, {
          steps: execution.steps,
          outputs: execution.outputs,
          currentStepIndex: execution.currentStepIndex,
        });
        this.notify(execution);
      } catch (err: any) {
        stepRecord.status = 'FAILED';
        const errorMsg = err.message || 'Unexpected step execution error';
        stepRecord.errorDetails = errorMsg;
        execution.status = 'FAILED';
        execution.errors.push(errorMsg);
        execution.endTime = new Date().toISOString();
        execution.durationMs =
          new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();

        db.updateExecution(execution.id, {
          steps: execution.steps,
          status: 'FAILED',
          errors: execution.errors,
          endTime: execution.endTime,
          durationMs: execution.durationMs,
        });
        this.notify(execution);
        return;
      }
    }

    // All steps completed successfully!
    execution.status = 'SUCCESS';
    execution.endTime = new Date().toISOString();
    execution.durationMs =
      new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
    execution.timeSavedSeconds = Math.max(120, wf.steps.length * 60);

    db.updateExecution(execution.id, {
      status: 'SUCCESS',
      endTime: execution.endTime,
      durationMs: execution.durationMs,
      timeSavedSeconds: execution.timeSavedSeconds,
    });

    // Update workflow metrics
    const currentTotal = (wf.totalExecutions || 0) + 1;
    db.updateWorkflow(wf.id, {
      totalExecutions: currentTotal,
      lastRunAt: execution.endTime,
    });

    // Update automation stats if present
    if (execution.automationId) {
      const auto = db.getAutomationById(execution.automationId);
      if (auto) {
        db.updateAutomation(auto.id, {
          totalRuns: auto.totalRuns + 1,
          successfulRuns: auto.successfulRuns + 1,
          lastRunAt: execution.endTime,
          timeSavedSeconds: auto.timeSavedSeconds + execution.timeSavedSeconds,
        });
      }
    }

    db.addNotification({
      id: `notif_suc_${Date.now()}`,
      userId: execution.userId,
      type: 'EXECUTION_COMPLETED',
      title: 'Workflow Execution Succeeded',
      message: `Workflow "${wf.name}" completed successfully. Saved ~${Math.round(execution.timeSavedSeconds / 60)} minutes.`,
      link: '/executions',
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.notify(execution);
  }

  /**
   * Resume an execution after human approval
   */
  public static async resumeExecution(
    executionId: string,
    decision: 'APPROVE' | 'REJECT' | 'MODIFY',
    feedback?: string
  ): Promise<Execution> {
    const execution = db.getExecutionById(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (execution.status !== 'WAITING' || !execution.isWaitingApproval) {
      throw new Error(`Execution ${executionId} is not waiting for approval`);
    }

    const currentIdx = execution.approvalPayload?.stepIndex || execution.currentStepIndex;
    const stepRecord = execution.steps.find((s) => s.stepIndex === currentIdx);

    if (decision === 'REJECT') {
      if (stepRecord) {
        stepRecord.status = 'FAILED';
        stepRecord.errorDetails = `Execution rejected by user: ${feedback || 'Action canceled'}`;
      }
      execution.status = 'CANCELLED';
      execution.isWaitingApproval = false;
      execution.endTime = new Date().toISOString();
      execution.errors.push(`Human approval rejected: ${feedback || 'User declined permission'}`);

      db.updateExecution(execution.id, {
        status: 'CANCELLED',
        isWaitingApproval: false,
        endTime: execution.endTime,
        errors: execution.errors,
        steps: execution.steps,
      });

      this.notify(execution);
      return execution;
    }

    // User approved: advance step and continue
    if (stepRecord) {
      stepRecord.status = 'SUCCESS';
      stepRecord.outputData = {
        approved: true,
        approvedAt: new Date().toISOString(),
        feedback,
      };
    }

    execution.status = 'RUNNING';
    execution.isWaitingApproval = false;
    execution.currentStepIndex = currentIdx + 1;

    db.updateExecution(execution.id, {
      status: 'RUNNING',
      isWaitingApproval: false,
      currentStepIndex: execution.currentStepIndex,
      steps: execution.steps,
    });

    this.notify(execution);

    // Continue running remaining steps
    setTimeout(() => {
      this.runNextSteps(execution.id);
    }, 100);

    return execution;
  }
}
