import React, { useState } from 'react';
import { cleanTrendTitle } from '../../../lib/cleanTrendTitle';
import { Target, TrendingUp, Users, Layers, BarChart3, Sparkles, Info } from 'lucide-react';
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
    saturation_index?: number;
    reach_ratio_median?: number;
    interaction_density_median?: number;
    small_channel_count?: number;
    medium_channel_count?: number;
    big_channel_count?: number;
    outlier_streak?: number;
  };
  className?: string;
}

interface GraphNode {
  id: string;
  label: string;
  category: string;
  value: string;
  status: 'high' | 'optimal';
  x: number;
  y: number;
  icon: React.ElementType;
}

/**
 * Light-theme concept topology.
 *
 * Every node value is read from real trend fields. When a signal is not
 * available the node says so instead of showing an invented number.
 */
export const ConceptGraph: React.FC<ConceptGraphProps> = ({ trend, className }) => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const conceptTitle = cleanTrendTitle(trend.topic);
  const oppScore =
    trend.opportunity_score != null
      ? Math.round(trend.opportunity_score)
      : trend.tvs_score != null
        ? Math.round(trend.tvs_score)
        : null;

  const vectorMatch =
    trend.vector_similarity != null && trend.vector_similarity > 0
      ? Math.round(trend.vector_similarity * 100)
      : null;

  const reachRatioStr =
    trend.reach_ratio_median != null && trend.reach_ratio_median > 0
      ? `${Number(trend.reach_ratio_median).toFixed(2)}x reach ratio`
      : trend.interaction_density_median != null && trend.interaction_density_median > 0
        ? `${(Number(trend.interaction_density_median) * 100).toFixed(1)}% interaction`
        : 'Not measured';

  const totalChannels =
    (trend.small_channel_count ?? 0) +
    (trend.medium_channel_count ?? 0) +
    (trend.big_channel_count ?? 0);

  const marketDensityStr =
    totalChannels > 0
      ? `S:${trend.small_channel_count ?? 0} · M:${trend.medium_channel_count ?? 0} · B:${trend.big_channel_count ?? 0}`
      : trend.saturation_index != null && trend.saturation_index > 0
        ? `${Math.round(trend.saturation_index)}/100 saturation`
        : 'Not measured';

  const outlierOrYieldStr =
    trend.outlier_streak && trend.outlier_streak > 0
      ? `${trend.outlier_streak}-day outlier streak`
      : oppScore != null
        ? `${oppScore}/100 fit`
        : 'Not measured';

  const nodes: GraphNode[] = [
    {
      id: 'velocity',
      label: 'Search velocity',
      category: 'Momentum',
      value: trend.velocity || 'Not measured',
      status: 'high',
      x: 180,
      y: 95,
      icon: TrendingUp,
    },
    {
      id: 'audience',
      label: 'Reach & interaction',
      category: 'Signal efficiency',
      value: reachRatioStr,
      status: 'optimal',
      x: 720,
      y: 95,
      icon: Users,
    },
    {
      id: 'niche',
      label: 'Category cluster',
      category: 'Semantic niche',
      value: trend.niches?.slice(0, 2).join(' · ') || 'Not measured',
      status: 'optimal',
      x: 180,
      y: 335,
      icon: Layers,
    },
    {
      id: 'saturation',
      label: 'Channel distribution',
      category: 'Creator tiers (S/M/B)',
      value: marketDensityStr,
      status: 'optimal',
      x: 720,
      y: 335,
      icon: BarChart3,
    },
    {
      id: 'monetization',
      label: 'Outlier & yield',
      category: 'Statistical breakout',
      value: outlierOrYieldStr,
      status: 'optimal',
      x: 450,
      y: 365,
      icon: Sparkles,
    },
  ];

  const activeNode = nodes.find((n) => n.id === activeNodeId);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-[#E5E0E8] bg-white',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFEBF2] bg-[#FBFAF8] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D9CEF5] bg-[#F1ECFF] text-[#4A2E8F]">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Concept topology
              </span>
              <span className="rounded border border-[#E5E0E8] bg-white px-2 py-0.5 font-mono text-[10px] text-[#625D68]">
                Vector space
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#77717F]">
              Relationship map of measured signals · select a node to inspect it
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            aria-pressed={showGrid}
            className={cn(
              'cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
              showGrid
                ? 'border-[#D9CEF5] bg-[#F1ECFF] text-[#4A2E8F]'
                : 'border-[#E5E0E8] bg-white text-[#77717F] hover:text-[#171717]'
            )}
          >
            Grid: {showGrid ? 'on' : 'off'}
          </button>
          {vectorMatch != null && (
            <div className="flex items-center gap-2 rounded-md border border-[#B8EED8] bg-[#E8FBF4] px-3 py-1.5 text-xs font-semibold text-[#0F5C43]">
              <span className="h-2 w-2 rounded-full bg-[#167A59]" />
              <span>{vectorMatch}% vector fit</span>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full select-none bg-[#FBFAF8]">
        <svg
          viewBox="0 0 900 440"
          className="h-auto min-h-[320px] w-full max-h-[460px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Concept topology for ${conceptTitle}`}
        >
          <defs>
            <pattern id="graph-grid-light" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#EFEBF2" strokeWidth="0.75" />
            </pattern>

            <radialGradient id="center-glow-light" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7C5CD6" stopOpacity="0.16" />
              <stop offset="60%" stopColor="#7C5CD6" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#7C5CD6" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="link-active-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C5CD6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E0548A" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="link-light" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C9BCF0" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#E5E0E8" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {showGrid && <rect width="100%" height="100%" fill="url(#graph-grid-light)" />}

          <circle cx="450" cy="220" r="170" fill="url(#center-glow-light)" />
          <circle
            cx="450"
            cy="220"
            r="210"
            fill="none"
            stroke="#E5E0E8"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <circle
            cx="450"
            cy="220"
            r="130"
            fill="none"
            stroke="#EFEBF2"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Links */}
          {nodes.map((node) => {
            const isHovered = activeNodeId === node.id;
            return (
              <g key={`link-${node.id}`}>
                <line
                  x1="450"
                  y1="220"
                  x2={node.x}
                  y2={node.y}
                  stroke={isHovered ? 'url(#link-active-light)' : 'url(#link-light)'}
                  strokeWidth={isHovered ? 2.2 : 1.2}
                  strokeDasharray={isHovered ? undefined : '4 4'}
                />
                <circle
                  cx={(450 + node.x) / 2}
                  cy={(220 + node.y) / 2}
                  r={isHovered ? 3.5 : 2}
                  fill={isHovered ? '#7C5CD6' : '#C9BCF0'}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isHovered = activeNodeId === node.id;
            return (
              <g
                key={`node-${node.id}`}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setActiveNodeId(node.id)}
                onClick={() => setActiveNodeId(activeNodeId === node.id ? null : node.id)}
                className="cursor-pointer"
              >
                {isHovered && (
                  <circle
                    r="42"
                    fill="none"
                    stroke="#7C5CD6"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    strokeDasharray="3 3"
                  />
                )}

                <circle
                  r={isHovered ? 32 : 25}
                  fill="#FFFFFF"
                  stroke={isHovered ? '#7C5CD6' : '#E5E0E8'}
                  strokeWidth={isHovered ? 2 : 1}
                />
                <circle
                  r={isHovered ? 26 : 21}
                  fill={isHovered ? '#F6F3FF' : '#FBFAF8'}
                  stroke={isHovered ? '#C9BCF0' : '#EFEBF2'}
                  strokeWidth={1}
                />

                <foreignObject x="-9" y="-9" width="18" height="18" className="pointer-events-none">
                  <div className="flex h-full w-full items-center justify-center">
                    <node.icon
                      className={cn(
                        'h-3.5 w-3.5 transition-colors',
                        isHovered ? 'text-[#7C5CD6]' : 'text-[#77717F]'
                      )}
                    />
                  </div>
                </foreignObject>

                <circle
                  cx="14"
                  cy="-14"
                  r="3.5"
                  fill={node.status === 'high' ? '#946200' : '#167A59'}
                />

                <text
                  y="42"
                  textAnchor="middle"
                  fill={isHovered ? '#4A2E8F' : '#171717'}
                  fontSize="11"
                  fontWeight="600"
                  className="font-cal-sans tracking-tight"
                >
                  {node.label}
                </text>
                <text
                  y="56"
                  textAnchor="middle"
                  fill={isHovered ? '#7C5CD6' : '#625D68'}
                  fontSize="10"
                  fontWeight="500"
                  className="font-mono"
                >
                  {node.value}
                </text>
              </g>
            );
          })}

          {/* Center */}
          <g transform="translate(450, 220)">
            <circle r="52" fill="#F1ECFF" stroke="#D9CEF5" strokeWidth="1.5" strokeDasharray="4 2" />
            <circle r="44" fill="#FFFFFF" stroke="#7C5CD6" strokeWidth="2" />
            <circle r="36" fill="#FBFAF8" />

            <text
              y="-10"
              textAnchor="middle"
              fill="#4A2E8F"
              fontSize="9"
              fontWeight="800"
              className="font-cal-sans uppercase tracking-widest"
            >
              CORE CONCEPT
            </text>
            <text
              y="10"
              textAnchor="middle"
              fill="#171717"
              fontSize="14"
              fontWeight="700"
              className="font-cal-sans"
            >
              {oppScore != null ? `${oppScore}/100 fit` : 'Fit pending'}
            </text>
            <text
              y="24"
              textAnchor="middle"
              fill="#77717F"
              fontSize="9"
              fontWeight="500"
              className="font-mono"
            >
              niche vector
            </text>
          </g>
        </svg>
      </div>

      {/* Footer */}
      <div className="flex flex-col justify-between gap-3 border-t border-[#EFEBF2] bg-white px-5 py-3.5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#D9CEF5] bg-[#F1ECFF] text-[#4A2E8F] sm:mt-0">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#171717]">
                {activeNode ? activeNode.label : 'Active concept cluster'}
              </span>
              <span className="rounded border border-[#E5E0E8] bg-[#FBFAF8] px-2 py-0.5 font-mono text-[10px] text-[#625D68]">
                {activeNode ? activeNode.category : 'System topology'}
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-snug text-[#625D68]">
              {activeNode ? (
                <>
                  Measured signal: <strong className="text-[#171717]">{activeNode.value}</strong>.
                </>
              ) : (
                <>
                  Target: <strong className="text-[#171717]">&ldquo;{conceptTitle}&rdquo;</strong>. Select
                  a node to inspect its measured value.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 self-end border-t border-[#EFEBF2] pt-2 text-xs sm:self-auto sm:border-t-0 sm:pt-0">
          <div className="flex items-center gap-1.5 text-[#625D68]">
            <span className="h-2 w-2 rounded-full bg-[#167A59]" />
            <span>Measured</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#625D68]">
            <span className="h-2 w-2 rounded-full bg-[#946200]" />
            <span>Momentum</span>
          </div>
        </div>
      </div>
    </div>
  );
};
