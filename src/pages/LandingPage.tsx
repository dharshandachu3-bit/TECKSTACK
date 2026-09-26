import React from 'react';
import {
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Play,
  Activity,
  Cpu,
  Server,
  Code2,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Navigation */}
      <header className="h-18 px-8 border-b border-neutral-900 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-neutral-100">
            WorkFlow<span className="text-cyan-400">OS</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onEnterApp}
            className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors font-medium"
          >
            Demo Sign In
          </button>
          <button
            onClick={onEnterApp}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            Launch Prototype
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-8 py-20 space-y-24 w-full">
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Workflow Discovery</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-100 leading-tight">
            Your work knows the workflow.{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              WorkFlowOS learns it.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            AI-powered workflow automation that discovers repetitive digital work across Gmail, CRM,
            spreadsheets, and Slack, and turns it into reliable automation.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={onEnterApp}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-semibold text-sm shadow-xl shadow-cyan-500/25 transition-all active:scale-95"
            >
              <span>Explore Interactive Prototype</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Traditional vs WorkFlowOS Comparison */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
            <span className="text-xs font-mono uppercase text-neutral-500">Traditional Automation</span>
            <h3 className="text-lg font-bold text-neutral-300">Manual Trigger & Action Builders</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Knowledge workers must manually blueprint logic, learn complex connectors, set up webhook
              endpoints, and maintain brittle scripts when tools change.
            </p>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-[11px] text-neutral-500 space-y-1">
              <div>USER CREATES WORKFLOW</div>
              <div>→ USER CONFIGURES SCHEMAS</div>
              <div>→ SYSTEM EXECUTES IT</div>
            </div>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-br from-neutral-900 to-cyan-950/20 border border-cyan-900/50 space-y-4">
            <span className="text-xs font-mono uppercase text-cyan-400">The WorkFlowOS Paradigm</span>
            <h3 className="text-lg font-bold text-neutral-100">AI-Powered Workflow Discovery</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              You perform your ordinary work. WorkFlowOS observes cross-application sequences, detects repetition,
              and generates verified, executable workflows for your approval.
            </p>
            <div className="p-4 rounded-xl bg-neutral-950 border border-cyan-800/40 font-mono text-[11px] text-cyan-300 space-y-1">
              <div>USER WORKS NORMALLY</div>
              <div>→ SYSTEM OBSERVES PATTERN</div>
              <div>→ AI SYNTHESIZES WORKFLOW</div>
              <div>→ USER APPROVES & AUTOMATES</div>
            </div>
          </div>
        </section>

        {/* How It Works (4 steps) */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono uppercase text-cyan-400">Process Lifecycle</span>
            <h2 className="text-2xl font-bold text-neutral-100">Observe. Understand. Automate.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <span className="text-cyan-400 font-mono text-[10px]">01 · OBSERVE</span>
              <h4 className="text-sm font-semibold text-neutral-100">Ambient Activity Stream</h4>
              <p className="text-neutral-400 leading-relaxed">
                Captures cross-app window transitions, form submits, and attachment downloads through a zero-trust sanitization layer.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <span className="text-indigo-400 font-mono text-[10px]">02 · DETECT</span>
              <h4 className="text-sm font-semibold text-neutral-100">Sequence Clustering</h4>
              <p className="text-neutral-400 leading-relaxed">
                Evaluates transition similarity, frequency, and time cost to isolate high-ROI repetitive processes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <span className="text-purple-400 font-mono text-[10px]">03 · SYNTHESIZE</span>
              <h4 className="text-sm font-semibold text-neutral-100">AI Workflow Generation</h4>
              <p className="text-neutral-400 leading-relaxed">
                LLM extracts entities, generates conditional safety gates, and constructs multi-step workflow graphs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <span className="text-emerald-400 font-mono text-[10px]">04 · EXECUTE</span>
              <h4 className="text-sm font-semibold text-neutral-100">Governed Automation</h4>
              <p className="text-neutral-400 leading-relaxed">
                Executes via API, semantic browser automation (Playwright), or human-in-the-loop validation checkpoints.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy & Zero-Trust Architecture */}
        <section className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-lg font-bold text-neutral-100">Zero-Trust Privacy Constitution</h3>
              <p className="text-xs text-neutral-400">
                Your credentials, client data, and secrets never leak to the AI model.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-neutral-400">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
              <span className="text-neutral-200 font-semibold">1. Client-Side Redaction</span>
              <p className="leading-relaxed">
                Passwords, credit cards, SSNs, and bearer authorization tokens are scrubbed by regex filters before network ingestion.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
              <span className="text-neutral-200 font-semibold">2. Application Blacklisting</span>
              <p className="leading-relaxed">
                Banking, password managers (1Password, Bitwarden), and private messaging apps are strictly excluded.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
              <span className="text-neutral-200 font-semibold">3. Human-in-the-Loop</span>
              <p className="leading-relaxed">
                No discovered workflow is activated without explicit human approval and risk assessment.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="h-16 px-8 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-500 max-w-7xl mx-auto w-full">
        <span>WorkFlowOS · AI-Powered Workflow Automation</span>
        <span>Prototype Version 1.0.0</span>
      </footer>
    </div>
  );
};
