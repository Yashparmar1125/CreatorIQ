import React from 'react';
import { YouTubeLogo, GoogleCalendarLogo, GoogleDriveLogo, NotionLogo } from '../components/brand/ConnectorIcons';

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
  },
  {
    id: 'calendar',
    label: 'Google Calendar',
    shortLabel: 'Calendar',
    description: 'Schedule video release slots, filming days & deadlines',
    category: 'planning',
    icon: GoogleCalendarLogo,
  },
  {
    id: 'drive',
    label: 'Google Drive & Docs',
    shortLabel: 'Drive',
    description: 'Read past video scripts & export new strategy docs',
    category: 'knowledge',
    icon: GoogleDriveLogo,
  },
  {
    id: 'notion',
    label: 'Notion Workspace',
    shortLabel: 'Notion',
    description: 'Sync creator notes, outlines & export strategy briefs',
    category: 'knowledge',
    icon: NotionLogo,
  },
];

export const ALL_CONNECTORS = CONNECTOR_OPTIONS.map((c) => c.id);
