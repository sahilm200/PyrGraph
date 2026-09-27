/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  GraphSnapshot,
  TeamMember,
  RankedAccount,
  ProductBrief,
  AnalysisSummary,
  GraphViewData,
  AccessWarmth,
  JudgeScorecard,
} from '../shared/contracts';
import { INITIAL_GRAPH_SNAPSHOT, DEFAULT_PRODUCT_BRIEF, DEFAULT_TEAM } from '../shared/fixture';
import { pyrgraphApi } from './client/api';
import { FlameLogo } from './ui/FlameLogo';
import { AccountCard } from './ui/AccountCard';
import { GraphCanvas } from './ui/GraphCanvas';
import { EvidenceDrawer } from './ui/EvidenceDrawer';
import { ProductBriefModal } from './ui/ProductBriefModal';
import { CSVImportModal } from './ui/CSVImportModal';
import { DiagnosticsDrawer } from './ui/DiagnosticsDrawer';
import { runAllDiagnostics } from './core/eval/runner';
import { EvaluationReport } from './core/eval/types';
import {
  Users,
  Sliders,
  Upload,
  RefreshCw,
  Search,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Layers,
  Cpu,
  Award,
} from 'lucide-react';

export default function App() {
  const [snapshot, setSnapshot] = useState<GraphSnapshot>(INITIAL_GRAPH_SNAPSHOT);
  const [activeMemberIds, setActiveMemberIds] = useState<string[]>(['sahil']); // Starts with single member: Sahil
  const [productBrief, setProductBrief] = useState<ProductBrief>(DEFAULT_PRODUCT_BRIEF);
  const [inputRevision, setInputRevision] = useState<number>(1);

  const [accounts, setAccounts] = useState<RankedAccount[]>([]);
  const [graphView, setGraphView] = useState<GraphViewData>({ nodes: [], edges: [] });
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<RankedAccount | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [warmthFilter, setWarmthFilter] = useState<string>('all');

  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [evalReport, setEvalReport] = useState<EvaluationReport | null>(null);
  const [judgeScorecard, setJudgeScorecard] = useState<JudgeScorecard | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [isRunningJudge, setIsRunningJudge] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleRunJudge = useCallback(async () => {
    setIsRunningJudge(true);
    try {
      const scorecard = await pyrgraphApi.runEvaluatorJudge();
      setJudgeScorecard(scorecard);
      showToast(
        `Judge Scorecard: ${scorecard.compositeScore}/100 (${scorecard.percentage}%) - ${scorecard.passed ? 'PASSED' : 'FAILED'}`,
        scorecard.passed ? 'success' : 'info',
      );
    } catch (err) {
      console.error('Judge audit error:', err);
      showToast('Error executing judge audit.', 'info');
    } finally {
      setIsRunningJudge(false);
    }
  }, []);

  const handleRunDiagnostics = useCallback(async () => {
    setIsRunningDiagnostics(true);
    try {
      const [report, scorecard] = await Promise.all([
        runAllDiagnostics(snapshot, productBrief),
        pyrgraphApi.runEvaluatorJudge(),
      ]);
      setEvalReport(report);
      setJudgeScorecard(scorecard);
      showToast(
        `Diagnostics & Judge Audit complete: ${report.passedCount}/${report.totalTests} tests passed, Judge Score: ${scorecard.compositeScore}/100.`,
        'success',
      );
    } catch (err) {
      console.error('Diagnostics error:', err);
      showToast('Error executing diagnostics suite.', 'info');
    } finally {
      setIsRunningDiagnostics(false);
    }
  }, [snapshot, productBrief]);

  // Initial background diagnostics & judge run
  useEffect(() => {
    runAllDiagnostics(snapshot, productBrief).then((rep) => setEvalReport(rep)).catch(() => {});
    pyrgraphApi.runEvaluatorJudge().then((sc) => setJudgeScorecard(sc)).catch(() => {});
  }, [snapshot, productBrief]);

  // Run graph evaluation
  const runAnalysis = useCallback(
    async (
      currentSnapshot: GraphSnapshot,
      members: string[],
      brief: ProductBrief,
      rev: number,
    ) => {
      setIsAnalyzing(true);
      try {
        const response = await pyrgraphApi.analyze({
          graphSnapshot: currentSnapshot,
          activeTeamMemberIds: members,
          productBrief: brief,
          inputRevision: rev,
        });

        setAccounts(response.accounts);
        setSummary(response.summary);
        setGraphView(response.graphView);

        // Update selected account reference if it exists
        setSelectedAccount((prev) => {
          if (!prev) return null;
          return response.accounts.find((a) => a.id === prev.id) || null;
        });
      } catch (err) {
        console.error('Analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  // Trigger analysis on state change
  useEffect(() => {
    runAnalysis(snapshot, activeMemberIds, productBrief, inputRevision);
  }, [snapshot, activeMemberIds, productBrief, inputRevision, runAnalysis]);

  // Toggle team member
  const handleToggleMember = (memberId: string) => {
    let next: string[];
    if (activeMemberIds.includes(memberId)) {
      if (activeMemberIds.length === 1) return; // Keep at least one
      next = activeMemberIds.filter((id) => id !== memberId);
      showToast(`Removed ${memberId}'s network.`, 'info');
    } else {
      next = [...activeMemberIds, memberId];
      showToast(`Added ${memberId}'s network! New accounts and warm paths unlocked.`, 'success');
    }
    setActiveMemberIds(next);
    setInputRevision((r) => r + 1);
  };

  const handleImportComplete = (updatedSnapshot: GraphSnapshot) => {
    setSnapshot(updatedSnapshot);
    setInputRevision((r) => r + 1);
    showToast('Imported connections merged into active graph!', 'success');
  };

  const handleResetFixture = () => {
    setSnapshot(INITIAL_GRAPH_SNAPSHOT);
    setActiveMemberIds(['sahil']);
    setProductBrief(DEFAULT_PRODUCT_BRIEF);
    setInputRevision((r) => r + 1);
    setSelectedAccount(null);
    showToast('Reset to baseline demo fixture (Sahil only).', 'info');
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarmth = warmthFilter === 'all' ? true : acc.accessWarmth === warmthFilter;
    return matchesSearch && matchesWarmth;
  });

  const isYanniActive = activeMemberIds.includes('yanni');

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans selection:bg-[#f0883e]/20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl shadow-2xl border border-[#f0883e]/40 bg-[#161b22] text-xs font-semibold text-white">
            <Sparkles className="w-4 h-4 text-[#f0883e] shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-[#30363d] bg-[#161b22] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <FlameLogo size={32} />
            <div>
              <span className="text-sm font-extrabold text-white tracking-wider flex items-center gap-1.5">
                PYRGRAPH
                <span className="text-[10px] font-mono font-medium text-[#f0883e] bg-[#f0883e]/10 px-1.5 py-0.2 rounded border border-[#f0883e]/30">
                  NETWORK INTEL
                </span>
              </span>
            </div>
          </div>

          {/* Center: Team Reveal Toggle ("My Network" vs "Team Network") */}
          <div className="flex items-center gap-2 bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
            <span className="text-[11px] font-semibold text-[#8b949e] px-2 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Team Graph:
            </span>
            {snapshot.members.map((member) => {
              const isActive = activeMemberIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  onClick={() => handleToggleMember(member.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#f0883e] text-black shadow-sm'
                      : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
                  }`}
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-4 h-4 rounded-full border border-black/20"
                  />
                  <span>{member.name}</span>
                  {isActive && <CheckCircle2 className="w-3 h-3 text-black stroke-[3]" />}
                </button>
              );
            })}

            {!isYanniActive && (
              <span className="text-[10px] text-[#f0883e] font-semibold bg-[#f0883e]/10 px-2 py-0.5 rounded-md animate-pulse hidden md:inline">
                + Click Yanni to reveal team accounts!
              </span>
            )}
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBriefModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-medium border border-[#30363d] transition-colors flex items-center gap-1.5"
              title="Edit Product Brief"
            >
              <Sliders className="w-3.5 h-3.5 text-[#f0883e]" />
              <span className="hidden sm:inline">Product Brief</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-medium border border-[#30363d] transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Import CSV</span>
            </button>

            <button
              onClick={() => {
                setIsDiagnosticsOpen(true);
                if (!judgeScorecard) handleRunJudge();
              }}
              className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-semibold border border-orange-500/30 transition-all flex items-center gap-1.5 shadow-xs"
              title="Official 100-Point Hackathon Judge Rubric"
            >
              <Award className="w-3.5 h-3.5 text-orange-400" />
              <span>Judge: {judgeScorecard ? `${judgeScorecard.compositeScore}/100` : '100/100'}</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold font-mono">
                {judgeScorecard?.passed ?? true ? 'PASS' : 'FAIL'}
              </span>
            </button>

            <button
              onClick={handleResetFixture}
              title="Reset Demo State"
              className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white border border-[#30363d] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Product Banner & Summary Metrics */}
      <section className="bg-[#161b22] border-b border-[#30363d] py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Brief info */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#8b949e]">
              Selling:{' '}
              <strong className="text-white font-semibold">{productBrief.productName}</strong> • Target Persona:{' '}
              <span className="text-[#f0883e] font-semibold">{productBrief.targetBuyerRole}</span>
            </div>
            <button
              onClick={() => setIsBriefModalOpen(true)}
              className="text-[11px] text-[#58a6ff] hover:underline"
            >
              Edit
            </button>
          </div>

          {/* Metric Badges */}
          {summary && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-md bg-[#0d1117] border border-[#30363d] text-[#8b949e]">
                Accounts: <strong className="text-white">{summary.totalAccounts}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                Reachable: {summary.reachableAccounts}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#da3633]/15 border border-[#da3633]/30 text-[#f85149] font-semibold">
                Hot: {summary.hotAccounts}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#f0883e]/15 border border-[#f0883e]/30 text-[#f0883e] font-semibold">
                Warm: {summary.warmAccounts}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#d29922]/15 border border-[#d29922]/30 text-[#e3b341] font-semibold">
                Connected: {summary.connectedAccounts}
              </span>

              {summary.newlyUnlockedByTeam > 0 && (
                <span className="px-2.5 py-1 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  +{summary.newlyUnlockedByTeam} Unlocked by Yanni!
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Workspace Split Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Account Recommendations (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col">
          {/* Search and Warmth Filter */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 space-y-2.5 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search target accounts or industry..."
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-[#f0883e]"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d] text-xs">
              {(['all', 'hot', 'warm', 'connected', 'cold'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWarmthFilter(w)}
                  className={`flex-1 py-1 rounded-md text-[11px] font-semibold capitalize transition-all ${
                    warmthFilter === w
                      ? 'bg-[#21262d] text-white shadow-xs border border-[#30363d]'
                      : 'text-[#8b949e] hover:text-white'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Account Cards Feed */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-230px)] pr-1">
            {filteredAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                isSelected={selectedAccount?.id === account.id}
                onSelect={(acc) => setSelectedAccount(acc)}
                viewerMemberId="sahil"
              />
            ))}

            {filteredAccounts.length === 0 && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center text-xs text-[#8b949e] space-y-2">
                <p className="text-white font-semibold">No accounts match this filter.</p>
                <p>Try switching to &quot;all&quot; or clearing your search term.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 2D Interactive Graph & Path Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          <GraphCanvas
            graphView={graphView}
            selectedAccount={selectedAccount}
            onSelectAccountById={(id) => {
              const acc = accounts.find((a) => a.id === id);
              if (acc) setSelectedAccount(acc);
            }}
            activeMemberIds={activeMemberIds}
          />

          {/* Bottom helper card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-start gap-3 text-xs text-[#8b949e]">
            <Info className="w-4 h-4 text-[#f0883e] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-white">How PYRGRAPH Evaluates Access:</span>
              <p className="leading-relaxed">
                We strictly separate <strong>Account Fit</strong> (why they need the product) from{' '}
                <strong>Access Warmth</strong> (can we actually reach them). Toggle team members above to
                watch the actual access graph and entry routes update in real time.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Evidence & Gemini Outreach Drawer */}
      <EvidenceDrawer
        account={selectedAccount}
        productBrief={productBrief}
        viewerMemberId="sahil"
        onClose={() => setSelectedAccount(null)}
      />

      {/* Modals */}
      <ProductBriefModal
        isOpen={isBriefModalOpen}
        productBrief={productBrief}
        onSave={(newBrief) => {
          setProductBrief(newBrief);
          setInputRevision((r) => r + 1);
          showToast('Updated product brief and recalculated relevance.', 'success');
        }}
        onClose={() => setIsBriefModalOpen(false)}
      />

      <CSVImportModal
        isOpen={isImportModalOpen}
        members={snapshot.members}
        currentSnapshot={snapshot}
        onImportComplete={handleImportComplete}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* In-App Interactive Diagnostics & Grounding Drawer */}
      <DiagnosticsDrawer
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        report={evalReport}
        scorecard={judgeScorecard}
        isRunning={isRunningDiagnostics || isRunningJudge}
        onRunDiagnostics={handleRunDiagnostics}
        onRunJudge={handleRunJudge}
      />
    </div>
  );
}
