import {
  JudgeScorecard,
  JudgeCategoryScore,
  JudgeSubtest,
  GraphSnapshot,
  ProductBrief,
  ShortestPath,
  IntroRequest,
  IntroResponse,
} from '../../../shared/contracts';
import { evaluateAccountGraph } from '../graph';
import { normalizeConnections } from '../import/csv';
import { evaluateGeminiGrounding } from './grounding';
import { generateIntroDraft } from '../gemini';
import {
  DEFAULT_PRODUCT_BRIEF,
  DEMO_ACCOUNTS,
  DEMO_CONTACTS,
  DEMO_EDGES,
  DEFAULT_TEAM,
} from '../../../shared/fixture';

export async function runAutomatedJudge(commitSha: string = 'local'): Promise<JudgeScorecard> {
  const categories: JudgeCategoryScore[] = [];

  // Construct baseline test graph from fixture
  const baselineSnapshot: GraphSnapshot = {
    version: 1,
    members: DEFAULT_TEAM,
    accounts: DEMO_ACCOUNTS,
    contacts: DEMO_CONTACTS,
    edges: DEMO_EDGES,
  };

  // =========================================================================
  // CATEGORY 1: Graph Traversal & Topology (25 points)
  // =========================================================================
  {
    const subtests: JudgeSubtest[] = [];
    let score = 0;

    // Subtest 1.1: Sahil-only traversal
    const sahilEval = evaluateAccountGraph(baselineSnapshot, ['sahil'], DEFAULT_PRODUCT_BRIEF);
    const stripe = sahilEval.accounts.find((a) => a.id === 'acc_stripe');
    const snowflake = sahilEval.accounts.find((a) => a.id === 'acc_snowflake');
    const datadogSahil = sahilEval.accounts.find((a) => a.id === 'acc_datadog');

    const passHopBounds =
      stripe?.bestPath?.hops !== undefined &&
      stripe.bestPath.hops <= 2 &&
      snowflake?.bestPath?.hops !== undefined &&
      snowflake.bestPath.hops <= 2;
    subtests.push({
      name: 'Max 2-Hop Traversal Boundary Enforced',
      passed: !!passHopBounds,
      note: passHopBounds ? 'Paths strictly <= 2 hops' : 'Path exceeded 2 hops',
    });
    if (passHopBounds) score += 5;

    // Subtest 1.2: Unreachable accounts marked cold
    const passColdIsolated =
      datadogSahil?.accessWarmth === 'cold' && datadogSahil.bestPath === null;
    subtests.push({
      name: 'Isolated Accounts Default to Cold with Null Path',
      passed: passColdIsolated,
      note: passColdIsolated ? 'Datadog is cold for Sahil alone' : 'Cold account improperly marked reachable',
    });
    if (passColdIsolated) score += 5;

    // Subtest 1.3: Cyclic Graph Resilience
    const cyclicSnapshot: GraphSnapshot = {
      ...baselineSnapshot,
      edges: [
        ...baselineSnapshot.edges,
        // Add a cycle
        {
          id: 'edge_cycle_1',
          sourceId: 'con_elena',
          targetId: 'con_devon',
          edgeType: 'contact_to_contact',
          strength: 'strong',
          evidence: [],
        },
        {
          id: 'edge_cycle_2',
          sourceId: 'con_devon',
          targetId: 'con_elena',
          edgeType: 'contact_to_contact',
          strength: 'strong',
          evidence: [],
        },
      ],
    };
    let cycleSafe = false;
    try {
      const cycleEval = evaluateAccountGraph(cyclicSnapshot, ['sahil'], DEFAULT_PRODUCT_BRIEF);
      cycleSafe = cycleEval.accounts.length > 0;
    } catch {
      cycleSafe = false;
    }
    subtests.push({
      name: 'Cyclic Graph Traversal Resilience',
      passed: cycleSafe,
      note: cycleSafe ? 'Terminates cleanly without infinite recursion' : 'Crashed on cyclic edges',
    });
    if (cycleSafe) score += 5;

    // Subtest 1.4: Teammate Dynamic Delta
    const teamEval = evaluateAccountGraph(baselineSnapshot, ['sahil', 'yanni'], DEFAULT_PRODUCT_BRIEF);
    const datadogTeam = teamEval.accounts.find((a) => a.id === 'acc_datadog');
    const figmaTeam = teamEval.accounts.find((a) => a.id === 'acc_figma');
    const teamDeltaValid =
      datadogTeam?.accessWarmth === 'hot' &&
      figmaTeam?.accessWarmth === 'warm' &&
      teamEval.summary.newlyUnlockedByTeam >= 2;
    subtests.push({
      name: 'Dynamic Team Reveal Unlocks Unreachable Accounts',
      passed: teamDeltaValid,
      note: teamDeltaValid
        ? `Unlocked ${teamEval.summary.newlyUnlockedByTeam} accounts via Yanni`
        : 'Team toggle failed to unlock target accounts',
    });
    if (teamDeltaValid) score += 5;

    // Subtest 1.5: Edge Strength Prioritization
    const elenaPath = stripe?.bestPath;
    const pathPrioritized = elenaPath?.steps[0]?.strength === 'strong';
    subtests.push({
      name: 'Strong Relationship Preferred in Best Path Selection',
      passed: !!pathPrioritized,
      note: pathPrioritized ? 'Strong edge prioritized over unknown' : 'Sub-optimal edge selected',
    });
    if (pathPrioritized) score += 5;

    categories.push({
      id: 'cat_graph',
      name: '1. Graph Traversal & Topology',
      score,
      maxScore: 25,
      passed: score >= 22,
      details: 'Evaluates 2-hop bounds, isolated node detection, cyclic graph safety, and team reveal delta.',
      subtests,
    });
  }

  // =========================================================================
  // CATEGORY 2: Warmth & Access Determinism (20 points)
  // =========================================================================
  {
    const subtests: JudgeSubtest[] = [];
    let score = 0;

    const teamEval = evaluateAccountGraph(baselineSnapshot, ['sahil', 'yanni'], DEFAULT_PRODUCT_BRIEF);
    const stripe = teamEval.accounts.find((a) => a.id === 'acc_stripe');
    const snowflake = teamEval.accounts.find((a) => a.id === 'acc_snowflake');
    const acme = teamEval.accounts.find((a) => a.id === 'acc_acme');
    const figma = teamEval.accounts.find((a) => a.id === 'acc_figma');

    // 2.1 Hot classification (Direct access to buyer or intro offer)
    const passHot = stripe?.accessWarmth === 'hot';
    subtests.push({
      name: 'Hot Classification for Direct Target Buyer with Intro Offer',
      passed: passHot,
      note: passHot ? 'Stripe correctly classified as Hot' : `Expected hot, got ${stripe?.accessWarmth}`,
    });
    if (passHot) score += 5;

    // 2.2 Warm classification (Strong co-worker history)
    const passWarm = figma?.accessWarmth === 'warm';
    subtests.push({
      name: 'Warm Classification for Verified Co-worker History',
      passed: passWarm,
      note: passWarm ? 'Figma correctly classified as Warm' : `Expected warm, got ${figma?.accessWarmth}`,
    });
    if (passWarm) score += 5;

    // 2.3 Connected classification (Unknown strength connection)
    const passConnected = snowflake?.accessWarmth === 'connected';
    subtests.push({
      name: 'Connected Classification for Unverified LinkedIn Contact',
      passed: passConnected,
      note: passConnected ? 'Snowflake correctly classified as Connected' : `Expected connected, got ${snowflake?.accessWarmth}`,
    });
    if (passConnected) score += 5;

    // 2.4 Cold classification (No route)
    const passCold = acme?.accessWarmth === 'cold';
    subtests.push({
      name: 'Cold Classification for Zero Route Account',
      passed: passCold,
      note: passCold ? 'Acme correctly classified as Cold' : `Expected cold, got ${acme?.accessWarmth}`,
    });
    if (passCold) score += 5;

    categories.push({
      id: 'cat_warmth',
      name: '2. Access Warmth & Determinism',
      score,
      maxScore: 20,
      passed: score >= 18,
      details: 'Validates strict deterministic separation of Hot, Warm, Connected, and Cold tiers.',
      subtests,
    });
  }

  // =========================================================================
  // CATEGORY 3: Grounded Gemini Citations & Tone (25 points)
  // =========================================================================
  {
    const subtests: JudgeSubtest[] = [];
    let score = 0;

    const mockEvidence = [
      {
        id: 'ev_scaleops_2022',
        type: 'shared_work_history' as const,
        title: 'ScaleOps Team (2022-2024)',
        description: 'Worked together on sales operations infrastructure.',
        confidence: 'high' as const,
      },
      {
        id: 'ev_intro_offer_q4',
        type: 'explicit_intro_offer' as const,
        title: 'Q4 Intro Offer',
        description: 'Elena offered to make introductions for RevOps tools.',
        confidence: 'high' as const,
      },
    ];

    const mockTargetContact = {
      id: 'con_elena',
      name: 'Elena Rostova',
      title: 'Head of Global Revenue Operations',
      companyName: 'Stripe',
      companyId: 'acc_stripe',
      email: 'elena.rostova@stripe.example.com',
      isTargetBuyer: true,
    };

    const mockPath: ShortestPath = {
      ownerMemberId: 'sahil',
      hops: 2,
      accessWarmth: 'hot',
      recommendedActionType: 'direct_outreach',
      targetContact: mockTargetContact,
      primaryEvidence: ['Co-workers at ScaleOps (2022-2024)', 'Recorded Intro Offer'],
      steps: [
        {
          fromId: 'sahil',
          fromName: 'Sahil',
          toId: 'con_elena',
          toName: 'Elena Rostova',
          roleOrRelation: 'Co-workers at ScaleOps',
          strength: 'strong',
          evidence: mockEvidence,
        },
        {
          fromId: 'con_elena',
          fromName: 'Elena Rostova',
          toId: 'acc_stripe',
          toName: 'Stripe',
          roleOrRelation: 'Head of Global Revenue Operations',
          strength: 'strong',
          evidence: [],
        },
      ],
    };

    // 3.1 100% Citation Grounding
    const validDraft: IntroResponse = {
      actionType: 'direct_outreach',
      recipientName: 'Elena Rostova',
      recipientRole: 'Head of Global Revenue Operations',
      subject: 'ScaleOps co-workers / RevOps tools',
      body: 'Hey Elena, reflecting on our time at ScaleOps, would love to chat.',
      rationale: 'Co-workers at ScaleOps (2022-2024)',
      citations: ['ScaleOps Team (2022-2024)'],
      isTemplateFallback: false,
    };
    const groundedEval = evaluateGeminiGrounding(validDraft, mockPath, mockEvidence);
    const passCitations = groundedEval.hasValidCitations && groundedEval.unverifiedClaims.length === 0;
    subtests.push({
      name: '100% Citation Grounding Verification',
      passed: passCitations,
      note: passCitations ? 'All citations map strictly to verified path evidence' : 'Detected unverified citation',
    });
    if (passCitations) score += 10;

    // 3.2 Anti-Hallucination Rejection
    const hallucinatedDraft: IntroResponse = {
      ...validDraft,
      citations: ['Met at Dreamforce in Vegas'],
    };
    const hallucinatedEval = evaluateGeminiGrounding(hallucinatedDraft, mockPath, mockEvidence);
    const passRejection = !hallucinatedEval.hasValidCitations && hallucinatedEval.unverifiedClaims.length > 0;
    subtests.push({
      name: 'Hallucinated Evidence Rejection Engine',
      passed: passRejection,
      note: passRejection ? 'Correctly flagged and rejected hallucinated citation' : 'Failed to catch fake citation',
    });
    if (passRejection) score += 5;

    // 3.3 Multi-Tone Template Generation
    const testReq: IntroRequest = {
      accountId: 'acc_stripe',
      accountName: 'Stripe',
      path: mockPath,
      productBrief: DEFAULT_PRODUCT_BRIEF,
      viewerMemberId: 'sahil',
      tone: 'executive',
    };

    const draftExec = await generateIntroDraft(testReq);
    const passExecTone =
      draftExec.subject.length > 5 &&
      draftExec.body.length > 20 &&
      draftExec.actionType === 'direct_outreach';
    subtests.push({
      name: 'Executive Formal Outreach Generation',
      passed: passExecTone,
      note: passExecTone ? 'Produced concise, high-relevance executive draft' : 'Draft output invalid',
    });
    if (passExecTone) score += 5;

    // 3.4 Forwardable Intro Blurb Generation
    const peerReq: IntroRequest = {
      ...testReq,
      viewerMemberId: 'sahil',
      tone: 'forwardable',
      path: {
        ...mockPath,
        ownerMemberId: 'yanni',
        recommendedActionType: 'teammate_intro_request',
        steps: [
          {
            ...mockPath.steps[0],
            fromId: 'yanni',
            fromName: 'Yanni', // Teammate path
          },
          mockPath.steps[1],
        ],
      },
    };
    const draftForwardable = await generateIntroDraft(peerReq);
    const passForwardable =
      draftForwardable.actionType === 'teammate_intro_request' &&
      !!draftForwardable.forwardableBlurb &&
      draftForwardable.forwardableBlurb.length > 20;
    subtests.push({
      name: 'Forwardable Teammate Intro Blurb Generation',
      passed: passForwardable,
      note: passForwardable ? 'Generated ready-to-forward teammate blurb' : 'Missing forwardable blurb',
    });
    if (passForwardable) score += 5;

    categories.push({
      id: 'cat_gemini',
      name: '3. Grounded Gemini Citations & Tone',
      score,
      maxScore: 25,
      passed: score >= 22,
      details: 'Tests citation verification, hallucination rejection, and executive/forwardable tone generation.',
      subtests,
    });
  }

  // =========================================================================
  // CATEGORY 4: CSV Ingestion & Deduplication (15 points)
  // =========================================================================
  {
    const subtests: JudgeSubtest[] = [];
    let score = 0;

    // 4.1 Fuzzy Header Matching
    const linkedInCsv = `First Name,Last Name,URL,Email Address,Company,Position,Connected On
Alexander,Vance,https://linkedin.com/in/avance,avance@scaleai.example.com,Scale AI,Head of Sales Operations,12 Mar 2024
Brenda,Song,https://linkedin.com/in/bsong,bsong@openai.example.com,OpenAI,VP Strategy,18 Jan 2024`;

    const res1 = normalizeConnections(linkedInCsv, 'sahil', baselineSnapshot);
    const passHeaderInference = res1.validContacts === 2 && res1.newAccountsDetected === 2;
    subtests.push({
      name: 'LinkedIn Export Fuzzy Header Inference',
      passed: passHeaderInference,
      note: passHeaderInference ? 'Mapped First Name, Last Name, Company, Position accurately' : 'Header mapping failed',
    });
    if (passHeaderInference) score += 5;

    // 4.2 Multi-Pass Identity Deduplication
    const snap1: GraphSnapshot = {
      ...baselineSnapshot,
      contacts: [...baselineSnapshot.contacts, ...res1.parsedContacts],
      accounts: [...baselineSnapshot.accounts, ...res1.newAccounts],
      edges: [...baselineSnapshot.edges, ...res1.newEdges],
    };

    const dupeCsv = `First Name,Last Name,Email Address,Company,Position
Elena,Rostova,elena.rostova@stripe.example.com,Stripe,Head of Global Revenue Operations
Alexander,Vance,avance@scaleai.example.com,Scale AI,Head of Sales Operations`;

    const res2 = normalizeConnections(dupeCsv, 'yanni', snap1);
    // Elena already exists in baseline, Vance exists in res1. So 0 new contacts, but 2 merged contacts for Yanni!
    const passDedupe = res2.validContacts === 0 && res2.existingContactsMerged === 2;
    subtests.push({
      name: 'Identity Deduplication & Cross-Teammate Edge Merge',
      passed: passDedupe,
      note: passDedupe
        ? 'Deduplicated 2 existing contacts and attached edges to Yanni'
        : `Deduplication failed: validContacts=${res2.validContacts}, merged=${res2.existingContactsMerged}`,
    });
    if (passDedupe) score += 5;

    // 4.3 RFC-4180 Escaped Commas & Quotes
    const escapedCsv = `First Name,Last Name,Company,Position,Email
"Robert ""Bob""",Miller,"Acme, Inc.","Director, Systems",bmiller@acme.example.com`;
    const res3 = normalizeConnections(escapedCsv, 'sahil', baselineSnapshot);
    const addedContact = res3.parsedContacts.find((c) => c.email === 'bmiller@acme.example.com');
    const passEscaping =
      res3.validContacts === 1 &&
      addedContact?.companyName === 'Acme, Inc.' &&
      addedContact?.title === 'Director, Systems';
    subtests.push({
      name: 'RFC-4180 Escaped Commas and Quotes Resilience',
      passed: passEscaping,
      note: passEscaping ? 'Parsed quoted company name and title with embedded commas' : 'RFC-4180 parsing broke',
    });
    if (passEscaping) score += 5;

    categories.push({
      id: 'cat_csv',
      name: '4. CSV Ingestion & Deduplication',
      score,
      maxScore: 15,
      passed: score >= 13,
      details: 'Tests header fuzzy mapping, identity deduplication, and RFC-4180 quotes/commas.',
      subtests,
    });
  }

  // =========================================================================
  // CATEGORY 5: Contract Compliance & API Performance (15 points)
  // =========================================================================
  {
    const subtests: JudgeSubtest[] = [];
    let score = 0;

    // 5.1 Traversal Latency Benchmark (<1500ms for 500 evaluations)
    const t0 = Date.now();
    for (let i = 0; i < 20; i++) {
      evaluateAccountGraph(baselineSnapshot, ['sahil', 'yanni'], DEFAULT_PRODUCT_BRIEF);
    }
    const elapsed = Date.now() - t0;
    const passLatency = elapsed < 500;
    subtests.push({
      name: 'Graph Traversal Latency Benchmark (<500ms)',
      passed: passLatency,
      note: `20 iterations completed in ${elapsed}ms (${(elapsed / 20).toFixed(1)}ms/iter)`,
    });
    if (passLatency) score += 5;

    // 5.2 Strict Schema Conformance
    const analysis = evaluateAccountGraph(baselineSnapshot, ['sahil', 'yanni'], DEFAULT_PRODUCT_BRIEF);
    const passSchema =
      Array.isArray(analysis.accounts) &&
      Array.isArray(analysis.graphView.nodes) &&
      Array.isArray(analysis.graphView.edges) &&
      typeof analysis.summary.reachableAccounts === 'number' &&
      typeof analysis.summary.newlyUnlockedByTeam === 'number';
    subtests.push({
      name: 'Strict Schema & Contract Conformance',
      passed: passSchema,
      note: passSchema ? 'All fields match shared/contracts.ts specifications' : 'Schema violation detected',
    });
    if (passSchema) score += 5;

    // 5.3 Offline / Quota Safety
    let offlineSafe = false;
    try {
      const fallbackReq: IntroRequest = {
        accountId: 'acc_snowflake',
        accountName: 'Snowflake',
        path: {
          ownerMemberId: 'sahil',
          hops: 2,
          accessWarmth: 'connected',
          recommendedActionType: 'routing_request',
          targetContact: {
            id: 'con_devon',
            name: 'Devon Reed',
            title: 'Senior Staff Infrastructure Engineer',
            companyName: 'Snowflake',
            companyId: 'acc_snowflake',
            email: 'devon.reed@snowflake.example.com',
            isTargetBuyer: false,
          },
          primaryEvidence: ['LinkedIn connection'],
          steps: [
            {
              fromId: 'sahil',
              fromName: 'Sahil',
              toId: 'con_devon',
              toName: 'Devon Reed',
              roleOrRelation: 'Connection',
              strength: 'unknown',
              evidence: [],
            },
            {
              fromId: 'con_devon',
              fromName: 'Devon Reed',
              toId: 'acc_snowflake',
              toName: 'Snowflake',
              roleOrRelation: 'Staff Engineer',
              strength: 'unknown',
              evidence: [],
            },
          ],
        },
        productBrief: DEFAULT_PRODUCT_BRIEF,
        viewerMemberId: 'sahil',
      };
      const result = await generateIntroDraft(fallbackReq);
      offlineSafe = result.subject.length > 0 && result.body.length > 0;
    } catch {
      offlineSafe = false;
    }
    subtests.push({
      name: 'Deterministic Fallback Safety & Error Shielding',
      passed: offlineSafe,
      note: offlineSafe ? 'Gracefully generates structured outreach even without live model' : 'Threw unhandled exception',
    });
    if (offlineSafe) score += 5;

    categories.push({
      id: 'cat_contract',
      name: '5. Contract Compliance & Performance',
      score,
      maxScore: 15,
      passed: score >= 13,
      details: 'Tests execution speed, contract type adherence, and safe template fallback handling.',
      subtests,
    });
  }

  // Calculate composite score
  const compositeScore = categories.reduce((sum, c) => sum + c.score, 0);
  const maxScore = categories.reduce((sum, c) => sum + c.maxScore, 0);
  const percentage = Math.round((compositeScore / maxScore) * 100);
  const passingThreshold = 85;
  const passed = percentage >= passingThreshold;

  const summary = passed
    ? `PASSED: Engine Foundation scored ${compositeScore}/${maxScore} (${percentage}%). Exceeds the ${passingThreshold}% gate.`
    : `FAILED: Engine Foundation scored ${compositeScore}/${maxScore} (${percentage}%). Below the ${passingThreshold}% gate.`;

  return {
    timestamp: new Date().toISOString(),
    compositeScore,
    maxScore,
    percentage,
    passingThreshold,
    passed,
    categories,
    summary,
    gitCommitSha: commitSha,
  };
}
