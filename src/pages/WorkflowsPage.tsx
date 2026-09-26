import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Plus,
  Play,
  Copy,
  Trash2,
  Pause,
  ArrowRight,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { Workflow, WorkflowStatus } from '../../shared/types.js';
import { api } from '../services/api.js';
import { useToast } from '../store/ToastContext.js';

interface WorkflowsPageProps {
  onOpenBuilder: (workflow: Workflow) => void;
  onRunWorkflow: (workflow: Workflow) => void;
  onCreateNew: () => void;
}

export const WorkflowsPage: React.FC<WorkflowsPageProps> = ({
  onOpenBuilder,
  onRunWorkflow,
  onCreateNew,
}) => {
  const { showToast } = useToast();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [filter, setFilter] = useState<'ALL' | WorkflowStatus>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'UPDATED' | 'EXECUTIONS'>('UPDATED');

  const fetchWorkflows = async () => {
    try {
      const data = await api.getWorkflows();
      setWorkflows(data);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleDuplicate = async (e: React.MouseEvent, wf: Workflow) => {
    e.stopPropagation();
    try {
      const duplicated = await api.duplicateWorkflow(wf.id);
      setWorkflows((prev) => [duplicated, ...prev]);
      showToast(`Workflow "${wf.name}" duplicated`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Duplication failed', 'error');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteWorkflow(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      showToast('Workflow deleted', 'info');
    } catch (err: any) {
      showToast(err.message || 'Deletion failed', 'error');
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, wf: Workflow) => {
    e.stopPropagation();
    const newStatus: WorkflowStatus = wf.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const updated = await api.updateWorkflow(wf.id, { status: newStatus });
      setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? updated : w)));
      showToast(`Workflow status set to ${newStatus}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const filtered = workflows
    .filter((w) => {
      if (filter !== 'ALL' && w.status !== filter) return false;
      if (search) {
        const query = search.toLowerCase();
        return (
          w.name.toLowerCase().includes(query) ||
          w.description.toLowerCase().includes(query) ||
          w.trigger.application.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'EXECUTIONS') {
        return (b.totalExecutions || 0) - (a.totalExecutions || 0);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-cyan-400">Process Library</span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-400 font-mono">
              {workflows.length} configured workflows
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100 mt-1">Workflows</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Build, edit, test, and orchestrate verified multi-step business automations.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs overflow-x-auto">
          {(['ALL', 'ACTIVE', 'PENDING_APPROVAL', 'DRAFT', 'PAUSED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                filter === st
                  ? 'bg-neutral-800 text-cyan-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {st === 'ALL'
                ? 'All Workflows'
                : st === 'PENDING_APPROVAL'
                ? 'Pending Approval'
                : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="UPDATED">Recently Updated</option>
            <option value="EXECUTIONS">Most Executions</option>
          </select>
        </div>
      </div>

      {/* Workflows List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-500 space-y-2">
            <div>No workflows match the selected criteria.</div>
            <button
              onClick={onCreateNew}
              className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-200 text-xs hover:bg-neutral-700 mt-2"
            >
              Create your first workflow
            </button>
          </div>
        ) : (
          filtered.map((wf) => (
            <div
              key={wf.id}
              onClick={() => onOpenBuilder(wf)}
              className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      wf.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                        : wf.status === 'PENDING_APPROVAL'
                        ? 'bg-amber-950 text-amber-400 border border-amber-900'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    {wf.status}
                  </span>
                  <span className="text-xs font-semibold text-neutral-100 group-hover:text-cyan-400 transition-colors">
                    {wf.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">v{wf.version}</span>
                </div>

                <p className="text-xs text-neutral-400 line-clamp-1 max-w-2xl">{wf.description}</p>

                <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
                  <span>Trigger: {wf.trigger.application}</span>
                  <span>·</span>
                  <span>{wf.steps.length} sequential steps</span>
                  <span>·</span>
                  <span>{wf.totalExecutions || 0} runs</span>
                  {wf.lastRunAt && (
                    <>
                      <span>·</span>
                      <span>Last run {new Date(wf.lastRunAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRunWorkflow(wf);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Run
                </button>

                <button
                  onClick={(e) => handleToggleStatus(e, wf)}
                  title={wf.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                  className="p-2 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => handleDuplicate(e, wf)}
                  title="Duplicate"
                  className="p-2 rounded-lg border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => handleDelete(e, wf.id)}
                  title="Delete"
                  className="p-2 rounded-lg border border-neutral-800 hover:bg-rose-950/40 text-neutral-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onOpenBuilder(wf)}
                  className="p-2 rounded-lg border border-neutral-800 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
