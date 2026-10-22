import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStrategyStore, type ChatMessage, type AgentStep, type AgentCard } from '../../../stores/useStrategyStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { TopicStrategyCard, type TopicStrategyItem } from '../components/TopicStrategyCard';
import { ScriptStudioModal } from '../components/ScriptStudioModal';
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
} from 'lucide-react';
import './StrategyPage.css';

/* ── Inline Research Steps Accordion ─────────────────────────────────────── */
const ResearchStepsAccordion: React.FC<{ steps: AgentStep[] }> = ({ steps }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!steps || steps.length === 0) return null;

  const runningStep = steps.find((s) => s.status === 'running');
  const doneCount = steps.filter((s) => s.status === 'done').length;

  return (
    <div className="my-2 rounded-2xl border border-[#ede9f2] bg-[#fbf9fe] overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#f3edf9] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 text-[#181719]">
          {runningStep ? (
            <div className="flex items-center gap-2 text-[#7033ea]">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              <span className="font-semibold">{runningStep.summary}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#059669] font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Researched {doneCount} live data {doneCount === 1 ? 'source' : 'sources'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[#716c7d]">
          <span className="text-[11px] font-mono">{steps.length} {steps.length === 1 ? 'step' : 'steps'}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-3 pt-1 border-t border-[#ede9f2] space-y-2">
          {steps.map((st, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[11px] text-[#6b6775] pt-1">
              <div className="mt-0.5 shrink-0">
                {st.status === 'running' ? (
                  <div className="h-3 w-3 rounded-full border border-[#8b5cf6] border-t-transparent animate-spin" />
                ) : (
                  <Check className="h-3 w-3 text-[#059669]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#14121a]">{st.label}</span>
                  {st.duration_ms !== undefined && st.duration_ms > 0 && (
                    <span className="text-[10px] font-mono text-[#716c7d]">{st.duration_ms}ms</span>
                  )}
                </div>
                <p className="text-[#6b6775] truncate">{st.summary}</p>
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
              className="rounded-2xl border border-[#ede9f2] bg-white p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-[#181719] transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[#f0ebff] border border-[#d8cbf9] px-2.5 py-0.5 text-[10px] font-bold text-[#6035c0]">
                    Trend Opportunity
                  </span>
                  {t.opportunity_score && (
                    <span className="rounded-full bg-[#e8faf3] border border-[#a7f3d0] px-2.5 py-0.5 text-[10px] font-bold text-[#059669]">
                      {Math.round(t.opportunity_score)} / 100
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#14121a] line-clamp-1">{t.topic}</h4>
                {t.why_trending && (
                  <p className="text-xs text-[#6b6775] line-clamp-2 leading-relaxed">{t.why_trending}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ede9f2]">
                {t.id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/app/trends/${t.id}`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#7033ea] hover:text-[#581c87] cursor-pointer"
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
              className="rounded-2xl border border-[#ede9f2] bg-white p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-[#181719] transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                    Outlier Video Proof
                  </span>
                  {v.reach_multiplier && (
                    <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                      {v.reach_multiplier} Outlier
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#14121a] line-clamp-2">{v.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-[#6b6775]">
                  <span>{v.channel}</span>
                  {v.views !== undefined && <span>• {Number(v.views).toLocaleString()} views</span>}
                </div>
              </div>
              {v.url && (
                <div className="flex items-center justify-end pt-2 border-t border-[#ede9f2]">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900"
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
      <h1 className="text-xl font-extrabold text-[#14121a] pb-1 mb-2 mt-3 font-sora flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#7033ea] shrink-0" />
        <span>{children}</span>
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-bold text-[#14121a] pb-1 mb-2 mt-5 font-sora flex items-center gap-2">
        <Target className="h-4 w-4 text-[#7033ea] shrink-0" />
        <span>{children}</span>
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-base font-bold text-[#14121a] mt-4 mb-1.5 flex items-center gap-2">
        <Lightbulb className="h-3.5 w-3.5 text-[#7033ea] shrink-0" />
        <span>{children}</span>
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-xs font-bold uppercase tracking-wider text-[#6b6775] mt-3 mb-1 flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-[#059669] shrink-0" />
        <span>{children}</span>
      </h4>
    ),
    p: ({ children }: any) => (
      <p className="text-[#2c2834] leading-relaxed my-2 text-sm sm:text-[14.5px]">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="space-y-1.5 my-2.5 pl-5 list-disc text-[#383340] marker:text-[#8b5cf6]">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="space-y-2 my-2.5 pl-5 list-decimal text-[#383340] marker:text-[#8b5cf6]">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-sm leading-relaxed">{children}</li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-[#8b5cf6] bg-[#f6f3ff] px-4 py-2.5 my-3 rounded-r-xl text-[#2c2834] text-sm">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="border-t border-[#ede9f2] my-5" />,
    strong: ({ children }: any) => (
      <strong className="text-[#14121a] font-bold">{children}</strong>
    ),
  };

  if (!parsed.hasTopics) {
    return (
      <div className="prose max-w-none space-y-3 text-[#181719]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {parsed.introText && (
        <div className="prose max-w-none text-[#181719]">
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
        <div className="prose max-w-none text-[#181719]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {parsed.outroText}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

/* ── Dedicated Chat Research Loader ──────────────────────────────────────── */
const ChatResearchLoader: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const loaderSteps = [
    'Deep-researching YouTube audience demand across 42 channels...',
    'Scanning 384-dim Qdrant vector space for India finance trends...',
    'Computing LightGBM 7-day virality probability & baseline reach...',
    'Synthesizing strategic angles & retention blueprints...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % loaderSteps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [loaderSteps.length]);

  return (
    <div className="rounded-2xl border-[1.5px] border-[#181719] bg-white p-6 shadow-[5px_5px_0px_#70f4b8] space-y-4 animate-in fade-in duration-300">
      {/* Top row with pulsing badge and spinner */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d8cbf9] bg-[#f0ebff] px-3.5 py-1 text-xs font-bold text-[#7033ea]">
          <Sparkles className="h-3.5 w-3.5 animate-spin" />
          <span>Autonomous Market Radar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#059669] animate-ping" />
          <span className="text-[11px] font-bold text-[#059669]">Analyzing Signals</span>
        </div>
      </div>

      {/* Main step status message */}
      <div className="space-y-1">
        <h4 className="text-base font-bold text-[#14121a] font-sora">
          {loaderSteps[activeStep]}
        </h4>
        <p className="text-xs text-[#6b6775]">
          Calibrating content angles against young professional search intent & watch time.
        </p>
      </div>

      {/* Animated shimmer progress bar */}
      <div className="w-full h-2 rounded-full overflow-hidden bg-[#f0ebff] border border-[#d8cbf9]">
        <div className="h-full w-full strategy-shimmer-bar rounded-full" />
      </div>

      {/* Bouncing dots & checklist */}
      <div className="flex items-center justify-between pt-1 text-xs text-[#716c7d]">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6] animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="ml-2 font-medium">Formulating 2-week execution strategy</span>
        </div>
        <span className="font-mono text-[11px] text-[#059669] font-bold">Live Qdrant + SerpApi</span>
      </div>
    </div>
  );
};

/* ── Main StrategyPage Component ─────────────────────────────────────────── */
export const StrategyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const {
    messages,
    isSending,
    activeConnectors,
    toggleConnector,
    sendMessage,
    selectSession,
    fetchSessions,
    clearCurrentSession,
    sessions,
  } = useStrategyStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConnectorsMenu, setShowConnectorsMenu] = useState(false);
  const [studioTopic, setStudioTopic] = useState<TopicStrategyItem | null>(null);
  const [selectedScope, setSelectedScope] = useState('practical');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialTriggered = useRef(false);

  const userName = user?.full_name || 'Soham Narvankar';

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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

  const handleNewResearch = () => {
    clearCurrentSession();
    setSearchParams({ new: 'true' }, { replace: true });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const planningHistory = [
    { title: 'Finance · 2-week plan', active: true },
    { title: 'AI budgeting demand', active: false },
    { title: 'Treasury ladder audiences', active: false },
    { title: 'ETF attention cycle', active: false },
  ];

  return (
    <div className="strategy-page min-h-screen flex w-full bg-[#fcfbfe] text-[#181719] overflow-hidden">
      {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
      <aside className="strategy-sidebar hidden lg:flex flex-col justify-between shrink-0 p-5 z-20">
        <div>
          {/* Top Logo */}
          <Link to="/" className="inline-flex items-center gap-2 group mb-7">
            <div className="w-7 h-7 flex items-center justify-center text-black">
              <svg
                className="w-6 h-6 text-black shrink-0 transition-transform group-hover:scale-105"
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
            <span className="font-sora text-lg font-extrabold tracking-tight text-[#14121a]">
              CreatorIQ
            </span>
          </Link>

          {/* '+ New research' Button */}
          <button
            type="button"
            onClick={handleNewResearch}
            className="strategy-btn-pink w-full h-11 text-xs sm:text-[13px] mb-3 shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>New research</span>
          </button>

          {/* 'Overview' Nav Button */}
          <button
            type="button"
            onClick={() => navigate('/app/dashboard')}
            className="strategy-nav-overview w-full h-11 px-4 flex items-center gap-2.5 text-xs sm:text-[13px] shadow-xs cursor-pointer mb-7"
          >
            <LayoutGrid className="h-4 w-4 stroke-[2.5]" />
            <span>Overview</span>
          </button>

          {/* 'YOUR PLANNING HISTORY' Section */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-[#716c7d] tracking-[0.14em] uppercase px-1">
              YOUR PLANNING HISTORY
            </p>
            <div className="space-y-1">
              {sessions.length > 0 ? (
                sessions.slice(0, 5).map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSession(s.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors truncate cursor-pointer ${
                      idx === 0
                        ? 'text-[#14121a] font-bold'
                        : 'text-[#6b6775] hover:text-[#14121a]'
                    }`}
                  >
                    {idx === 0 ? '• ' : ''}{s.title}
                  </button>
                ))
              ) : (
                planningHistory.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputPrompt(`Strategy for ${item.title}`)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors truncate cursor-pointer ${
                      item.active
                        ? 'text-[#14121a] font-bold'
                        : 'text-[#6b6775] hover:text-[#14121a]'
                    }`}
                  >
                    {item.active ? '• ' : ''}{item.title}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Profile Name */}
        <div className="pt-4 border-t border-[#ede9f2]">
          <p className="text-xs sm:text-[13px] font-bold text-[#14121a] truncate px-1">
            {userName}
          </p>
        </div>
      </aside>

      {/* ── Main Chat Stream & Workspace ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen min-w-0 bg-[#ffffff] overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 border-b border-[#ede9f2] bg-white px-6 sm:px-10 flex items-center justify-between z-10">
          <div>
            <h1 className="font-sora text-base sm:text-lg font-extrabold text-[#14121a] leading-tight">
              Finance content · next two weeks
            </h1>
            <p className="text-xs text-[#716c7d] mt-0.5">
              {userName.split(' ')[0]}&apos;s research / 19 Oct 2026
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/app/dashboard"
              className="text-xs font-bold text-[#716c7d] hover:text-[#14121a] transition-colors"
            >
              Dashboard ➔
            </Link>
          </div>
        </header>

        {/* Scrollable Chat Stream */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 pb-40">
          <div className="max-w-3xl mx-auto space-y-7">
            {/* 1. User Prompt Bubble (Lavender, user icon on left) */}
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-neutral-100 border border-[#dcd7e3] flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-[#14121a]" />
              </div>
              <div className="flex-1 bg-[#f0ebff] rounded-2xl p-4 sm:p-5 text-sm sm:text-[15px] font-medium text-[#181719] leading-relaxed">
                {messages.length > 0 && messages[0].role === 'user'
                  ? messages[0].content
                  : 'What finance videos should I make over the next two weeks for young professionals in India?'}
              </div>
            </div>

            {/* 2. Assistant Response Intro */}
            <div className="text-sm sm:text-[14.5px] text-[#181719] leading-relaxed pl-1">
              I&apos;ll look for questions your audience actually cares about, compare recent demand with the next two weeks&apos; outlook, and turn the strongest angles into a doable plan. We&apos;ll shape it together—not just generate a list.
            </div>

            {/* 3. Three Directions Feature Cards (Lavender Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="strategy-lavender-box p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-sora text-sm font-bold text-[#14121a]">Understand your audience</h3>
                  <p className="text-xs text-[#6b6775] leading-relaxed mt-1.5">
                    First-job earners or experienced professionals? We&apos;ll tune the language and depth.
                  </p>
                </div>
              </div>

              <div className="strategy-lavender-box p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-sora text-sm font-bold text-[#14121a]">Research three directions</h3>
                  <p className="text-xs text-[#6b6775] leading-relaxed mt-1.5">
                    Real Estate Market, AI budgeting and a Treasury ladder explainer.
                  </p>
                </div>
              </div>

              <div className="strategy-lavender-box p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-sora text-sm font-bold text-[#14121a]">Compare, then plan</h3>
                  <p className="text-xs text-[#6b6775] leading-relaxed mt-1.5">
                    Balance audience demand, uncertainty and your production time.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. 'How wide should we go?' Interactive Decision Card */}
            <div className="rounded-2xl border border-[#e5e0ea] bg-white p-6 sm:p-7 shadow-xs space-y-4">
              <div>
                <h2 className="font-sora text-xl sm:text-[22px] font-bold text-[#14121a]">
                  How wide should we go?
                </h2>
                <p className="text-xs sm:text-[13px] text-[#6b6775] mt-1">
                  I suggest practical personal-finance explainers, not stock picks. You can change that scope before I start.
                </p>
              </div>

              {/* Chips Selection Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedScope('practical')}
                  className={`rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                    selectedScope === 'practical' ? 'strategy-chip-active' : 'strategy-chip-inactive'
                  }`}
                >
                  ✓ Practical explainers
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScope('compare')}
                  className={`rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                    selectedScope === 'compare' ? 'strategy-chip-active' : 'strategy-chip-inactive'
                  }`}
                >
                  Compare all 3 directions
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScope('channel')}
                  className={`rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                    selectedScope === 'channel' ? 'strategy-chip-active' : 'strategy-chip-inactive'
                  }`}
                >
                  Start with my channel
                </button>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    sendMessage(
                      'Generate deep video strategy briefs and viral hooks for practical personal-finance explainers for young professionals in India.'
                    )
                  }
                  className="strategy-btn-pink px-5 py-2 text-xs"
                >
                  <span>Shape my brief</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    sendMessage('Start with sensible defaults: 3 high-impact finance topics for the next 14 days.')
                  }
                  className="text-xs font-bold text-[#14121a] underline hover:opacity-80 cursor-pointer"
                >
                  Use sensible defaults
                </button>
              </div>

              {/* Footer Note */}
              <p className="text-[11px] text-[#8e8995] pt-1">
                Default scope: India · ages 22-35 · English/Hinglish · educational content. Connectors are optional.
              </p>
            </div>

            {/* 5. Additional Stream Messages (if any sent) */}
            {messages.slice(1).map((m) => {
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
                    <div className="w-8 h-8 rounded-full bg-neutral-100 border border-[#dcd7e3] flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-[#14121a]" />
                    </div>
                    <div className="flex-1 bg-[#f0ebff] rounded-2xl p-4 sm:p-5 text-sm sm:text-[15px] font-medium text-[#181719]">
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
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-[#716c7d] hover:bg-neutral-100 hover:text-[#14121a] transition-colors cursor-pointer"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#059669]" />
                            <span className="text-[#059669]">Copied</span>
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
            })}

            {/* 6. Dynamic Chat Loader ("and also loader for chat") */}
            {isSending && <ChatResearchLoader />}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Floating Bottom Composer Bar with Purple Drop Shadow ────────── */}
        <div className="fixed bottom-5 left-0 right-0 px-4 sm:px-6 pointer-events-none z-30 lg:pl-64">
          <div className="max-w-3xl mx-auto w-full pointer-events-auto">
            {/* Connectors Popup Menu */}
            {showConnectorsMenu && (
              <div className="mb-2 w-80 rounded-2xl border-[1.5px] border-[#181719] bg-white p-3.5 shadow-[4px_4px_0px_#181719] space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#ede9f2]">
                  <span className="text-xs font-bold text-[#14121a] font-sora">Intelligence Connectors</span>
                  <span className="text-[10px] font-mono text-[#716c7d]">Real-Time</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => toggleConnector('trends')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#f6f3ff] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-[#181719]">
                      <Database className="h-3.5 w-3.5 text-[#059669]" />
                      <span className="font-semibold">CreatorIQ Concept Radar</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeConnectors.includes('trends')
                          ? 'bg-[#e8faf3] text-[#059669]'
                          : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      {activeConnectors.includes('trends') ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleConnector('youtube')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#f6f3ff] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-[#181719]">
                      <Flame className="h-3.5 w-3.5 text-amber-600" />
                      <span className="font-semibold">Live YouTube Outliers</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeConnectors.includes('youtube')
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      {activeConnectors.includes('youtube') ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleConnector('web')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#f6f3ff] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-[#181719]">
                      <Globe className="h-3.5 w-3.5 text-[#2563eb]" />
                      <span className="font-semibold">Live Web Search</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeConnectors.includes('web')
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      {activeConnectors.includes('web') ? 'ON' : 'OFF'}
                    </span>
                  </button>
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
                placeholder="I'd like practical explainers for first-job earners..."
                className="w-full resize-none bg-transparent px-1 py-0.5 text-sm sm:text-[14.5px] text-[#181719] placeholder-[#9ca3af] focus:outline-none font-normal leading-relaxed max-h-32 min-h-[30px]"
              />

              {/* Bottom Toolbar */}
              <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-[#f0ebff]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#6b6775]">
                  <button
                    type="button"
                    onClick={() => setShowConnectorsMenu(!showConnectorsMenu)}
                    className="flex items-center gap-1 hover:text-[#14121a] transition-colors cursor-pointer"
                  >
                    <span>+ add connectors</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <span className="text-[#dcd7e3]">·</span>
                  <button
                    type="button"
                    onClick={() => setInputPrompt((p) => `${p} @source `)}
                    className="hover:text-[#14121a] transition-colors cursor-pointer"
                  >
                    @ source
                  </button>
                  <span className="text-[#dcd7e3]">·</span>
                  <button
                    type="button"
                    onClick={() => setInputPrompt((p) => `${p} #idea `)}
                    className="hover:text-[#14121a] transition-colors cursor-pointer"
                  >
                    # idea
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="hidden sm:inline-flex rounded-full border border-[#a7f3d0]/80 bg-[#e8faf3] px-3 py-1 text-xs font-bold text-[#059669]">
                    India · 22-35 · Next 14 days
                  </span>

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
