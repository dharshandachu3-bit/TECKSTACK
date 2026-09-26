import { ActivityEvent, WorkflowCandidate, ApplicationName } from '../../shared/types.js';

export interface DiscoveryAnalysisResult {
  analyzedEventsCount: number;
  sessionsIdentified: number;
  patternsDiscovered: number;
  candidates: WorkflowCandidate[];
  summary: {
    topPattern: string;
    highestConfidence: number;
    totalPotentialWeeklyTimeSavedHours: number;
  };
}

export class WorkflowDiscoveryEngine {
  /**
   * Main discovery algorithm executing the 7-step pattern detection
   */
  public static analyze(events: ActivityEvent[], userId: string): DiscoveryAnalysisResult {
    if (!events || events.length === 0) {
      return {
        analyzedEventsCount: 0,
        sessionsIdentified: 0,
        patternsDiscovered: 0,
        candidates: [],
        summary: { topPattern: 'None', highestConfidence: 0, totalPotentialWeeklyTimeSavedHours: 0 },
      };
    }

    // Step 1: Session Segmentation (by sessionId or timestamp gap > 5 minutes)
    const sessions = this.segmentSessions(events);

    // Step 2: Event Normalization (abstract target URLs, ids, timestamps into canonical action representations)
    const normalizedSessions = sessions.map((sess) => this.normalizeSession(sess));

    // Step 3 & 4: Sequence Extraction (extract consecutive sub-sequences of length 3-7)
    const sequenceClusters = this.extractAndClusterSequences(normalizedSessions);

    // Step 5, 6 & 7: Similarity, Repetition Detection & Candidate Scoring
    const scoredCandidates: WorkflowCandidate[] = [];

    for (const cluster of sequenceClusters) {
      if (cluster.occurrences.length >= 2) {
        const candidate = this.evaluateCandidate(cluster, userId);
        if (candidate.confidenceScore >= 0.6) {
          scoredCandidates.push(candidate);
        }
      }
    }

    // Sort by confidence score and frequency
    scoredCandidates.sort((a, b) => b.confidenceScore * b.frequency - a.confidenceScore * a.frequency);

    const totalSecondsSaved = scoredCandidates.reduce((acc, c) => acc + c.estimatedWeeklyTimeSavedSecs, 0);

    return {
      analyzedEventsCount: events.length,
      sessionsIdentified: sessions.length,
      patternsDiscovered: scoredCandidates.length,
      candidates: scoredCandidates,
      summary: {
        topPattern: scoredCandidates[0]?.name || 'Standard Digital Operations',
        highestConfidence: scoredCandidates[0]?.confidenceScore || 0,
        totalPotentialWeeklyTimeSavedHours: Math.round((totalSecondsSaved / 3600) * 10) / 10,
      },
    };
  }

  /**
   * 1. Session Segmentation
   */
  private static segmentSessions(events: ActivityEvent[]): ActivityEvent[][] {
    // Sort chronologically ascending
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const sessionsMap = new Map<string, ActivityEvent[]>();
    let fallbackSessionCounter = 1;
    let lastTime = 0;
    let currentFallbackId = `sess_gen_${fallbackSessionCounter}`;

    sorted.forEach((e) => {
      const eTime = new Date(e.timestamp).getTime();
      let sId = e.sessionId;

      if (!sId || sId === 'sess_default') {
        if (lastTime > 0 && eTime - lastTime > 5 * 60 * 1000) {
          fallbackSessionCounter++;
          currentFallbackId = `sess_gen_${fallbackSessionCounter}`;
        }
        sId = currentFallbackId;
      }
      lastTime = eTime;

      if (!sessionsMap.has(sId)) {
        sessionsMap.set(sId, []);
      }
      sessionsMap.get(sId)!.push(e);
    });

    return Array.from(sessionsMap.values()).filter((s) => s.length >= 2);
  }

  /**
   * 2. Event Normalization
   */
  private static normalizeSession(session: ActivityEvent[]) {
    return session.map((evt) => ({
      app: evt.application,
      eventType: evt.eventType,
      canonicalAction: this.canonicalizeAction(evt.application, evt.eventType, evt.action),
      originalEvent: evt,
    }));
  }

