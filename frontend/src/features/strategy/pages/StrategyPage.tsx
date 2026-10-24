import { useDashboardStore } from '../../../stores/useDashboardStore';
import { ConnectorPopover } from '../../dashboard/components/ConnectorPopover';
import { YouTubeConnectModal } from '../../dashboard/components/YouTubeConnectModal';
import { api } from '../../../lib/api';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStrategyStore, type AgentStep, type AgentCard } from '../../../stores/useStrategyStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { TopicStrategyCard, type TopicStrategyItem } from '../components/TopicStrategyCard';
import { ScriptStudioModal } from '../components/ScriptStudioModal';
import { parseStrategyTopics } from '../utils/parseStrategyTopics';
import { ALL_CONNECTORS } from '../../../lib/connectors';
import { BrandLogo } from '../../../components/brand/BrandLogo';
import {
  Plus,
  ArrowRight,
  ArrowDown,
  LayoutGrid,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Trash2,
  AlertCircle,
  RefreshCw,
  Calendar,
  FileText,
  Loader2,
} from 'lucide-react';

/* ── Unified Claude-Style Inline Reasoning Pill ─────────────────────────── */
const ResearchStepsAccordion: React.FC<{ steps: AgentStep[]; isStreaming?: boolean }> = ({
  steps,
  isStreaming,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if ((!steps || steps.length === 0) && !isStreaming) return null;

  const runningStep = steps.find((s) => s.status === 'running');
  const doneCount = steps.filter((s) => s.status === 'done').length;
  const totalMs = steps.reduce((acc, s) => acc + (s.duration_ms || 0), 0);

  // Waiting for first token with no tool steps yet
  if (steps.length === 0 && isStreaming) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E0E8] bg-[#FBFAF8] px-3.5 py-1.5 text-xs text-[#625D68]">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4A2E8F]" />
        <span className="font-medium">Thinking…</span>
      </div>
    );
  }

  const lastStepSummary = steps[steps.length - 1]?.summary || 'Completed tool execution';

  return (
    <div className="my-1.5 inline-block max-w-full rounded-xl border border-[#E5E0E8] bg-[#FBFAF8] text-xs transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#F6F3FF] rounded-xl transition-colors cursor-pointer text-left"
      >
        {runningStep ? (
          <div className="flex items-center gap-2 text-[#171717]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4A2E8F] shrink-0" />
            <span className="font-medium truncate max-w-[280px] sm:max-w-[440px]">
              {runningStep.summary}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#625D68]">
            <Check className="h-3.5 w-3.5 text-[#167A59] shrink-0" />
            <span className="font-medium text-[#171717] truncate max-w-[260px] sm:max-w-[420px]">
              {doneCount === 1 ? lastStepSummary : `Used ${doneCount} tools`}
            </span>
            {totalMs > 0 && (
              <span className="text-[11px] text-[#77717F]">· {totalMs}ms</span>
            )}
          </div>
        )}
        <span className="text-[#77717F] ml-1 shrink-0">
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {isOpen && (
        <div className="px-3.5 pb-2.5 pt-1.5 border-t border-[#EFEBF2] space-y-1.5">
          {steps.map((st, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px] text-[#625D68]">
              <div className="mt-0.5 shrink-0">
                {st.status === 'running' ? (
                  <Loader2 className="h-3 w-3 animate-spin text-[#4A2E8F]" />
                ) : (
                  <Check className="h-3 w-3 text-[#167A59]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-[#171717]">{st.label}</span>
                  {st.duration_ms !== undefined && st.duration_ms > 0 && (
                    <span className="text-[10px] font-mono text-[#77717F]">{st.duration_ms}ms</span>
                  )}
                </div>
                <p className="text-[#625D68] truncate">{st.summary}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Interactive Action Cards (Calendar Bookings, Trends & Outliers) ────── */
const InteractiveCardsList: React.FC<{ cards: AgentCard[] }> = ({ cards }) => {
  const navigate = useNavigate();
  if (!cards || cards.length === 0) return null;

  return (
    <div className="my-2.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((c, i) => {
        if (c.card_type === 'calendar') {
          const ev = c.payload || {};
          const formattedDate = ev.start
            ? new Date(ev.start).toLocaleString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'Scheduled';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="col-span-1 sm:col-span-2 rounded-2xl border border-[#B9EFDD] bg-[#F4FDF9] p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#B9EFDD] text-[#167A59]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#167A59]">
                      Added to Google Calendar
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#171717] truncate mt-0.5">
                    {ev.title || 'YouTube Content Milestone'}
                  </h4>
                  <p className="text-xs text-[#625D68] mt-0.5">{formattedDate}</p>
                </div>
              </div>
              {ev.html_link && (
                <a
                  href={ev.html_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0E8] bg-white px-3.5 py-2 text-xs font-semibold text-[#171717] shadow-2xs transition-colors hover:border-[#C9BCF0] hover:bg-[#F6F3FF]"
                >
                  <span>Open in Calendar</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#4A2E8F]" />
                </a>
              )}
            </motion.div>
          );
        }

        if (c.card_type === 'document') {
          const doc = c.payload || {};
          const sourceLabel = doc.source === 'notion' ? 'Saved to Notion Workspace' : 'Created in Google Docs';
          const btnLabel = doc.source === 'notion' ? 'Open in Notion' : 'Open in Google Docs';
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="col-span-1 sm:col-span-2 rounded-2xl border border-[#D9CEF5] bg-[#F6F3FF] p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#D9CEF5] text-[#4A2E8F]">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A2E8F]">
                    {sourceLabel}
                  </span>
                  <h4 className="text-sm font-bold text-[#171717] truncate mt-0.5">
                    {doc.title || 'Strategy Brief & Script'}
                  </h4>
                </div>
              </div>
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E0E8] bg-white px-3.5 py-2 text-xs font-semibold text-[#171717] shadow-2xs transition-colors hover:border-[#C9BCF0] hover:bg-[#F1ECFF]"
                >
                  <span>{btnLabel}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-[#4A2E8F]" />
                </a>
              )}
            </motion.div>
          );
        }

        if (c.card_type === 'trend') {
          const t = c.payload;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="rounded-2xl border border-[#E5E0E8] bg-white p-4 flex flex-col justify-between space-y-3 hover:border-[#C9C0DA] transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[#F1ECFF] px-2.5 py-0.5 text-[10px] font-semibold text-[#4A2E8F]">
                    Trend Opportunity
                  </span>
                  {t.opportunity_score && (
                    <span className="rounded-full bg-[#E4FBF2] px-2.5 py-0.5 text-[10px] font-bold text-[#167A59]">
                      {Math.round(t.opportunity_score)} / 100
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#171717] line-clamp-1">{t.topic}</h4>
                {t.why_trending && (
                  <p className="text-xs text-[#625D68] line-clamp-2 leading-relaxed">{t.why_trending}</p>
                )}
              </div>
              {t.id && (
                <div className="flex items-center justify-end pt-2 border-t border-[#EFEBF2]">
                  <button
                    type="button"
                    onClick={() => navigate(`/app/trends/detail/${t.id}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#4A2E8F] hover:text-[#171717] cursor-pointer"
                  >
                    <span>Inspect opportunity</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        }

        if (c.card_type === 'video') {
          const v = c.payload;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="rounded-2xl border border-[#E5E0E8] bg-white p-4 flex flex-col justify-between space-y-3 hover:border-[#C9C0DA] transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[#F6F3FF] px-2.5 py-0.5 text-[10px] font-semibold text-[#625D68]">
                    Reference Video
                  </span>
                  {v.reach_multiplier && (
                    <span className="rounded-full bg-[#E4FBF2] px-2.5 py-0.5 text-[10px] font-bold text-[#167A59]">
                      {v.reach_multiplier} reach
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#171717] line-clamp-2">{v.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-[#625D68]">
                  <span>{v.channel}</span>
                  {v.views !== undefined && <span>· {Number(v.views).toLocaleString()} views</span>}
                </div>
              </div>
              {v.url && (
                <div className="flex items-center justify-end pt-2 border-t border-[#EFEBF2]">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#4A2E8F] hover:text-[#171717]"
                  >
                    <span>Watch on YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </motion.div>
          );
        }

        return null;
      })}
    </div>
  );
};

/* ── Editorial Markdown (Claude / ChatGPT Style — Zero Forced Heading Icons) */
const StrategyMessageContent: React.FC<{
  content: string;
  onOpenStudio: (t: TopicStrategyItem) => void;
  onAskCopilot: (prompt: string) => void;
}> = ({ content, onOpenStudio, onAskCopilot }) => {
  const parsed = parseStrategyTopics(content);

  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-lg sm:text-xl font-bold text-[#171717] mt-5 mb-2 font-cal-sans tracking-tight">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-base sm:text-[17px] font-bold text-[#171717] mt-5 mb-2 font-cal-sans tracking-tight">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-[15px] font-bold text-[#171717] mt-4 mb-1.5">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-xs font-bold uppercase tracking-wider text-[#625D68] mt-3 mb-1">
        {children}
      </h4>
    ),
    p: ({ children }: any) => (
      <p className="text-[#1F1C24] leading-[1.72] my-2.5 text-[14.5px] sm:text-[15px]">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="space-y-1.5 my-2.5 pl-5 list-disc text-[#2C2834] marker:text-[#7A6FA3]">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="space-y-2 my-2.5 pl-5 list-decimal text-[#2C2834] marker:text-[#7A6FA3]">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-[14.5px] sm:text-[15px] leading-[1.68]">{children}</li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-3 border-[#4A2E8F] bg-[#F6F3FF] px-4 py-2.5 my-3 rounded-r-xl text-[#1F1C24] text-sm">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="border-t border-[#E5E0E8] my-5" />,
    strong: ({ children }: any) => (
      <strong className="text-[#171717] font-semibold">{children}</strong>
    ),
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-[#4A2E8F] underline decoration-[#C9BCF0] underline-offset-2 hover:text-[#171717]"
      >
        {children}
      </a>
    ),
    pre: ({ children }: any) => (
      <pre className="my-3 w-full overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-[#E5E0E8] bg-[#FBFAF8] p-3.5 text-xs text-[#2C2834]">
        {children}
      </pre>
    ),
    code: ({ className, children }: any) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="break-words rounded-md bg-[#F6F3FF] px-1.5 py-0.5 text-[13px] font-medium text-[#4A2E8F]">
            {children}
          </code>
        );
      }
      return <code className="whitespace-pre-wrap break-words font-mono text-xs">{children}</code>;
    },
    table: ({ children }: any) => (
      <div className="my-4 w-full overflow-x-auto rounded-xl border border-[#E5E0E8] bg-white custom-scrollbar">
        <table className="w-full border-collapse text-left text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-[#FBFAF8] border-b border-[#E5E0E8]">{children}</thead>,
    tbody: ({ children }: any) => <tbody>{children}</tbody>,
    tr: ({ children }: any) => (
      <tr className="border-b border-[#EFEBF2] last:border-b-0">{children}</tr>
    ),
    th: ({ children }: any) => (
      <th className="whitespace-nowrap px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#625D68]">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-3.5 py-2.5 align-top text-[13.5px] leading-relaxed text-[#1F1C24]">
        {children}
      </td>
    ),
  };

  if (!parsed.hasTopics) {
    return (
      <div className="prose max-w-none text-[#171717]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {parsed.introText && (
        <div className="prose max-w-none text-[#171717]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {parsed.introText}
          </ReactMarkdown>
        </div>
      )}

      <div className="space-y-4 my-2 not-prose">
        {parsed.topics.map((t) => (
          <TopicStrategyCard
            key={t.id}
            topic={t}
            onOpenStudio={onOpenStudio}
            onAskCopilot={onAskCopilot}
          />
        ))}
      </div>

      {parsed.outroText && (
        <div className="prose max-w-none text-[#171717]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {parsed.outroText}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

/* ── Smart Contextual Follow-Up Chips (ChatGPT / Claude Continuity) ─────── */
function getFollowUpSuggestions(content: string): string[] {
  const lower = content.toLowerCase();
  if (lower.includes('calendar') || lower.includes('scheduled')) {
    return [
      'Write the 30-second opening hook for this video',
      'Block a 2-hour filming slot the day before',
      'Draft the full 5-minute script outline',
    ];
  }
  if (lower.includes('hook') || lower.includes('0:00')) {
    return [
      'Schedule this video on my Google Calendar',
      'Make the opening 6 seconds more contrarian',
      'Expand this into a full script',
    ];
  }
  return [
    'Write the 30-second opening hook for option 1',
    'Save this strategy brief to Google Docs',
    'Schedule this publish slot on my Google Calendar',
  ];
}

const STARTER_PROMPTS = [
  'What should I publish next based on my channel outliers?',
  'Give me 3 high-conviction video angles for my niche this week',
  'Check my Google Calendar and suggest my best filming & publish slots',
  'Write a 30-second hook for my top dashboard trend',
];

/* ── Main StrategyPage Component ────────────────────────────────────────── */
export const StrategyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const {
    messages,
    isSending,
    isLoadingSessions,
    isLoadingMessages,
    activeConnectors,
    setConnectors,
    sendMessage,
    selectSession,
    deleteSession,
    fetchSessions,
    clearCurrentSession,
    sessions,
    currentSessionId,
    error,
  } = useStrategyStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConnectorsMenu, setShowConnectorsMenu] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const {
    primaryChannel,
    isCalendarConnected,
    isDriveConnected,
    isNotionConnected,
    fetchDashboard,
  } = useDashboardStore();

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const [studioTopic, setStudioTopic] = useState<TopicStrategyItem | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialTriggered = useRef(false);
  const sessionInitTriggered = useRef(false);
  const userScrolledUpRef = useRef(false);
  const prevMsgCountRef = useRef(0);

  const userName = user?.full_name || '';

  const activeSession = sessions.find((s) => s.id === currentSessionId) || null;
  const sessionTitle =
    activeSession?.title && activeSession.title !== 'New Strategy Chat'
      ? activeSession.title
      : 'Copilot';

  const connectedCount =
    (primaryChannel?.is_oauth_connected ? 1 : 0) +
    (isCalendarConnected ? 1 : 0) +
    (isDriveConnected ? 1 : 0) +
    (isNotionConnected ? 1 : 0);

  /** Detect user scroll position so we never hijack their reading position */
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottomBtn(distanceFromBottom > 180);
    if (distanceFromBottom > 140) {
      userScrolledUpRef.current = true;
    } else if (distanceFromBottom < 40) {
      userScrolledUpRef.current = false;
    }
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    userScrolledUpRef.current = false;
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  /**
   * Claude / ChatGPT Scroll Physics:
   * - When a new user turn is added, scroll once so the user's question sits near the top of the viewport,
   *   letting the assistant's streaming response grow naturally downward without yanking the top off-screen.
   */
  useEffect(() => {
    const count = messages.length;
    if (count > prevMsgCountRef.current) {
      prevMsgCountRef.current = count;
      userScrolledUpRef.current = false;
      requestAnimationFrame(() => {
        if (lastUserMsgRef.current) {
          lastUserMsgRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }, [messages.length]);

  const loadHistory = async (): Promise<typeof sessions> => {
    const loaded = await fetchSessions();
    const failure = useStrategyStore.getState().error;
    setHistoryError(failure);
    return loaded;
  };

  useEffect(() => {
    if (sessionInitTriggered.current) return;
    sessionInitTriggered.current = true;

    (async () => {
      const loaded = await loadHistory();
      const navState = location.state as { prompt?: string; topic?: string } | null;
      if (navState?.prompt || navState?.topic) return;

      const sessionParam = searchParams.get('session');
      if (sessionParam) {
        await selectSession(sessionParam);
        return;
      }
      if (searchParams.get('new') === 'true') return;

      if (loaded.length > 0) {
        await selectSession(loaded[0].id);
        setSearchParams({ session: loaded[0].id }, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialTriggered.current) return;
    const state = location.state as { prompt?: string; topic?: string } | null;
    if (state?.prompt || state?.topic) {
      initialTriggered.current = true;
      const initialText = state.prompt || (state.topic ? `Strategy and hooks for: ${state.topic}` : '');
      if (initialText) {
        sendMessage(initialText);
      }
    }
  }, [location.state, sendMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputPrompt]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isSending) return;
    const p = inputPrompt;
    setInputPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(p);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendResearchMessage = async (prompt: string) => {
    if (activeConnectors.length === 0) setConnectors(ALL_CONNECTORS);
    await sendMessage(prompt);
  };

  const handleNewResearch = () => {
    clearCurrentSession();
    prevMsgCountRef.current = 0;
    setSearchParams({ new: 'true' }, { replace: true });
  };

  const handleSelectSession = async (id: string) => {
    await selectSession(id);
    setSearchParams({ session: id }, { replace: true });
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    const nextId = useStrategyStore.getState().currentSessionId;
    setSearchParams(nextId ? { session: nextId } : { new: 'true' }, { replace: true });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasMessages = messages.length > 0;
  const streamError = error && error !== historyError ? error : null;

  // Find index of the last user message for top-anchoring
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') {
      lastUserIdx = i;
      break;
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-[#FBFAF8] text-[#171717] overflow-hidden font-sans">
      {/* ── Left Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col justify-between shrink-0 p-5 z-20 bg-[#F6F3FF] border-r border-[#E5E0E8]">
        <div className="flex flex-col min-h-0 flex-1">
          <BrandLogo to="/" size="sm" className="mb-6" />

          <button
            type="button"
            onClick={handleNewResearch}
            className="inline-flex items-center justify-center gap-1.5 rounded-full font-bold bg-[#FF98C1] border border-[#F27DA8] text-[#171717] transition-all hover:bg-[#FF8AB8] cursor-pointer w-full h-10 text-xs sm:text-[13px] mb-2.5 shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>New chat</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/app/dashboard')}
            className="w-full h-10 px-3.5 flex items-center gap-2.5 text-xs sm:text-[13px] font-semibold text-[#171717] bg-white hover:bg-[#F1ECFF] border border-[#E5E0E8] rounded-xl transition-colors cursor-pointer mb-6 shrink-0"
          >
            <LayoutGrid className="h-4 w-4 stroke-[2] text-[#4A2E8F]" />
            <span>Dashboard</span>
          </button>

          {/* Session History */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between gap-2 px-1 mb-2">
              <p className="text-[10px] font-bold text-[#77717F] tracking-[0.12em] uppercase">
                Recent Chats
              </p>
              <button
                type="button"
                onClick={() => loadHistory()}
                aria-label="Refresh chat history"
                className="text-[#77717F] hover:text-[#171717] transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {isLoadingSessions ? (
                <div className="space-y-2 px-1" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-7 rounded-lg bg-[#EAE4F7] animate-pulse" />
                  ))}
                </div>
              ) : historyError ? (
                <div className="px-1 space-y-2">
                  <p className="text-[11px] leading-relaxed text-[#B42332]">{historyError}</p>
                  <button
                    type="button"
                    onClick={() => loadHistory()}
                    className="text-[11px] font-bold text-[#171717] underline hover:opacity-80 cursor-pointer"
                  >
                    Try again
                  </button>
                </div>
              ) : sessions.length === 0 ? (
                <p className="px-1 text-[11px] leading-relaxed text-[#77717F]">
                  No conversations yet.
                </p>
              ) : (
                sessions.map((s) => {
                  const isActive = s.id === currentSessionId;
                  return (
                    <div key={s.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => handleSelectSession(s.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-colors truncate cursor-pointer pr-7 ${
                          isActive
                            ? 'bg-white border border-[#E5E0E8] text-[#171717] font-semibold shadow-2xs'
                            : 'text-[#625D68] font-medium hover:bg-[#EFEAFD] hover:text-[#171717]'
                        }`}
                      >
                        {s.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(s.id)}
                        aria-label={`Delete session ${s.title}`}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[#A79FB0] opacity-0 hover:text-[#B42332] group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Bottom Connected Channel / Profile */}
        <div className="pt-3.5 border-t border-[#E5E0E8] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#171717] truncate">
              {primaryChannel?.name || userName || 'Creator'}
            </p>
            {primaryChannel?.handle && (
              <p className="text-[11px] text-[#77717F] truncate">
                @{primaryChannel.handle.replace(/^@/, '')}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Chat Stream & Workspace ──────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen min-w-0 bg-[#FBFAF8] overflow-hidden relative">
        {/* Clean Minimal Header */}
        <header className="h-14 shrink-0 border-b border-[#EFEBF2] bg-[#FBFAF8]/90 backdrop-blur-xs px-6 sm:px-8 flex items-center justify-between z-10">
          <div className="min-w-0 flex items-center gap-3">
            <h1 className="font-sora text-sm sm:text-[15px] font-bold text-[#171717] truncate">
              {sessionTitle}
            </h1>
            {primaryChannel?.is_oauth_connected && (
              <span className="hidden sm:inline-flex items-center rounded-full border border-[#E5E0E8] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#625D68]">
                {primaryChannel.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/app/dashboard"
              className="text-xs font-semibold text-[#625D68] hover:text-[#171717] transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* Scrollable Chat Stream */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-8 lg:px-10 pt-5 pb-6"
        >
          <div className="max-w-5xl mx-auto w-full">
            {isLoadingMessages ? (
              <div className="space-y-4 pt-4" aria-hidden="true">
                <div className="ml-auto h-12 w-2/3 rounded-2xl bg-[#F1EEF5] animate-pulse" />
                <div className="h-36 w-full rounded-2xl bg-[#F1EEF5] animate-pulse" />
              </div>
            ) : !hasMessages && !isSending ? (
              /* ── Clean Claude / ChatGPT Centered Empty State ─────────── */
              <div className="pt-12 sm:pt-20 pb-8">
                <div className="text-center max-w-lg mx-auto mb-8">
                  <h2 className="font-cal-sans text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
                    {primaryChannel?.name
                      ? `What are we building for ${primaryChannel.name}?`
                      : 'What should we work on today?'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#625D68] mt-2 leading-relaxed">
                    Brainstorm high-conviction video angles, sharpen hooks, or schedule milestones directly onto your Google Calendar.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => sendResearchMessage(p)}
                      className="group rounded-2xl border border-[#E5E0E8] bg-white p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer hover:border-[#C9BCF0] hover:bg-[#F6F3FF]/60 transition-all"
                    >
                      <span className="text-xs sm:text-[13px] font-medium text-[#171717] leading-snug">
                        {p}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#9B94A5] group-hover:text-[#4A2E8F] group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Conversation Turns ─────────────────────────────────── */
              <div className="space-y-6">
                {messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  const isLastUser = idx === lastUserIdx;
                  const isLastAssistant = !isUser && idx === messages.length - 1;
                  const steps = m.metadata?.steps || [];
                  const cards = m.metadata?.cards || [];
                  const cleanContent = m.content
                    .replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}]|\u{20E3}|\uFE0F/gu, '')
                    .replace(/<br\s*\/?>/gi, ' • ')
                    .replace(/\*\*\s+([^*\n]+?)\*\*/g, '**$1**');

                  if (isUser) {
                    return (
                      <div
                        key={m.id}
                        ref={isLastUser ? lastUserMsgRef : undefined}
                        className="flex justify-end scroll-mt-6 pt-2"
                      >
                        <div className="max-w-[82%] sm:max-w-[75%] rounded-2xl bg-[#F1ECFF] border border-[#E2D9FA] px-4 py-3 text-[14.5px] sm:text-[15px] font-medium text-[#171717] leading-relaxed">
                          {cleanContent}
                        </div>
                      </div>
                    );
                  }

                  const followUps =
                    isLastAssistant && !isSending && cleanContent.length > 60
                      ? getFollowUpSuggestions(cleanContent)
                      : [];

                  return (
                    <div key={m.id} className="space-y-3">
                      {/* Unified Inline Reasoning Pill (Steps or Thinking state) */}
                      <ResearchStepsAccordion
                        steps={steps}
                        isStreaming={isLastAssistant && isSending && !cleanContent}
                      />

                      {/* Interactive Cards (Calendar Event, Trend, Video) */}
                      {cards.length > 0 && <InteractiveCardsList cards={cards} />}

                      {/* Editorial Assistant Prose */}
                      {cleanContent && (
                        <div className="min-w-0 overflow-hidden rounded-2xl bg-white border border-[#EFEBF2] px-5 py-4 sm:px-6 sm:py-5 shadow-[0_2px_10px_rgba(23,23,23,0.02)]">
                          <StrategyMessageContent
                            content={cleanContent}
                            onOpenStudio={(t) => setStudioTopic(t)}
                            onAskCopilot={(p) => {
                              sendMessage(p);
                            }}
                          />

                          {/* Action Bar */}
                          <div className="mt-3 pt-2.5 border-t border-[#F4F1F8] flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopy(m.id, cleanContent)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[#77717F] hover:bg-[#F6F3FF] hover:text-[#171717] transition-colors cursor-pointer"
                            >
                              {copiedId === m.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-[#167A59]" />
                                  <span className="text-[#167A59] font-semibold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Contextual Follow-Up Chips on Last Completed Turn */}
                      {followUps.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {followUps.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => sendMessage(suggestion)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E0E8] bg-white px-3 py-1.5 text-xs font-medium text-[#625D68] transition-all hover:border-[#C9BCF0] hover:bg-[#F6F3FF] hover:text-[#171717] cursor-pointer"
                            >
                              <span>{suggestion}</span>
                              <ArrowRight className="h-3 w-3 text-[#4A2E8F]" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {streamError && !isSending && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#F5C6CE] bg-[#FDECEF] p-4 text-xs text-[#B42332]"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{streamError}</span>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* ── Dedicated Bottom Dock (Never overlaps scrollbars or messages) ── */}
        <div className="relative shrink-0 bg-gradient-to-t from-[#FBFAF8] via-[#FBFAF8] to-transparent px-4 sm:px-8 lg:px-10 pt-2 pb-4 z-20">
          {/* Floating "Scroll to bottom" Pill docked cleanly above composer */}
          <AnimatePresence>
            {showScrollBottomBtn && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                onClick={() => scrollToBottom(true)}
                className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1.5 rounded-full border border-[#E5E0E8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#171717] shadow-[0_6px_18px_rgba(23,23,23,0.10)] hover:border-[#C9BCF0] hover:bg-[#F6F3FF] cursor-pointer"
              >
                <ArrowDown className="h-3.5 w-3.5 text-[#4A2E8F]" />
                <span>Scroll to bottom</span>
              </motion.button>
            )}
          </AnimatePresence>

          <div className="max-w-5xl mx-auto w-full">
            <div className="relative">
              <ConnectorPopover
                isOpen={showConnectorsMenu}
                onClose={() => setShowConnectorsMenu(false)}
                primaryChannel={primaryChannel}
                placement="top"
                onConnectYouTube={() => {
                  setShowConnectorsMenu(false);
                  setShowConnectModal(true);
                }}
                onDisconnectYouTube={async () => {
                  try {
                    await api.post('/auth/youtube/disconnect');
                    await fetchDashboard();
                  } catch (e) {
                    console.error('Failed to disconnect YouTube:', e);
                  }
                }}
              />
            </div>

            {/* Clean Claude/ChatGPT Composer Box */}
            <form
              onSubmit={handleSend}
              className="rounded-2xl border border-[#E5E0E8] bg-white p-3 shadow-[0_10px_30px_rgba(23,23,23,0.07)] transition-all focus-within:border-[#C9BCF0] focus-within:shadow-[0_12px_34px_rgba(74,46,143,0.10)]"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything, refine a script, or schedule a video…"
                className="w-full resize-none border-0 bg-transparent px-2 py-1 text-sm sm:text-[15px] text-[#171717] placeholder-[#9B94A5] focus:outline-none font-normal leading-relaxed max-h-36 min-h-[28px]"
              />

              <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-[#F4F1F8]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConnectorsMenu(!showConnectorsMenu)}
                    aria-expanded={showConnectorsMenu}
                    aria-label="Manage connectors"
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      showConnectorsMenu
                        ? 'border-[#7C5CD6] bg-[#F1ECFF] text-[#4A2E8F]'
                        : 'border-[#E5E0E8] bg-[#FBFAF8] text-[#625D68] hover:border-[#D5CFDE] hover:text-[#171717]'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Connectors</span>
                    {connectedCount > 0 && (
                      <span className="rounded-full bg-[#F1ECFF] px-1.5 py-0.2 text-[10px] font-bold text-[#4A2E8F]">
                        {connectedCount}
                      </span>
                    )}
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${showConnectorsMenu ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() || isSending}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl font-bold bg-[#FF98C1] border border-[#F27DA8] text-[#171717] transition-all hover:bg-[#FF8AB8] disabled:opacity-45 disabled:cursor-not-allowed px-4 py-1.5 text-xs cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Streaming</span>
                      </>
                    ) : (
                      <>
                        <span>Send</span>
                        <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Script Studio Modal */}
      <ScriptStudioModal
        topic={studioTopic}
        isOpen={!!studioTopic}
        onClose={() => setStudioTopic(null)}
      />

      {/* YouTube Connect Modal */}
      <YouTubeConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        primaryChannel={primaryChannel}
      />
    </div>
  );
};
