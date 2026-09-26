import React from 'react';
import { Play, Sparkles, Activity } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown.js';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSimulateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSimulateModal,
}) => {
  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Platform Overview',
      subtitle: 'Real-time workflow intelligence & automation performance',
    },
    discovery: {
      title: 'AI Workflow Discovery',
      subtitle: 'Autonomous pattern recognition and sequence synthesis',
    },
    activity: {
      title: 'Activity Monitor',
      subtitle: 'Event ingestion pipeline & sensitive data filtering',
    },
    workflows: {
      title: 'Workflows & Orchestration',
      subtitle: 'Executable multi-app automations and state machines',
    },
    automations: {
      title: 'Active Automations',
      subtitle: 'Event triggers, scheduled workers, and run monitors',
    },
    executions: {
      title: 'Execution Logs & Live Runner',
      subtitle: 'Step-by-step state traces and human-in-the-loop approvals',
    },
    analytics: {
      title: 'Impact Analytics',
      subtitle: 'Calculated hours saved, success metrics, and application usage',
    },
    integrations: {
      title: 'Integration Adapters',
      subtitle: 'Connected API connectors & browser automation engine',
    },
    settings: {
      title: 'Settings & Privacy Controls',
      subtitle: 'Sensitive data scrubbing rules, exclusions, and AI engine config',
    },
  };

  const current = titles[currentTab] || {
    title: 'WorkFlowOS',
    subtitle: 'AI-Powered Workflow Automation',
  };

  return (
    <header className="h-16 px-6 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between z-20 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
          {current.title}
        </h1>
        <p className="text-xs text-neutral-400 font-mono tracking-tight">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Prototype Event Source Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-neutral-800/80 border border-neutral-700/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-neutral-300 font-mono text-[11px]">Prototype Event Source</span>
        </div>

        {/* Quick Simulator CTA */}
        <button
          onClick={onOpenSimulateModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-medium text-xs shadow-sm shadow-cyan-500/20 transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate Activity</span>
        </button>

        {/* Notification Center */}
        <NotificationDropdown onNavigate={setCurrentTab} />
      </div>
    </header>
  );
};
