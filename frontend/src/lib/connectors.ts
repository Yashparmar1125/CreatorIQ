import { Calendar, FileText, Globe, Youtube } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ConnectorOption {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  category: 'channel' | 'planning' | 'knowledge' | 'web';
  icon: LucideIcon;
  badge?: string;
  requiresAuth?: boolean;
}

/**
 * Real-time copilot connectors that inject evidence, memory, and actions.
 */
export const CONNECTOR_OPTIONS: ConnectorOption[] = [
  {
    id: 'youtube',
    label: 'YouTube Channel Context',
    shortLabel: 'YouTube',
    description: 'Audience retention, upload metrics & competitor signals',
    category: 'channel',
    icon: Youtube,
    badge: 'Core',
    requiresAuth: true,
  },
  {
    id: 'calendar',
    label: 'Google Calendar',
    shortLabel: 'Calendar',
    description: 'Schedule video release slots, filming days & deadlines',
    category: 'planning',
    icon: Calendar,
    badge: 'Workflow',
  },
  {
    id: 'vault',
    label: 'Knowledge Vault (Notion / Drive)',
    shortLabel: 'Vault',
    description: 'Past scripts, outlines, voice guidelines & creator notes',
    category: 'knowledge',
    icon: FileText,
    badge: 'Memory',
  },
  {
    id: 'web',
    label: 'Web & Trend Intelligence',
    shortLabel: 'Web Intel',
    description: 'Live Google Trends, breakout search terms & web signals',
    category: 'web',
    icon: Globe,
    badge: 'Real-Time',
  },
];

export const ALL_CONNECTORS = CONNECTOR_OPTIONS.map((c) => c.id);