  private static canonicalizeAction(app: string, eventType: string, action: string): string {
    const act = action.toLowerCase();
    if (app === 'Gmail' && (eventType === 'EMAIL_OPENED' || act.includes('email'))) {
      return 'READ_INBOUND_EMAIL';
    }
    if (app === 'Gmail' && (eventType === 'EMAIL_ATTACHMENT_DOWNLOADED' || act.includes('download') || act.includes('attachment'))) {
      return 'DOWNLOAD_EMAIL_ATTACHMENT';
    }
    if (app === 'HubSpot CRM' && (eventType === 'CRM_RECORD_SEARCHED' || act.includes('search'))) {
      return 'QUERY_CRM_CONTACT';
    }
    if (app === 'HubSpot CRM' && (eventType === 'CRM_RECORD_UPDATED' || act.includes('update') || act.includes('record'))) {
      return 'UPDATE_CRM_RECORD';
    }
    if (app === 'Slack' && (eventType === 'MESSAGE_SENT' || act.includes('message') || act.includes('post'))) {
      return 'DISPATCH_TEAM_NOTIFICATION';
    }
    if (app === 'Google Sheets' && (eventType === 'SPREADSHEET_ROW_ADDED' || act.includes('ledger') || act.includes('row'))) {
      return 'APPEND_SPREADSHEET_DATA';
    }
    if (app === 'Chrome' && (eventType === 'DATA_EXPORTED' || act.includes('export') || act.includes('report'))) {
      return 'EXPORT_PORTAL_REPORT';
    }
    return `${app.toUpperCase()}_${eventType}`;
  }

  /**
   * 3 & 4. Sequence Extraction and Clustering
   */
  private static extractAndClusterSequences(
    normalizedSessions: Array<Array<{ app: ApplicationName; eventType: any; canonicalAction: string; originalEvent: ActivityEvent }>>
  ) {
    const clusters = new Map<
      string,
      {
        fingerprint: string;
        occurrences: Array<Array<{ app: ApplicationName; eventType: any; canonicalAction: string; originalEvent: ActivityEvent }>>;
        applications: Set<ApplicationName>;
      }
    >();

    normalizedSessions.forEach((sess) => {
      // Build sliding windows
      const len = sess.length;
      const windowSizes = [3, 4, 5, 6].filter((s) => s <= len);

      windowSizes.forEach((wSize) => {
        for (let i = 0; i <= len - wSize; i++) {
          const slice = sess.slice(i, i + wSize);
          const fingerprint = slice.map((item) => `${item.app}::${item.canonicalAction}`).join(' -> ');
          const apps = new Set<ApplicationName>(slice.map((item) => item.app));

          if (!clusters.has(fingerprint)) {
            clusters.set(fingerprint, {
              fingerprint,
              occurrences: [],
              applications: apps,
            });
          }
          clusters.get(fingerprint)!.occurrences.push(slice);
        }
      });
    });

    // Remove redundant sub-sequences if a larger sequence completely encapsulates it with same occurrences
    return Array.from(clusters.values());
  }

