import { Router } from 'express';
import { db } from '../../database/store.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { WorkflowExecutor } from '../../workflow-engine/executor/workflowExecutor.js';
import { Automation } from '../../shared/types.js';

export const automationsRouter = Router();

// GET /api/automations
automationsRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const automations = db.getAutomations(req.userId!);
  return res.json({ automations });
});

// POST /api/automations
automationsRouter.post('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { workflowId, name, triggerType, scheduleCron } = req.body;
  if (!workflowId || !name) {
    return res.status(400).json({ error: 'workflowId and name are required' });
  }

  const workflow = db.getWorkflowById(workflowId);
  if (!workflow) {
    return res.status(404).json({ error: 'Referenced workflow not found' });
  }

  const automation: Automation = {
    id: `auto_${Date.now()}`,
    userId: req.userId!,
    workflowId,
    name,
    triggerType: triggerType || 'EVENT_BASED',
    scheduleCron,
    status: 'ACTIVE',
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    timeSavedSeconds: 0,
  };

  db.createAutomation(automation);
  return res.status(201).json({ automation });
});

// GET /api/automations/:id
automationsRouter.get('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const automation = db.getAutomationById(req.params.id);
  if (!automation || automation.userId !== req.userId!) {
    return res.status(404).json({ error: 'Automation not found' });
  }
  return res.json({ automation });
});

// POST /api/automations/:id/toggle
automationsRouter.post('/:id/toggle', authMiddleware, (req: AuthenticatedRequest, res) => {
  const automation = db.getAutomationById(req.params.id);
  if (!automation || automation.userId !== req.userId!) {
    return res.status(404).json({ error: 'Automation not found' });
  }

  const newStatus = automation.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  const updated = db.updateAutomation(automation.id, { status: newStatus });
  return res.json({ automation: updated });
});

// POST /api/automations/:id/run - Run automation now
automationsRouter.post('/:id/run', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const automation = db.getAutomationById(req.params.id);
  if (!automation || automation.userId !== req.userId!) {
    return res.status(404).json({ error: 'Automation not found' });
  }

  const workflow = db.getWorkflowById(automation.workflowId);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow associated with automation not found' });
  }

  try {
    const execution = await WorkflowExecutor.startExecution(
      workflow,
      req.userId!,
      { trigger: 'Automation Manual Run' },
      automation.id
    );

    return res.status(201).json({
      success: true,
      executionId: execution.id,
      execution,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Automation trigger failed' });
  }
});

// DELETE /api/automations/:id
automationsRouter.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const automation = db.getAutomationById(req.params.id);
  if (!automation || automation.userId !== req.userId!) {
    return res.status(404).json({ error: 'Automation not found' });
  }

  const deleted = db.deleteAutomation(automation.id);
  return res.json({ success: deleted });
});
