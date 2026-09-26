import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  EyeOff,
  Sparkles,
  Zap,
  Save,
  Check,
  Laptop,
  Lock,
  User,
  Sliders,
} from 'lucide-react';
import { UserSetting } from '../../shared/types.js';
import { api } from '../services/api.js';
import { useAuth } from '../store/AuthContext.js';
import { useToast } from '../store/ToastContext.js';

interface SettingsPageProps {
  onOpenAgentModal: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenAgentModal }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<UserSetting | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newExcludedApp, setNewExcludedApp] = useState('');

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const handleToggle = (key: keyof UserSetting) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleAddExcludedApp = () => {
    if (!settings || !newExcludedApp.trim()) return;
    if (settings.excludedApps.includes(newExcludedApp.trim())) return;
    setSettings({
      ...settings,
      excludedApps: [...settings.excludedApps, newExcludedApp.trim()],
    });
    setNewExcludedApp('');
  };

  const handleRemoveExcludedApp = (app: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      excludedApps: settings.excludedApps.filter((a) => a !== app),
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSavedSuccess(true);
      showToast('Settings & security policy saved', 'success');
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="p-8 text-neutral-500 text-xs">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-cyan-400">Governance & Preferences</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-1">
            Settings & Privacy Controls
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure privacy boundaries, sensitive data redaction policies, and AI model orchestration.
          </p>
        </div>

        <button
          disabled={saving}
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 shrink-0"
        >
          {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : savedSuccess ? 'Preferences Saved' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* User Profile Card */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200 uppercase tracking-wider">
            <User className="w-4 h-4 text-cyan-400" />
            <span>Active Operator Account</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-500 font-mono text-[10px] uppercase">Full Name</span>
              <div className="text-neutral-200 font-medium mt-0.5">{user?.name || 'Sarah Chen'}</div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-500 font-mono text-[10px] uppercase">Email</span>
              <div className="text-neutral-200 font-medium mt-0.5">{user?.email || 'demo@workflowos.ai'}</div>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-500 font-mono text-[10px] uppercase">Access Role</span>
              <div className="text-cyan-400 font-mono font-medium mt-0.5">{user?.role || 'ADMIN'}</div>
            </div>
          </div>
        </div>

        {/* Privacy & Zero-Trust Redaction Controls */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Zero-Trust Privacy & Sensitive Data Scrubbing</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800">
              <div>
                <div className="text-xs font-semibold text-neutral-200">
                  Sensitive Data Redaction Filter
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Automatically scrubs credit cards, passwords, SSNs, and private bearer tokens before storage or AI ingestion.
                </div>
              </div>
              <button
                onClick={() => handleToggle('sensitiveDataFilterEnabled')}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.sensitiveDataFilterEnabled ? 'bg-emerald-500' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-neutral-950 absolute top-1 transition-transform ${
                    settings.sensitiveDataFilterEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800">
              <div>
                <div className="text-xs font-semibold text-neutral-200">
                  Require Operator Human Approval by Default
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Forces newly discovered workflows to pause before performing destructive data mutations.
                </div>
              </div>
              <button
                onClick={() => handleToggle('requireApprovalDefault')}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.requireApprovalDefault ? 'bg-cyan-500' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-neutral-950 absolute top-1 transition-transform ${
                    settings.requireApprovalDefault ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Excluded Applications */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-semibold text-neutral-300">
              Application Blacklist / Exclusions
            </div>
            <p className="text-[11px] text-neutral-400">
              Events originating from these processes are immediately discarded at the client boundary and never ingested.
            </p>

            <div className="flex flex-wrap gap-2">
              {settings.excludedApps.map((app) => (
                <span
                  key={app}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs font-mono"
                >
                  <span>{app}</span>
                  <button
                    onClick={() => handleRemoveExcludedApp(app)}
                    className="text-neutral-500 hover:text-rose-400 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-sm pt-1">
              <input
                type="text"
                placeholder="e.g. Signal, 1Password, Medical Records"
                value={newExcludedApp}
                onChange={(e) => setNewExcludedApp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddExcludedApp()}
                className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleAddExcludedApp}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium"
              >
                Add Exclusion
              </button>
            </div>
          </div>
        </div>

        {/* AI Engine & Model Settings */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Understanding & Inference Provider</span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-200">Inference Engine Selection</span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {process.env.GEMINI_API_KEY ? 'Active (Gemini SDK)' : 'Offline Fallback'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                WorkFlowOS uses an abstract AIProvider layer. In Google AI Studio, it connects to Gemini 2.5 Flash for high-speed structured sequence comprehension. When no key is present, it uses the built-in deterministic offline inference engine.
              </p>
            </div>
          </div>
        </div>

        {/* Future Desktop Agent Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 to-purple-950/20 border border-purple-900/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Laptop className="w-6 h-6 text-purple-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-neutral-100">
                Future Native Desktop Agent Ready
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Review the connection contract for macOS, Windows, and Linux background daemons.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAgentModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-colors shrink-0"
          >
            View Specification
          </button>
        </div>
      </div>
    </div>
  );
};
