import { GoogleGenAI } from '@google/genai';
import { IntroRequest, IntroResponse, OutreachTone } from '../../shared/contracts';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAIClient;
}

const draftCache = new Map<string, IntroResponse>();
let quotaCooldownUntil = 0;

export async function generateIntroDraft(req: IntroRequest): Promise<IntroResponse> {
  const { accountName, path, productBrief, viewerMemberId } = req;
  const tone: OutreachTone = req.tone || 'executive';
  const isOwnerViewer = path.ownerMemberId === viewerMemberId;
  const targetContact = path.targetContact;
  const targetRole = targetContact?.title || 'Team Member';
  const targetName = targetContact?.name || 'Contact';

  // Grounding evidence citations
  const citations = path.primaryEvidence.length > 0 ? path.primaryEvidence : ['Recorded relationship connection'];

  // Check cache first
  const cacheKey = `${accountName}_${path.ownerMemberId}_${viewerMemberId}_${tone}_${productBrief.productName}`;
  if (draftCache.has(cacheKey)) {
    return draftCache.get(cacheKey)!;
  }

  // Check if Gemini is configured or currently cooling down from a 429
  const ai = getGenAI();

  if (!ai || Date.now() < quotaCooldownUntil) {
    const fallback = generateDeterministicFallback(req, citations, tone);
    draftCache.set(cacheKey, fallback);
    return fallback;
  }

  try {
    const toneInstructions = {
      executive: `
TONE: EXECUTIVE FORMAL
- Professional, concise (under 75 words), and respectful of senior leadership time.
- Emphasize RevOps operational efficiency, workflow clarity, and low-friction discovery.
- Avoid casual slang or hyperbolic sales claims.
      `,
      casual: `
TONE: PEER CASUAL
- Friendly, warm, collegial, and peer-to-peer.
- Reference shared professional background or mutual ecosystem context.
- Keep the ask lightweight, conversational, and exploratory (10-min virtual coffee).
      `,
      forwardable: `
TONE: FORWARDABLE INTRO BLURB
- Specifically optimized for double-opt-in intro routing.
- Provide a clean, self-contained 2-3 sentence paragraph that the teammate can forward directly via Slack or email without editing.
      `,
    }[tone];

    const prompt = `
You are the AI engine for PYRGRAPH, a relationship-first sales intelligence platform.
Draft the most sensible, evidence-grounded next message to unlock an introduction into ${accountName}.

${toneInstructions}

CONTEXT & EVIDENCE:
- Target Company: ${accountName}
- Target Contact: ${targetName} (${targetRole})
- Is Target Contact a Buyer? ${targetContact?.isTargetBuyer ? 'YES (Relevant Buyer)' : 'NO (Entry Contact / Engineer)'}
- Connection Owner on Team: ${path.ownerMemberId}
- Current User / Viewer: ${viewerMemberId}
- Relationship Access Warmth: ${path.accessWarmth}
- Recorded Evidence:
${citations.map((c) => `  * ${c}`).join('\n')}

PRODUCT INFORMATION:
- Product Name: ${productBrief.productName}
- One-Liner: ${productBrief.oneLiner}
- Target Buyer Persona: ${productBrief.targetBuyerRole}
- Value Proposition: ${productBrief.valueProposition}

OPERATING RULES (CRITICAL):
1. IF the best route belongs to a teammate (e.g. owner is "yanni" and viewer is "sahil"):
   - Action type MUST be "teammate_intro_request".
   - Recipient is the teammate (${path.ownerMemberId === 'yanni' ? 'Yanni' : 'Sahil'}).
   - Write a note asking them if they would be open to introducing us to ${targetName}.
   - Supply a crisp "forwardableBlurb" that they can forward to ${targetName}.
2. IF viewer directly knows the contact AND contact is a target buyer:
   - Action type MUST be "direct_outreach".
   - Address directly to ${targetName}, citing genuine shared history.
3. IF contact is NOT a buyer (e.g., an engineer at the company):
   - Action type MUST be "routing_request".
   - Ask low-pressure question: whether they can direct us to the person managing ${productBrief.targetBuyerRole}.
   - Do NOT invent a fake friendship with executive leadership.
4. Keep all factual references strictly grounded in the recorded evidence above.

Return your response in strict JSON format matching this schema:
{
  "actionType": "teammate_intro_request" | "direct_outreach" | "routing_request",
  "recipientName": "string",
  "recipientRole": "string",
  "subject": "string",
  "body": "string",
  "forwardableBlurb": "string (optional)",
  "rationale": "short explanation of why this path and message were chosen based on evidence"
}
`;

    // Attempt generation with primary model or fallback model
    const callModel = async (modelName: string) => {
      const generatePromise = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: tone === 'casual' ? 0.35 : 0.15,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini call timed out after 3000ms for ${modelName}`)), 3000),
      );

      return Promise.race([generatePromise, timeoutPromise]);
    };

    let response;
    try {
      response = await callModel('gemini-3.8-flash');
    } catch (primaryErr: unknown) {
      const primaryMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      if (primaryMsg.includes('429') || primaryMsg.includes('Quota exceeded') || primaryMsg.includes('RESOURCE_EXHAUSTED')) {
        // Try flash-lite if primary model quota is saturated
        try {
          response = await callModel('gemini-3.1-flash-lite');
        } catch {
          throw primaryErr; // Rethrow to outer handler for cooldown
        }
      } else {
        throw primaryErr;
      }
    }

    const text = response.text || '';
    const parsed = JSON.parse(text);

    const result: IntroResponse = {
      actionType: parsed.actionType || path.recommendedActionType,
      recipientName: parsed.recipientName || (isOwnerViewer ? targetName : path.ownerMemberId),
      recipientRole: parsed.recipientRole || (isOwnerViewer ? targetRole : 'Co-Founder'),
      subject: parsed.subject || `Introduction to ${targetName} at ${accountName}`,
      body: parsed.body || '',
      forwardableBlurb: parsed.forwardableBlurb || undefined,
      rationale: parsed.rationale || 'Grounded in verified historical collaboration evidence.',
      citations,
      isTemplateFallback: false,
      tone,
    };

    draftCache.set(cacheKey, result);
    return result;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const isRateLimit = errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('RESOURCE_EXHAUSTED');
    if (isRateLimit) {
      quotaCooldownUntil = Date.now() + 45000; // 45-second cooldown
      console.warn('[PyrGraph AI Engine] Free tier quota reached; automatically using grounded deterministic fallback.');
    } else {
      console.warn('[PyrGraph AI Engine] Live model generation unavailable, using fallback template:', errMsg);
    }
    const fallback = generateDeterministicFallback(req, citations, tone);
    draftCache.set(cacheKey, fallback);
    return fallback;
  }
}

function generateDeterministicFallback(
  req: IntroRequest,
  citations: string[],
  tone: OutreachTone,
): IntroResponse {
  const { accountName, path, productBrief, viewerMemberId } = req;
  const isOwnerViewer = path.ownerMemberId === viewerMemberId;
  const targetContact = path.targetContact;
  const targetName = targetContact?.name || 'Contact';
  const targetRole = targetContact?.title || 'Team Member';
  const ownerName = path.ownerMemberId === 'yanni' ? 'Yanni' : 'Sahil';
  const senderName = viewerMemberId === 'yanni' ? 'Yanni' : 'Sahil';

  if (!isOwnerViewer) {
    // Teammate intro request
    const blurb = `Hey ${targetName}, our team is building ${productBrief.productName} (${productBrief.oneLiner}). Thought this might align with what you're seeing at ${accountName}—would love to connect you with my co-founder ${senderName} if you're open.`;

    if (tone === 'casual') {
      return {
        actionType: 'teammate_intro_request',
        recipientName: ownerName,
        recipientRole: 'Co-Founder',
        subject: `Quick ping: intro to ${targetName} @ ${accountName}?`,
        body: `Hey ${ownerName},\n\nSaw you're connected with ${targetName} (${targetRole}) over at ${accountName}. We're exploring pilots for ${productBrief.productName} and their team would be an awesome fit.\n\nCould you forward a quick blurb to see if they'd be up for a quick chat?\n\nCheers,\n${senderName}`,
        forwardableBlurb: blurb,
        rationale: `Teammate intro request routed through ${ownerName} with casual peer phrasing.`,
        citations,
        isTemplateFallback: true,
        tone,
      };
    }

    if (tone === 'forwardable') {
      return {
        actionType: 'teammate_intro_request',
        recipientName: ownerName,
        recipientRole: 'Co-Founder',
        subject: `Forwardable intro blurb for ${targetName} (${accountName})`,
        body: `Hey ${ownerName} — whenever you have a second, could you forward the blurb below to ${targetName}? No rush at all.\n\n--- FORWARDABLE BLURB ---\n${blurb}`,
        forwardableBlurb: blurb,
        rationale: `Self-contained forwardable double-opt-in blurb for ${ownerName}.`,
        citations,
        isTemplateFallback: true,
        tone,
      };
    }

    // Default executive formal
    return {
      actionType: 'teammate_intro_request',
      recipientName: ownerName,
      recipientRole: 'Co-Founder',
      subject: `Introduction request: ${targetName} at ${accountName}`,
      body: `Hi ${ownerName},\n\nI noticed you have a direct connection with ${targetName}, ${targetRole} at ${accountName}. Based on our target criteria for ${productBrief.productName}, they are a strong strategic fit.\n\nWould you be open to introducing us, or sharing the brief summary below to confirm if they would be interested in a brief discussion?\n\nBest regards,\n${senderName}`,
      forwardableBlurb: blurb,
      rationale: `Formal executive teammate intro request routed through ${ownerName}.`,
      citations,
      isTemplateFallback: true,
      tone,
    };
  }

  if (targetContact?.isTargetBuyer) {
    // Direct outreach to buyer
    if (tone === 'casual') {
      return {
        actionType: 'direct_outreach',
        recipientName: targetName,
        recipientRole: targetRole,
        subject: `Catching up / ${productBrief.productName}`,
        body: `Hey ${targetName},\n\nHope everything is going great with you! Great to see the continued momentum at ${accountName}.\n\nOur team has been working on ${productBrief.productName} to ${productBrief.valueProposition.toLowerCase()}.\n\nWould love to catch up for 10 minutes sometime next week and get your thoughts on how your team is thinking about this.\n\nBest,\n${senderName}`,
        rationale: `Warm, conversational direct outreach grounded in verified prior relationship.`,
        citations,
        isTemplateFallback: true,
        tone,
      };
    }

    if (tone === 'forwardable') {
      return {
        actionType: 'direct_outreach',
        recipientName: targetName,
        recipientRole: targetRole,
        subject: `${productBrief.productName} <> ${accountName} — quick overview`,
        body: `Hi ${targetName},\n\nReaching out directly as we previously worked together. We are currently rolling out ${productBrief.productName} (${productBrief.oneLiner}) to help teams ${productBrief.valueProposition.toLowerCase()}.\n\nIf this aligns with your current priorities at ${accountName}, happy to send over a 2-page brief or chat briefly.\n\nBest,\n${senderName}`,
        forwardableBlurb: `${senderName}'s team is building ${productBrief.productName} (${productBrief.oneLiner}). Thought you might be interested in exploring.`,
        rationale: `Crisp forwardable summary sent directly to buyer.`,
        citations,
        isTemplateFallback: true,
        tone,
      };
    }

    // Default executive formal
    return {
      actionType: 'direct_outreach',
      recipientName: targetName,
      recipientRole: targetRole,
      subject: `${productBrief.productName} & RevOps priorities at ${accountName}`,
      body: `Dear ${targetName},\n\nI hope this note finds you well. Given our prior collaboration, I wanted to reach out regarding ${productBrief.productName}.\n\nWe specifically designed the platform to ${productBrief.valueProposition.toLowerCase()}. Given your leadership role as ${targetRole}, I would welcome the opportunity to share our findings and understand how ${accountName} approaches this.\n\nWould you have 15 minutes for a brief introductory call next week?\n\nSincerely,\n${senderName}`,
      rationale: `Executive formal direct outreach referencing prior collaboration evidence.`,
      citations,
      isTemplateFallback: true,
      tone,
    };
  }

  // Routing request to non-buyer
  if (tone === 'casual') {
    return {
      actionType: 'routing_request',
      recipientName: targetName,
      recipientRole: targetRole,
      subject: `Quick question re: ${accountName}`,
      body: `Hey ${targetName},\n\nHope you're having a great week! Quick question for you—we're working on ${productBrief.productName} (${productBrief.oneLiner}).\n\nI know you're focused on ${targetRole}, but do you know who on your team handles ${productBrief.targetBuyerRole} tools? Would love a quick pointer if you have a moment!\n\nThanks a ton,\n${senderName}`,
      rationale: `Low-pressure casual routing inquiry asking engineer contact for a pointer.`,
      citations,
      isTemplateFallback: true,
      tone,
    };
  }

  return {
    actionType: 'routing_request',
    recipientName: targetName,
    recipientRole: targetRole,
    subject: `Inquiry regarding ${accountName} RevOps / GTM operations`,
    body: `Hello ${targetName},\n\nI hope you are doing well. Our team is developing ${productBrief.productName} (${productBrief.oneLiner}).\n\nWhile I recognize your focus is within ${targetRole}, could you advise who currently leads ${productBrief.targetBuyerRole} or sales tooling at ${accountName}?\n\nAny guidance or introduction to the appropriate team member would be greatly appreciated.\n\nBest regards,\n${senderName}`,
    rationale: `Formal routing request to non-buyer entry contact.`,
    citations,
    isTemplateFallback: true,
    tone,
  };
}
