import { Router } from 'express';
import { db } from '../../database/store.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { WorkflowExecutor } from '../../workflow-engine/executor/workflowExecutor.js';

export const executionsRouter = Router();

// GET /api/executions
executionsRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const executions = db.getExecutions(req.userId!, limit);
  return res.json({ executions });
});

// GET /api/executions/:id
executionsRouter.get('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const execution = db.getExecutionById(req.params.id);
  if (!execution || execution.userId !== req.userId!) {
    return res.status(404).json({ error: 'Execution record not found' });
  }
  return res.json({ execution });
});

// GET /api/executions/:id/stream - SSE real-time stream of execution progress
executionsRouter.get('/:id/stream', (req, res) => {
  const executionId = req.params.id;
  const execution = db.getExecutionById(executionId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (execution) {
    res.write(`data: ${JSON.stringify(execution)}\n\n`);
  }

  const unsubscribe = WorkflowExecutor.subscribe(executionId, (updated) => {
    try {
      res.write(`data: ${JSON.stringify(updated)}\n\n`);
      if (updated.status === 'SUCCESS' || updated.status === 'FAILED') {
        setTimeout(() => {
          unsubscribe();
          try {
            res.end();
          } catch {}
        }, 1000);
      }
    } catch (err) {
      unsubscribe();
    }
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// POST /api/executions/:id/approve - Human-in-the-loop decision
executionsRouter.post('/:id/approve', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { decision, feedback } = req.body; // 'APPROVE' | 'REJECT' | 'MODIFY'
  if (!decision || !['APPROVE', 'REJECT', 'MODIFY'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision: must be APPROVE, REJECT, or MODIFY' });
  }

  try {
    const updated = await WorkflowExecutor.resumeExecution(req.params.id, decision, feedback);
    return res.json({ success: true, execution: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to resume execution' });
  }
});

// POST /api/executions/:id/retry
executionsRouter.post('/:id/retry', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const execution = db.getExecutionById(req.params.id);
  if (!execution || execution.userId !== req.userId!) {
    return res.status(404).json({ error: 'Execution not found' });
  }

  const workflow = db.getWorkflowById(execution.workflowId);
  if (!workflow) {
    return res.status(404).json({ error: 'Associated workflow not found' });
  }

  try {
    const newExecution = await WorkflowExecutor.startExecution(
      workflow,
      req.userId!,
      {
        ...execution.inputs,
        isRetry: true,
        previousExecutionId: execution.id,
        triggerData: execution.triggerData,
      },
      execution.automationId,
      execution.triggerData
    );

    return res.status(201).json({
      success: true,
      message: 'Workflow rerun initiated',
      executionId: newExecution.id,
      execution: newExecution,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Retry failed' });
  }
});
