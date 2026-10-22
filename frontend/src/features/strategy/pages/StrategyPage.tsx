import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStrategyStore, type ChatMessage, type AgentStep, type AgentCard } from '../../../stores/useStrategyStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { TopicStrategyCard, type TopicStrategyItem } from '../components/TopicStrategyCard';
import { ScriptStudioModal } from '../components/ScriptStudioModal';
import { StrategyResearchLoader } from '../components/StrategyResearchLoader';
import { parseStrategyTopics } from '../utils/parseStrategyTopics';
import {
  Sparkles,
  Plus,
  ArrowRight,
  User,
  LayoutGrid,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Flame,
  Database,
  ExternalLink,
  Copy,
  Lightbulb,
  Target,
  TrendingUp,
  Trash2,
  AlertCircle,
  RefreshCw,
  Radio,
} from 'lucide-react';
import './StrategyPage.css';

/* ── Inline Research Steps Accordion ─────────────────────────────────────── */
const ResearchStepsAccordion: React.FC<{ steps: AgentStep[] }> = ({ steps }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!steps || steps.length === 0) return null;

  const runningStep = steps.find((s) => s.status === 'running');
  const doneCount = steps.filter((s) => s.status === 'done').length;

  return (
    <div className="my-2 rounded-2xl border border-[#E5E0E8] bg-[#F6F3FF] overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#F1ECFF] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 text-[#171717]">
          {runningStep ? (
            <div className="flex items-center gap-2 text-[#171717]">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              <span className="font-semibold">{runningStep.summary}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#167A59] font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Researched {doneCount} live data {doneCount === 1 ? 'source' : 'sources'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[#625D68]">
          <span className="text-[11px] font-mono">{steps.length} {steps.length === 1 ? 'step' : 'steps'}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-3 pt-1 border-t border-[#E5E0E8] space-y-2">
          {steps.map((st, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[11px] text-[#625D68] pt-1">
              <div className="mt-0.5 shrink-0">
                {st.status === 'running' ? (
                  <div className="h-3 w-3 rounded-full border border-[#625D68] border-t-transparent animate-spin" />
                ) : (
                  <Check className="h-3 w-3 text-[#167A59]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#171717]">{st.label}</span>
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

/* ── Interactive Cards List (Trends + Outlier Videos) ────────────────────── */
const InteractiveCardsList: React.FC<{ cards: AgentCard[] }> = ({ cards }) => {
  const navigate = useNavigate();
  if (!cards || cards.length === 0) return null;

  return (
    <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((c, i) => {
        if (c.card_type === 'trend') {
          const t = c.payload;
          return (
            <div
              key={i}
              className="rounded-2xl border border-[#E5E0E8] bg-white p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-[#C9C0DA] transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[#F1ECFF] border border-[#D9CEF5] px-2.5 py-0.5 text-[10px] font-bold text-[#4A2E8F]">
                    Trend Opportunity
                  </span>
                  {t.opportunity_score && (
                    <span className="rounded-full bg-[#E4FBF2] border border-[#B9EFDD] px-2.5 py-0.5 text-[10px] font-bold text-[#167A59]">
                      {Math.round(t.opportunity_score)} / 100
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#171717] line-clamp-1">{t.topic}</h4>
                {t.why_trending && (
                  <p className="text-xs text-[#625D68] line-clamp-2 leading-relaxed">{t.why_trending}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EFEBF2]">
                {t.id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/app/trends/${t.id}`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#4A2E8F] hover:text-[#171717] cursor-pointer"
                  >
                    <span>View Detail</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        }

        if (c.card_type === 'video') {
          const v = c.payload;
          return (
            <div
              key={i}
              className="rounded-2xl border border-[#E5E0E8] bg-white p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-[#C9C0DA] transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[#F6F3FF] border border-[#E5E0E8] px-2.5 py-0.5 text-[10px] font-bold text-[#625D68] inline-flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    Outlier Video Proof
                  </span>
                  {v.reach_multiplier && (
                    <span className="rounded-full bg-[#F6F3FF] border border-[#E5E0E8] px-2.5 py-0.5 text-[10px] font-bold text-[#625D68]">
                      {v.reach_multiplier} Outlier
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#171717] line-clamp-2">{v.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-[#625D68]">
                  <span>{v.channel}</span>
                  {v.views !== undefined && <span>• {Number(v.views).toLocaleString()} views</span>}
                </div>
              </div>
              {v.url && (
                <div className="flex items-center justify-end pt-2 border-t border-[#EFEBF2]">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#4A2E8F] hover:text-[#171717]"
                  >
                    <span>Watch on YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

/* ── Light-Themed Strategy Markdown & Interactive Cards ──────────────────── */
const StrategyMessageContent: React.FC<{
  content: string;
  onOpenStudio: (t: TopicStrategyItem) => void;
  onAskCopilot: (prompt: string) => void;
}> = ({ content, onOpenStudio, onAskCopilot }) => {
  const parsed = parseStrategyTopics(content);

  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-xl font-extrabold text-[#171717] pb-1 mb-2 mt-3 font-sora flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#4A2E8F] shrink-0" />
        <span>{children}</span>
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-bold text-[#171717] pb-1 mb-2 mt-5 font-sora flex items-center gap-2">
        <Target className="h-4 w-4 text-[#4A2E8F] shrink-0" />
        <span>{children}</span>
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-base font-bold text-[#171717] mt-4 mb-1.5 flex items-center gap-2">
        <Lightbulb className="h-3.5 w-3.5 text-[#4A2E8F] shrink-0" />
        <span>{children}</span>
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-xs font-bold uppercase tracking-wider text-[#625D68] mt-3 mb-1 flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-[#167A59] shrink-0" />
        <span>{children}</span>
      </h4>
    ),
    p: ({ children }: any) => (
      <p className="text-[#2C2834] leading-relaxed my-2 text-sm sm:text-[14.5px]">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="space-y-1.5 my-2.5 pl-5 list-disc text-[#383340] marker:text-[#7A6FA3]">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="space-y-2 my-2.5 pl-5 list-decimal text-[#383340] marker:text-[#7A6FA3]">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-sm leading-relaxed">{children}</li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-[#C9BCF0] bg-[#F6F3FF] px-4 py-2.5 my-3 rounded-r-xl text-[#2C2834] text-sm">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="border-t border-[#E5E0E8] my-5" />,
    strong: ({ children }: any) => (
      <strong className="text-[#171717] font-bold">{children}</strong>
    ),
  };

  if (!parsed.hasTopics) {
    return (
      <div className="prose max-w-none space-y-3 text-[#171717]">
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

/* ── Scope prompts (sent to the real API) ────────────────────────────────── */
const SCOPE_PROMPTS: Record<string, string> = {
  practical:
    'Give me practical, easy-to-follow video ideas for my channel, with titles, hooks and a retention outline.',
  compare:
    'Compare every angle you find and give me the 3 strongest options, with the evidence behind each one.',
  channel:
    'Start from my channel: analyse what has worked for me and propose the next 3 videos to make.',
};

const CONNECTOR_OPTIONS = [
  { id: 'trends', label: 'CreatorIQ Concept Radar', icon: Database },
  { id: 'youtube', label: 'Live YouTube Outliers', icon: Flame },
  { id: 'web', label: 'Live Web Search', icon: Globe },
];

const ALL_CONNECTORS = CONNECTOR_OPTIONS.map((c) => c.id);

const STARTER_PROMPTS = [
  'What should I publish in the next 14 days?',
  'Give me 5 video ideas with hooks and titles for my niche.',
  'Plan a 2-week series on my strongest topic.',
  'Which of my past videos should I make a follow-up to?',
];

/* ── Main StrategyPage Component ─────────────────────────────────────────── */
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
    toggleConnector,
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
  const [studioTopic, setStudioTopic] = useState<TopicStrategyItem | null>(null);
  const [selectedScope, setSelectedScope] = useState('practical');
  const [historyError, setHistoryError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialTriggered = useRef(false);
  const sessionInitTriggered = useRef(false);

  const userName = user?.full_name || '';

  const activeSession = sessions.find((s) => s.id === currentSessionId) || null;
  const sessionTitle =
    activeSession?.title && activeSession.title !== 'New Strategy Chat'
      ? activeSession.title
      : 'Strategy research';
  const sessionDate = activeSession?.created_at
    ? new Date(activeSession.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  /** Live steps of the in-flight request (real SSE events). */
  const liveSteps = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m.role === 'assistant' && m.metadata?.steps?.length) {
        return m.metadata.steps;
      }
    }
    return [] as AgentStep[];
  }, [messages]);

  /** Loads the real session list and records any failure separately. */
  const loadHistory = async (): Promise<typeof sessions> => {
    const loaded = await fetchSessions();
    const failure = useStrategyStore.getState().error;
    setHistoryError(failure);
    return loaded;
  };

  // Restore the real history on mount
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

  // Handle incoming navigation state
  useEffect(() => {
    if (initialTriggered.current) return;
    const state = location.state as { prompt?: string; topic?: string } | null;
    if (state?.prompt || state?.topic) {
      initialTriggered.current = true;
      const initialText = state.prompt || (state.topic ? `Deep strategy and viral hooks for: ${state.topic}` : '');
      if (initialText) {
        sendMessage(initialText);
      }
    }
  }, [location.state, sendMessage]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
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

  /**
   * Research asks run with live sources enabled. A plain message typed in the
   * composer uses whatever the creator selected in the Live research control,
   * so normal chat never triggers a search.
   */
  const sendResearchMessage = async (prompt: string) => {
    if (activeConnectors.length === 0) setConnectors(ALL_CONNECTORS);
    await sendMessage(prompt);
  };

  const handleNewResearch = () => {
    clearCurrentSession();
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

  return (
    <div className="strategy-page min-h-screen flex w-full bg-[#FBFAF8] text-[#171717] overflow-hidden">
      {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
      <aside className="strategy-sidebar hidden lg:flex flex-col justify-between shrink-0 p-5 z-20">
        <div>
          {/* Top Logo */}
          <Link to="/" className="inline-flex items-center gap-2 group mb-7">
            <div className="w-7 h-7 flex items-center justify-center text-[#171717]">
              <svg
                className="w-6 h-6 text-[#171717] shrink-0 transition-transform group-hover:scale-105"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2.4" />
                <path
                  d="M12 6.5C8.96243 6.5 6.5 8.96243 6.5 12C6.5 15.0376 8.96243 17.5 12 17.5C15.0376 17.5 17.5 15.0376 17.5 12"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="2.2" fill="currentColor" />
              </svg>
            </div>
            <span className="font-sora text-lg font-extrabold tracking-tight text-[#171717]">
              CreatorIQ
            </span>
          </Link>

          {/* '+ New research' Button */}
          <button
            type="button"
            onClick={handleNewResearch}
            className="strategy-btn-pink w-full h-11 text-xs sm:text-[13px] mb-3"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>New research</span>
          </button>

          {/* 'Overview' Nav Button */}
          <button
            type="button"
            onClick={() => navigate('/app/dashboard')}
            className="strategy-nav-overview w-full h-11 px-4 flex items-center gap-2.5 text-xs sm:text-[13px] cursor-pointer mb-7"
          >
            <LayoutGrid className="h-4 w-4 stroke-[2.5]" />
            <span>Overview</span>
          </button>

          {/* 'YOUR RESEARCH HISTORY' Section — real API sessions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-[10px] font-bold text-[#77717F] tracking-[0.14em] uppercase">
                YOUR RESEARCH HISTORY
              </p>
              <button
                type="button"
                onClick={() => loadHistory()}
                aria-label="Refresh research history"
                className="text-[#77717F] hover:text-[#171717] transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            {isLoadingSessions ? (
              <div className="space-y-2 px-1" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-6 rounded-lg bg-[#F1EEF5] animate-pulse" />
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
                No research sessions yet. Ask a question below to start one.
              </p>
            ) : (
              <div className="space-y-1">
                {sessions.map((s) => {
                  const isActive = s.id === currentSessionId;
                  return (
                    <div key={s.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => handleSelectSession(s.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors truncate cursor-pointer pr-7 ${
                          isActive
                            ? 'bg-[#F1ECFF] text-[#171717] font-bold'
                            : 'text-[#625D68] hover:bg-[#F6F3FF] hover:text-[#171717]'
                        }`}
                      >
                        {s.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(s.id)}
                        aria-label={`Delete session ${s.title}`}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[#A79FB0] opacity-60 hover:text-[#B42332] group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Profile Name */}
        <div className="pt-4 border-t border-[#E5E0E8]">
          <p className="text-xs sm:text-[13px] font-bold text-[#171717] truncate px-1">
            {userName || 'Creator'}
          </p>
        </div>
      </aside>

      {/* ── Main Chat Stream & Workspace ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen min-w-0 bg-[#FBFAF8] overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 border-b border-[#E5E0E8] bg-white px-6 sm:px-10 flex items-center justify-between z-10">
          <div className="min-w-0">
            <h1 className="font-sora text-base sm:text-lg font-extrabold text-[#171717] leading-tight truncate">
              {sessionTitle}
            </h1>
            <p className="text-xs text-[#625D68] mt-0.5 truncate">
              {userName ? `${userName.split(' ')[0]}'s research / ` : 'Research / '}
              {sessionDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/app/dashboard"
              className="text-xs font-bold text-[#625D68] hover:text-[#171717] transition-colors"
            >
              Dashboard ➔
            </Link>
          </div>
        </header>

        {/* Scrollable Chat Stream */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 pb-40">
          <div className="max-w-3xl mx-auto space-y-7">
            {isLoadingMessages ? (
              <div className="space-y-4" aria-hidden="true">
                <div className="h-24 rounded-2xl bg-[#F1EEF5] animate-pulse" />
                <div className="h-40 rounded-2xl bg-[#F1EEF5] animate-pulse" />
              </div>
            ) : !hasMessages && !isSending ? (
              /* ── Empty state: honest, no invented findings ───────────────── */
              <div className="space-y-6">
                <div>
                  <h2 className="font-sora text-xl sm:text-[22px] font-bold text-[#171717]">
                    What should we research?
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#625D68] mt-1.5 leading-relaxed max-w-xl">
                    Ask about your next videos. We search the live sources you enable, then return a
                    strategy brief with angles, titles, hooks and a retention outline.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => sendResearchMessage(p)}
                      className="strategy-lavender-box p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:border-[#C9BCF0] transition-colors"
                    >
                      <span className="text-xs sm:text-[13px] font-semibold text-[#171717] leading-relaxed">
                        {p}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#4A2E8F]" />
                    </button>
                  ))}
                </div>

                {/* Scope picker — sends a real request */}
                <div className="rounded-2xl border border-[#E5E0E8] bg-white p-6 sm:p-7 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-sora text-lg sm:text-[20px] font-bold text-[#171717]">
                      How should we scope this?
                    </h3>
                    <p className="text-xs sm:text-[13px] text-[#625D68] mt-1">
                      Pick how deep we go. You can change it in your next message.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedScope('practical')}
                      className={`rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                        selectedScope === 'practical' ? 'strategy-chip-active' : 'strategy-chip-inactive'
                      }`}
                    >
                      {selectedScope === 'practical' ? '✓ ' : ''}Practical explainers
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedScope('compare')}
                      className={`rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                        selectedScope === 'compare' ? 'strategy-chip-active' : 'strategy-chip-inactive'
                      }`}
                    >
                      {selectedScope === 'compare' ? '✓ ' : ''}Compare every angle
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedScope('channel')}
                      className={`rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                        selectedScope === 'channel' ? 'strategy-chip-active' : 'strategy-chip-inactive'
                      }`}
                    >
                      {selectedScope === 'channel' ? '✓ ' : ''}Start from my channel
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => sendResearchMessage(SCOPE_PROMPTS[selectedScope])}
                      className="strategy-btn-pink px-5 py-2 text-xs"
                    >
                      <span>Shape my brief</span>
                      <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => sendResearchMessage(SCOPE_PROMPTS.practical)}
                      className="text-xs font-bold text-[#171717] underline hover:opacity-80 cursor-pointer"
                    >
                      Use sensible defaults
                    </button>
                  </div>

                  <p className="text-[11px] text-[#77717F] pt-1">
                    Scope applies to this request only. Connectors are optional — switch them off
                    before sending if you want a narrower search.
                  </p>
                </div>
              </div>
            ) : (
              /* ── Real conversation ────────────────────────────────────────── */
              messages.map((m) => {
                const isUser = m.role === 'user';
                const steps = m.metadata?.steps || [];
                const cards = m.metadata?.cards || [];
                const cleanContent = m.content.replace(
                  /[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\uFE0F\u20E3]/gu,
                  ''
                );

                if (isUser) {
                  return (
                    <div key={m.id} className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-[#F1ECFF] border border-[#E5E0E8] flex items-center justify-center shrink-0 mt-1">
                        <User className="w-4 h-4 text-[#171717]" />
                      </div>
                      <div className="flex-1 bg-[#F1ECFF] rounded-2xl p-4 sm:p-5 text-sm sm:text-[15px] font-medium text-[#171717] leading-relaxed">
                        {cleanContent}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={m.id} className="space-y-4 pt-2">
                    {steps.length > 0 && <ResearchStepsAccordion steps={steps} />}
                    {cards.length > 0 && <InteractiveCardsList cards={cards} />}
                    {cleanContent && (
                      <StrategyMessageContent
                        content={cleanContent}
                        onOpenStudio={(t) => setStudioTopic(t)}
                        onAskCopilot={(p) => {
                          setInputPrompt(p);
                          sendMessage(p);
                        }}
                      />
                    )}
                    {cleanContent && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, cleanContent)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-[#625D68] hover:bg-[#F6F3FF] hover:text-[#171717] transition-colors cursor-pointer"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-[#167A59]" />
                              <span className="text-[#167A59]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Real live loader driven by the SSE steps */}
            {isSending && (
              <StrategyResearchLoader
                steps={liveSteps}
                liveResearch={activeConnectors.length > 0}
              />
            )}

            {streamError && !isSending && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-[#F5C6CE] bg-[#FDECEF] p-4 text-xs text-[#B42332]"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{streamError}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Floating Bottom Composer Bar ───────────────────────────────── */}
        <div className="fixed bottom-5 left-0 right-0 px-4 sm:px-6 pointer-events-none z-30 lg:pl-64">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            {/* Connectors Popup Menu */}
            {showConnectorsMenu && (
              <div className="mb-2 w-80 rounded-2xl border border-[#E5E0E8] bg-white p-3.5 shadow-lg space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#EFEBF2]">
                  <span className="text-xs font-bold text-[#171717] font-sora">Live research</span>
                  <span className="text-[10px] font-mono text-[#77717F]">Real-Time</span>
                </div>
                <p className="text-[11px] text-[#625D68] leading-relaxed">
                  Off by default so a normal question is answered straight away. Turn a source on
                  only when you want live evidence.
                </p>
                <div className="space-y-1.5 text-xs">
                  {CONNECTOR_OPTIONS.map((c) => {
                    const isOn = activeConnectors.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleConnector(c.id)}
                        aria-pressed={isOn}
                        className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-[#F6F3FF] transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2 text-[#171717] min-w-0">
                          <c.icon className="h-3.5 w-3.5 text-[#625D68] shrink-0" />
                          <span className="font-semibold truncate">{c.label}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                            isOn ? 'bg-[#E4FBF2] text-[#167A59]' : 'bg-[#F6F3FF] text-[#77717F]'
                          }`}
                        >
                          {isOn ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Composer Box */}
            <form onSubmit={handleSend} className="strategy-composer-bar p-3.5">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your next videos, angles, hooks or a content plan…"
                className="w-full resize-none bg-transparent px-1 py-0.5 text-sm sm:text-[14.5px] text-[#171717] placeholder-[#9B94A5] focus:outline-none font-normal leading-relaxed max-h-32 min-h-[30px]"
              />

              {/* Bottom Toolbar */}
              <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-[#EFEBF2]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#625D68]">
                  <button
                    type="button"
                    onClick={() => setShowConnectorsMenu(!showConnectorsMenu)}
                    aria-expanded={showConnectorsMenu}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors cursor-pointer ${
                      activeConnectors.length > 0
                        ? 'border-[#B9EFDD] bg-[#E4FBF2] text-[#167A59]'
                        : 'border-[#E5E0E8] bg-white text-[#625D68] hover:text-[#171717]'
                    }`}
                  >
                    <Radio className="h-3 w-3" />
                    <span>
                      {activeConnectors.length > 0
                        ? `Live research · ${activeConnectors.length}`
                        : 'Live research off'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <span className="text-[#DCD6E2]">·</span>
                  <button
                    type="button"
                    onClick={() => setInputPrompt((p) => `${p} @source `)}
                    className="hover:text-[#171717] transition-colors cursor-pointer"
                  >
                    @ source
                  </button>
                  <span className="text-[#DCD6E2]">·</span>
                  <button
                    type="button"
                    onClick={() => setInputPrompt((p) => `${p} #idea `)}
                    className="hover:text-[#171717] transition-colors cursor-pointer"
                  >
                    # idea
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim() || isSending}
                    className="strategy-btn-pink px-4 py-1.5 text-xs font-bold"
                  >
                    <span>Send</span>
                    <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
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
    </div>
  );
};
