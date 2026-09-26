import {
  User,
  ActivityEvent,
  WorkflowCandidate,
  Workflow,
  Automation,
  Execution,
  AnalyticsSummary,
  Integration,
  Notification,
  UserSetting,
  WorkflowSimulationTemplate,
} from '../../shared/types.js';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('workflowos_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // AUTH
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data as { token: string; user: User; expiresAt: string };
  },

  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data as { token: string; user: User; expiresAt: string };
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
    return data.user as User;
  },

  async logout() {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    localStorage.removeItem('workflowos_token');
  },

  // ACTIVITY
  async getEvents(limit = 100) {
    const res = await fetch(`${API_BASE}/activity/events?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.events as ActivityEvent[];
  },

  async ingestEvent(event: Partial<ActivityEvent>) {
    const res = await fetch(`${API_BASE}/activity/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(event),
    });
    const data = await res.json();
    return data.event as ActivityEvent;
  },

  async clearEvents() {
    await fetch(`${API_BASE}/activity/events`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  async getSimulationTemplates() {
    const res = await fetch(`${API_BASE}/activity/templates`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.templates as WorkflowSimulationTemplate[];
  },

  async simulateActivity(templateId: string) {
    const res = await fetch(`${API_BASE}/activity/simulate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ templateId }),
    });
    return await res.json();
  },

  subscribeToActivityStream(onEvent: (event: ActivityEvent) => void): () => void {
    const eventSource = new EventSource(`${API_BASE}/activity/stream`);
    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed && parsed.id) {
          onEvent(parsed);
        }
      } catch (err) {
        // ignore ping
      }
    };
    return () => eventSource.close();
  },

  // DISCOVERY
  async getCandidates() {
    const res = await fetch(`${API_BASE}/discovery/candidates`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.candidates as WorkflowCandidate[];
  },

  async getCandidateById(id: string) {
    const res = await fetch(`${API_BASE}/discovery/candidates/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.candidate as WorkflowCandidate;
  },

  async analyzeActivity() {
    const res = await fetch(`${API_BASE}/discovery/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Discovery failed');
    return data as {
      success: boolean;
      analysis: any;
      newCandidatesCreated: number;
      allCandidates: WorkflowCandidate[];
    };
  },

  async understandCandidate(id: string) {
    const res = await fetch(`${API_BASE}/discovery/candidates/${id}/understand`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI analysis failed');
    return data.aiAnalysis;
  },

  async acceptCandidate(id: string) {
    const res = await fetch(`${API_BASE}/discovery/candidates/${id}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Acceptance failed');
    return data as { success: boolean; workflow: Workflow; candidate: WorkflowCandidate };
  },

  async rejectCandidate(id: string) {
    const res = await fetch(`${API_BASE}/discovery/candidates/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.candidate as WorkflowCandidate;
  },

  // WORKFLOWS
  async getWorkflows() {
    const res = await fetch(`${API_BASE}/workflows`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.workflows as Workflow[];
  },

  async getWorkflowById(id: string) {
    const res = await fetch(`${API_BASE}/workflows/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Workflow not found');
    return data.workflow as Workflow;
  },

  async createWorkflow(workflow: Partial<Workflow>) {
    const res = await fetch(`${API_BASE}/workflows`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(workflow),
    });
    const data = await res.json();
    return data.workflow as Workflow;
  },

  async updateWorkflow(id: string, updates: Partial<Workflow>) {
    const res = await fetch(`${API_BASE}/workflows/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.workflow as Workflow;
  },

  async deleteWorkflow(id: string) {
    const res = await fetch(`${API_BASE}/workflows/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  async validateWorkflow(id: string, customPayload?: Partial<Workflow>) {
    const res = await fetch(`${API_BASE}/workflows/${id}/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ workflow: customPayload }),
    });
    const data = await res.json();
    return data.validation as { valid: boolean; errors: string[]; warnings: string[] };
  },

  async runWorkflow(id: string, inputs: Record<string, any> = {}) {
    const res = await fetch(`${API_BASE}/workflows/${id}/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ inputs }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Run failed');
    return data as { success: boolean; executionId: string; execution: Execution };
  },

  async duplicateWorkflow(id: string) {
    const res = await fetch(`${API_BASE}/workflows/${id}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.workflow as Workflow;
  },

  // AUTOMATIONS
  async getAutomations() {
    const res = await fetch(`${API_BASE}/automations`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.automations as Automation[];
  },

  async createAutomation(payload: { workflowId: string; name: string; triggerType?: string; scheduleCron?: string }) {
    const res = await fetch(`${API_BASE}/automations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.automation as Automation;
  },

  async toggleAutomation(id: string) {
    const res = await fetch(`${API_BASE}/automations/${id}/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.automation as Automation;
  },

  async runAutomation(id: string) {
    const res = await fetch(`${API_BASE}/automations/${id}/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Automation run failed');
    return data as { success: boolean; executionId: string; execution: Execution };
  },

  async deleteAutomation(id: string) {
    const res = await fetch(`${API_BASE}/automations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await res.json();
  },

  // EXECUTIONS
  async getExecutions(limit = 50) {
    const res = await fetch(`${API_BASE}/executions?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.executions as Execution[];
  },

  async getExecutionById(id: string) {
    const res = await fetch(`${API_BASE}/executions/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.execution as Execution;
  },

  subscribeToExecutionStream(executionId: string, onUpdate: (exec: Execution) => void): () => void {
    const eventSource = new EventSource(`${API_BASE}/executions/${executionId}/stream`);
    let closed = false;

    const cleanup = () => {
      if (!closed) {
        closed = true;
        eventSource.close();
      }
    };

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed && parsed.id) {
          onUpdate(parsed);
          if (parsed.status === 'SUCCESS' || parsed.status === 'FAILED') {
            cleanup();
          }
        }
      } catch (err) {
        // ignore
      }
    };

    eventSource.onerror = () => {
      cleanup();
    };

    return cleanup;
  },

  async approveExecutionStep(executionId: string, decision: 'APPROVE' | 'REJECT' | 'MODIFY', feedback?: string) {
    const res = await fetch(`${API_BASE}/executions/${executionId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ decision, feedback }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Approval failed');
    return data.execution as Execution;
  },

  async retryExecution(executionId: string) {
    const res = await fetch(`${API_BASE}/executions/${executionId}/retry`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Retry failed');
    return data as { success: boolean; executionId: string; execution: Execution };
  },

  // ANALYTICS
  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.analytics as AnalyticsSummary;
  },

  // INTEGRATIONS
  async getIntegrations() {
    const res = await fetch(`${API_BASE}/integrations`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.integrations as Integration[];
  },

  async testIntegration(id: string) {
    const res = await fetch(`${API_BASE}/integrations/${id}/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Test failed');
    return data.result as { success: boolean; status: string; latencyMs: number; message: string; metadata?: any };
  },

  async updateIntegration(id: string, updates: Partial<Integration>) {
    const res = await fetch(`${API_BASE}/integrations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.integration as Integration;
  },

  // NOTIFICATIONS
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.notifications as Notification[];
  },

  async markNotificationAsRead(id: string) {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
  },

  async markAllNotificationsAsRead() {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  // SETTINGS
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.settings as UserSetting;
  },

  async updateSettings(updates: Partial<UserSetting>) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    return data.settings as UserSetting;
  },
};
