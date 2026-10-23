import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useDashboardStore } from '../../../stores/useDashboardStore';
import { useTrendsStore } from '../../../stores/useTrendsStore';
import { useStrategyStore } from '../../../stores/useStrategyStore';
import { cleanTrendText, cleanTrendTitle } from '../../../lib/cleanTrendTitle';
import { ALL_CONNECTORS, CONNECTOR_OPTIONS } from '../../../lib/connectors';
import {
  ArrowRight,
  ChevronDown,
  Plus,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import { ConnectorPopover } from '../components/ConnectorPopover';
import { YouTubeConnectModal } from '../components/YouTubeConnectModal';

/** Prompt starters — they only fill the composer, the creator edits before sending. */
const SUGGESTED_PROMPTS = [
  'What should I publish in the next 14 days?',
  'Give me 5 video ideas with hooks and titles for my niche.',
  'Which of my past videos should I make a follow-up to?',
  'Plan a 2-week series on my strongest topic.',
];

function formatCompactNumber(num: number): string {
  if (!Number.isFinite(num) || num <= 0) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { primaryChannel, fetchDashboard } = useDashboardStore();
  const { trends, isLoading: isTrendsLoading, fetchTrends } = useTrendsStore();
  const { activeConnectors, toggleConnector, setConnectors } = useStrategyStore();

  const [prompt, setPrompt] = useState('');
  const [showConnectors, setShowConnectors] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const connectorPanelRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchDashboard();
    fetchTrends();
  }, [fetchDashboard, fetchTrends]);

  useEffect(() => {
    if (!showConnectors) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (connectorPanelRef.current && !connectorPanelRef.current.contains(e.target as Node)) {
        setShowConnectors(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showConnectors]);

  const firstName = useMemo(() => {
    const name = user?.full_name?.trim() || user?.email?.split('@')[0] || '';
    return name ? name.split(' ')[0] : 'creator';
  }, [user?.full_name, user?.email]);

  const channelSummary = useMemo(() => {
    if (!primaryChannel) return null;
    const parts: string[] = [];
    if (primaryChannel.handle) parts.push(`@${primaryChannel.handle.replace(/^@/, '')}`);
    else if (primaryChannel.name) parts.push(primaryChannel.name);
    if (primaryChannel.subscriber_count > 0) {
      parts.push(`${formatCompactNumber(primaryChannel.subscriber_count)} subscribers`);
    }
    if (primaryChannel.video_count > 0) {
      parts.push(`${primaryChannel.video_count} videos`);
    }
    return parts.length ? parts.join(' · ') : primaryChannel.name;
  }, [primaryChannel]);

  const topTrends = useMemo(() => trends.slice(0, 3), [trends]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = prompt.trim();
    // Research always runs with live sources so the brief is evidence based.
    if (activeConnectors.length === 0) setConnectors(ALL_CONNECTORS);
    navigate('/app/strategy', text ? { state: { prompt: text } } : undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const applySuggestion = (text: string) => {
    setPrompt(text);
    textareaRef.current?.focus();
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* ------------------------------------------------------------------
          Main workspace — the research task is the primary content
         ------------------------------------------------------------------ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-3xl"
      >
        <h1 className="font-sora text-[26px] font-extrabold leading-tight tracking-tight text-[#171717] sm:text-[32px]">
          What content to plan today,{' '}
          <span className="text-[#4A2E8F]">{firstName}</span>?
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#625D68] sm:text-sm">
          {primaryChannel ? (
            primaryChannel.is_oauth_connected ? (
              <>
                Live channel sync active for <span className="font-semibold text-[#171717]">{channelSummary}</span>.
                Copilot research is grounded in your real audience metrics and retention data.
              </>
            ) : (
              <>
                Researching with profile DNA for <span className="font-semibold text-[#171717]">{channelSummary}</span> (manual draft).{' '}
                <button
                  type="button"
                  onClick={() => setShowConnectModal(true)}
                  className="cursor-pointer font-semibold text-[#D81B60] underline underline-offset-2 hover:text-[#B4144B]"
                >
                  Connect YouTube OAuth
                </button>{' '}
                to unlock live viewer retention and subscriber baselines.
              </>
            )
          ) : (
            <>
              Ask for ideas, hooks or a content plan and CreatorIQ will bring live evidence.{' '}
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="cursor-pointer font-semibold text-[#4A2E8F] underline underline-offset-2 hover:text-[#331C6B]"
              >
                Connect your channel
              </button>{' '}
              to personalise every answer.
            </>
          )}
        </p>

        {/* Research composer */}
        <form
          ref={connectorPanelRef}
          onSubmit={handleSubmit}
          className="app-field app-field-lg mt-6 p-4 sm:p-5"
        >
          <label htmlFor="dashboard-prompt" className="sr-only">
            Describe what you want to research
          </label>
          <textarea
            id="dashboard-prompt"
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Describe a video idea, a topic, or the outcome you want…"
            className="w-full resize-none border-0 bg-transparent text-[15px] leading-relaxed text-[#171717] placeholder-[#9B94A5] focus:outline-none"
          />

          {/* Active connector micro-pills inside composer */}
          {activeConnectors.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F1ECFF]/80">
              <span className="text-[10px] font-mono text-[#77717F] uppercase tracking-wider mr-1">
                Context:
              </span>
              {activeConnectors.map((cId) => {
                const opt = CONNECTOR_OPTIONS.find((c) => c.id === cId);
                if (!opt) return null;
                const Icon = opt.icon;
                return (
                  <span
                    key={cId}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9CEF5] bg-[#F8F6FF] px-2 py-0.5 text-[11px] font-medium text-[#4A2E8F] transition-all hover:bg-[#F1ECFF]"
                  >
                    <Icon className="h-3 w-3 text-[#7C5CD6]" />
                    <span>{opt.shortLabel}</span>
                    <button
                      type="button"
                      onClick={() => toggleConnector(cId)}
                      className="cursor-pointer rounded p-0.5 text-[#4A2E8F]/70 hover:bg-[#E2D8FB] hover:text-[#4A2E8F]"
                      aria-label={`Remove ${opt.shortLabel} connector`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="relative mt-3 flex flex-wrap items-center gap-2 border-t border-[#EFEBF2] pt-3.5">
            {/* Popover trigger container */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowConnectors((v) => !v)}
                aria-expanded={showConnectors}
                aria-label="Add connectors"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E5E0E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#625D68] transition-colors hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]"
              >
                <Plus className="h-3.5 w-3.5" />
                add connectors
                {activeConnectors.length > 0 && (
                  <span className="rounded-full bg-[#F1ECFF] px-1.5 py-0.5 text-[10px] font-bold text-[#4A2E8F]">
                    {activeConnectors.length}
                  </span>
                )}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showConnectors ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Sleek Floating Popover Flyout */}
              <ConnectorPopover
                isOpen={showConnectors}
                onClose={() => setShowConnectors(false)}
                activeConnectors={activeConnectors}
                onToggle={toggleConnector}
                onSelectAll={() => setConnectors(CONNECTOR_OPTIONS.map((c) => c.id))}
                onClearAll={() => setConnectors([])}
                primaryChannel={primaryChannel}
                onConnectYouTube={() => {
                  setShowConnectors(false);
                  setShowConnectModal(true);
                }}
              />
            </div>

            {/* Connected account chip — real channel state only */}
            {primaryChannel?.is_oauth_connected ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-[#B8EED8] bg-[#E8FBF4] px-3 py-1.5 text-xs font-semibold text-[#0F5C43]"
                title="Live OAuth Synced Channel"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#167A59] animate-pulse" />
                <UserRound className="h-3.5 w-3.5" />
                {primaryChannel.handle
                  ? `@${primaryChannel.handle.replace(/^@/, '')}`
                  : primaryChannel.name}
                <span className="rounded bg-[#D0F5E7] px-1 py-0.2 text-[9.5px] font-mono font-bold text-[#0F5C43]">
                  LIVE SYNC
                </span>
              </span>
            ) : primaryChannel ? (
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E5E0E8] bg-[#FBFAF8] px-3 py-1.5 text-xs font-medium text-[#625D68] transition-all hover:border-[#FF98C1] hover:bg-[#FFF5F8] hover:text-[#171717]"
                title="Channel context is in manual profile mode. Click to connect YouTube OAuth for live data."
              >
                <UserRound className="h-3.5 w-3.5 text-[#77717F] group-hover:text-[#171717]" />
                <span className="font-semibold text-[#171717]">
                  {primaryChannel.handle
                    ? `@${primaryChannel.handle.replace(/^@/, '')}`
                    : primaryChannel.name}
                </span>
                <span className="rounded bg-[#F1ECFF] px-1.5 py-0.5 text-[10px] font-semibold text-[#4A2E8F]">
                  Unsynced
                </span>
                <span className="inline-flex items-center text-[10px] font-bold text-[#D81B60] group-hover:underline">
                  Connect ⚡
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowConnectModal(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E5E0E8] bg-[#FBFAF8] px-3 py-1.5 text-xs font-semibold text-[#625D68] transition-colors hover:border-[#C9BCF0] hover:text-[#171717]"
              >
                <UserRound className="h-3.5 w-3.5" />
                Connect YouTube
              </button>
            )}

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-[11px] text-[#77717F] sm:inline">
                {prompt.trim() ? 'Enter to research' : 'Shift + Enter for a new line'}
              </span>
              <button type="submit" className="app-btn-pink h-9 px-4 text-[13px]">
                Research
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </form>

        {/* Suggested prompts */}
        <div className="mt-6">
          <p className="app-section-label">Try a prompt</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((text, i) => (
              <motion.button
                key={text}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => applySuggestion(text)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E5E0E8] bg-white px-3.5 py-1.5 text-xs font-medium text-[#625D68] shadow-[0_1px_2px_rgba(23,23,23,0.03)] transition-colors hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717]"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#4A2E8F]" />
                {text}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ------------------------------------------------------------------
          Evidence entry point — real opportunities from the personalised feed
         ------------------------------------------------------------------ */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-sora text-base font-bold text-[#171717]">Top predicted opportunities</h2>
            <p className="mt-1 text-xs text-[#625D68]">
              Ranked for your niche from the live feed. Open one to see the evidence.
            </p>
          </div>
          <Link
            to="/app/trends"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A2E8F] transition-colors hover:text-[#171717]"
          >
            View all ideas
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isTrendsLoading && topTrends.length === 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-[#F1EEF5]" />
            ))}
          </div>
        ) : topTrends.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[#E5E0E8] bg-white p-8 text-center">
            <TrendingUp className="mx-auto h-6 w-6 text-[#A79FB0]" />
            <p className="mt-2 text-sm font-semibold text-[#171717]">No opportunities yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#77717F]">
              Your personalised feed is still empty. Finish onboarding or refresh the feed to get
              ranked opportunities for your niche.
            </p>
            <Link
              to="/app/trends"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#4A2E8F] hover:text-[#171717]"
            >
              Go to trends
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {topTrends.map((trend, i) => {
              const score =
                trend.opportunity_score != null ? Math.round(trend.opportunity_score) : null;
              const why = cleanTrendText(trend.why_predicted);
              return (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <Link
                    to={`/app/trends/detail/${trend.id}`}
                    className="group flex h-full flex-col gap-3 rounded-2xl border border-[#E5E0E8] bg-white p-4 transition-all duration-150 hover:border-[#C9BCF0] hover:shadow-[0_12px_28px_rgba(74,46,143,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {trend.niches?.slice(0, 1).map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded-md border border-[#E5E0E8] bg-[#F6F3FF] px-2 py-0.5 text-[10px] font-semibold text-[#4A2E8F]"
                          >
                            {tag}
                          </span>
                        ))}
                        {trend.archetype && (
                          <span className="rounded-md border border-[#E5E0E8] bg-[#FBFAF8] px-2 py-0.5 text-[10px] font-semibold capitalize text-[#625D68]">
                            {trend.archetype}
                          </span>
                        )}
                      </div>
                      {score != null && (
                        <span className="shrink-0 rounded-md border border-[#B8EED8] bg-[#E8FBF4] px-2 py-0.5 text-[10px] font-bold text-[#0F5C43]">
                          {score}/100 fit
                        </span>
                      )}
                    </div>

                    <h3 className="text-[13.5px] font-bold leading-snug text-[#171717] group-hover:text-[#4A2E8F]">
                      {cleanTrendTitle(trend.topic)}
                    </h3>

                    {why && (
                      <p className="line-clamp-3 text-xs leading-relaxed text-[#625D68]">{why}</p>
                    )}

                    <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-bold text-[#4A2E8F]">
                      Inspect evidence
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* YouTube Channel OAuth Connection Dialog */}
      <YouTubeConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        primaryChannel={primaryChannel}
      />
    </div>
  );
};
