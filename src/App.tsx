import React, { useState } from 'react';
import { AuthProvider, useAuth } from './store/AuthContext.js';
import { Sidebar } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';
import { LiveExecutionModal } from './components/LiveExecutionModal.js';
import { CandidateReviewModal } from './components/CandidateReviewModal.js';
import { EventSimulatorModal } from './components/EventSimulatorModal.js';
import { DesktopAgentNoticeModal } from './components/DesktopAgentNoticeModal.js';
import { VisualWorkflowBuilder } from './components/VisualWorkflowBuilder.js';

import { DashboardPage } from './pages/DashboardPage.js';
import { DiscoveryPage } from './pages/DiscoveryPage.js';
import { ActivityMonitorPage } from './pages/ActivityMonitorPage.js';
import { WorkflowsPage } from './pages/WorkflowsPage.js';
import { AutomationsPage } from './pages/AutomationsPage.js';
import { ExecutionsPage } from './pages/ExecutionsPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { IntegrationsPage } from './pages/IntegrationsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';

import { Workflow, WorkflowCandidate } from '../shared/types.js';
import { api } from './services/api.js';
import { ToastProvider, useToast } from './store/ToastContext.js';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Modals state
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [reviewCandidate, setReviewCandidate] = useState<WorkflowCandidate | null>(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400 font-mono text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping mr-2" />
        Initializing WorkFlowOS Core Engine...
      </div>
    );
  }

  // If user selected Landing page explicitly
  if (currentTab === 'landing') {
    return (
      <>
        <LandingPage onEnterApp={() => setCurrentTab('dashboard')} />
        <DesktopAgentNoticeModal
          isOpen={isAgentModalOpen}
          onClose={() => setIsAgentModalOpen(false)}
        />
      </>
    );
  }

  // If not authenticated, show Login/Register
  if (!isAuthenticated) {
    if (authView === 'REGISTER') {
      return (
        <RegisterPage
          onSuccess={() => setCurrentTab('dashboard')}
          onGoToLogin={() => setAuthView('LOGIN')}
        />
      );
    }
    return (
      <LoginPage
        onSuccess={() => setCurrentTab('dashboard')}
        onGoToRegister={() => setAuthView('REGISTER')}
      />
    );
  }

  const handleRunWorkflow = async (workflow: Workflow) => {
    try {
      const res = await api.runWorkflow(workflow.id);
      setActiveExecutionId(res.executionId);
      showToast(`Initiated workflow: ${workflow.name}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Run failed', 'error');
    }
  };

  const handleCreateNewWorkflow = () => {
    const blankWorkflow: Workflow = {
      id: `wf_${Date.now()}`,
      userId: '',
      name: 'Custom New Workflow',
      description: 'Orchestrated custom process across enterprise applications.',
      category: 'General Operations',
      version: 1,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trigger: {
        id: `trig_${Date.now()}`,
        type: 'EMAIL_RECEIVED',
        application: 'Gmail',
        description: 'New incoming email received',
        config: {},
      },
      variables: [],
      conditions: [],
      steps: [
        {
          id: `step_1`,
          stepIndex: 1,
          name: 'Extract Information',
          type: 'ACTION',
          application: 'Gmail',
          actionType: 'PARSE_EMAIL_METADATA',
          parameters: {},
          executionMethod: 'API',
          timeoutMs: 15000,
        },
        {
          id: `step_2`,
          stepIndex: 2,
          name: 'Search Customer Account',
          type: 'ACTION',
          application: 'HubSpot CRM',
          actionType: 'SEARCH_CONTACT',
          parameters: {},
          executionMethod: 'API',
          timeoutMs: 15000,
        },
      ],
    };
    setEditingWorkflow(blankWorkflow);
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAgentModal={() => setIsAgentModalOpen(true)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenSimulateModal={() => setIsSimulateOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentTab}
              onOpenCandidateReview={(cand) => setReviewCandidate(cand)}
              onOpenExecution={(id) => setActiveExecutionId(id)}
              onRunWorkflow={handleRunWorkflow}
              refreshNonce={refreshNonce}
            />
          )}

          {currentTab === 'discovery' && (
            <DiscoveryPage
              onOpenCandidateReview={(cand) => setReviewCandidate(cand)}
              onNavigateToWorkflows={() => setCurrentTab('workflows')}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityMonitorPage
              onOpenSimulateModal={() => setIsSimulateOpen(true)}
              onNavigateToDiscovery={() => setCurrentTab('discovery')}
            />
          )}

          {currentTab === 'workflows' && (
            <WorkflowsPage
              onOpenBuilder={(wf) => setEditingWorkflow(wf)}
              onRunWorkflow={handleRunWorkflow}
              onCreateNew={handleCreateNewWorkflow}
            />
          )}

          {currentTab === 'automations' && (
            <AutomationsPage
              onOpenExecution={(id) => setActiveExecutionId(id)}
              onNavigateToExecutions={() => setCurrentTab('executions')}
            />
          )}

          {currentTab === 'executions' && (
            <ExecutionsPage
              onOpenExecution={(id) => setActiveExecutionId(id)}
              refreshNonce={refreshNonce}
            />
          )}

          {currentTab === 'analytics' && <AnalyticsPage />}

          {currentTab === 'integrations' && <IntegrationsPage />}

          {currentTab === 'settings' && (
            <SettingsPage onOpenAgentModal={() => setIsAgentModalOpen(true)} />
          )}
        </main>
      </div>

      {/* Full-Screen Visual Workflow Builder if editing */}
      {editingWorkflow && (
        <div className="fixed inset-0 z-50 bg-neutral-950">
          <VisualWorkflowBuilder
            workflow={editingWorkflow}
            onSave={(saved) => {
              setEditingWorkflow(saved);
            }}
            onRun={(wf) => {
              handleRunWorkflow(wf);
            }}
            onCancel={() => setEditingWorkflow(null)}
          />
        </div>
      )}

      {/* Live Execution Trace Modal */}
      {activeExecutionId && (
        <LiveExecutionModal
          key={activeExecutionId}
          executionId={activeExecutionId}
          onClose={() => {
            setActiveExecutionId(null);
            setRefreshNonce((n) => n + 1);
          }}
          onExecutionRetried={(newId) => {
            setActiveExecutionId(newId);
            setRefreshNonce((n) => n + 1);
          }}
          onExecutionCompleted={() => {
            setRefreshNonce((n) => n + 1);
          }}
        />
      )}

      {/* AI Discovery Candidate Review Modal */}
      {reviewCandidate && (
        <CandidateReviewModal
          candidate={reviewCandidate}
          onClose={() => setReviewCandidate(null)}
          onApproved={(generatedWorkflow) => {
            setReviewCandidate(null);
            setCurrentTab('workflows');
            setEditingWorkflow(generatedWorkflow);
          }}
          onRejected={() => {
            setReviewCandidate(null);
          }}
        />
      )}

      {/* Activity Event Simulation Modal */}
      <EventSimulatorModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onSimulated={() => {
          // If on activity or dashboard, events will stream in via SSE
        }}
      />

      {/* Desktop Agent Specification Modal */}
      <DesktopAgentNoticeModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
