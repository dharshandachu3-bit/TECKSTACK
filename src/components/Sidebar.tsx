import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Activity,
  GitBranch,
  Zap,
  PlaySquare,
  BarChart3,
  Boxes,
  Settings,
  Laptop,
  Globe,
  LogOut,
  Layers,
} from 'lucide-react';
import { useAuth } from '../store/AuthContext.js';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAgentModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAgentModal,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'discovery', label: 'AI Discovery', icon: Sparkles, badge: 'Core' },
    { id: 'activity', label: 'Activity Monitor', icon: Activity },
    { id: 'workflows', label: 'Workflows', icon: GitBranch },
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'executions', label: 'Executions', icon: PlaySquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'integrations', label: 'Integrations', icon: Boxes },
    { id: 'settings', label: 'Settings & Privacy', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col h-screen select-none shrink-0 z-30">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-neutral-800">
        <div
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-neutral-100 flex items-center gap-1.5">
              WorkFlow<span className="text-cyan-400">OS</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-mono tracking-wider">AI AUTOMATION</div>
          </div>
        </div>
      </div>

      {/* Engine Status pill */}
      <div className="px-4 py-3 border-b border-neutral-800/60 bg-neutral-900/40">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Engine Online</span>
          </div>
          <span className="text-neutral-500">v1.0.0</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          Platform
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-neutral-800 text-cyan-400 border border-neutral-700/60 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-2 pb-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          Architecture
        </div>

        <button
          onClick={onOpenAgentModal}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors text-left"
        >
          <Laptop className="w-4 h-4 text-purple-400" />
          <span>Desktop Agent Spec</span>
        </button>

        <button
          onClick={() => setCurrentTab('landing')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
            currentTab === 'landing'
              ? 'bg-neutral-800 text-cyan-400 border border-neutral-700/60'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Globe className="w-4 h-4 text-neutral-500" />
          <span>Public Landing</span>
        </button>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-300 shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SC'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-neutral-200 truncate">
                {user?.name || 'Sarah Chen'}
              </div>
              <div className="text-[10px] text-neutral-500 font-mono truncate">
                {user?.email || 'demo@workflowos.ai'}
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
