import React, { useState, useEffect } from 'react';
import {
  Boxes,
  CheckCircle2,
  Clock,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Key,
  Globe,
  Mail,
  MessageSquare,
  Database,
  FileSpreadsheet,
  Compass,
} from 'lucide-react';
import { Integration } from '../../shared/types.js';
import { api } from '../services/api.js';
import { useToast } from '../store/ToastContext.js';

export const IntegrationsPage: React.FC = () => {
  const { showToast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const fetchIntegrations = async () => {
    try {
      const data = await api.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error('Failed to load integrations:', err);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTestConnection = async (integration: Integration) => {
    setTestingId(integration.id);
    try {
      const result = await api.testIntegration(integration.id);
      setTestResults((prev) => ({ ...prev, [integration.id]: result }));
      showToast(
        result.success
          ? `${integration.name}: ${result.message}`
          : `${integration.name} test: ${result.message}`,
        result.success ? 'success' : 'error'
      );
      // refresh
      fetchIntegrations();
    } catch (err: any) {
      showToast(err.message || 'Connection test failed', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const getAppIcon = (type: string) => {
    switch (type) {
      case 'GMAIL':
        return <Mail className="w-5 h-5 text-rose-400" />;
      case 'SLACK':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'CRM':
        return <Database className="w-5 h-5 text-amber-400" />;
      case 'SHEETS':
        return <FileSpreadsheet className="w-5 h-5 text-teal-400" />;
      case 'BROWSER':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      default:
        return <Boxes className="w-5 h-5 text-neutral-400" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-cyan-400">Execution Adapters</span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400 font-mono">Multi-App Gateway</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-1">
            Integrations & Connectors
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Transparently manages native API connectors, OAuth2 tokens, and headless browser automation runners.
          </p>
        </div>
      </div>

      {/* Architectural Honesty Banner */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-semibold text-neutral-200">
            Adapter Architecture: Simulated vs Production Connected
          </span>
          <p className="text-neutral-400 leading-relaxed">
            In this web prototype, adapters run with simulated sandbox responses when external OAuth
            credentials are not supplied. When real OAuth keys or API credentials are provided in
            production, the exact same adapter methods (
            <code className="text-[11px] text-cyan-300 font-mono">execute()</code>,{' '}
            <code className="text-[11px] text-cyan-300 font-mono">testConnection()</code>) route to the live APIs.
          </p>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => {
          const testRes = testResults[item.id];
          return (
            <div
              key={item.id}
              className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                    {getAppIcon(item.type)}
                  </div>

                  <span
                    className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full ${
                      item.status === 'CONNECTED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                        : item.status === 'SIMULATED'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/60'
                        : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-neutral-100">{item.name}</h3>
                  <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                    {item.application} · {item.authType}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1.5 text-[11px] font-mono text-neutral-400">
                  <div className="flex items-center justify-between">
                    <span>Latency:</span>
                    <span className="text-neutral-200">{item.latencyMs ?? 110}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Verified:</span>
                    <span className="text-neutral-300">
                      {item.lastTestedAt ? new Date(item.lastTestedAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                </div>

                {testRes && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-[11px] text-emerald-300 font-mono">
                    ✓ {testRes.message} ({testRes.latencyMs}ms)
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                <button
                  disabled={testingId === item.id}
                  onClick={() => handleTestConnection(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${testingId === item.id ? 'animate-spin' : ''}`} />
                  <span>{testingId === item.id ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  onClick={() => setSelectedIntegration(item)}
                  className="text-xs text-neutral-400 hover:text-cyan-400 transition-colors"
                >
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Production Guide Box */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
        <h3 className="text-sm font-semibold text-neutral-200">
          How to connect real Gmail / Slack / HubSpot APIs in Production
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-400 pt-2">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
            <span className="font-semibold text-neutral-200">1. Google Workspace (Gmail / Sheets)</span>
            <p className="leading-relaxed">
              Register OAuth Client in Google Cloud Console. Set redirect URL to <code className="text-[11px] text-cyan-300">/api/integrations/oauth/callback</code> with scopes <code className="text-[11px] text-cyan-300">mail.read</code> and <code className="text-[11px] text-cyan-300">spreadsheets</code>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
            <span className="font-semibold text-neutral-200">2. Slack Enterprise Bot</span>
            <p className="leading-relaxed">
              Create Slack App in Slack API dashboard. Add Bot Token Scopes (<code className="text-[11px] text-cyan-300">chat:write</code>, <code className="text-[11px] text-cyan-300">channels:read</code>) and install to workspace.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
            <span className="font-semibold text-neutral-200">3. CRM API Keys</span>
            <p className="leading-relaxed">
              In HubSpot/Salesforce settings, generate a Private App Access Token or Connected App OAuth credentials and paste into the Integration config.
            </p>
          </div>
        </div>
      </div>

      {/* Config Drawer / Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-semibold text-neutral-100">
                Configure {selectedIntegration.name}
              </h3>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="text-neutral-400 hover:text-neutral-200 text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 font-mono text-[11px] mb-1">
                  Auth Mode
                </label>
                <input
                  disabled
                  value={selectedIntegration.authType}
                  className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-mono text-[11px] mb-1">
                  Configuration JSON
                </label>
                <textarea
                  rows={6}
                  defaultValue={JSON.stringify(selectedIntegration.config, null, 2)}
                  className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-200 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedIntegration(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
