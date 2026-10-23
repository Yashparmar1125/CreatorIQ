import { Calendar, FileText, Youtube } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ConnectorOption {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  category: 'channel' | 'planning' | 'knowledge';
  icon: LucideIcon;
  badge?: string;
}

/**
 * External accounts and services that can be connected to empower Copilot reasoning.
 */
export const CONNECTOR_OPTIONS: ConnectorOption[] = [
  {
    id: 'youtube',
    label: 'YouTube Channel',
    shortLabel: 'YouTube',
    description: 'Audience retention, upload metrics & competitor signals',
    category: 'channel',
    icon: Youtube,
    badge: 'OAuth',
  },
  {
    id: 'calendar',
    label: 'Google Calendar',
    shortLabel: 'Calendar',
    description: 'Schedule video release slots, filming days & deadlines',
    category: 'planning',
    icon: Calendar,
    badge: 'OAuth',
  },
  {
    id: 'vault',
    label: 'Knowledge Vault (Notion / Drive)',
    shortLabel: 'Vault',
    description: 'Past scripts, outlines, voice guidelines & creator notes',
    category: 'knowledge',
    icon: FileText,
    badge: 'Sync',
  },
];

export const ALL_CONNECTORS = CONNECTOR_OPTIONS.map((c) => c.id);
