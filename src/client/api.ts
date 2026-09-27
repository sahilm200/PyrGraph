import {
  HealthResponse,
  BootstrapResponse,
  AnalysisRequest,
  AnalysisResponse,
  IntroRequest,
  IntroResponse,
  GraphSnapshot,
  ProductBrief,
  JudgeScorecard,
} from '../../shared/contracts';
import { INITIAL_GRAPH_SNAPSHOT, DEFAULT_PRODUCT_BRIEF, DEFAULT_TEAM } from '../../shared/fixture';
import { evaluateAccountGraph } from '../core/graph';

export const pyrgraphApi = {
  async getHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) return await res.json();
    } catch {
      // Fallback
    }
    return {
      status: 'ok',
      service: 'pyrgraph-engine',
      time: new Date().toISOString(),
      geminiConfigured: false,
    };
  },

  async getBootstrap(): Promise<BootstrapResponse> {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) return await res.json();
    } catch {
      // Fallback to fixture
    }
    return {
      team: DEFAULT_TEAM,
      initialGraph: INITIAL_GRAPH_SNAPSHOT,
      defaultProductBrief: DEFAULT_PRODUCT_BRIEF,
    };
  },

  async analyze(req: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to local evaluation
    }

    // Local deterministic fallback
    const result = evaluateAccountGraph(req.graphSnapshot, req.activeTeamMemberIds, req.productBrief);
    return {
      inputRevision: req.inputRevision,
      accounts: result.accounts,
      summary: result.summary,
      graphView: result.graphView,
    };
  },

  async generateIntro(req: IntroRequest): Promise<IntroResponse> {
    const res = await fetch('/api/intro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate intro with server');
    }

    return await res.json();
  },

  async runEvaluatorJudge(commitSha: string = 'runtime'): Promise<JudgeScorecard> {
    try {
      const res = await fetch('/api/eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitSha }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback to local evaluation judge
    }

    const { runAutomatedJudge } = await import('../core/eval/judge');
    return await runAutomatedJudge(commitSha);
  },
};

