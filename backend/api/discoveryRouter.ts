import { Router } from 'express';
import { db } from '../../database/store.js';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.js';
import { WorkflowDiscoveryEngine } from '../../ai/workflow-discovery/discoveryEngine.js';
import { AIUnderstandingService } from '../../ai/workflow-understanding/understandingService.js';
import { WorkflowGenerator } from '../../ai/workflow-generation/workflowGenerator.js';

export const discoveryRouter = Router();

// GET /api/discovery/candidates
discoveryRouter.get('/candidates', authMiddleware, (req: AuthenticatedRequest, res) => {
  const candidates = db.getCandidates(req.userId!);
  return res.json({ candidates });
});

// GET /api/discovery/candidates/:id
discoveryRouter.get('/candidates/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const candidate = db.getCandidateById(req.params.id);
  if (!candidate || candidate.userId !== req.userId!) {
    return res.status(404).json({ error: 'Candidate not found' });
  }
  return res.json({ candidate });
});

// POST /api/discovery/analyze - Run discovery algorithm over activity events
discoveryRouter.post('/analyze', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const events = db.getActivityEvents(req.userId!, 300);
    const discoveryResult = WorkflowDiscoveryEngine.analyze(events, req.userId!);

    // Store newly discovered candidates in database if not already present
    const existing = db.getCandidates(req.userId!);
    const newCandidates = [];

    for (const cand of discoveryResult.candidates) {
      const alreadyHas = existing.some(
        (e) => e.name.toLowerCase() === cand.name.toLowerCase() && e.status !== 'REJECTED'
      );
      if (!alreadyHas) {
        db.createCandidate(cand);
        newCandidates.push(cand);

        // Notify user about newly discovered workflow
        db.addNotification({
          id: `notif_disc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          userId: req.userId!,
          type: 'WORKFLOW_DISCOVERED',
          title: `New Pattern Discovered: ${cand.name}`,
          message: `Observed ${cand.frequency} times with ${Math.round(cand.similarity * 100)}% consistency across ${cand.applications.join(', ')}.`,
          link: '/discovery',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return res.json({
      success: true,
      analysis: discoveryResult,
      newCandidatesCreated: newCandidates.length,
      allCandidates: db.getCandidates(req.userId!),
    });
  } catch (err: any) {
    console.error('Error during workflow discovery analyze:', err);
    return res.status(500).json({ error: err.message || 'Discovery analysis failed' });
  }
});

// POST /api/discovery/candidates/:id/understand - Run AI analysis on candidate sequence
discoveryRouter.post('/candidates/:id/understand', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const candidate = db.getCandidateById(req.params.id);
  if (!candidate || candidate.userId !== req.userId!) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  try {
    const aiAnalysis = await AIUnderstandingService.analyzeSequence(
      candidate.rawSequence,
      { name: candidate.name, intent: candidate.intent }
    );

    return res.json({ aiAnalysis });
  } catch (err: any) {
    console.error('AI understanding error:', err);
    return res.status(500).json({ error: err.message || 'AI workflow analysis failed' });
  }
});

// POST /api/discovery/candidates/:id/accept - Approve discovery and generate executable Workflow
discoveryRouter.post('/candidates/:id/accept', authMiddleware, async (req: AuthenticatedRequest, res) => {
  const candidate = db.getCandidateById(req.params.id);
  if (!candidate || candidate.userId !== req.userId!) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  try {
    // Generate AI interpretation
    const aiAnalysis = await AIUnderstandingService.analyzeSequence(
      candidate.rawSequence,
      { name: candidate.name, intent: candidate.intent }
    );

    // Convert into formal Workflow
    const workflow = WorkflowGenerator.generateWorkflowFromAI(aiAnalysis, req.userId!, candidate.id);
    workflow.status = 'APPROVED';

    db.createWorkflow(workflow);
    db.updateCandidate(candidate.id, {
      status: 'ACCEPTED',
      reviewedAt: new Date().toISOString(),
    });

    db.addNotification({
      id: `notif_apprv_${Date.now()}`,
      userId: req.userId!,
      type: 'WORKFLOW_APPROVED',
      title: 'Workflow Approved & Generated',
      message: `"${workflow.name}" is now ready to build and automate.`,
      link: `/workflows`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      workflow,
      candidate: db.getCandidateById(candidate.id),
    });
  } catch (err: any) {
    console.error('Error accepting candidate:', err);
    return res.status(500).json({ error: err.message || 'Failed to accept candidate' });
  }
});

// POST /api/discovery/candidates/:id/reject
discoveryRouter.post('/candidates/:id/reject', authMiddleware, (req: AuthenticatedRequest, res) => {
  const candidate = db.getCandidateById(req.params.id);
  if (!candidate || candidate.userId !== req.userId!) {
    return res.status(404).json({ error: 'Candidate not found' });
  }

  const updated = db.updateCandidate(candidate.id, {
    status: 'REJECTED',
    reviewedAt: new Date().toISOString(),
  });

  return res.json({ success: true, candidate: updated });
});
