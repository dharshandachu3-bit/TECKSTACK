import { Router } from 'express';
import { db } from '../../database/store.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { EventManager } from '../../events/eventManager.js';
import { PrototypeEventSource, SIMULATION_TEMPLATES } from '../../events/prototypeEventSource.js';

export const activityRouter = Router();

// GET /api/activity/events
activityRouter.get('/events', authMiddleware, (req: AuthenticatedRequest, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  const events = db.getActivityEvents(req.userId!, limit);
  return res.json({
    events,
    meta: {
      source: 'Prototype Event Source',
      desktopAgentAvailable: false,
      isSimulated: true,
      totalCount: events.length,
    },
  });
});

// POST /api/activity/events - Ingest event through sensitive data filtering pipeline
activityRouter.post('/events', authMiddleware, (req: AuthenticatedRequest, res) => {
  const raw = req.body;
  const event = EventManager.ingestEvent({
    ...raw,
    userId: req.userId!,
  });
  return res.status(201).json({ event });
});

// DELETE /api/activity/events - Clear session events
activityRouter.delete('/events', authMiddleware, (req: AuthenticatedRequest, res) => {
  db.clearActivityEvents(req.userId!);
  return res.json({ success: true, message: 'Activity events cleared' });
});

// GET /api/activity/stream - SSE real-time event stream
activityRouter.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Activity stream connected' })}\n\n`);

  EventManager.addSseClient(res);

  req.on('close', () => {
    EventManager.removeSseClient(res);
  });
});

// GET /api/activity/templates - Available simulation templates
activityRouter.get('/templates', (_req, res) => {
  return res.json({ templates: SIMULATION_TEMPLATES });
});

// POST /api/activity/simulate - Trigger a simulated workflow sequence
activityRouter.post('/simulate', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { templateId } = req.body;
  const template = SIMULATION_TEMPLATES.find((t) => t.id === templateId) || SIMULATION_TEMPLATES[0];

  const sessionId = `sess_sim_${Date.now()}`;
  const generatedEvents = PrototypeEventSource.generateTemplateEvents(template.id, req.userId!, sessionId);

  // Ingest events sequentially with short stagger to simulate live user actions
  generatedEvents.forEach((evt, idx) => {
    setTimeout(() => {
      EventManager.ingestEvent(evt);
    }, idx * 600);
  });

  return res.json({
    success: true,
    sessionId,
    templateName: template.name,
    eventsScheduled: generatedEvents.length,
    message: `Simulating ${template.name} across ${generatedEvents.length} application steps`,
  });
});
