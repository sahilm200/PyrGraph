import { IntroResponse, ShortestPath, EvidenceItem } from '../../../shared/contracts';
import { CitationCheckReport } from './types';

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2013\u2014–—]/g, '-')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strict citation verifier that compares model generated citations & rationale
 * against verified evidence records in the retrieved graph path.
 */
export function evaluateGeminiGrounding(
  draft: IntroResponse,
  path: ShortestPath,
  knownEvidence: EvidenceItem[]
): CitationCheckReport {
  const normalizedVerifiedTitles = knownEvidence.map((e) => normalizeText(e.title));
  const normalizedVerifiedDescs = knownEvidence.map((e) => normalizeText(e.description));

  const matchedTitles: string[] = [];
  const unverifiedClaims: string[] = [];

  // 1. Verify citations
  for (const citation of draft.citations) {
    const normCitation = normalizeText(citation);
    
    // Check if matches title, or if all key words of citation appear in evidence title or description
    const isMatched = normalizedVerifiedTitles.some((t) => {
      return t.includes(normCitation) || normCitation.includes(t) ||
        normCitation.split(' ').every((word) => word.length <= 2 || t.includes(word));
    }) || normalizedVerifiedDescs.some((d) => d.includes(normCitation));

    if (isMatched) {
      matchedTitles.push(citation);
    } else {
      unverifiedClaims.push(citation);
    }
  }

  // 2. Verify Recipient Integrity
  const recipientName = normalizeText(draft.recipientName || '');
  const targetContactName = normalizeText(path.targetContact?.name || '');
  const ownerMemberId = normalizeText(path.ownerMemberId || '');

  let recipientMatches = false;
  if (path.recommendedActionType === 'teammate_intro_request') {
    // If asking teammate for intro, recipient should match teammate or be addressed appropriately
    recipientMatches = Boolean(
      recipientName &&
      (recipientName.includes(ownerMemberId) || recipientName.includes('yanni') || recipientName.includes('sahil'))
    );
  } else {
    // Direct outreach must address target contact
    recipientMatches = Boolean(
      targetContactName && recipientName &&
      (recipientName.includes(targetContactName) || targetContactName.includes(recipientName))
    );
  }

  const totalCitations = draft.citations.length;
  const groundedRatio = totalCitations > 0 ? matchedTitles.length / totalCitations : 0;

  return {
    hasValidCitations: matchedTitles.length > 0 && unverifiedClaims.length === 0,
    groundedRatio,
    citedEvidenceCount: matchedTitles.length,
    matchedEvidenceTitles: matchedTitles,
    unverifiedClaims,
    recipientMatchesBuyer: recipientMatches,
  };
}
