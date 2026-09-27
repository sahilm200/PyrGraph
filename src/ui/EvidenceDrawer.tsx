import React, { useState, useEffect } from 'react';
import {
  RankedAccount,
  ProductBrief,
  IntroResponse,
  OutreachTone,
} from '../../shared/contracts';
import { pyrgraphApi } from '../client/api';
import { WARMTH_CONFIG } from './AccountCard';
import {
  X,
  Flame,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Building,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  BadgeCheck,
  Briefcase,
  Users,
  Send,
} from 'lucide-react';

interface EvidenceDrawerProps {
  account: RankedAccount | null;
  productBrief: ProductBrief;
  viewerMemberId: string;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  account,
  productBrief,
  viewerMemberId,
  onClose,
}) => {
  const [selectedTone, setSelectedTone] = useState<OutreachTone>('executive');
  const [draft, setDraft] = useState<IntroResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Reset draft when account changes
  useEffect(() => {
    setDraft(null);
    setError(null);
  }, [account?.id]);

  if (!account) return null;

  const warmth = WARMTH_CONFIG[account.accessWarmth];
  const path = account.bestPath;

  const handleGenerateDraft = async (toneToUse: OutreachTone = selectedTone) => {
    if (!path) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await pyrgraphApi.generateIntro({
        accountId: account.id,
        accountName: account.name,
        path,
        productBrief,
        viewerMemberId,
        tone: toneToUse,
      });
      setDraft(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error generating outreach with Gemini');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectTone = (tone: OutreachTone) => {
    setSelectedTone(tone);
    if (draft && path) {
      handleGenerateDraft(tone);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-[#161b22] border-l border-[#30363d] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-5 border-b border-[#30363d] bg-[#0d1117] flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">{account.name}</h2>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${warmth.bg} ${warmth.text} ${warmth.border}`}
            >
              <Flame className="w-3 h-3 fill-current" />
              {warmth.label}
            </span>
          </div>
          <p className="text-xs text-[#8b949e]">
            {account.industry} • <span className="text-white font-mono">{account.domain}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-[#8b949e] hover:text-white p-1.5 rounded-lg hover:bg-[#21262d] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Account Fit Overview */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#58a6ff]" />
              Account Fit Analysis
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {account.fitScore}/100 Fit Score
            </span>
          </div>
          <p className="text-xs text-[#c9d1d9] leading-relaxed">{account.fitReason}</p>
          <div className="text-[11px] text-[#8b949e] pt-1">
            Target Buyer Personas:{' '}
            <span className="text-[#f0883e] font-medium">
              {account.targetBuyerRoles.join(', ')}
            </span>
          </div>
        </div>

        {/* Shortest Route & Grounded Evidence */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#f0883e]" />
            Evidence-Backed Shortest Path
          </h3>

          {path ? (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-4">
              {/* Path Steps */}
              <div className="space-y-3">
                {path.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-5 h-5 rounded-full bg-[#21262d] border border-[#30363d] text-white text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5 font-medium text-white">
                        <span className="capitalize text-emerald-400">{step.fromName}</span>
                        <ArrowRight className="w-3 h-3 text-[#8b949e]" />
                        <span className="text-[#f0883e]">{step.toName}</span>
                      </div>
                      <p className="text-[11px] text-[#8b949e]">{step.roleOrRelation}</p>

                      {/* Evidence items */}
                      {step.evidence.length > 0 && (
                        <div className="space-y-1 pt-1.5">
                          {step.evidence.map((ev) => (
                            <div
                              key={ev.id}
                              className="p-2 rounded-md bg-[#161b22] border border-[#30363d] text-[11px] space-y-0.5"
                            >
                              <div className="flex items-center justify-between text-white font-medium">
                                <span className="flex items-center gap-1 text-[#f0883e]">
                                  <BadgeCheck className="w-3 h-3 text-emerald-400" />
                                  {ev.title}
                                </span>
                                {ev.date && (
                                  <span className="text-[10px] text-[#8b949e] font-mono">
                                    {ev.date}
                                  </span>
                                )}
                              </div>
                              <p className="text-[#8b949e]">{ev.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action recommendation note */}
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs space-y-1">
                <span className="font-semibold text-white">Recommended Motion:</span>
                <p className="text-[11px] text-[#c9d1d9]">
                  {path.recommendedActionType === 'teammate_intro_request'
                    ? `Route through ${path.ownerMemberId === 'yanni' ? 'Yanni' : 'Sahil'} who holds the personal relationship.`
                    : path.recommendedActionType === 'direct_outreach'
                    ? 'Direct warm outreach to buyer referencing verified past co-working history.'
                    : 'Low-pressure routing inquiry asking the contact to point to the RevOps team.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 text-center text-xs text-[#8b949e] space-y-2">
              <AlertCircle className="w-8 h-8 text-[#6e7681] mx-auto" />
              <p className="text-white font-medium">No verified path to {account.name}</p>
              <p>
                Neither Sahil nor Yanni has a recorded connection into this account. Toggle on team
                members or import connections to reveal new paths.
              </p>
            </div>
          )}
        </div>

        {/* Gemini Intro Generator Section with Multi-Tone Selection */}
        {path && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#f0883e]" />
                Gemini Multi-Tone Outreach
              </h3>

              <button
                onClick={() => handleGenerateDraft(selectedTone)}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-[#f0883e] hover:bg-[#d97706] text-black font-semibold rounded-lg text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {draft ? 'Regenerate' : 'Draft Outreach'}
                  </>
                )}
              </button>
            </div>

            {/* Tone Selector Toolbar */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleSelectTone('executive')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  selectedTone === 'executive'
                    ? 'bg-[#f0883e]/20 border border-[#f0883e] text-white shadow-xs'
                    : 'text-[#8b949e] hover:text-white border border-transparent'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-[#f0883e]" />
                <span>Executive Formal</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTone('casual')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  selectedTone === 'casual'
                    ? 'bg-[#f0883e]/20 border border-[#f0883e] text-white shadow-xs'
                    : 'text-[#8b949e] hover:text-white border border-transparent'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span>Peer Casual</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTone('forwardable')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  selectedTone === 'forwardable'
                    ? 'bg-[#f0883e]/20 border border-[#f0883e] text-white shadow-xs'
                    : 'text-[#8b949e] hover:text-white border border-transparent'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Forwardable Blurb</span>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
                {error}
              </div>
            )}

            {draft && (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-4 shadow-lg animate-in fade-in duration-200">
                {/* Draft Metadata */}
                <div className="flex items-center justify-between border-b border-[#30363d] pb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full capitalize">
                      {draft.actionType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[#8b949e]">
                      To: <strong className="text-white">{draft.recipientName}</strong> (
                      {draft.recipientRole})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#f0883e] font-mono capitalize">
                      {draft.tone || selectedTone}
                    </span>
                    {draft.isTemplateFallback && (
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                        Template Fallback
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject Line */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#8b949e]">
                    <span>Subject:</span>
                    <button
                      onClick={() => copyToClipboard(draft.subject, 'subject')}
                      className="text-xs text-[#58a6ff] hover:text-white flex items-center gap-1"
                    >
                      {copiedKey === 'subject' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-lg text-xs font-medium text-white">
                    {draft.subject}
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#8b949e]">
                    <span>Message Body:</span>
                    <button
                      onClick={() => copyToClipboard(draft.body, 'body')}
                      className="text-xs text-[#58a6ff] hover:text-white flex items-center gap-1"
                    >
                      {copiedKey === 'body' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-[#c9d1d9] whitespace-pre-wrap leading-relaxed font-sans">
                    {draft.body}
                  </div>
                </div>

                {/* Forwardable Blurb if requesting from teammate */}
                {draft.forwardableBlurb && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-[#8b949e]">
                      <span className="text-[#f0883e] font-semibold flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        Forwardable Double-Opt-In Blurb:
                      </span>
                      <button
                        onClick={() => copyToClipboard(draft.forwardableBlurb!, 'blurb')}
                        className="text-xs text-[#58a6ff] hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'blurb' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-2.5 bg-[#161b22] border border-[#f0883e]/30 rounded-lg text-xs text-white italic">
                      &quot;{draft.forwardableBlurb}&quot;
                    </div>
                  </div>
                )}

                {/* Citations Grounding */}
                <div className="text-[10px] text-[#8b949e] border-t border-[#30363d] pt-2 space-y-1">
                  <span className="font-semibold text-[#c9d1d9] block">Evidence Citations:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#8b949e]">
                    {draft.citations.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between">
        <span className="text-xs text-[#8b949e]">
          Target: <strong className="text-white">{account.name}</strong>
        </span>
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg text-xs font-medium border border-[#30363d] transition-colors"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
};
