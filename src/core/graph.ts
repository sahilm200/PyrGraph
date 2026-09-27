import {
  GraphSnapshot,
  CompanyAccount,
  Contact,
  RelationshipEdge,
  ShortestPath,
  PathStep,
  AccessWarmth,
  RankedAccount,
  GraphViewData,
  GraphViewNode,
  GraphViewEdge,
  ProductBrief,
} from '../../shared/contracts';

export function evaluateAccountGraph(
  snapshot: GraphSnapshot,
  activeMemberIds: string[],
  productBrief: ProductBrief,
): {
  accounts: RankedAccount[];
  graphView: GraphViewData;
  summary: {
    totalAccounts: number;
    reachableAccounts: number;
    hotAccounts: number;
    warmAccounts: number;
    connectedAccounts: number;
    coldAccounts: number;
    newlyUnlockedByTeam: number;
  };
} {
  const activeMembersSet = new Set(activeMemberIds);
  const contactsById = new Map<string, Contact>(snapshot.contacts.map((c) => [c.id, c]));
  const membersById = new Map(snapshot.members.map((m) => [m.id, m]));

  // Build adjacency: Member -> Contacts
  // Only consider edges owned by an active team member!
  const memberToContactEdges = snapshot.edges.filter(
    (e) => e.edgeType === 'team_to_contact' && e.ownerMemberId && activeMembersSet.has(e.ownerMemberId),
  );

  // Group contacts by account
  const accountToReachableContacts = new Map<
    string,
    Array<{
      contact: Contact;
      edge: RelationshipEdge;
      memberId: string;
    }>
  >();

  for (const edge of memberToContactEdges) {
    const contact = contactsById.get(edge.targetId);
    if (!contact || !contact.companyId) continue;
    const list = accountToReachableContacts.get(contact.companyId) || [];
    list.push({ contact, edge, memberId: edge.ownerMemberId! });
    accountToReachableContacts.set(contact.companyId, list);
  }

  // Also calculate single-member (Sahil only) baseline to compute newly unlocked count
  const sahilOnlyReachableAccounts = new Set<string>();
  for (const edge of snapshot.edges.filter((e) => e.edgeType === 'team_to_contact' && e.ownerMemberId === 'sahil')) {
    const contact = contactsById.get(edge.targetId);
    if (contact?.companyId) sahilOnlyReachableAccounts.add(contact.companyId);
  }

  const rankedAccounts: RankedAccount[] = snapshot.accounts.map((account) => {
    const reachableEntries = accountToReachableContacts.get(account.id) || [];
    const reachableMembers = Array.from(new Set(reachableEntries.map((r) => r.memberId)));

    if (reachableEntries.length === 0) {
      // COLD account
      return {
        ...account,
        accessWarmth: 'cold',
        bestPath: null,
        buyerRelevanceReason: 'No connection identified in active team networks.',
        targetBuyerIdentified: false,
        reachableViaMembers: [],
      };
    }

    // Rank candidate paths to find the best route
    let bestCandidate: {
      contact: Contact;
      edge: RelationshipEdge;
      memberId: string;
      warmthScore: number;
      warmth: AccessWarmth;
    } | null = null;

    for (const entry of reachableEntries) {
      const { contact, edge } = entry;
      let warmth: AccessWarmth = 'connected';
      let score = 20;

      const hasExplicitOffer = edge.evidence.some((ev) => ev.type === 'explicit_intro_offer');
      const hasRelationshipEvidence = edge.evidence.some(
        (ev) =>
          ev.type === 'shared_work_history' ||
          ev.type === 'prior_meeting' ||
          ev.type === 'self_reported',
      );
      const isStrong = edge.strength === 'strong';

      if (contact.isTargetBuyer && (hasExplicitOffer || (hasRelationshipEvidence && isStrong))) {
        warmth = 'hot';
        score = 95;
      } else if (hasRelationshipEvidence || isStrong) {
        warmth = 'warm';
        score = 75;
      } else if (edge.evidence.some((ev) => ev.confidence === 'medium')) {
        warmth = 'connected';
        score = 45;
      } else {
        warmth = 'connected';
        score = 30;
      }

      // Bonus if directly a buyer role
      if (contact.isTargetBuyer) {
        score += 15;
      }

      if (!bestCandidate || score > bestCandidate.warmthScore) {
        bestCandidate = { ...entry, warmthScore: score, warmth };
      }
    }

    const best = bestCandidate!;
    const ownerMember = membersById.get(best.memberId);
    const ownerName = ownerMember?.name || best.memberId;

    // Action recommendation type
    let recommendedActionType: 'direct_outreach' | 'teammate_intro_request' | 'routing_request' | 'cold_unsupported' =
      'routing_request';

    if (best.memberId === 'yanni') {
      recommendedActionType = 'teammate_intro_request';
    } else if (best.contact.isTargetBuyer) {
      recommendedActionType = 'direct_outreach';
    } else {
      recommendedActionType = 'routing_request';
    }

    const steps: PathStep[] = [
      {
        fromId: best.memberId,
        fromName: ownerName,
        toId: best.contact.id,
        toName: best.contact.name,
        roleOrRelation: `${best.contact.title} (${best.edge.strength})`,
        strength: best.edge.strength,
        evidence: best.edge.evidence,
      },
      {
        fromId: best.contact.id,
        fromName: best.contact.name,
        toId: account.id,
        toName: account.name,
        roleOrRelation: `Employed at ${account.name}`,
        strength: 'strong',
        evidence: [],
      },
    ];

    const shortestPath: ShortestPath = {
      ownerMemberId: best.memberId,
      hops: 1, // 1 social connection hop to employer
      accessWarmth: best.warmth,
      steps,
      primaryEvidence: best.edge.evidence.map((e) => `${e.title}: ${e.description}`),
      recommendedActionType,
      targetContact: best.contact,
    };

    let buyerRelevanceReason = '';
    if (best.contact.isTargetBuyer) {
      buyerRelevanceReason = `${best.contact.name} holds key buyer role "${best.contact.title}".`;
    } else {
      buyerRelevanceReason = `${best.contact.name} (${best.contact.title}) is an entry contact who can route to the RevOps team.`;
    }

    return {
      ...account,
      accessWarmth: best.warmth,
      bestPath: shortestPath,
      buyerRelevanceReason,
      targetBuyerIdentified: Boolean(best.contact.isTargetBuyer),
      reachableViaMembers: reachableMembers,
    };
  });

  // Sort accounts: Hot first, then Warm, Connected, then Cold; secondarily by FitScore
  const warmthWeight: Record<AccessWarmth, number> = {
    hot: 400,
    warm: 300,
    connected: 200,
    cold: 100,
  };

  rankedAccounts.sort((a, b) => {
    const diff = warmthWeight[b.accessWarmth] - warmthWeight[a.accessWarmth];
    if (diff !== 0) return diff;
    return b.fitScore - a.fitScore;
  });

  // Calculate Summary metrics
  const reachableCount = rankedAccounts.filter((a) => a.accessWarmth !== 'cold').length;
  const hotCount = rankedAccounts.filter((a) => a.accessWarmth === 'hot').length;
  const warmCount = rankedAccounts.filter((a) => a.accessWarmth === 'warm').length;
  const connectedCount = rankedAccounts.filter((a) => a.accessWarmth === 'connected').length;
  const coldCount = rankedAccounts.filter((a) => a.accessWarmth === 'cold').length;

  // Newly unlocked when Yanni is toggled in addition to Sahil
  let newlyUnlockedByTeam = 0;
  if (activeMemberIds.includes('yanni')) {
    const currentlyReachable = new Set(
      rankedAccounts.filter((a) => a.accessWarmth !== 'cold').map((a) => a.id),
    );
    for (const id of currentlyReachable) {
      if (!sahilOnlyReachableAccounts.has(id)) {
        newlyUnlockedByTeam++;
      }
    }
  }

  // Construct 2D Graph View
  const graphNodes: GraphViewNode[] = [];
  const graphEdges: GraphViewEdge[] = [];

  // 1. Members
  for (const m of snapshot.members) {
    const isActive = activeMembersSet.has(m.id);
    graphNodes.push({
      id: m.id,
      label: m.name,
      subLabel: m.role,
      type: 'team_member',
      isActive,
      memberOwnerId: m.id,
    });
  }

  // 2. Contacts
  for (const c of snapshot.contacts) {
    const relevantEdge = snapshot.edges.find(
      (e) => e.targetId === c.id && e.edgeType === 'team_to_contact' && activeMembersSet.has(e.ownerMemberId || ''),
    );
    const isActive = Boolean(relevantEdge);

    graphNodes.push({
      id: c.id,
      label: c.name,
      subLabel: c.title,
      type: 'contact',
      isActive,
      memberOwnerId: relevantEdge?.ownerMemberId,
    });
  }

  // 3. Accounts
  for (const acc of rankedAccounts) {
    graphNodes.push({
      id: acc.id,
      label: acc.name,
      subLabel: acc.industry,
      type: 'account',
      warmth: acc.accessWarmth,
      isActive: acc.accessWarmth !== 'cold',
    });
  }

  // Edges
  for (const edge of snapshot.edges) {
    const isOwnerActive = edge.ownerMemberId ? activeMembersSet.has(edge.ownerMemberId) : true;
    let warmth: AccessWarmth = 'connected';
    if (edge.evidence.some((ev) => ev.type === 'explicit_intro_offer' || ev.confidence === 'high')) {
      warmth = 'warm';
    }

    graphEdges.push({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      type: edge.edgeType,
      strength: edge.strength,
      isActive: isOwnerActive,
      warmth,
    });
  }

  return {
    accounts: rankedAccounts,
    graphView: {
      nodes: graphNodes,
      edges: graphEdges,
    },
    summary: {
      totalAccounts: rankedAccounts.length,
      reachableAccounts: reachableCount,
      hotAccounts: hotCount,
      warmAccounts: warmCount,
      connectedAccounts: connectedCount,
      coldAccounts: coldCount,
      newlyUnlockedByTeam,
    },
  };
}
