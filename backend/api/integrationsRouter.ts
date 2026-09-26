import { Router } from 'express';
import { db } from '../../database/store.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { IntegrationManager } from '../../integrations/IntegrationManager.js';

export const integrationsRouter = Router();

// GET /api/integrations
integrationsRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const integrations = db.getIntegrations(req.userId!);
  return res.json({ integrations });
});

// POST /api/integrations/:id/test - Test connection
integrationsRouter.post('/:id/test', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await IntegrationManager.testIntegration(req.params.id, req.userId!);
    return res.json({ result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Connection test failed' });
  }
});

// PUT /api/integrations/:id - Update integration config
integrationsRouter.put('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const integration = db.getIntegrationById(req.params.id);
  if (!integration || integration.userId !== req.userId!) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  const updated = db.updateIntegration(integration.id, req.body);
  return res.json({ integration: updated });
});
