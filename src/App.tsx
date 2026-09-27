/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessWarmth,
  AnalysisSummary,
  GraphSnapshot,
  GraphViewData,
  ProductBrief,
  RankedAccount,
} from '../shared/contracts';
import { DEFAULT_PRODUCT_BRIEF, INITIAL_GRAPH_SNAPSHOT } from '../shared/fixture';
import { pyrgraphApi } from './client/api';
import { CornerActionButton, FlameReveal, MultiStepLoader, ParticleDrift } from './ui/AnalysisControls';
import { AccountCard } from './ui/AccountCard';
import { DiagnosticsDrawer } from './ui/DiagnosticsDrawer';
import { EvidenceDrawer } from './ui/EvidenceDrawer';
import { GraphCanvas } from './ui/GraphCanvas';
import { ProductBriefModal } from './ui/ProductBriefModal';
import { CSVImportModal } from './ui/CSVImportModal';
import { runAllDiagnostics } from './core/eval/runner';
import { EvaluationReport } from './core/eval/types';
import { ACCESS_COLOR, ACCESS_LABEL, PYRGRAPH_LOGO_SRC, routeRankColor } from './ui/brand';
import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  Database,
  FileUp,
  Gauge,
  Pause,
  Play,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

export default function App() {
  const [snapshot, setSnapshot] = useState<GraphSnapshot>(INITIAL_GRAPH_SNAPSHOT);
  const [activeMemberIds, setActiveMemberIds] = useState<string[]>(['sahil']);
  const [productBrief, setProductBrief] = useState<ProductBrief>(DEFAULT_PRODUCT_BRIEF);
  const [inputRevision, setInputRevision] = useState(1);
  const [accounts, setAccounts] = useState<RankedAccount[]>([]);
  const [graphView, setGraphView] = useState<GraphViewData>({ nodes: [], edges: [] });
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<RankedAccount | null>(null);
  const [highlightedAccountId, setHighlightedAccountId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [warmthFilter, setWarmthFilter] = useState<'all' | AccessWarmth>('all');
  const [hasEnteredWorkspace, setHasEnteredWorkspace] = useState(false);
  const [isLeavingEntry, setIsLeavingEntry] = useState(false);
  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);
  const [analysisTrigger, setAnalysisTrigger] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisPending, setAnalysisPending] = useState(false);
  const [particlesPaused, setParticlesPaused] = useState(false);

  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [evalReport, setEvalReport] = useState<EvaluationReport | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const inputRevisionRef = useRef(inputRevision);
  const analysisRequestRef = useRef(0);
  const enteredWorkspaceRef = useRef(false);
  const skipNextAnalysisRef = useRef(false);
  inputRevisionRef.current = inputRevision;

  const invalidateAnalysis = () => {
    analysisRequestRef.current += 1;
    inputRevisionRef.current += 1;
    setInputRevision(inputRevisionRef.current);
    setAccounts([]);
    setGraphView({ nodes: [], edges: [] });
    setSummary(null);
    setSelectedAccount(null);
    setHighlightedAccountId(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3400);
  };

  const handleRunDiagnostics = useCallback(async () => {
    setIsRunningDiagnostics(true);
    try {
      setEvalReport(await runAllDiagnostics(snapshot, productBrief));
    } catch (error) {
      console.error('Diagnostics error:', error);
      showToast('Diagnostics could not finish. Check the browser console for details.', 'info');
    } finally {
      setIsRunningDiagnostics(false);
    }
  }, [snapshot, productBrief]);

  useEffect(() => {
    runAllDiagnostics(snapshot, productBrief).then(setEvalReport).catch(() => {});
  }, [snapshot, productBrief]);

  const runAnalysis = useCallback(async (
    currentSnapshot: GraphSnapshot,
    members: string[],
    brief: ProductBrief,
    revision: number,
  ) => {
    const requestId = ++analysisRequestRef.current;
    setIsAnalyzing(true);
    setAnalysisPending(false);
    setAnalysisError(null);
    setAnalysisStep(0);

    try {
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
      if (requestId !== analysisRequestRef.current || revision !== inputRevisionRef.current) return;
      setAnalysisStep(1);

      const response = await pyrgraphApi.analyze({
        graphSnapshot: currentSnapshot,
        activeTeamMemberIds: members,
        productBrief: brief,
        inputRevision: revision,
      });

      if (requestId !== analysisRequestRef.current || revision !== inputRevisionRef.current || response.inputRevision !== revision) return;
      setAccounts(response.accounts);
      setSummary(response.summary);
      setGraphView(response.graphView);
      setSelectedAccount((current) => current ? response.accounts.find((account) => account.id === current.id) || null : null);
      setAnalysisStep(2);
      if (!enteredWorkspaceRef.current) {
        setIsLeavingEntry(true);
        window.setTimeout(() => {
          if (requestId !== analysisRequestRef.current || revision !== inputRevisionRef.current) return;
          enteredWorkspaceRef.current = true;
          setHasEnteredWorkspace(true);
          setIsLeavingEntry(false);
        }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700);
      }
    } catch (error) {
      if (requestId === analysisRequestRef.current && revision === inputRevisionRef.current) {
        console.error('Analysis error:', error);
        setAnalysisError('We could not analyze this network. Try again.');
      }
    } finally {
      if (requestId === analysisRequestRef.current) setIsAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    if (!hasStartedAnalysis) return;
    if (skipNextAnalysisRef.current) {
      skipNextAnalysisRef.current = false;
      return;
    }
    void runAnalysis(snapshot, activeMemberIds, productBrief, inputRevision);
  }, [snapshot, activeMemberIds, productBrief, inputRevision, hasStartedAnalysis, analysisTrigger, runAnalysis]);

  const handleRunAnalysis = () => {
    if (!hasStartedAnalysis) setHasStartedAnalysis(true);
    setAnalysisTrigger((current) => current + 1);
  };

  const handleEnterWorkspace = () => {
    setHasStartedAnalysis(true);
    if (hasStartedAnalysis) setAnalysisTrigger((current) => current + 1);
  };

  const handleToggleMember = (memberId: string) => {
    const nextMembers = activeMemberIds.includes(memberId)
      ? activeMemberIds.length > 1 ? activeMemberIds.filter((id) => id !== memberId) : activeMemberIds
      : [...activeMemberIds, memberId];
    if (nextMembers.length === activeMemberIds.length) return;
    setActiveMemberIds(nextMembers);
    invalidateAnalysis();
    const memberName = snapshot.members.find((member) => member.id === memberId)?.name || memberId;
    showToast(nextMembers.includes(memberId) ? `${memberName}'s network added. Accounts and routes are recalculating.` : `${memberName}'s network removed. Accounts and routes are recalculating.`, 'info');
  };

  const handleImportComplete = (updatedSnapshot: GraphSnapshot) => {
    skipNextAnalysisRef.current = true;
    setSnapshot(updatedSnapshot);
    invalidateAnalysis();
    setAnalysisPending(true);
    showToast('Imported connections merged into this browser session. Select Analyze to update accounts and routes.', 'success');
  };

  const handleResetFixture = () => {
    setSnapshot(INITIAL_GRAPH_SNAPSHOT);
    setActiveMemberIds(['sahil']);
    setProductBrief(DEFAULT_PRODUCT_BRIEF);
    invalidateAnalysis();
    showToast('Sample graph reset to Sahil’s network.', 'info');
  };

  const filteredAccounts = accounts.filter((account) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = !query || account.name.toLowerCase().includes(query) || account.industry.toLowerCase().includes(query);
    return matchesQuery && (warmthFilter === 'all' || account.accessWarmth === warmthFilter);
  });

  if (!hasEnteredWorkspace) {
    return (
      <div className={`entry-screen${isLeavingEntry ? ' is-leaving' : ''}`}>
        <ParticleDrift paused={particlesPaused} />
        <button className="motion-toggle" type="button" onClick={() => setParticlesPaused((paused) => !paused)} aria-pressed={particlesPaused}>
          {particlesPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
          {particlesPaused ? 'Resume particles' : 'Pause particles'}
        </button>
        <section className="entry-content" aria-labelledby="entry-title">
          <p className="entry-eyebrow">Network access, made visible</p>
          <img className="entry-logo" src={PYRGRAPH_LOGO_SRC} alt="PyrGraph" />
          <h1 id="entry-title" className="entry-title">Find the accounts your team can already reach.</h1>
          <p className="entry-copy">Start with one network. Add a teammate and watch supported routes, account access, and the next sensible introduction take shape.</p>
          <div className="entry-meta" aria-label="Sample graph details">
            <span><Database aria-hidden="true" /> {snapshot.contacts.length} sample contacts</span>
            <span><Users aria-hidden="true" /> {snapshot.members.length} team networks</span>
            <span><Gauge aria-hidden="true" /> Evidence-backed routes</span>
          </div>
          <CornerActionButton onClick={handleEnterWorkspace} disabled={isAnalyzing} busy={isAnalyzing}>{isAnalyzing ? 'Analyzing network' : 'Analyze the sample network'}</CornerActionButton>
          {isAnalyzing && <MultiStepLoader activeStep={analysisStep} />}
          {analysisError && <div className="analysis-error" role="alert">{analysisError} <button type="button" onClick={handleEnterWorkspace}>Retry</button></div>}
          <p className="entry-footnote">Synthetic demo data · Imports stay in this browser session</p>
        </section>
          {isLeavingEntry && <FlameReveal />}
      </div>
    );
  }

  return (
    <div className="app-shell">
      {toast && (
        <div className="toast-message" role="status" aria-live="polite">
          {toast.type === 'success' ? <CheckCircle2 aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
          <span>{toast.message}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}><X aria-hidden="true" size={13} /></button>
        </div>
      )}

      <header className="workspace-header">
        <div className="workspace-header__inner">
          <a className="brand-lockup" href="#workspace" aria-label="PyrGraph network workspace">
            <img src={PYRGRAPH_LOGO_SRC} alt="" />
            <span><strong className="brand-lockup__name">PYRGRAPH</strong><small className="brand-lockup__descriptor">Network access intelligence</small></span>
          </a>

          <div className="team-picker" role="group" aria-label="Choose team networks">
            <span className="team-picker__label"><Users size={13} aria-hidden="true" /> Network</span>
            {snapshot.members.map((member) => {
              const active = activeMemberIds.includes(member.id);
              return (
                <button
                  type="button"
                  key={member.id}
                  className={`team-toggle${active ? ' is-active' : ''}`}
                  onClick={() => handleToggleMember(member.id)}
                  aria-pressed={active}
                  title={`${active ? 'Remove' : 'Add'} ${member.name}’s network`}
                >
                  <img src={member.avatar} alt="" />
                  <span>{member.name}</span>
                  {active && <CheckCircle2 size={13} aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="header-actions">
            <button type="button" className="utility-button" onClick={() => setIsBriefModalOpen(true)} title="Edit product brief">
              <SlidersHorizontal aria-hidden="true" /><span>Product</span>
            </button>
            <button type="button" className="utility-button" onClick={() => setIsImportModalOpen(true)} title="Import a connections CSV">
              <FileUp aria-hidden="true" /><span>Import</span>
            </button>
            <button type="button" className="utility-button" onClick={() => { setIsDiagnosticsOpen(true); if (!evalReport) void handleRunDiagnostics(); }} disabled={isRunningDiagnostics} title="Run diagnostics">
              <CircleHelp aria-hidden="true" /><span>Checks</span>
            </button>
            <button type="button" className="utility-button" onClick={handleResetFixture} title="Reset sample graph"><RefreshCw aria-hidden="true" /></button>
            <CornerActionButton className="utility-button--analysis" onClick={handleRunAnalysis} disabled={isAnalyzing} busy={isAnalyzing}>
              {isAnalyzing ? 'Analyzing' : 'Analyze'}
            </CornerActionButton>
          </div>
        </div>
      </header>

      <section className="workspace-summary" aria-label="Current product brief and account summary">
        <div className="workspace-summary__inner">
          <div className="product-line">
            <span className="section-eyebrow">Selling</span>
            <strong>{productBrief.productName}</strong>
            <span>·</span>
            <span className="product-line__target">{productBrief.targetBuyerRole}</span>
            <button type="button" className="summary-edit" onClick={() => setIsBriefModalOpen(true)}>Edit brief</button>
            <span className="sample-badge"><Database aria-hidden="true" /> Sample graph</span>
          </div>
          {summary && (
            <div className="summary-metrics" aria-label="Analysis summary">
              <span className="summary-metric">Accounts<strong>{summary.totalAccounts}</strong></span>
              <span className="summary-metric">Reachable<strong>{summary.reachableAccounts}</strong></span>
              <span className="summary-metric" style={{ '--pg-access-color': ACCESS_COLOR.hot } as React.CSSProperties}>Hot<strong>{summary.hotAccounts}</strong></span>
              <span className="summary-metric" style={{ '--pg-access-color': ACCESS_COLOR.warm } as React.CSSProperties}>Warm<strong>{summary.warmAccounts}</strong></span>
              <span className="summary-metric" style={{ '--pg-access-color': ACCESS_COLOR.connected } as React.CSSProperties}>Connected<strong>{summary.connectedAccounts}</strong></span>
              {summary.newlyUnlockedByTeam > 0 && <span className="summary-metric summary-metric--unlocked">Newly reachable<strong>{summary.newlyUnlockedByTeam}</strong></span>}
            </div>
          )}
        </div>
      </section>

      <main className="workspace-layout" id="workspace">
        <aside className="account-column" aria-labelledby="accounts-title">
          <div className="accounts-heading">
            <div>
              <p className="section-eyebrow">Account access</p>
              <h1 id="accounts-title">Ranked accounts</h1>
              <p>Fit and relationship access are shown separately.</p>
            </div>
          </div>

          <div className="account-filters">
            <label className="account-search">
              <Search aria-hidden="true" />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Filter accounts or industries" aria-label="Filter accounts or industries" />
            </label>
            <div className="warmth-filters" role="group" aria-label="Filter by access status">
              {(['all', 'hot', 'warm', 'connected', 'cold'] as const).map((filter) => (
                <button type="button" key={filter} className={`warmth-filter${warmthFilter === filter ? ' is-active' : ''}`} onClick={() => setWarmthFilter(filter)} aria-pressed={warmthFilter === filter}>
                  {filter === 'all' ? 'All access' : ACCESS_LABEL[filter]}
                </button>
              ))}
            </div>
          </div>

          <div className="account-list" aria-live="polite">
            {filteredAccounts.map((account) => {
              const rank = accounts.findIndex((item) => item.id === account.id) + 1;
              return (
                <AccountCard
                  key={account.id}
                  account={account}
                  rank={rank}
                  routeColor={routeRankColor(rank - 1, accounts.length)}
                  isSelected={selectedAccount?.id === account.id}
                  isHighlighted={highlightedAccountId === account.id}
                  onSelect={setSelectedAccount}
                  onHighlight={setHighlightedAccountId}
                  viewerMemberId="sahil"
                />
              );
            })}
            {filteredAccounts.length === 0 && (
              <div className="account-empty" role="status">
                {analysisPending ? 'Import ready. Select Analyze to rank the updated network.' : accounts.length === 0 && isAnalyzing ? 'Preparing account rankings…' : 'No accounts match this filter. Try another access status or clear your search.'}
              </div>
            )}
          </div>
        </aside>

        <section className="graph-column" aria-label="Network graph and analysis status">
          {isAnalyzing && <MultiStepLoader activeStep={analysisStep} />}
          {analysisError && (
            <div className="analysis-error" role="alert"><span><AlertCircle aria-hidden="true" /> {analysisError}</span><button type="button" onClick={handleRunAnalysis}>Try again</button></div>
          )}
          <GraphCanvas
            graphView={graphView}
            rankedAccounts={accounts}
            selectedAccount={selectedAccount}
            highlightedAccountId={highlightedAccountId}
            onHighlightAccount={setHighlightedAccountId}
            onSelectAccountById={(id) => setSelectedAccount(accounts.find((account) => account.id === id) || null)}
          />
          <p className="graph-note">
            <Sparkles aria-hidden="true" />
            <span><strong>Next step:</strong> choose an account to inspect its evidence, then draft a direct message or teammate request. Nothing is sent from PyrGraph.</span>
          </p>
        </section>
      </main>

      <EvidenceDrawer account={selectedAccount} productBrief={productBrief} viewerMemberId="sahil" onClose={() => setSelectedAccount(null)} />
      <ProductBriefModal
        isOpen={isBriefModalOpen}
        productBrief={productBrief}
        onSave={(brief) => {
          setProductBrief(brief);
          invalidateAnalysis();
          showToast('Product brief saved. Account relevance is recalculating.', 'success');
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
      <DiagnosticsDrawer isOpen={isDiagnosticsOpen} report={evalReport} onClose={() => setIsDiagnosticsOpen(false)} onRunDiagnostics={handleRunDiagnostics} isRunning={isRunningDiagnostics} />
    </div>
  );
}
