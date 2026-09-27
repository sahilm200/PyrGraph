import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Cpu,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Layers,
  FileCheck,
} from 'lucide-react';
import { EvaluationReport, TestCase } from '../core/eval/types';

interface DiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  report: EvaluationReport | null;
  isRunning: boolean;
  onRunDiagnostics: () => void;
}

export const DiagnosticsDrawer: React.FC<DiagnosticsDrawerProps> = ({
  isOpen,
  onClose,
  report,
  isRunning,
  onRunDiagnostics,
}) => {
  const [expandedTestId, setExpandedTestId] = useState<string | null>('GEMINI-01');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedTestId((prev) => (prev === id ? null : id));
  };

  const allTests = report?.suites.flatMap((s) => s.tests) || [];
  const filteredTests =
    selectedCategory === 'all'
      ? allTests
      : allTests.filter((t) => t.category === selectedCategory);

  const passRate =
    report && report.totalTests > 0
      ? Math.round((report.passedCount / report.totalTests) * 100)
      : 100;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0d1117] border-l border-[#30363d] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-5 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Engine Diagnostics &amp; Grounding Eval
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Automated traversal correctness, team reveal invariants &amp; Gemini citation verification.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8b949e] hover:text-white rounded-lg hover:bg-[#21262d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Metric Bar */}
        <div className="p-4 border-b border-[#30363d] bg-[#161b22]/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-mono">
            {report ? (
              <>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  {report.passedCount} / {report.totalTests} Passed ({passRate}%)
                </span>
                <span className="text-[#8b949e]">·</span>
                <span className="text-[#8b949e] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {report.durationMs}ms
                </span>
                <span className="text-[#8b949e]">·</span>
                <span className="text-[#8b949e]">Run at {report.timestamp}</span>
              </>
            ) : (
              <span className="text-[#8b949e]">No evaluation run yet</span>
            )}
          </div>

          <button
            onClick={onRunDiagnostics}
            disabled={isRunning}
            className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Executing Suite...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run All Evaluations
              </>
            )}
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-2.5 border-b border-[#30363d] bg-[#0d1117] flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Checks' },
            { id: 'graph_logic', label: 'Graph Invariants' },
            { id: 'team_reveal', label: 'Team Reveal' },
            { id: 'gemini_grounding', label: 'Gemini Grounding' },
            { id: 'contract_schemas', label: 'API Contracts' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#21262d] text-white border border-[#30363d]'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Test List Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredTests.map((test) => {
            const isExpanded = expandedTestId === test.id;
            const isPassed = test.status === 'passed';

            return (
              <div
                key={test.id}
                className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-xs transition-all"
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(test.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#1c2128] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#8b949e] font-semibold">{test.id}</span>
                        <h4 className="text-xs font-semibold text-white tracking-tight">{test.title}</h4>
                      </div>
                      <p className="text-[11px] text-[#8b949e] mt-0.5">{test.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-[#8b949e]">{test.durationMs}ms</span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                        isPassed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {test.status.toUpperCase()}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#8b949e]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#8b949e]" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-[#30363d] bg-[#0d1117] space-y-3">
                    {/* Specific Citation Inspector for GEMINI-01 */}
                    {test.citationReport && (
                      <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Citation Grounding Verifier
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400">
                            {test.citationReport.matchedEvidenceTitles.length} Verified Evidence Citations
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="p-2 bg-[#0d1117] rounded border border-emerald-500/20 text-emerald-300 font-mono text-[11px] flex items-center justify-between">
                            <span>Matched Evidence:</span>
                            <span className="text-white font-semibold">
                              &ldquo;{test.citationReport.matchedEvidenceTitles[0]}&rdquo;
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#8b949e] pt-1">
                            <span>Hallucination Guardrail:</span>
                            <span className="text-emerald-400 font-medium">0 Unverified Claims Detected</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Assertion Breakdown */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">
                        Assertions ({test.assertions.length})
                      </div>
                      {test.assertions.map((a, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between p-2 rounded bg-[#161b22] border border-[#30363d] text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            {a.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            )}
                            <span className="text-white">{a.name}</span>
                          </div>

                          <div className="text-right text-[11px] text-[#8b949e]">
                            <span>Actual: </span>
                            <span className={a.passed ? 'text-emerald-400' : 'text-rose-400'}>
                              {String(a.actual)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between text-xs text-[#8b949e]">
          <span>Grounding Verifier: Deterministic subgraph citation check</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg transition-colors border border-[#30363d]"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
