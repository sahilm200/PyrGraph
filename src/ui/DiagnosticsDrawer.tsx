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
  Award,
  Check,
} from 'lucide-react';
import { EvaluationReport, TestCase } from '../core/eval/types';
import { JudgeScorecard } from '../../shared/contracts';

interface DiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  report: EvaluationReport | null;
  scorecard: JudgeScorecard | null;
  isRunning: boolean;
  onRunDiagnostics: () => void;
  onRunJudge?: () => void;
}

export const DiagnosticsDrawer: React.FC<DiagnosticsDrawerProps> = ({
  isOpen,
  onClose,
  report,
  scorecard,
  isRunning,
  onRunDiagnostics,
  onRunJudge,
}) => {
  const [activeTab, setActiveTab] = useState<'judge' | 'unit_tests'>('judge');
  const [expandedCatId, setExpandedCatId] = useState<string | null>('cat_graph');
  const [expandedTestId, setExpandedTestId] = useState<string | null>('GEMINI-01');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const toggleExpandTest = (id: string) => {
    setExpandedTestId((prev) => (prev === id ? null : id));
  };

  const toggleExpandCat = (id: string) => {
    setExpandedCatId((prev) => (prev === id ? null : id));
  };

  const allTests = report?.suites.flatMap((s) => s.tests) || [];
  const filteredTests =
    selectedCategory === 'all'
      ? allTests
      : allTests.filter((t) => t.category === selectedCategory);

  const passRate =
    report && report.totalTests > 0
      ? Math.round((report.passedCount / report.totalTests) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0d1117] border-l border-[#30363d] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-5 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Engine Quality &amp; Evaluation Center
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                  Internal gate: ≥85%
                </span>
              </div>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Internal 100-point checks for graph bounds and citation grounding. This is not an organizer score.
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

        {/* Top-Level Tabs */}
        <div className="flex border-b border-[#30363d] bg-[#161b22]/40 text-xs px-5">
          <button
            onClick={() => setActiveTab('judge')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'judge'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-[#8b949e] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Internal Self-Check
            {scorecard && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  scorecard.passed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {scorecard.percentage}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('unit_tests')}
            className={`py-3 px-4 font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'unit_tests'
                ? 'border-orange-500 text-orange-400 bg-orange-500/5'
                : 'border-transparent text-[#8b949e] hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Diagnostic Test Cases
            {report && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#21262d] text-[#8b949e]">
                {report.passedCount}/{report.totalTests}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: internal 100-point self-check */}
        {activeTab === 'judge' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Scorecard Hero Banner */}
            <div className="bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-[#30363d] rounded-xl p-5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wider text-[#8b949e] font-semibold">
                      Internal Check Score
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-extrabold text-white tracking-tight font-mono">
                        {scorecard ? scorecard.compositeScore : '—'}
                      </span>
                      <span className="text-lg text-[#8b949e] font-mono">/ 100</span>
                    </div>
                  </div>

                  <div className="h-10 w-px bg-[#30363d] hidden sm:block" />

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        scorecard?.passed ?? false
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {scorecard ? (scorecard.passed ? 'PASSED INTERNAL GATE' : 'BELOW INTERNAL GATE') : 'NOT RUN'}
                    </span>
                    <p className="text-[11px] text-[#8b949e] mt-1 font-mono">
                      {scorecard ? `Timestamp: ${new Date(scorecard.timestamp).toLocaleTimeString()} · Sha: ${scorecard.gitCommitSha}` : 'Run the check to see a result.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onRunJudge) onRunJudge();
                    else onRunDiagnostics();
                  }}
                  disabled={isRunning}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Evaluating Engine...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Run Internal Checks
                    </>
                  )}
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full bg-[#21262d] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      (scorecard?.percentage ?? 0) >= 85
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-rose-500 to-amber-500'
                    }`}
                    style={{ width: `${scorecard?.percentage ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Category Rubric Cards */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b949e] px-1">
                Quantitative Evaluation Categories
              </h3>

              {(scorecard?.categories || []).map((cat) => {
                const isExpanded = expandedCatId === cat.id;
                const catPercentage = Math.round((cat.score / cat.maxScore) * 100);

                return (
                  <div
                    key={cat.id}
                    className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden transition-all"
                  >
                    <div
                      onClick={() => toggleExpandCat(cat.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#1c2128] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {cat.passed ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white tracking-tight">{cat.name}</h4>
                          </div>
                          <p className="text-[11px] text-[#8b949e] mt-0.5">{cat.details}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-white">
                            {cat.score} / {cat.maxScore} pts
                          </span>
                          <div className="text-[10px] text-[#8b949e] font-mono">({catPercentage}%)</div>
                        </div>

                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#8b949e]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#8b949e]" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-[#21262d] bg-[#0d1117]/60 space-y-2">
                        <div className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
                          Verified Rubric Subtests:
                        </div>

                        {cat.subtests.map((sub, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-2 rounded-lg bg-[#161b22]/70 border border-[#21262d] text-xs"
                          >
                            {sub.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <span className="font-medium text-white">{sub.name}</span>
                              {sub.note && (
                                <p className="text-[11px] text-[#8b949e] mt-0.5 font-mono">{sub.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Diagnostic Test Cases */}
        {activeTab === 'unit_tests' && (
          <>
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
                      onClick={() => toggleExpandTest(test.id)}
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

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="p-4 border-t border-[#21262d] bg-[#0d1117]/50 space-y-3">
                        {/* Grounding Citation Report if present */}
                        {test.citationReport && (
                          <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                                Grounded Citation Verification
                              </span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                  test.citationReport.hasValidCitations
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {Math.round(test.citationReport.groundedRatio * 100)}% Grounded
                              </span>
                            </div>

                            <div className="text-[11px] space-y-1 text-[#8b949e]">
                              <div>
                                Verified Evidence Cited:{' '}
                                <span className="text-white font-mono">
                                  {test.citationReport.citedEvidenceCount}
                                </span>
                              </div>
                              {test.citationReport.matchedEvidenceTitles.length > 0 && (
                                <div className="text-emerald-400">
                                  &bull; Matched:{' '}
                                  {test.citationReport.matchedEvidenceTitles.join(', ')}
                                </div>
                              )}
                              {test.citationReport.unverifiedClaims.length > 0 && (
                                <div className="text-rose-400 font-semibold">
                                  &bull; Rejected Unverified Claims:{' '}
                                  {test.citationReport.unverifiedClaims.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Assertions */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider">
                            Assertions:
                          </span>
                          {test.assertions.map((a, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-xs p-2 rounded-md bg-[#161b22]/50 border border-[#21262d]"
                            >
                              {a.passed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 font-mono text-[11px]">
                                <span className="text-white">{a.name}</span>
                                {a.details && (
                                  <p className="text-[#8b949e] mt-0.5">{a.details}</p>
                                )}
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
          </>
        )}
      </div>
    </div>
  );
};
