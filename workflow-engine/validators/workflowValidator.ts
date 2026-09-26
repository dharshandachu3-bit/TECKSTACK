import { Workflow } from '../../shared/types.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class WorkflowValidator {
  public static validate(workflow: Workflow): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Workflow metadata
    if (!workflow.name || workflow.name.trim().length === 0) {
      errors.push('Workflow name is required.');
    }

    // 2. Trigger check
    if (!workflow.trigger || !workflow.trigger.type || !workflow.trigger.application) {
      errors.push('A valid trigger with an application and event type is required.');
    }

    // 3. Steps existence
    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push('Workflow must contain at least one action step.');
      return { valid: false, errors, warnings };
    }

    // 4. Step validity & parameters
    const seenIndices = new Set<number>();
    const seenStepIds = new Set<string>();

    workflow.steps.forEach((step, idx) => {
      if (seenStepIds.has(step.id)) {
        errors.push(`Duplicate step ID detected: ${step.id}`);
      }
      seenStepIds.add(step.id);

      if (seenIndices.has(step.stepIndex)) {
        errors.push(`Duplicate step index detected at position ${idx + 1}`);
      }
      seenIndices.add(step.stepIndex);

      if (!step.name || step.name.trim().length === 0) {
        errors.push(`Step at position ${idx + 1} is missing a descriptive name.`);
      }

      if (!step.application) {
        errors.push(`Step "${step.name || idx + 1}" does not specify a target application.`);
      }

      if (!['TRIGGER', 'ACTION', 'CONDITION', 'WAIT', 'HUMAN_APPROVAL'].includes(step.type)) {
        errors.push(`Step "${step.name}" has invalid type "${step.type}".`);
      }

      if (step.type === 'HUMAN_APPROVAL' && !step.requiresApprovalPrompt) {
        warnings.push(`Step "${step.name}" is a Human Approval step without a custom prompt message.`);
      }

      if (!step.executionMethod) {
        warnings.push(`Step "${step.name}" missing explicit executionMethod, defaulting to API.`);
      }
    });

    // 5. Conditions check
    if (workflow.conditions) {
      workflow.conditions.forEach((cond, cIdx) => {
        if (!cond.field || cond.field.trim().length === 0) {
          errors.push(`Condition #${cIdx + 1} is missing a comparison field name.`);
        }
      });
    }

    // 6. Executable path check
    const hasTerminalAction = workflow.steps.some((s) => s.type === 'ACTION' || s.type === 'HUMAN_APPROVAL');
    if (!hasTerminalAction) {
      errors.push('Workflow does not contain any executable action or approval steps.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
