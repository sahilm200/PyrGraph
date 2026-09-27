import { GoogleGenAI } from '@google/genai';
import { IntroRequest, IntroResponse } from '../../shared/contracts';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAIClient;
}

export async function generateIntroDraft(req: IntroRequest): Promise<IntroResponse> {
  const { accountName, path, productBrief, viewerMemberId } = req;
  const isOwnerViewer = path.ownerMemberId === viewerMemberId;
  const targetContact = path.targetContact;
  const targetRole = targetContact?.title || 'Team Member';
  const targetName = targetContact?.name || 'Contact';

  // Grounding evidence citations
  const citations = path.primaryEvidence.length > 0 ? path.primaryEvidence : ['Recorded relationship connection'];

  // Check if Gemini is configured
  const ai = getGenAI();

  if (!ai) {
    // Return honest, labeled fallback template
    return generateDeterministicFallback(req, citations);
  }

  try {
    const prompt = `
You are the AI engine for PYRGRAPH, a relationship-first sales intelligence platform.
Draft the most sensible, evidence-grounded next message to unlock an introduction into ${accountName}.

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
   - Recipient is the teammate (Yanni).
   - Write a note asking Yanni if they would be open to introducing us to ${targetName}.
   - Supply a crisp 2-sentence "forwardableBlurb" that Yanni can forward to ${targetName}.
2. IF viewer directly knows the contact AND contact is a target buyer:
   - Action type MUST be "direct_outreach".
   - Address directly to ${targetName}, citing genuine shared history.
3. IF contact is NOT a buyer (e.g., an engineer at the company):
   - Action type MUST be "routing_request".
   - Ask low-pressure question: whether they can direct us to the person managing ${productBrief.targetBuyerRole}.
   - Do NOT invent a fake friendship with executive leadership.
4. Keep tone natural, concise, and professional. No marketing fluff.

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    return {
      actionType: parsed.actionType || path.recommendedActionType,
      recipientName: parsed.recipientName || (isOwnerViewer ? targetName : path.ownerMemberId),
      recipientRole: parsed.recipientRole || (isOwnerViewer ? targetRole : 'Co-Founder'),
      subject: parsed.subject || `Introduction to ${targetName} at ${accountName}`,
      body: parsed.body || '',
      forwardableBlurb: parsed.forwardableBlurb || undefined,
      rationale: parsed.rationale || 'Grounded in verified historical collaboration evidence.',
      citations,
      isTemplateFallback: false,
    };
  } catch (err) {
    console.error('Gemini generation error, using fallback template:', err);
    return generateDeterministicFallback(req, citations);
  }
}

function generateDeterministicFallback(req: IntroRequest, citations: string[]): IntroResponse {
  const { accountName, path, productBrief, viewerMemberId } = req;
  const isOwnerViewer = path.ownerMemberId === viewerMemberId;
  const targetContact = path.targetContact;
  const targetName = targetContact?.name || 'Contact';
  const targetRole = targetContact?.title || 'Team Member';
  const ownerName = path.ownerMemberId === 'yanni' ? 'Yanni' : 'Sahil';

  if (!isOwnerViewer) {
    // Ask teammate
    return {
      actionType: 'teammate_intro_request',
      recipientName: ownerName,
      recipientRole: 'Co-Founder',
      subject: `Quick intro to ${targetName} at ${accountName}?`,
      body: `Hey ${ownerName},\n\nI noticed you have a strong connection with ${targetName} (${targetRole}) at ${accountName}. We're exploring accounts for ${productBrief.productName} and their RevOps profile is a stellar fit.\n\nWould you feel comfortable introducing me or forwarding a blurb to see if they'd be open to a 10-minute chat?\n\nBest,\n${viewerMemberId === 'sahil' ? 'Sahil' : 'Yanni'}`,
      forwardableBlurb: `Hey ${targetName}, our team is building ${productBrief.productName} (${productBrief.oneLiner}). Thought this might align with what you're seeing at ${accountName}—would love to connect you with my co-founder if you're open.`,
      rationale: `Teammate intro request routed through ${ownerName} who holds the direct verified relationship.`,
      citations,
      isTemplateFallback: true,
    };
  }

  if (targetContact?.isTargetBuyer) {
    // Direct outreach to buyer
    return {
      actionType: 'direct_outreach',
      recipientName: targetName,
      recipientRole: targetRole,
      subject: `Reconnecting / ${productBrief.productName} at ${accountName}`,
      body: `Hi ${targetName},\n\nHope all is well! It's been great following the momentum at ${accountName}.\n\nWe're currently building ${productBrief.productName} to ${productBrief.valueProposition.toLowerCase()}.\n\nGiven your focus on ${targetRole}, I'd love to share what we've learned and get your perspective on how you handle this today.\n\nDo you have 15 minutes next Tuesday or Thursday?\n\nBest,\nSahil`,
      rationale: `Direct warm outreach grounded in your prior verified co-working relationship.`,
      citations,
      isTemplateFallback: true,
    };
  }

  // Routing request to non-buyer
  return {
    actionType: 'routing_request',
    recipientName: targetName,
    recipientRole: targetRole,
    subject: `Quick question re: ${accountName} RevOps team`,
    body: `Hi ${targetName},\n\nHope you're doing well! Quick question—our team is building ${productBrief.productName} (${productBrief.oneLiner}).\n\nI know your focus is in ${targetRole}, but do you happen to know who leads revenue operations or sales tools at ${accountName} that might be the right person to speak with?\n\nAppreciate any pointer!\n\nBest,\nSahil`,
    rationale: `Low-pressure routing inquiry because ${targetName} is an engineer, not a RevOps buyer.`,
    citations,
    isTemplateFallback: true,
  };
}
