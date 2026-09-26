import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Boxes,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AnalyticsSummary } from '../../shared/types.js';
import { api } from '../services/api.js';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-cyan-400">Business Impact</span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400 font-mono">Dynamic Aggregations</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-1">
            System Analytics
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Aggregated metrics calculated dynamically from stored activity sessions and automation traces.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          title="Refresh metrics"
          className="p-2 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors shrink-0"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-500 uppercase">
            Total Operational Hours Saved
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {analytics?.totalTimeSavedHours ?? 0} <span className="text-xs font-normal text-neutral-400">hours</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            Across {analytics?.totalExecutions ?? 0} executions
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-500 uppercase">Avg Run Duration</div>
          <div className="text-2xl font-bold text-neutral-100 mt-1">
            {analytics?.averageExecutionDurationSeconds ?? 0}s
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            End-to-end execution latency
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-500 uppercase">Success Rate</div>
          <div className="text-2xl font-bold text-neutral-100 mt-1">
            {analytics?.successRate ?? 100}%
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">
            {analytics?.successfulExecutions} passed / {analytics?.failedExecutions} failed
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="text-[11px] font-mono text-neutral-500 uppercase">Workflows Discovered</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            {analytics?.workflowsDiscovered ?? 0}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">
            {analytics?.activeAutomations ?? 0} active in production
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executions per day */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
              Executions Per Day (Last 7 Days)
            </span>
            <span className="text-[11px] font-mono text-neutral-500">Success vs Failure</span>
          </div>

          <div className="h-64 w-full">
            {analytics?.chartData.executionsPerDay && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.chartData.executionsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="date" stroke="#737373" fontSize={11} />
                  <YAxis stroke="#737373" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: '#262626',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="success" name="Successful" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Time saved over time */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
              Cumulative Hours Saved Over Time
            </span>
            <span className="text-[11px] font-mono text-emerald-400">Hours</span>
          </div>

          <div className="h-64 w-full">
            {analytics?.chartData.timeSavedOverTime && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.chartData.timeSavedOverTime}>
                  <defs>
                    <linearGradient id="timeSavedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="date" stroke="#737373" fontSize={11} />
                  <YAxis stroke="#737373" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderColor: '#262626',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hoursSaved"
                    name="Hours Saved"
                    stroke="#06b6d4"
                    fillOpacity={1}
                    fill="url(#timeSavedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown Grid: Most Used Integrations & Top Repeated Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integrations breakdown */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
              Integration Distribution
            </h3>
          </div>

          <div className="space-y-3">
            {analytics?.chartData.integrationsUsage.map((item) => (
              <div key={item.app} className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-neutral-300">
                  <span>{item.app}</span>
                  <span className="font-mono text-neutral-400">
                    {item.count} step invocations ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Repeated Workflows */}
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
              Top Automated Workflows
            </h3>
          </div>

          <div className="space-y-3">
            {analytics?.chartData.mostRepeatedWorkflows.map((item, idx) => (
              <div
                key={item.name}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center font-mono text-[10px] text-neutral-400">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-neutral-200">{item.name}</span>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <div className="text-neutral-300">{item.runs} runs</div>
                  <div className="text-emerald-400 font-semibold">
                    ~{item.timeSavedMinutes} mins saved
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