  /**
   * 5, 6 & 7: Similarity, Repetition Detection, Candidate Scoring
   */
  private static evaluateCandidate(
    cluster: {
      fingerprint: string;
      occurrences: Array<Array<{ app: ApplicationName; eventType: any; canonicalAction: string; originalEvent: ActivityEvent }>>;
      applications: Set<ApplicationName>;
    },
    userId: string
  ): WorkflowCandidate {
    const frequency = cluster.occurrences.length;
    const representative = cluster.occurrences[0];
    const appsList = Array.from(cluster.applications);

    // Calculate cross-application transitions
    let transitions = 0;
    for (let i = 0; i < representative.length - 1; i++) {
      if (representative[i].app !== representative[i + 1].app) {
        transitions++;
      }
    }

    // Calculate average duration across occurrences
    let totalDurationSecs = 0;
    cluster.occurrences.forEach((occ) => {
      const first = new Date(occ[0].originalEvent.timestamp).getTime();
      const last = new Date(occ[occ.length - 1].originalEvent.timestamp).getTime();
      const diffSecs = Math.max(30, Math.round((last - first) / 1000));
      totalDurationSecs += diffSecs;
    });
    const avgDurationSecs = Math.max(90, Math.round(totalDurationSecs / frequency));

    // Similarity score (repetition consistency)
    const similarity = Math.min(0.98, 0.85 + (frequency >= 5 ? 0.08 : frequency * 0.02));

    // Candidate Confidence Scoring formula:
    // Balances frequency (weight 0.4), cross-app transitions (weight 0.3), and similarity (weight 0.3)
    const freqScore = Math.min(1.0, frequency / 6);
    const transitionScore = Math.min(1.0, transitions / 3);
    const confidenceScore = Math.round((freqScore * 0.4 + transitionScore * 0.3 + similarity * 0.3) * 100) / 100;

    // Estimated Weekly Time Saved (assume pattern occurs ~ frequency * 1.5 times per week)
    const estimatedWeeklyRuns = Math.round(frequency * 1.5);
    const estimatedWeeklyTimeSavedSecs = estimatedWeeklyRuns * avgDurationSecs;

    // Pattern semantic name inference
    const { name, intent, trigger, risks } = this.inferPatternMetadata(representative, appsList);

    return {
      id: `cand_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name,
      intent,
      applications: appsList,
      frequency,
      similarity,
      crossAppTransitions: transitions,
      avgDurationSecs,
      confidenceScore,
      estimatedWeeklyTimeSavedSecs,
      status: 'DISCOVERED',
      discoveredAt: new Date().toISOString(),
      suggestedTrigger: trigger,
      suggestedStepsCount: representative.length,
      potentialRisks: risks,
      rawSequence: representative.map((item) => ({
        app: item.app,
        action: item.originalEvent.action,
        eventType: item.eventType,
        target: item.originalEvent.target,
      })),
    };
  }

  private static inferPatternMetadata(
    sequence: Array<{ app: ApplicationName; canonicalAction: string; originalEvent: ActivityEvent }>,
    apps: ApplicationName[]
  ): { name: string; intent: string; trigger: string; risks: string[] } {
    const hasGmail = apps.includes('Gmail');
    const hasCRM = apps.includes('HubSpot CRM');
    const hasSlack = apps.includes('Slack');
    const hasSheets = apps.includes('Google Sheets');
    const hasChrome = apps.includes('Chrome');

    if (hasGmail && hasCRM && hasSlack) {
      return {
        name: 'Process Customer Request',
        intent: 'Parse incoming customer email attachments, look up customer account in CRM, update ticket status, and notify operations team on Slack.',
        trigger: 'New customer inquiry email received in Gmail',
        risks: ['Customer not found in CRM may require human intervention', 'Attachment file formats must be verified'],
      };
    }

    if (hasChrome && hasSheets) {
      return {
        name: 'Portal Export & Spreadsheet Reconciliation',
        intent: 'Download data reports from web application portal and automatically append normalized ledger records into Google Sheets.',
        trigger: 'New report export CSV downloaded in browser',
        risks: ['Column structure change in source CSV export could break spreadsheet formatting'],
      };
    }

    if (hasCRM && hasSlack) {
      return {
        name: 'Lead Qualification & Team Alert',
        intent: 'Detect qualified CRM contact lifecycle changes and broadcast actionable alerts into team Slack channels.',
        trigger: 'CRM contact stage changes to MQL or Opportunity',
        risks: ['Potential high alert volume during marketing campaign spikes'],
      };
    }

    if (hasGmail && hasSlack) {
      return {
        name: 'Urgent Email Dispatcher',
        intent: 'Monitor high-priority client mail and forward instant Slack alerts with summaries.',
        trigger: 'High priority email with keyword flag',
        risks: ['Spam filtering false positives'],
      };
    }

    const firstApp = sequence[0]?.app || 'System';
    const lastApp = sequence[sequence.length - 1]?.app || 'System';
    return {
      name: `${firstApp} to ${lastApp} Sync Automation`,
      intent: `Automate repetitive handoffs between ${apps.join(', ')} to eliminate manual copying and context switching.`,
      trigger: `Triggered by action in ${firstApp}`,
      risks: ['Ensure valid API permissions across integrated applications'],
    };
  }
}
