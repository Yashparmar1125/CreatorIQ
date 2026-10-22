import { Database, Flame, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ConnectorOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Live research sources that the copilot agent can query.
 * The ids map to the backend tool groups (see copilot_agent._TOOL_CONNECTORS),
 * so toggling one here only changes which real sources are used.
 */
export const CONNECTOR_OPTIONS: ConnectorOption[] = [
  {
    id: 'trends',
    label: 'CreatorIQ Concept Radar',
    description: 'Your personalised trend feed and ranking signals.',
    icon: Database,
  },
  {
    id: 'youtube',
    label: 'Live YouTube Outliers',
    description: 'Outlier videos and reach ratios from YouTube.',
    icon: Flame,
  },
  {
    id: 'web',
    label: 'Live Web Search',
    description: 'Current web sources for the topic you research.',
    icon: Globe,
  },
];

export const ALL_CONNECTORS = CONNECTOR_OPTIONS.map((c) => c.id);
