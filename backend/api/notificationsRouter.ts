import { Router } from 'express';
import { db } from '../../database/store.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const notifications = db.getNotifications(req.userId!);
  return res.json({ notifications });
});

// PUT /api/notifications/:id/read
notificationsRouter.put('/:id/read', authMiddleware, (req: AuthenticatedRequest, res) => {
  const ok = db.markNotificationAsRead(req.params.id, req.userId!);
  return res.json({ success: ok });
});

// POST /api/notifications/read-all
notificationsRouter.post('/read-all', authMiddleware, (req: AuthenticatedRequest, res) => {
  db.markAllNotificationsAsRead(req.userId!);
  return res.json({ success: true });
});
