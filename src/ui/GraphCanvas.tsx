import React, { useMemo } from 'react';
import { GraphViewData, RankedAccount } from '../../shared/contracts';

interface GraphCanvasProps {
  graphView: GraphViewData;
  selectedAccount: RankedAccount | null;
  onSelectAccountById: (accountId: string) => void;
  activeMemberIds: string[];
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graphView,
  selectedAccount,
  onSelectAccountById,
  activeMemberIds,
}) => {
  // Compute clean, structured layout coordinates
  // Left column: Team members
  // Middle column: Contacts
  // Right column: Accounts
  const layout = useMemo(() => {
    const width = 640;
    const height = 480;

    const teamNodes = graphView.nodes.filter((n) => n.type === 'team_member');
    const contactNodes = graphView.nodes.filter((n) => n.type === 'contact');
    const accountNodes = graphView.nodes.filter((n) => n.type === 'account');

    const positions = new Map<string, { x: number; y: number }>();

    // 1. Team column (x = 70)
    teamNodes.forEach((node, i) => {
      const step = height / (teamNodes.length + 1);
      positions.set(node.id, { x: 75, y: step * (i + 1) });
    });

    // 2. Contacts column (x = 300)
    contactNodes.forEach((node, i) => {
      const step = height / (contactNodes.length + 1);
      positions.set(node.id, { x: 300, y: step * (i + 1) });
    });

    // 3. Accounts column (x = 540)
    accountNodes.forEach((node, i) => {
      const step = height / (accountNodes.length + 1);
      positions.set(node.id, { x: 535, y: step * (i + 1) });
    });

    return { width, height, positions };
  }, [graphView]);

  // Identify nodes and edges on the selected account's best path
  const selectedPathNodes = useMemo(() => {
    const set = new Set<string>();
    if (!selectedAccount || !selectedAccount.bestPath) return set;
    set.add(selectedAccount.id);
    set.add(selectedAccount.bestPath.ownerMemberId);
    if (selectedAccount.bestPath.targetContact) {
      set.add(selectedAccount.bestPath.targetContact.id);
    }
    return set;
  }, [selectedAccount]);

  const selectedPathEdges = useMemo(() => {
    const set = new Set<string>();
    if (!selectedAccount || !selectedAccount.bestPath) return set;
    const ownerId = selectedAccount.bestPath.ownerMemberId;
    const contactId = selectedAccount.bestPath.targetContact?.id;
    if (ownerId && contactId) {
      set.add(`${ownerId}->${contactId}`);
      set.add(`${contactId}->${selectedAccount.id}`);
    }
    return set;
  }, [selectedAccount]);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-xl flex flex-col justify-between relative overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[#30363d] pb-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f0883e] animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            2D Team Relationship Graph
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#8b949e]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#da3633]" /> Hot
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#f0883e]" /> Warm
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#d29922]" /> Connected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#30363d]" /> Cold
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full flex-1 flex items-center justify-center min-h-[380px]">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="w-full h-full max-h-[460px] select-none"
        >
          <defs>
            <linearGradient id="edge-hot" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f0883e" />
              <stop offset="100%" stopColor="#da3633" />
            </linearGradient>
            <linearGradient id="edge-warm" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e3b341" />
              <stop offset="100%" stopColor="#f0883e" />
            </linearGradient>
            <filter id="glow-hot" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Edges */}
          {graphView.edges.map((edge) => {
            const src = layout.positions.get(edge.source);
            const tgt = layout.positions.get(edge.target);
            if (!src || !tgt) return null;

            const isSelected = selectedPathEdges.has(`${edge.source}->${edge.target}`);
            const isActive = edge.isActive;

            let strokeColor = '#30363d';
            let strokeWidth = 1.5;
            let opacity = isActive ? 0.6 : 0.15;

            if (isSelected) {
              strokeColor = '#f0883e';
              strokeWidth = 3;
              opacity = 1;
            } else if (isActive) {
              if (edge.warmth === 'warm') strokeColor = '#f0883e';
              else if (edge.warmth === 'hot') strokeColor = '#da3633';
              else strokeColor = '#d29922';
            }

            // Curved cubic bezier
            const dx = tgt.x - src.x;
            const pathD = `M ${src.x} ${src.y} C ${src.x + dx * 0.45} ${src.y}, ${tgt.x - dx * 0.45} ${tgt.y}, ${tgt.x} ${tgt.y}`;

            return (
              <g key={edge.id}>
                {isSelected && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#f0883e"
                    strokeWidth={7}
                    opacity={0.3}
                    filter="url(#glow-hot)"
                  />
                )}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={edge.strength === 'unknown' ? '4,4' : undefined}
                  opacity={opacity}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {graphView.nodes.map((node) => {
            const pos = layout.positions.get(node.id);
            if (!pos) return null;

            const isSelected = selectedPathNodes.has(node.id);
            const isAccount = node.type === 'account';
            const isTeam = node.type === 'team_member';
            const isContact = node.type === 'contact';
            const isActive = node.isActive;

            let nodeColor = '#30363d';
            let nodeBorder = '#484f58';
            let textColor = '#c9d1d9';

            if (isTeam) {
              nodeColor = isActive ? '#21262d' : '#161b22';
              nodeBorder = isActive ? '#58a6ff' : '#30363d';
              textColor = isActive ? '#58a6ff' : '#6e7681';
            } else if (isContact) {
              nodeColor = isActive ? '#1c2128' : '#161b22';
              nodeBorder = isActive ? '#f0883e' : '#30363d';
              textColor = isActive ? '#f0f6fc' : '#6e7681';
            } else if (isAccount) {
              if (node.warmth === 'hot') {
                nodeColor = '#da3633';
                nodeBorder = '#f85149';
                textColor = '#ffffff';
              } else if (node.warmth === 'warm') {
                nodeColor = '#f0883e';
                nodeBorder = '#ffa657';
                textColor = '#ffffff';
              } else if (node.warmth === 'connected') {
                nodeColor = '#d29922';
                nodeBorder = '#e3b341';
                textColor = '#ffffff';
              } else {
                nodeColor = '#21262d';
                nodeBorder = '#30363d';
                textColor = '#6e7681';
              }
            }

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => isAccount && onSelectAccountById(node.id)}
                className={`transition-all duration-300 ${isAccount ? 'cursor-pointer hover:opacity-90' : ''}`}
                opacity={isActive || isTeam ? 1 : 0.35}
              >
                {/* Selected glow */}
                {isSelected && (
                  <circle
                    r={isAccount ? 24 : 20}
                    fill="none"
                    stroke="#f0883e"
                    strokeWidth={4}
                    opacity={0.6}
                    filter="url(#glow-hot)"
                    className="animate-pulse"
                  />
                )}

                {/* Node body */}
                {isAccount ? (
                  <rect
                    x={-45}
                    y={-14}
                    width={90}
                    height={28}
                    rx={6}
                    fill={node.warmth === 'cold' ? '#161b22' : nodeColor}
                    stroke={isSelected ? '#ffffff' : nodeBorder}
                    strokeWidth={isSelected ? 2 : 1.5}
                    className="shadow-md"
                  />
                ) : (
                  <circle
                    r={isTeam ? 18 : 14}
                    fill={nodeColor}
                    stroke={isSelected ? '#ffffff' : nodeBorder}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                )}

                {/* Node Icon / Initial */}
                {isTeam && (
                  <text
                    textAnchor="middle"
                    dy=".35em"
                    fontSize={11}
                    fontWeight="bold"
                    fill={textColor}
                  >
                    {node.label[0]}
                  </text>
                )}

                {/* Label text */}
                <text
                  x={isAccount ? 0 : 0}
                  y={isAccount ? 4 : isTeam ? 28 : 22}
                  textAnchor="middle"
                  fontSize={isAccount ? 11 : 10}
                  fontWeight={isAccount ? 'bold' : 'normal'}
                  fill={isAccount && node.warmth !== 'cold' ? '#ffffff' : textColor}
                  className="pointer-events-none select-none"
                >
                  {node.label}
                </text>

                {/* Sub-label for contacts / members */}
                {!isAccount && node.subLabel && (
                  <text
                    x={0}
                    y={isTeam ? 39 : 32}
                    textAnchor="middle"
                    fontSize={8.5}
                    fill="#8b949e"
                    className="pointer-events-none select-none truncate"
                  >
                    {node.subLabel.slice(0, 18)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer column legend */}
      <div className="grid grid-cols-3 text-center text-[10px] text-[#8b949e] border-t border-[#30363d]/60 pt-2 font-mono uppercase tracking-wider">
        <span>Team Members</span>
        <span>Network Contacts</span>
        <span>Target Accounts</span>
      </div>
    </div>
  );
};
