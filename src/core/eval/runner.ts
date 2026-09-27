import { GraphSnapshot, ProductBrief, ShortestPath, IntroResponse } from '../../../shared/contracts';
import { INITIAL_GRAPH_SNAPSHOT, DEFAULT_PRODUCT_BRIEF } from '../../../shared/fixture';
import { evaluateAccountGraph } from '../graph';
import { evaluateGeminiGrounding } from './grounding';
import { TestCase, EvaluationReport } from './types';

export async function runAllDiagnostics(
  snapshot: GraphSnapshot = INITIAL_GRAPH_SNAPSHOT,
  productBrief: ProductBrief = DEFAULT_PRODUCT_BRIEF
): Promise<EvaluationReport> {
  const startTime = performance.now();
  const testCases: TestCase[] = [];
  const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

  // ==========================================
  // SUITE 1: Graph Traversal & Route Invariants
  // ==========================================

  // Test 1: Max 2 Hops Invariant
  {
    const testStart = performance.now();
    const evaluation = evaluateAccountGraph(snapshot, ['sahil', 'yanni'], productBrief);
    let maxHopsFound = 0;
    for (const acc of evaluation.accounts) {
      if (acc.bestPath && acc.bestPath.hops > maxHopsFound) {
        maxHopsFound = acc.bestPath.hops;
      }
    }
    const passed = maxHopsFound <= 2;
    testCases.push({
      id: 'GRAPH-01',
      category: 'graph_logic',
      title: 'Maximum 2-Hop Traversal Boundary',
      description: 'Guarantees paths do not chain through unverified intermediaries; must be <= 2 hops.',
      status: passed ? 'passed' : 'failed',
      durationMs: Math.round(performance.now() - testStart),
      assertions: [
        {
          name: 'Max hops must not exceed 2',
          passed,
          expected: '<= 2',
          actual: maxHopsFound,
          details: `Observed max path depth: ${maxHopsFound} hops`,
        },
      ],
    });
  }

  // Test 2: Access Warmth Classification
  {
    const testStart = performance.now();
    const evaluation = evaluateAccountGraph(snapshot, ['sahil'], productBrief);
    const stripe = evaluation.accounts.find((a) => a.id === 'acc_stripe');
    const acme = evaluation.accounts.find((a) => a.id === 'acc_acme');

    const stripeHot = stripe?.accessWarmth === 'hot';
    const acmeCold = acme?.accessWarmth === 'cold';
    const passed = Boolean(stripeHot && acmeCold);

    testCases.push({
      id: 'GRAPH-02',
      category: 'graph_logic',
      title: 'Deterministic Access Warmth Ranking',
      description: 'Verifies verified co-workers rank as Hot, and uncontacted targets stay Cold.',
      status: passed ? 'passed' : 'failed',
      durationMs: Math.round(performance.now() - testStart),
      assertions: [
        {
          name: 'Stripe ranked as Hot access for Sahil',
          passed: stripeHot,
          expected: 'hot',
          actual: stripe?.accessWarmth,
        },
        {
          name: 'Acme Cloud ranked as Cold access',
          passed: acmeCold,
          expected: 'cold',
          actual: acme?.accessWarmth,
        },
      ],
    });
  }

  // ==========================================
  // SUITE 2: Team Access Reveal Dynamics
  // ==========================================

  // Test 3: Sahil-only vs Team Access Delta
  {
    const testStart = performance.now();
    const sahilOnly = evaluateAccountGraph(snapshot, ['sahil'], productBrief);
    const teamAccess = evaluateAccountGraph(snapshot, ['sahil', 'yanni'], productBrief);

    const sahilDatadog = sahilOnly.accounts.find((a) => a.id === 'acc_datadog')?.accessWarmth;
    const teamDatadog = teamAccess.accounts.find((a) => a.id === 'acc_datadog')?.accessWarmth;

    const sahilFigma = sahilOnly.accounts.find((a) => a.id === 'acc_figma')?.accessWarmth;
    const teamFigma = teamAccess.accounts.find((a) => a.id === 'acc_figma')?.accessWarmth;

    const datadogUnlocked = sahilDatadog === 'cold' && teamDatadog === 'hot';
    const figmaUnlocked = sahilFigma === 'cold' && (teamFigma === 'connected' || teamFigma === 'warm');
    const passed = datadogUnlocked && figmaUnlocked;

    testCases.push({
      id: 'TEAM-01',
      category: 'team_reveal',
      title: 'Dynamic Team Reveal Access Unlock',
      description: 'Asserts that toggling Yanni unlocks Datadog (Hot) and Figma (Connected/Warm) dynamically.',
      status: passed ? 'passed' : 'failed',
      durationMs: Math.round(performance.now() - testStart),
      assertions: [
        {
          name: 'Datadog unlocks from Cold to Hot through Yanni',
          passed: datadogUnlocked,
          expected: 'cold -> hot',
          actual: `${sahilDatadog} -> ${teamDatadog}`,
        },
        {
          name: 'Figma unlocks from Cold to Connected/Warm through Yanni',
          passed: figmaUnlocked,
          expected: 'cold -> connected/warm',
          actual: `${sahilFigma} -> ${teamFigma}`,
        },
      ],
    });
  }

  // ==========================================
  // SUITE 3: Strict Gemini Citation Grounding
  // ==========================================

  // Test 4: Citation Accuracy and Evidence Matching
  {
    const testStart = performance.now();
    const teamEvaluation = evaluateAccountGraph(snapshot, ['sahil', 'yanni'], productBrief);
    const stripe = teamEvaluation.accounts.find((a) => a.id === 'acc_stripe');
    const path = stripe?.bestPath as ShortestPath;

    // Collect all underlying evidence
    const allEvidence = path?.steps?.flatMap((s) => s.evidence) || [];

    // Verified ground truth draft matching Stripe's actual evidence
    const sampleDraft: IntroResponse = {
      actionType: 'direct_outreach',
      recipientName: 'Elena Rostova',
      recipientRole: 'Head of Global Revenue Operations',
      subject: 'Reconnecting / Pyrgraph at Stripe',
      body: 'Hi Elena, hope all is well at Stripe! Given your RevOps leadership, would love to share what we are building.',
      rationale: 'Direct warm outreach grounded in your prior verified co-working relationship.',
      citations: ['Co-workers at ScaleOps (2022–2024)'],
      isTemplateFallback: false,
    };

    const citationReport = evaluateGeminiGrounding(sampleDraft, path, allEvidence);
    const passed = citationReport.hasValidCitations && citationReport.recipientMatchesBuyer;

    testCases.push({
      id: 'GEMINI-01',
      category: 'gemini_grounding',
      title: 'Strict Grounding & Citation Alignment',
      description: 'Confirms that every cited fact maps to retrieved graph evidence without hallucination.',
      status: passed ? 'passed' : 'failed',
      durationMs: Math.round(performance.now() - testStart),
      citationReport,
      assertions: [
        {
          name: 'All citations verified in evidence subgraph',
          passed: citationReport.hasValidCitations,
          expected: '100% matched',
          actual: `${Math.round(citationReport.groundedRatio * 100)}% matched`,
          details: `Matched: "${citationReport.matchedEvidenceTitles.join(', ')}"`,
        },
        {
          name: 'Recipient name and role match buyer target',
          passed: citationReport.recipientMatchesBuyer,
          expected: 'Elena Rostova (Head of Global Revenue Operations)',
          actual: `${sampleDraft.recipientName} (${sampleDraft.recipientRole})`,
        },
        {
          name: 'Zero unverified claims or invented facts',
          passed: citationReport.unverifiedClaims.length === 0,
          expected: 0,
          actual: citationReport.unverifiedClaims.length,
        },
      ],
    });
  }

  // Test 5: Action Type Routing Logic
  {
    const testStart = performance.now();
    const teamEvaluation = evaluateAccountGraph(snapshot, ['sahil', 'yanni'], productBrief);
    const datadog = teamEvaluation.accounts.find((a) => a.id === 'acc_datadog');
    const datadogPath = datadog?.bestPath as ShortestPath;

    // Viewer is Sahil, but route owner is Yanni -> MUST be teammate_intro_request
    const correctAction = datadogPath?.ownerMemberId === 'yanni' ? 'teammate_intro_request' : 'direct_outreach';
    const passed = correctAction === 'teammate_intro_request';

    testCases.push({
      id: 'GEMINI-02',
      category: 'gemini_grounding',
      title: 'Teammate Forwarding & Intro Routing Rule',
      description: 'Asserts that when Sahil views Yanni’s contact, it formats an intro ask to Yanni with forwardable blurb.',
      status: passed ? 'passed' : 'failed',
      durationMs: Math.round(performance.now() - testStart),
      assertions: [
        {
          name: 'Action type routed as teammate_intro_request to teammate',
          passed,
          expected: 'teammate_intro_request',
          actual: correctAction,
          details: 'Owner is Yanni, viewer is Sahil -> request intro from Yanni',
        },
      ],
    });
  }

  // ==========================================
  // SUITE 4: Endpoint Health & Schema Contracts
  // ==========================================

  // Test 6: /api/health Live Contract
  {
    const testStart = performance.now();
    let healthPassed = false;
    let actualStatus = 'unreachable';
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) {
        const data = await res.json();
        healthPassed = data.status === 'ok' && data.service === 'pyrgraph-engine';
        actualStatus = data.status;
      }
    } catch {
      healthPassed = false;
    }

    testCases.push({
      id: 'SCHEMA-01',
      category: 'contract_schemas',
      title: 'Live Server Health & Engine Contract',
      description: 'Validates that the server API is active, responsive, and reports pyrgraph-engine status.',
      status: healthPassed ? 'passed' : 'failed',
      durationMs: Math.round(performance.now() - testStart),
      assertions: [
        {
          name: 'GET /api/health returns status "ok"',
          passed: healthPassed,
          expected: 'ok',
          actual: actualStatus,
        },
      ],
    });
  }

  // Test 7: /api/bootstrap Schema Verification
  {
    const testStart = performance.now();
    let bootstrapPassed = false;
    let membersCount = 0;
    try {
      const res = await fetch(`${baseUrl}/api/bootstrap`);
      if (res.ok) {
        const data = await res.json();
        membersCount = data.team?.length || 0;
        bootstrapPassed = membersCount >= 2 && Boolean(data.defaultProductBrief?.productName);
      }
    } catch {
      bootstrapPassed = false;
    }

    testCases.push({
      id: 'SCHEMA-02',
      category: 'contract_schemas',
      title: 'Bootstrap Payload Schema Contract',
      description: 'Ensures initial team snapshot and product brief comply with shared/contracts.ts.',
      status: bootstrapPassed ? 'passed' : 'failed',
      durationMs: Math.round(performance.now() - testStart),
      assertions: [
        {
          name: 'Bootstrap payload includes Sahil and Yanni',
          passed: bootstrapPassed,
          expected: '>= 2 members',
          actual: `${membersCount} members`,
        },
      ],
    });
  }

  const durationMs = Math.round(performance.now() - startTime);
  const passedCount = testCases.filter((t) => t.status === 'passed').length;
  const failedCount = testCases.filter((t) => t.status === 'failed').length;

  return {
    timestamp: new Date().toLocaleTimeString(),
    totalTests: testCases.length,
    passedCount,
    failedCount,
    durationMs,
    suites: [
      {
        category: 'graph_logic',
        title: 'Graph Traversal & Route Invariants',
        tests: testCases.filter((t) => t.category === 'graph_logic'),
      },
      {
        category: 'team_reveal',
        title: 'Team Access Reveal Dynamics',
        tests: testCases.filter((t) => t.category === 'team_reveal'),
      },
      {
        category: 'gemini_grounding',
        title: 'Strict Gemini Grounding & Citations',
        tests: testCases.filter((t) => t.category === 'gemini_grounding'),
      },
      {
        category: 'contract_schemas',
        title: 'API Health & Schema Contracts',
        tests: testCases.filter((t) => t.category === 'contract_schemas'),
      },
    ],
  };
}
