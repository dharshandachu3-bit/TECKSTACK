import { Router } from 'express';
import { authRouter } from './authRouter.js';
import { activityRouter } from './activityRouter.js';
import { discoveryRouter } from './discoveryRouter.js';
import { workflowsRouter } from './workflowsRouter.js';
import { automationsRouter } from './automationsRouter.js';
import { executionsRouter } from './executionsRouter.js';
import { analyticsRouter } from './analyticsRouter.js';
import { integrationsRouter } from './integrationsRouter.js';
import { notificationsRouter } from './notificationsRouter.js';
import { settingsRouter } from './settingsRouter.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/activity', activityRouter);
apiRouter.use('/discovery', discoveryRouter);
apiRouter.use('/workflows', workflowsRouter);
apiRouter.use('/automations', automationsRouter);
apiRouter.use('/executions', executionsRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/integrations', integrationsRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/settings', settingsRouter);

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'WorkFlowOS Core Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    capabilities: [
      'WORKFLOW_DISCOVERY',
      'AI_UNDERSTANDING',
      'SIMULATED_EVENT_STREAM',
      'WORKFLOW_EXECUTION_ENGINE',
      'SENSITIVE_DATA_FILTER',
      'DESKTOP_AGENT_READY',
    ],
  });
});
