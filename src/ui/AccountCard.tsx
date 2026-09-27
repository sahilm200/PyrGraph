import React from 'react';
import { RankedAccount, AccessWarmth } from '../../shared/contracts';
import { ArrowRight, Flame, ShieldAlert, Sparkles, Building2, UserCheck, HelpCircle } from 'lucide-react';

interface AccountCardProps {
  account: RankedAccount;
  isSelected: boolean;
  onSelect: (account: RankedAccount) => void;
  viewerMemberId: string;
}

export const WARMTH_CONFIG: Record<
  AccessWarmth,
  { label: string; bg: string; text: string; border: string; glow: string; description: string }
> = {
  hot: {
    label: 'Hot Access',
    bg: 'bg-[#da3633]/15',
    text: 'text-[#f85149]',
    border: 'border-[#da3633]/40',
    glow: 'shadow-[0_0_12px_rgba(218,54,51,0.25)]',
    description: 'Direct route to verified target buyer or explicit intro offer.',
  },
  warm: {
    label: 'Warm Access',
    bg: 'bg-[#f0883e]/15',
    text: 'text-[#f0883e]',
    border: 'border-[#f0883e]/40',
    glow: 'shadow-[0_0_12px_rgba(240,136,62,0.2)]',
    description: 'Strong relationship evidence or prior collaboration.',
  },
  connected: {
    label: 'Connected',
    bg: 'bg-[#d29922]/15',
    text: 'text-[#e3b341]',
    border: 'border-[#d29922]/40',
    glow: '',
    description: '1st-degree connection exists; strength or role unverified.',
  },
  cold: {
    label: 'No Known Path',
    bg: 'bg-[#21262d]',
    text: 'text-[#8b949e]',
    border: 'border-[#30363d]',
    glow: '',
    description: 'No route in loaded team networks.',
  },
};

export const AccountCard: React.FC<AccountCardProps> = ({ account, isSelected, onSelect, viewerMemberId }) => {
  const warmth = WARMTH_CONFIG[account.accessWarmth];
  const isUnlockedByTeammate =
    account.reachableViaMembers.includes('yanni') && !account.reachableViaMembers.includes('sahil');

  return (
    <div
      onClick={() => onSelect(account)}
      className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'bg-[#1c2128] border-[#f0883e] shadow-lg ring-1 ring-[#f0883e]/50'
          : 'bg-[#161b22] border-[#30363d] hover:border-[#8b949e]/60 hover:bg-[#1c2128]/80'
      } ${warmth.glow}`}
    >
      {/* Top row */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">{account.name}</h3>
              <span className="text-[11px] font-mono text-[#8b949e]">{account.domain}</span>
            </div>
            <span className="text-xs text-[#8b949e] flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3" />
              {account.industry} • {account.employeeCount}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${warmth.bg} ${warmth.text} ${warmth.border}`}
            >
              <Flame className="w-3 h-3 fill-current" />
              {warmth.label}
            </span>
            <span className="text-[10px] text-[#8b949e] font-mono">
              Fit: <strong className="text-white">{account.fitScore}/100</strong>
            </span>
          </div>
        </div>

        {/* Path Preview or Gap Notice */}
        {account.bestPath ? (
          <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#8b949e] uppercase tracking-wider flex items-center gap-1">
                Shortest Entry Route:
              </span>
              {isUnlockedByTeammate && (
                <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Unlocked by Yanni
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-white font-medium">
              <span className="capitalize text-emerald-400 font-mono">
                {account.bestPath.ownerMemberId}
              </span>
              <ArrowRight className="w-3 h-3 text-[#8b949e]" />
              <span className="text-[#f0883e] font-semibold">
                {account.bestPath.targetContact?.name}
              </span>
              <span className="text-[#8b949e] text-[11px] truncate">
                ({account.bestPath.targetContact?.title})
              </span>
            </div>

            <div className="text-[11px] text-[#8b949e] flex items-center gap-1 pt-0.5">
              {account.targetBuyerIdentified ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Target Buyer Match
                </span>
              ) : (
                <span className="text-[#d29922] flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" />
                  Routing Contact (Ask for RevOps intro)
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d]/50 text-xs text-[#8b949e] italic flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#6e7681]" />
            No verified route in current active network.
          </div>
        )}
      </div>

        {/* Action Callout */}
      <div className="mt-3 pt-2 border-t border-[#30363d]/60 flex items-center justify-between text-xs">
        <span className="text-[11px] text-[#8b949e] line-clamp-1">
          {account.bestPath
            ? account.bestPath.ownerMemberId === viewerMemberId
              ? account.targetBuyerIdentified
                ? 'Ready for direct outreach'
                : 'Routing request ready'
              : 'Ask teammate for warm intro'
            : 'Unreachable'}
        </span>
        <span className="text-[#f0883e] font-medium hover:underline text-[11px] shrink-0">
          Inspect Evidence &rarr;
        </span>
      </div>
    </div>
  );
};
