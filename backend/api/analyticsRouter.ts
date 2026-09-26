import { Router } from 'express';
import { db } from '../../database/store.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

export const analyticsRouter = Router();

// GET /api/analytics
analyticsRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const summary = db.getAnalytics(req.userId!);
  return res.json({ analytics: summary });
});
