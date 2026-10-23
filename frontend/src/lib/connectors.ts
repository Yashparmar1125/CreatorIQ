import React from 'react';
import { YouTubeLogo, GoogleCalendarLogo, NotionLogo } from '../components/brand/ConnectorIcons';

export interface ConnectorOption {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  category: 'channel' | 'planning' | 'knowledge';
  icon: React.ComponentType<{ className?: string }>;
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
    icon: YouTubeLogo,
    badge: 'OAuth',
  },
  {
    id: 'calendar',
    label: 'Google Calendar',
    shortLabel: 'Calendar',
    description: 'Schedule video release slots, filming days & deadlines',
    category: 'planning',
    icon: GoogleCalendarLogo,
    badge: 'OAuth',
  },
  {
    id: 'vault',
    label: 'Knowledge Vault (Notion / Drive)',
    shortLabel: 'Vault',
    description: 'Past scripts, outlines, voice guidelines & creator notes',
    category: 'knowledge',
    icon: NotionLogo,
    badge: 'Sync',
  },
];

export const ALL_CONNECTORS = CONNECTOR_OPTIONS.map((c) => c.id);
