import React, { useMemo } from 'react';
import { AccessWarmth, GraphViewData, RankedAccount } from '../../shared/contracts';
import { ACCESS_COLOR, ACCESS_LABEL, routeRankColor } from './brand';
import { GitBranch, Info } from 'lucide-react';

interface GraphCanvasProps {
  graphView: GraphViewData;
  rankedAccounts: RankedAccount[];
  selectedAccount: RankedAccount | null;
  highlightedAccountId: string | null;
  onHighlightAccount: (accountId: string | null) => void;
  onSelectAccountById: (accountId: string) => void;
}

const ACCESS_SWATCH: Record<AccessWarmth, string> = ACCESS_COLOR;

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graphView,
  rankedAccounts,
  selectedAccount,
  highlightedAccountId,
  onHighlightAccount,
  onSelectAccountById,
}) => {
  const layout = useMemo(() => {
    const width = 1140;
    const contactNodes = graphView.nodes.filter((node) => node.type === 'contact').sort((a, b) => a.id.localeCompare(b.id));
    const teamNodes = graphView.nodes.filter((node) => node.type === 'team_member');
    const accountNodes = graphView.nodes.filter((node) => node.type === 'account');
    const height = Math.max(620, Math.max(contactNodes.length, accountNodes.length) * 96 + 118);
    const positions = new Map<string, { x: number; y: number }>();
    const spread = (count: number) => count < 2 ? [height / 2] : Array.from({ length: count }, (_, index) => 92 + (height - 184) * index / (count - 1));

    teamNodes.forEach((node, index) => {
      const center = height / 2;
      const offset = (index - (teamNodes.length - 1) / 2) * 132;
      positions.set(node.id, { x: 114, y: center + offset });
    });
    contactNodes.forEach((node, index) => positions.set(node.id, { x: 556, y: spread(contactNodes.length)[index] }));

    const rankIndexById = new Map(rankedAccounts.map((account, index) => [account.id, index]));
    accountNodes
      .sort((a, b) => (rankIndexById.get(a.id) ?? 0) - (rankIndexById.get(b.id) ?? 0))
      .forEach((node, index) => positions.set(node.id, { x: 1030, y: spread(accountNodes.length)[index] }));

    return { width, height, positions };
  }, [graphView, rankedAccounts]);

  const rankedEdges = useMemo(() => {
    const result = new Map<string, { accountId: string; rank: number; color: string }>();
    rankedAccounts.forEach((account, rank) => {
      const color = routeRankColor(rank, rankedAccounts.length);
      account.bestPath?.steps.forEach((step) => {
        const key = `${step.fromId}->${step.toId}`;
        if (!result.has(key)) result.set(key, { accountId: account.id, rank: rank + 1, color });
      });
    });
    return result;
  }, [rankedAccounts]);

  const activeAccount = rankedAccounts.find((account) => account.id === highlightedAccountId) || selectedAccount;
  const activePathEdges = useMemo(() => new Set(activeAccount?.bestPath?.steps.map((step) => `${step.fromId}->${step.toId}`) || []), [activeAccount]);
  const accountById = useMemo(() => new Map(rankedAccounts.map((account) => [account.id, account])), [rankedAccounts]);

  return (
    <section className="graph-panel" aria-labelledby="graph-title">
      <header className="graph-panel__header">
        <div className="graph-panel__title">
          <GitBranch aria-hidden="true" />
          <div>
            <h2 id="graph-title">Team network</h2>
            <p>Hover or focus a ranked route. Select an account to inspect its evidence.</p>
          </div>
        </div>
        <div className="graph-legend" aria-label="Graph legends">
          <span className="legend-item"><i className="legend-dot" style={{ '--legend-color': 'var(--pg-hot)' } as React.CSSProperties} />{ACCESS_LABEL.hot}</span>
          <span className="legend-item"><i className="legend-dot" style={{ '--legend-color': 'var(--pg-warm)' } as React.CSSProperties} />{ACCESS_LABEL.warm}</span>
          <span className="legend-item"><i className="legend-dot" style={{ '--legend-color': 'var(--pg-connected)' } as React.CSSProperties} />{ACCESS_LABEL.connected}</span>
          <span className="legend-item"><i className="legend-dot" style={{ '--legend-color': 'var(--pg-cold)' } as React.CSSProperties} />{ACCESS_LABEL.cold}</span>
          {rankedAccounts.length > 0 && <span className="route-rank-legend" aria-label="Route rank: highest to lowest">
            Route rank <i className="route-rank-legend__bar" /> <span>1 → {rankedAccounts.length}</span>
          </span>}
        </div>
      </header>

      <div className="graph-scroll">
        <svg className="graph-svg" viewBox={`0 0 ${layout.width} ${layout.height}`} style={{ height: layout.height }} role="img" aria-label="Interactive team relationship graph with ranked account routes">
          <defs>
            <pattern id="graph-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#d5aa83" fillOpacity="0.12" />
            </pattern>
            <marker id="route-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#c9b9a7" fillOpacity="0.7" />
            </marker>
          </defs>
          <rect width={layout.width} height={layout.height} fill="url(#graph-grid)" />
          <text className="graph-column-label" x="114" y="42">TEAM</text>
          <text className="graph-column-label" x="556" y="42">PEOPLE</text>
          <text className="graph-column-label" x="1030" y="42">ACCOUNTS · RANKED</text>

          {graphView.edges.map((edge) => {
            const from = layout.positions.get(edge.source);
            const to = layout.positions.get(edge.target);
            if (!from || !to) return null;
            const key = `${edge.source}->${edge.target}`;
            const rank = rankedEdges.get(key);
            const emphasized = activePathEdges.has(key);
            const sourceNode = graphView.nodes.find((node) => node.id === edge.source);
            const targetNode = graphView.nodes.find((node) => node.id === edge.target);
            const sourceRadius = sourceNode?.type === 'team_member' ? 25 : sourceNode?.type === 'account' ? 75 : 18;
            const targetRadius = targetNode?.type === 'account' ? 75 : targetNode?.type === 'team_member' ? 25 : 18;
            const d = `M ${from.x + sourceRadius} ${from.y} C ${from.x + 156} ${from.y}, ${to.x - 156} ${to.y}, ${to.x - targetRadius} ${to.y}`;
            return (
              <g key={edge.id}>
              {emphasized && <path d={d} className="graph-edge-understroke" />}
              <path
                d={d}
                className={`graph-edge${edge.isActive ? ' is-active' : ''}${rank ? ' is-ranked' : ''}${emphasized ? ' is-emphasized' : ''}`}
                stroke={rank ? rank.color : edge.type === 'contact_to_company' ? '#8b8176' : '#73675a'}
                strokeDasharray={edge.type === 'contact_to_company' ? '3 6' : edge.strength === 'unknown' ? '5 6' : undefined}
                markerEnd={edge.type === 'contact_to_company' ? undefined : 'url(#route-arrow)'}
                aria-label={edge.type === 'contact_to_company' ? 'Works at account' : 'Recorded relationship'}
              />
              </g>
            );
          })}

          {graphView.nodes.map((node) => {
            const point = layout.positions.get(node.id);
            if (!point) return null;
            const isAccount = node.type === 'account';
            const account = isAccount ? accountById.get(node.id) : undefined;
            const rank = account ? rankedAccounts.findIndex((item) => item.id === account.id) + 1 : 0;
            const routeColor = account ? routeRankColor(rank - 1, rankedAccounts.length) : 'var(--pg-ember)';
            const isEmphasized = activeAccount?.id === account?.id;
            const accessColor = node.warmth ? ACCESS_SWATCH[node.warmth] : 'var(--pg-cold)';
            const label = node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label;
            const accountName = account ? `${rank}. ${account.name}` : node.label;
            return (
              <g
                key={node.id}
                className={`graph-node${isAccount ? ' graph-node--account' : ''}${node.isActive || node.type === 'team_member' ? ' is-active' : ''}${isEmphasized ? ' is-emphasized' : ''}`}
                transform={`translate(${point.x} ${point.y})`}
                style={{ '--route-color': routeColor, '--node-access-color': accessColor } as React.CSSProperties}
                role={isAccount ? 'button' : undefined}
                tabIndex={isAccount ? 0 : undefined}
                aria-label={isAccount && account ? `${accountName}, ${ACCESS_LABEL[account.accessWarmth]}, fit ${account.fitScore} out of 100. Select to inspect evidence.` : undefined}
                aria-pressed={isAccount ? selectedAccount?.id === node.id : undefined}
                onMouseEnter={() => isAccount && onHighlightAccount(node.id)}
                onMouseLeave={() => isAccount && onHighlightAccount(null)}
                onFocus={() => isAccount && onHighlightAccount(node.id)}
                onBlur={() => isAccount && onHighlightAccount(null)}
                onClick={() => isAccount && onSelectAccountById(node.id)}
                onKeyDown={(event) => {
                  if (isAccount && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onSelectAccountById(node.id);
                  }
                }}
              >
                {isAccount ? (
                  <>
                    <rect className="graph-node__body" x="-75" y="-25" width="150" height="50" rx="8" />
                    <circle className="graph-node__rank" cx="-59" cy="-9" r="12" />
                    <text className="graph-node__rank-text" x="-59" y="-9">{rank}</text>
                    <text className="graph-node__name" y="4">{label}</text>
                    <text className="graph-node__sub" y="19">{ACCESS_LABEL[account?.accessWarmth || 'cold']}</text>
                    <circle className="graph-node__access" cx="62" cy="-14" r="5" fill={accessColor} />
                  </>
                ) : node.type === 'team_member' ? (
                  <>
                    <circle className="graph-node__body graph-node__body--member" r="25" />
                    <text className="graph-node__name" y="4">{node.label.slice(0, 1)}</text>
                    <text className="graph-node__sub" y="43">{label}</text>
                  </>
                ) : (
                  <>
                    <circle className="graph-node__body graph-node__body--person" r="18" />
                    <text className="graph-node__name" y="42">{label}</text>
                    <text className="graph-node__sub" y="56">{(node.subLabel || '').slice(0, 24)}</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <footer className="graph-columns">
        <span>Team members</span><span>Network contacts</span><span>Target accounts</span>
      </footer>
      <div className="graph-note" style={{ padding: '0 16px 13px' }}>
        <Info aria-hidden="true" />
        <span>Solid links show recorded relationships. Dashed links show where a contact works; employment does not imply a personal relationship. Account access badges are engine results. Route colors show rank.</span>
      </div>
    </section>
  );
};
