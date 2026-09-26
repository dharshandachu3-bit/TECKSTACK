import React from 'react';
import { X, Laptop, ShieldCheck, ArrowDown, Code2, Server, Cpu, CheckCircle } from 'lucide-react';

interface DesktopAgentNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesktopAgentNoticeModal: React.FC<DesktopAgentNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-800/60 text-purple-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Native Desktop Agent Architecture
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono">
                System Boundary & Native Agent Hooking Specification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Transparent Notice */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Architectural Honesty: No Fake Browser OS Access</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Standard web browsers are security-sandboxed and cannot hook arbitrary operating
              system processes (such as Windows kernel events, macOS Accessibility APIs, or X11/Wayland windowing).
            </p>
            <p className="text-xs text-neutral-400 leading-relaxed">
              WorkFlowOS prototypes this with a strictly decoupled{' '}
              <span className="text-neutral-200 font-mono text-[11px]">PrototypeEventSource</span>.
              The backend ingestion endpoint (
              <span className="text-neutral-200 font-mono text-[11px]">POST /api/activity/events</span>
              ) is identical to the target interface for the production native agent.
            </p>
          </div>

          {/* Architecture Visual Diagram */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Native Agent Pipeline
            </span>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-700/60 flex items-center justify-between text-purple-300">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-purple-400" />
                  <span>Native OS Agent (Rust / Electron / Swift Daemon)</span>
                </div>
                <span className="text-[10px] text-neutral-500">macOS / Windows / Linux</span>
              </div>

              <div className="flex justify-center text-neutral-600">
                <ArrowDown className="w-4 h-4" />
              </div>

              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-700/60 flex items-center justify-between text-neutral-300">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Local Sensitive Data Filter & Redaction Engine</span>
                </div>
                <span className="text-[10px] text-emerald-400">Client-Side Zero-Trust</span>
              </div>

              <div className="flex justify-center text-neutral-600">
                <ArrowDown className="w-4 h-4" />
              </div>

              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-700/60 flex items-center justify-between text-neutral-200">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>WorkFlowOS Core Ingestion API (POST /api/activity/events)</span>
                </div>
                <span className="text-[10px] text-neutral-400">Authenticated Token</span>
              </div>

              <div className="flex justify-center text-neutral-600">
                <ArrowDown className="w-4 h-4" />
              </div>

              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-700/60 flex items-center justify-between text-emerald-300">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span>AI Discovery Engine & Automated Workflow Engine</span>
                </div>
                <span className="text-[10px] text-cyan-400">Autonomous</span>
              </div>
            </div>
          </div>

          {/* Connection Code Sample */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Agent Ingestion Payload Example
            </span>
            <pre className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto">
{`curl -X POST https://your-workflowos.domain/api/activity/events \\
  -H "Authorization: Bearer YOUR_AGENT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "DESKTOP_AGENT",
    "application": "HubSpot CRM",
    "eventType": "CRM_RECORD_UPDATED",
    "action": "Updated customer status to Verified",
    "target": "Account #98412",
    "metadata": { "windowTitle": "HubSpot - Chrome" }
  }'`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-end bg-neutral-900/60 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
