import { Router } from 'express';
import { db } from '../../database/store.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { WorkflowValidator } from '../../workflow-engine/validators/workflowValidator.js';
import { WorkflowExecutor } from '../../workflow-engine/executor/workflowExecutor.js';
import { Workflow } from '../../shared/types.js';

export const workflowsRouter = Router();

// GET /api/workflows
workflowsRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const workflows = db.getWorkflows(req.userId!);
  return res.json({ workflows });
});

// POST /api/workflows
workflowsRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const payload = req.body;
  const newWorkflow: Workflow = {
    id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId: req.userId!,
    candidateId: payload.candidateId,
    name: payload.name || 'New Custom Workflow',
    description: payload.description || 'Custom defined automation sequence',
    category: payload.category || 'General Operations',
    version: 1,
    status: payload.status || 'DRAFT',
    trigger: payload.trigger || {
      id: `trig_${Date.now()}`,
      type: 'EMAIL_RECEIVED',
      application: 'Gmail',
      description: 'Trigger when customer email is received',
      config: {},
    },
    steps: payload.steps || [],
    conditions: payload.conditions || [],
    variables: payload.variables || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalExecutions: 0,
    successRate: 100,
  };

  db.createWorkflow(newWorkflow);
  return res.status(201).json({ workflow: newWorkflow });
});

// GET /api/workflows/:id
workflowsRouter.get('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const workflow = db.getWorkflowById(req.params.id);
  if (!workflow || workflow.userId !== req.userId!) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  return res.json({ workflow });
});

// PUT /api/workflows/:id
workflowsRouter.put('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const workflow = db.getWorkflowById(req.params.id);
  if (!workflow || workflow.userId !== req.userId!) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const updated = db.updateWorkflow(workflow.id, {
    ...req.body,
    updatedAt: new Date().toISOString(),
  });

  return res.json({ workflow: updated });
});

// DELETE /api/workflows/:id
workflowsRouter.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const workflow = db.getWorkflowById(req.params.id);
  if (!workflow || workflow.userId !== req.userId!) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const deleted = db.deleteWorkflow(workflow.id);
  return res.json({ success: deleted });
});

// POST /api/workflows/:id/validate
workflowsRouter.post('/:id/validate', authMiddleware, (req: AuthenticatedRequest, res) => {
  const workflow = db.getWorkflowById(req.params.id);
  if (!workflow || workflow.userId !== req.userId!) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  // Allow validating modified in-memory payload if supplied in body
  const targetWorkflow = { ...workflow, ...(req.body.workflow || {}) };
  const validation = WorkflowValidator.validate(targetWorkflow);

  return res.json({ validation });
});

// POST /api/workflows/:id/run - Launch execution through backend workflow engine
workflowsRouter.post('/:id/run', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const workflow = db.getWorkflowById(req.params.id);
  if (!workflow || workflow.userId !== req.userId!) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const validation = WorkflowValidator.validate(workflow);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Cannot execute an invalid workflow',
      validationErrors: validation.errors,
    });
  }

  try {
    const execution = await WorkflowExecutor.startExecution(
      workflow,
      req.userId!,
      req.body.inputs || {}
    );

    return res.status(201).json({
      success: true,
      executionId: execution.id,
      execution,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Execution startup failed' });
  }
});

// POST /api/workflows/:id/duplicate
workflowsRouter.post('/:id/duplicate', authMiddleware, (req: AuthenticatedRequest, res) => {
  const workflow = db.getWorkflowById(req.params.id);
  if (!workflow || workflow.userId !== req.userId!) {
    return res.status(404).json({ error: 'Workflow not found' });
  }

  const duplicated: Workflow = {
    ...workflow,
    id: `wf_${Date.now()}_copy`,
    name: `${workflow.name} (Copy)`,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalExecutions: 0,
    successRate: 100,
  };

  db.createWorkflow(duplicated);
  return res.status(201).json({ workflow: duplicated });
});
