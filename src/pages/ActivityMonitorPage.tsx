import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Pause,
  Trash2,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { ActivityEvent, ApplicationName } from '../../shared/types.js';
import { api } from '../services/api.js';

interface ActivityMonitorPageProps {
  onOpenSimulateModal: () => void;
  onNavigateToDiscovery: () => void;
}

export const ActivityMonitorPage: React.FC<ActivityMonitorPageProps> = ({
  onOpenSimulateModal,
  onNavigateToDiscovery,
}) => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string>('ALL');

  useEffect(() => {
    // Load existing events
    api.getEvents(150).then(setEvents).catch(console.error);

    // Subscribe to SSE live updates
    const unsubscribe = api.subscribeToActivityStream((newEvent) => {
      if (isMonitoring) {
        setEvents((prev) => [newEvent, ...prev.slice(0, 199)]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isMonitoring]);

  const handleClear = async () => {
    try {
      await api.clearEvents();
      setEvents([]);
    } catch (err) {
      console.error('Failed to clear events:', err);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (selectedApp === 'ALL') return true;
    return e.application === selectedApp;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner & Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-cyan-400">Stream Ingestion</span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400 font-mono">Prototype Event Source</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-1">
            Activity Event Monitor
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Observes application transitions, clicks, email reads, and data exports. Sanitized with client zero-trust filtering.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              isMonitoring
                ? 'bg-neutral-800 text-neutral-200 border-neutral-700'
                : 'bg-amber-950/40 text-amber-300 border-amber-900'
            }`}
          >
            {isMonitoring ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isMonitoring ? 'Pause Ingestion' : 'Resume'}</span>
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Session</span>
          </button>

          <button
            onClick={onOpenSimulateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulate User Activity</span>
          </button>

          <button
            onClick={onNavigateToDiscovery}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-indigo-700 bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-300 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover Workflows</span>
          </button>
        </div>
      </div>

      {/* Honest Prototype Notice & Sensitive Data Filter Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
          <Activity className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-neutral-200">Prototype Event Source</span>
            <p className="text-neutral-400 mt-1 leading-relaxed">
              Standard web browsers cannot listen to global OS keystrokes or background windows.
              Events shown here represent simulated actions or events ingested via API. A native desktop agent will feed this identical endpoint.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-neutral-200">Privacy & Data Redaction</span>
            <p className="text-neutral-400 mt-1 leading-relaxed">
              SensitiveDataFilter actively sanitizes credit cards, passwords, SSNs, and bearer tokens before events reach the database or AI discovery engine.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs">
          {['ALL', 'Gmail', 'HubSpot CRM', 'Slack', 'Google Sheets', 'Chrome'].map((app) => (
            <button
              key={app}
              onClick={() => setSelectedApp(app)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedApp === app
                  ? 'bg-neutral-800 text-cyan-400'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {app}
            </button>
          ))}
        </div>

        <div className="text-xs text-neutral-500 font-mono flex items-center gap-2">
          {isMonitoring && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
          <span>{filteredEvents.length} events loaded</span>
        </div>
      </div>

      {/* Events Table / Stream */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
        <div className="divide-y divide-neutral-800/60 max-h-[600px] overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-16 text-center text-xs text-neutral-500">
              No activity events found. Click &ldquo;Simulate User Activity&rdquo; to populate live events.
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-4 hover:bg-neutral-800/30 transition-colors flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[11px] text-neutral-500 w-16 shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>

                  <span className="w-24 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-300 shrink-0 text-center">
                    {evt.application}
                  </span>

                  <div className="min-w-0">
                    <div className="text-neutral-200 font-medium truncate">{evt.action}</div>
                    <div className="text-[11px] text-neutral-500 font-mono truncate">
                      Target: {evt.target}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {evt.sensitiveDataScrubbed && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/50">
                      Scrubbed
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-neutral-500">
                    {evt.eventType}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
