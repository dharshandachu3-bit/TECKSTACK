import fs from 'fs';
import path from 'path';
import {
  User,
  Session,
  ActivityEvent,
  WorkflowCandidate,
  Workflow,
  WorkflowStep,
  Integration,
  Automation,
  Execution,
  ExecutionStep,
  Notification,
  UserSetting,
  AnalyticsSummary,
} from '../shared/types.js';
import {
  DEMO_USER,
  INITIAL_USER_SETTINGS,
  INITIAL_INTEGRATIONS,
  INITIAL_CANDIDATES,
  INITIAL_WORKFLOWS,
  INITIAL_AUTOMATIONS,
  INITIAL_NOTIFICATIONS,
  generateSeedExecutions,
  generateSeedActivityEvents,
} from './seedData.js';

interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  activityEvents: ActivityEvent[];
  workflowCandidates: WorkflowCandidate[];
  workflows: Workflow[];
  automations: Automation[];
  executions: Execution[];
  integrations: Integration[];
  notifications: Notification[];
  userSettings: Record<string, UserSetting>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'workflowos.json');

class DatabaseStore {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.workflows && parsed.executions) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed reading data file, using fresh seeded data:', err);
    }

    const seeded: DatabaseSchema = {
      users: [DEMO_USER],
      sessions: [],
      activityEvents: generateSeedActivityEvents(),
      workflowCandidates: INITIAL_CANDIDATES,
      workflows: INITIAL_WORKFLOWS,
      automations: INITIAL_AUTOMATIONS,
      executions: generateSeedExecutions(),
      integrations: INITIAL_INTEGRATIONS,
      notifications: INITIAL_NOTIFICATIONS,
      userSettings: {
        [DEMO_USER.id]: INITIAL_USER_SETTINGS,
      },
    };

    this.persistSync(seeded);
    return seeded;
  }

  private persistSync(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  private scheduleSave() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.persistSync(this.data);
    }, 200);
  }

  // USERS
  getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    if (!this.data.userSettings[user.id]) {
      this.data.userSettings[user.id] = {
        ...INITIAL_USER_SETTINGS,
        id: `set_${Date.now()}`,
        userId: user.id,
      };
    }
    this.scheduleSave();
    return user;
  }

  // SESSIONS
  createSession(session: Session): Session {
    this.data.sessions.push(session);
    this.scheduleSave();
    return session;
  }

  getSession(token: string): Session | undefined {
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return undefined;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.deleteSession(token);
      return undefined;
    }
    return session;
  }

  deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.scheduleSave();
  }

  // ACTIVITY EVENTS
  getActivityEvents(userId: string, limit = 100): ActivityEvent[] {
    return this.data.activityEvents
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  addActivityEvent(event: ActivityEvent): ActivityEvent {
    this.data.activityEvents.unshift(event);
    if (this.data.activityEvents.length > 500) {
      this.data.activityEvents = this.data.activityEvents.slice(0, 500);
    }
    this.scheduleSave();
    return event;
  }

  clearActivityEvents(userId: string) {
    this.data.activityEvents = this.data.activityEvents.filter((e) => e.userId !== userId);
    this.scheduleSave();
  }

  // CANDIDATES
  getCandidates(userId: string): WorkflowCandidate[] {
    return this.data.workflowCandidates.filter((c) => c.userId === userId);
  }

  getCandidateById(id: string): WorkflowCandidate | undefined {
    return this.data.workflowCandidates.find((c) => c.id === id);
  }

  createCandidate(candidate: WorkflowCandidate): WorkflowCandidate {
    this.data.workflowCandidates.unshift(candidate);
    this.scheduleSave();
    return candidate;
  }

  updateCandidate(id: string, updates: Partial<WorkflowCandidate>): WorkflowCandidate | undefined {
    const idx = this.data.workflowCandidates.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data.workflowCandidates[idx] = {
      ...this.data.workflowCandidates[idx],
      ...updates,
    };
    this.scheduleSave();
    return this.data.workflowCandidates[idx];
  }

  // WORKFLOWS
  getWorkflows(userId: string): Workflow[] {
    return this.data.workflows.filter((w) => w.userId === userId);
  }

  getWorkflowById(id: string): Workflow | undefined {
    return this.data.workflows.find((w) => w.id === id);
  }

  createWorkflow(workflow: Workflow): Workflow {
    this.data.workflows.unshift(workflow);
    this.scheduleSave();
    return workflow;
  }

  updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | undefined {
    const idx = this.data.workflows.findIndex((w) => w.id === id);
    if (idx === -1) return undefined;
    this.data.workflows[idx] = {
      ...this.data.workflows[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.scheduleSave();
    return this.data.workflows[idx];
  }

  deleteWorkflow(id: string): boolean {
    const initialLen = this.data.workflows.length;
    this.data.workflows = this.data.workflows.filter((w) => w.id !== id);
    this.data.automations = this.data.automations.filter((a) => a.workflowId !== id);
    this.scheduleSave();
    return this.data.workflows.length < initialLen;
  }

  // AUTOMATIONS
  getAutomations(userId: string): Automation[] {
    return this.data.automations.filter((a) => a.userId === userId);
  }

  getAutomationById(id: string): Automation | undefined {
    return this.data.automations.find((a) => a.id === id);
  }

  createAutomation(automation: Automation): Automation {
    this.data.automations.unshift(automation);
    this.scheduleSave();
    return automation;
  }

  updateAutomation(id: string, updates: Partial<Automation>): Automation | undefined {
    const idx = this.data.automations.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.data.automations[idx] = { ...this.data.automations[idx], ...updates };
    this.scheduleSave();
    return this.data.automations[idx];
  }

  deleteAutomation(id: string): boolean {
    const initialLen = this.data.automations.length;
    this.data.automations = this.data.automations.filter((a) => a.id !== id);
    this.scheduleSave();
    return this.data.automations.length < initialLen;
  }

  // EXECUTIONS
  getExecutions(userId: string, limit = 100): Execution[] {
    return this.data.executions
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }

  getExecutionById(id: string): Execution | undefined {
    return this.data.executions.find((e) => e.id === id);
  }

  createExecution(execution: Execution): Execution {
    this.data.executions.unshift(execution);
    this.scheduleSave();
    return execution;
  }

  updateExecution(id: string, updates: Partial<Execution>): Execution | undefined {
    const idx = this.data.executions.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    this.data.executions[idx] = { ...this.data.executions[idx], ...updates };
    this.scheduleSave();
    return this.data.executions[idx];
  }

  updateExecutionStep(
    executionId: string,
    stepIndex: number,
    updates: Partial<ExecutionStep>
  ): ExecutionStep | undefined {
    const execution = this.getExecutionById(executionId);
    if (!execution) return undefined;
    const stepIdx = execution.steps.findIndex((s) => s.stepIndex === stepIndex);
    if (stepIdx === -1) return undefined;

    execution.steps[stepIdx] = {
      ...execution.steps[stepIdx],
      ...updates,
    };
    this.scheduleSave();
    return execution.steps[stepIdx];
  }

  // INTEGRATIONS
  getIntegrations(userId: string): Integration[] {
    return this.data.integrations.filter((i) => i.userId === userId);
  }

  getIntegrationById(id: string): Integration | undefined {
    return this.data.integrations.find((i) => i.id === id);
  }

  updateIntegration(id: string, updates: Partial<Integration>): Integration | undefined {
    const idx = this.data.integrations.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    this.data.integrations[idx] = { ...this.data.integrations[idx], ...updates };
    this.scheduleSave();
    return this.data.integrations[idx];
  }

  // NOTIFICATIONS
  getNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addNotification(notification: Notification): Notification {
    this.data.notifications.unshift(notification);
    this.scheduleSave();
    return notification;
  }

  markNotificationAsRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (notif) {
      notif.read = true;
      this.scheduleSave();
      return true;
    }
    return false;
  }

  markAllNotificationsAsRead(userId: string) {
    this.data.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    this.scheduleSave();
  }

  // SETTINGS
  getUserSettings(userId: string): UserSetting {
    if (!this.data.userSettings[userId]) {
      this.data.userSettings[userId] = {
        ...INITIAL_USER_SETTINGS,
        id: `set_${Date.now()}`,
        userId,
      };
      this.scheduleSave();
    }
    return this.data.userSettings[userId];
  }

  updateUserSettings(userId: string, updates: Partial<UserSetting>): UserSetting {
    const current = this.getUserSettings(userId);
    this.data.userSettings[userId] = { ...current, ...updates };
    this.scheduleSave();
    return this.data.userSettings[userId];
  }

  // REAL CALCULATED ANALYTICS
  // Requirements: Do not hardcode metrics! Calculate from real stored executions and activity.
  getAnalytics(userId: string): AnalyticsSummary {
    const candidates = this.getCandidates(userId);
    const automations = this.getAutomations(userId);
    const executions = this.getExecutions(userId, 500);

    const workflowsDiscovered = candidates.length;
    const activeAutomations = automations.filter((a) => a.status === 'ACTIVE').length;
    const successfulExecutions = executions.filter((e) => e.status === 'SUCCESS').length;
    const failedExecutions = executions.filter((e) => e.status === 'FAILED').length;
    const totalExecutions = executions.length;

    const successRate =
      totalExecutions > 0
        ? Math.round((successfulExecutions / totalExecutions) * 1000) / 10
        : 100;

    const totalSecondsSaved = executions
      .filter((e) => e.status === 'SUCCESS')
      .reduce((acc, curr) => acc + (curr.timeSavedSeconds || 0), 0);

    const totalTimeSavedHours = Math.round((totalSecondsSaved / 3600) * 10) / 10;
    const totalTimeSavedMinutes = Math.round(totalSecondsSaved / 60);

    const validDurations = executions
      .filter((e) => e.durationMs && e.durationMs > 0)
      .map((e) => e.durationMs as number);
    const averageExecutionDurationSeconds =
      validDurations.length > 0
        ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length / 100) / 10
        : 0;

    // Group executions by day for the last 7 days
    const dayMap = new Map<string, { success: number; failed: number; secondsSaved: number }>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(5, 10); // MM-DD
      dayMap.set(key, { success: 0, failed: 0, secondsSaved: 0 });
    }

    executions.forEach((e) => {
      const key = e.startTime.slice(5, 10);
      if (dayMap.has(key)) {
        const item = dayMap.get(key)!;
        if (e.status === 'SUCCESS') {
          item.success++;
          item.secondsSaved += e.timeSavedSeconds || 0;
        } else if (e.status === 'FAILED') {
          item.failed++;
        }
      }
    });

    const executionsPerDay = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      success: data.success,
      failed: data.failed,
      total: data.success + data.failed,
    }));

    const timeSavedOverTime = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      hoursSaved: Math.round((data.secondsSaved / 3600) * 10) / 10,
      minutesSaved: Math.round(data.secondsSaved / 60),
    }));

    // Integrations usage breakdown
    const appCounts: Record<string, number> = {};
    executions.forEach((e) => {
      e.steps.forEach((s) => {
        appCounts[s.application] = (appCounts[s.application] || 0) + 1;
      });
    });

    const totalStepCalls = Object.values(appCounts).reduce((a, b) => a + b, 0) || 1;
    const integrationsUsage = Object.entries(appCounts).map(([app, count]) => ({
      app: app as any,
      count,
      percentage: Math.round((count / totalStepCalls) * 100),
    }));

    // Most repeated workflows
    const workflowRuns: Record<string, { runs: number; timeSavedSeconds: number }> = {};
    executions.forEach((e) => {
      if (!workflowRuns[e.workflowName]) {
        workflowRuns[e.workflowName] = { runs: 0, timeSavedSeconds: 0 };
      }
      workflowRuns[e.workflowName].runs++;
      if (e.status === 'SUCCESS') {
        workflowRuns[e.workflowName].timeSavedSeconds += e.timeSavedSeconds || 0;
      }
    });

    const mostRepeatedWorkflows = Object.entries(workflowRuns)
      .map(([name, stat]) => ({
        name,
        runs: stat.runs,
        timeSavedMinutes: Math.round(stat.timeSavedSeconds / 60),
      }))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5);

    return {
      workflowsDiscovered,
      activeAutomations,
      successfulExecutions,
      failedExecutions,
      totalExecutions,
      successRate,
      totalTimeSavedHours,
      totalTimeSavedMinutes,
      averageExecutionDurationSeconds,
      chartData: {
        timeSavedOverTime,
        executionsPerDay,
        integrationsUsage,
        mostRepeatedWorkflows,
      },
    };
  }
}

export const db = new DatabaseStore();
