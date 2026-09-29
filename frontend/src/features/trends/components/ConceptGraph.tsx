import React, { useState } from 'react';
import { cleanTrendTitle } from '../../../lib/cleanTrendTitle';
import {
  Target,
  TrendingUp,
  Users,
  Layers,
  BarChart3,
  DollarSign,
  Info,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ConceptGraphProps {
  trend: {
    topic: string;
    archetype?: string;
    niches?: string[];
    velocity?: string;
    opportunity_score?: number;
    tvs_score?: number;
    volume?: string;
    stability_score?: number;
    vector_similarity?: number;
  };
  className?: string;
}

interface GraphNode {
  id: string;
  label: string;
  category: string;
  value: string;
  status: 'high' | 'medium' | 'optimal';
  x: number;
  y: number;
  icon: React.ElementType;
}

export const ConceptGraph: React.FC<ConceptGraphProps> = ({ trend, className }) => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const conceptTitle = cleanTrendTitle(trend.topic);
  const oppScore = Math.round(trend.opportunity_score ?? trend.tvs_score ?? 78);
  const vectorMatch = (trend as any).vector_similarity
    ? Math.round((trend as any).vector_similarity * 100)
    : 92;

  // Harmoniously positioned nodes around center (cx=450, cy=220 on 900x440 viewBox)
  // Plenty of clearance from all edges and between nodes
  const nodes: GraphNode[] = [
    {
      id: 'velocity',
      label: 'Search Velocity',
      category: 'Momentum',
      value: trend.velocity || '245K/hr',
      status: 'high',
      x: 180,
      y: 95,
      icon: TrendingUp,
    },
    {
      id: 'audience',
      label: 'Audience Retention',
      category: 'Engagement',
      value: '72% at 0:30',
      status: 'optimal',
      x: 720,
      y: 95,
      icon: Users,
    },
    {
      id: 'niche',
      label: 'Category Cluster',
      category: 'Semantic Niche',
      value: trend.niches?.[0] || 'Tech / AI',
      status: 'optimal',
      x: 180,
      y: 335,
      icon: Layers,
    },
    {
      id: 'saturation',
      label: 'Market Density',
      category: 'Competition',
      value: 'Low (Early Window)',
      status: 'medium',
      x: 720,
      y: 335,
      icon: BarChart3,
    },
    {
      id: 'monetization',
      label: 'Monetization Depth',
      category: 'Commercial Fit',
      value: 'High RPM ($14-22)',
      status: 'optimal',
      x: 450,
      y: 365,
      icon: DollarSign,
    },
  ];

  const activeNode = nodes.find((n) => n.id === activeNodeId);

  return (
    <div className={cn('rounded-xl border border-[#242424] bg-[#0c0c0c] overflow-hidden shadow-xl', className)}>
      {/* Topology Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1e1e] bg-[#111111] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-950/60 border border-indigo-700/40 text-indigo-400 shadow-xs">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Concept Topology &amp; Vector Graph
              </span>
              <span className="rounded bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                Qdrant Engine
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Interactive relationship cluster mapping &bull; Click any node to inspect telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer',
              showGrid
                ? 'bg-[#181818] border-[#333333] text-neutral-200'
                : 'bg-transparent border-[#222222] text-neutral-500 hover:text-neutral-300'
            )}
          >
            Grid: {showGrid ? 'ON' : 'OFF'}
          </button>
          <div className="flex items-center gap-2 rounded-md bg-[#141414] border border-[#2a2a2a] px-3 py-1.5 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{vectorMatch}% Vector Fit</span>
          </div>
        </div>
      </div>

      {/* SVG Visualization Canvas */}
      <div className="relative w-full bg-[#080808] select-none">
        <svg
          viewBox="0 0 900 440"
          className="w-full h-auto min-h-[340px] max-h-[460px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="graph-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#161616" strokeWidth="0.75" />
            </pattern>

            {/* Radial glow around center */}
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#4f46e5" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>

            {/* Link Gradients */}
            <linearGradient id="linkGradActive" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#383838" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#222222" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          {showGrid && <rect width="100%" height="100%" fill="url(#graph-grid)" />}

          {/* Ambient center pulse circles */}
          <circle cx="450" cy="220" r="170" fill="url(#centerGlow)" />
          <circle cx="450" cy="220" r="210" fill="none" stroke="#1a1a1a" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="450" cy="220" r="130" fill="none" stroke="#222222" strokeWidth="1" strokeDasharray="3 3" />

          {/* Connecting Links from Center to Nodes */}
          {nodes.map((node) => {
            const isHovered = activeNodeId === node.id;
            return (
              <g key={`link-${node.id}`}>
                <line
                  x1="450"
                  y1="220"
                  x2={node.x}
                  y2={node.y}
                  stroke={isHovered ? 'url(#linkGradActive)' : 'url(#linkGrad)'}
                  strokeWidth={isHovered ? 2.5 : 1.2}
                  strokeDasharray={isHovered ? 'none' : '4 4'}
                  className="transition-all duration-200"
                />
                {/* Mid-point signal pulse indicator */}
                <circle
                  cx={(450 + node.x) / 2}
                  cy={(220 + node.y) / 2}
                  r={isHovered ? 3.5 : 2}
                  fill={isHovered ? '#818cf8' : '#3a3a3a'}
                  className="transition-all duration-200"
                />
              </g>
            );
          })}

          {/* Peripheral Nodes */}
          {nodes.map((node) => {
            const isHovered = activeNodeId === node.id;
            return (
              <g
                key={`node-${node.id}`}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setActiveNodeId(node.id)}
                onClick={() => setActiveNodeId(activeNodeId === node.id ? null : node.id)}
                className="cursor-pointer group"
              >
                {/* Node Outer Halo Glow on Hover */}
                {isHovered && (
                  <circle
                    r="42"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    strokeDasharray="3 3"
                    className="animate-spin-slow"
                  />
                )}

                {/* Node Outer Ring */}
                <circle
                  r={isHovered ? 32 : 25}
                  fill="#141414"
                  stroke={isHovered ? '#818cf8' : '#282828'}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all duration-200"
                />
                {/* Node Inner Ring */}
                <circle
                  r={isHovered ? 26 : 21}
                  fill="#101010"
                  stroke={isHovered ? '#6366f1' : '#1e1e1e'}
                  strokeWidth={1}
                />

                {/* Center Icon */}
                <foreignObject x="-9" y="-9" width="18" height="18" className="pointer-events-none">
                  <div className="flex items-center justify-center w-full h-full">
                    <node.icon
                      className={cn(
                        'h-3.5 w-3.5 transition-colors',
                        isHovered ? 'text-indigo-400' : 'text-neutral-400'
                      )}
                    />
                  </div>
                </foreignObject>

                {/* Node Status Dot */}
                <circle
                  cx="14"
                  cy="-14"
                  r="3.5"
                  fill={node.status === 'high' ? '#f59e0b' : '#10b981'}
                />

                {/* Node Label (Clean, crisp, high-contrast) */}
                <text
                  y="42"
                  textAnchor="middle"
                  fill={isHovered ? '#ffffff' : '#e4e4e7'}
                  fontSize="11"
                  fontWeight="600"
                  className="font-sora tracking-tight transition-colors"
                >
                  {node.label}
                </text>
                {/* Node Metric Value */}
                <text
                  y="56"
                  textAnchor="middle"
                  fill={isHovered ? '#818cf8' : '#a1a1aa'}
                  fontSize="10"
                  fontWeight="500"
                  className="font-mono"
                >
                  {node.value}
                </text>
              </g>
            );
          })}

          {/* Central Target Concept Node */}
          <g transform="translate(450, 220)" className="cursor-pointer">
            {/* Pulsing ring */}
            <circle r="52" fill="#141329" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="4 2" />
            <circle r="44" fill="#100e24" stroke="#6366f1" strokeWidth="2" />
            <circle r="36" fill="#0d0c1e" />

            <text
              y="-10"
              textAnchor="middle"
              fill="#818cf8"
              fontSize="9"
              fontWeight="800"
              className="font-sora uppercase tracking-widest"
            >
              CORE CONCEPT
            </text>
            <text
              y="10"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="14"
              fontWeight="700"
              className="font-sora"
            >
              {oppScore}/100 Fit
            </text>
            <text
              y="24"
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="9"
              fontWeight="500"
              className="font-mono"
            >
              Qdrant Vector
            </text>
          </g>
        </svg>
      </div>

      {/* DEDICATED TELEMETRY FOOTER BAR - Completely Separated, NEVER Covers Any Graph Nodes! */}
      <div className="border-t border-[#1e1e1e] bg-[#0d0d0d] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-950/60 border border-indigo-700/40 text-indigo-400 mt-0.5 sm:mt-0">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {activeNode ? activeNode.label : 'Active Concept Cluster'}
              </span>
              <span className="rounded bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 text-[10px] font-mono text-neutral-400">
                {activeNode ? activeNode.category : 'System Topology'}
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5 leading-snug">
              {activeNode ? (
                <>
                  Signals evaluate <strong className="text-white">{activeNode.value}</strong>. Strong alignment with creator niche vector.
                </>
              ) : (
                <>
                  Target: <strong className="text-white">&ldquo;{conceptTitle}&rdquo;</strong>. Hover or click any node to inspect relationship telemetry.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0 self-end sm:self-auto border-t sm:border-t-0 border-[#1c1c1c] pt-2 sm:pt-0">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Optimal</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Spike Velocity</span>
          </div>
        </div>
      </div>
    </div>
  );
};
