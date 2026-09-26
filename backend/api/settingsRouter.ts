import { Router } from 'express';
import { db } from '../../database/store.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const settings = db.getUserSettings(req.userId!);
  return res.json({ settings });
});

// PUT /api/settings
settingsRouter.put('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const updated = db.updateUserSettings(req.userId!, req.body);
  return res.json({ settings: updated });
});
