import React from 'react';
import { ArrowRight, Building2, Flame, HelpCircle, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { RankedAccount } from '../../shared/contracts';
import { ACCESS_COLOR, ACCESS_LABEL } from './brand';


interface AccountCardProps {
  account: RankedAccount;
  isSelected: boolean;
  isHighlighted: boolean;
  rank: number;
  routeColor: string;
  onSelect: (account: RankedAccount) => void;
  onHighlight: (accountId: string | null) => void;
  viewerMemberId: string;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  isSelected,
  isHighlighted,
  rank,
  routeColor,
  onSelect,
  onHighlight,
  viewerMemberId,
}) => {
  const isUnlockedByTeammate = account.reachableViaMembers.includes('yanni') && !account.reachableViaMembers.includes('sahil');
  const pathSummary = account.bestPath?.targetContact
    ? `${account.bestPath.ownerMemberId} → ${account.bestPath.targetContact.name}`
    : 'No supported route in the active network';

  return (
    <button
      type="button"
      className={`account-card${isSelected ? ' is-selected' : ''}${isHighlighted ? ' is-highlighted' : ''}`}
      style={{ '--pg-route-color': routeColor, '--pg-access-color': ACCESS_COLOR[account.accessWarmth] } as React.CSSProperties}
      onClick={() => onSelect(account)}
      onMouseEnter={() => onHighlight(account.id)}
      onMouseLeave={() => onHighlight(null)}
      onFocus={() => onHighlight(account.id)}
      onBlur={() => onHighlight(null)}
      aria-pressed={isSelected}
      aria-label={`Rank ${rank} ${account.name}, ${ACCESS_LABEL[account.accessWarmth]}, fit ${account.fitScore} out of 100. ${pathSummary}. Inspect evidence.`}
    >
      <div className="account-card__top">
        <div className="account-card__identity">
          <span className="account-card__rank" aria-hidden="true">{rank}</span>
          <h3 className="account-card__name">{account.name}</h3>
          <span className="account-card__domain">{account.domain}</span>
          <p className="account-card__industry"><Building2 aria-hidden="true" size={12} /> {account.industry} · {account.employeeCount}</p>
        </div>
        <span className="access-badge" title={ACCESS_LABEL[account.accessWarmth]}>
          <i className="access-badge__dot" aria-hidden="true" />
          {ACCESS_LABEL[account.accessWarmth]}
        </span>
      </div>

      <div className="account-card__details">
        <span className="account-card__fit">Fit <strong>{account.fitScore}/100</strong></span>
        <span className="account-card__path">
          {account.bestPath ? (
            <>
              {isUnlockedByTeammate && <Sparkles aria-hidden="true" size={11} />}
              {account.bestPath.ownerMemberId === viewerMemberId
                ? account.targetBuyerIdentified ? 'Direct buyer route' : 'Routing contact'
                : `Ask ${account.bestPath.ownerMemberId} for an intro`}
            </>
          ) : <><ShieldAlert aria-hidden="true" size={11} /> No verified route</>}
        </span>
      </div>
      <span className="sr-only">
        {account.bestPath ? account.targetBuyerIdentified ? 'Target buyer match' : 'Routing contact, ask for the relevant team' : 'No verified route in current team network'}
        {account.bestPath && (account.bestPath.recommendedActionType === 'teammate_intro_request' ? <ArrowRight /> : account.targetBuyerIdentified ? <UserCheck /> : <HelpCircle />)}
      </span>
    </button>
  );
};
