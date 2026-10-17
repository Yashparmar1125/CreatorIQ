import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStrategyStore, type ChatMessage, type AgentStep, type AgentCard } from '../../../stores/useStrategyStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Button } from '../../../components/ui/Button';
import { TopicStrategyCard, type TopicStrategyItem } from '../components/TopicStrategyCard';
import { ScriptStudioModal } from '../components/ScriptStudioModal';
import { parseStrategyTopics } from '../utils/parseStrategyTopics';
import {
  Sparkles,
  Plus,
  Zap,
  Copy,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Database,
  Flame,
  Code2,
  Globe,
  ExternalLink,
  X,
  Layers,
  Lightbulb,
  Target,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: Sparkles,
    title: 'Top 3 Breakout Topics',
    desc: 'Query verified momentum trends with high reach multipliers',
    prompt: 'What are the top 3 breakout video topics in tech right now with high reach multipliers?',
  },
  {
    icon: Flame,
    title: 'Small Channel Outlier Radar',
    desc: 'Find creators under 25K subs getting 5x–20x baseline views',
    prompt: 'Show me recent small creator outlier videos that got over 5x their baseline views.',
  },
  {
    icon: Zap,
    title: '3-Second Hook Architect',
    desc: 'Craft visual & audio hooks to eliminate first 3s swipe-aways',
    prompt: 'Design 3 irresistible first 3-second hook variations (Visual + Audio script) for my next video.',
  },
  {
    icon: Globe,
    title: 'Live Web & Industry News',
    desc: 'Search breaking news and viral controversies across the web',
    prompt: 'Search the live web for breaking announcements and trending creator controversies this week.',
  },
];

/* ── Inline Research Steps Accordion ─────────────────────────────────────── */
const ResearchStepsAccordion: React.FC<{ steps: AgentStep[] }> = ({ steps }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!steps || steps.length === 0) return null;

  const runningStep = steps.find((s) => s.status === 'running');
  const doneCount = steps.filter((s) => s.status === 'done').length;

  return (
    <div className="my-2 rounded-2xl border border-[#23232c] bg-[#121217] overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-[#181820] transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2 text-neutral-300">
          {runningStep ? (
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              <span className="font-medium">{runningStep.summary}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Researched {doneCount} live data {doneCount === 1 ? 'source' : 'sources'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-neutral-500">
          <span className="text-[11px] font-mono">{steps.length} {steps.length === 1 ? 'step' : 'steps'}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-3.5 pb-3 pt-1 border-t border-[#1d1d24] space-y-2">
          {steps.map((st, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[11px] text-neutral-400 pt-1">
              <div className="mt-0.5 shrink-0">
                {st.status === 'running' ? (
                  <div className="h-3 w-3 rounded-full border border-indigo-400 border-t-transparent animate-spin" />
                ) : (
                  <Check className="h-3 w-3 text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-neutral-200">{st.label}</span>
                  {st.duration_ms !== undefined && st.duration_ms > 0 && (
                    <span className="text-[10px] font-mono text-neutral-500">{st.duration_ms}ms</span>
                  )}
                </div>
                <p className="text-neutral-400 truncate">{st.summary}</p>
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
              className="rounded-2xl border border-[#2b2b38] bg-[#13131b] p-3.5 flex flex-col justify-between space-y-3 hover:border-indigo-500/50 transition-all shadow-md"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                    Trend Opportunity
                  </span>
                  {t.opportunity_score && (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {Math.round(t.opportunity_score)} / 100
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{t.topic}</h4>
                {t.why_trending && (
                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{t.why_trending}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f1f28]">
                {t.id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/app/trends/${t.id}`)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
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
              className="rounded-2xl border border-[#2b2b38] bg-[#13131b] p-3.5 flex flex-col justify-between space-y-3 hover:border-amber-500/50 transition-all shadow-md"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                    Outlier Video Proof
                  </span>
                  {v.reach_multiplier && (
                    <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                      {v.reach_multiplier} Outlier
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2">{v.title}</h4>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                  <span>{v.channel}</span>
                  {v.views !== undefined && <span>• {Number(v.views).toLocaleString()} views</span>}
                </div>
              </div>
              {v.url && (
                <div className="flex items-center justify-end pt-2 border-t border-[#1f1f28]">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
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

/* ── Strategy Message Content with Claude-style Interactive Cards ──────── */
const StrategyMessageContent: React.FC<{
  content: string;
  onOpenStudio: (t: TopicStrategyItem) => void;
  onAskCopilot: (prompt: string) => void;
}> = ({ content, onOpenStudio, onAskCopilot }) => {
  const parsed = parseStrategyTopics(content);

  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-lg font-bold text-white pb-1 mb-2 mt-2 font-sora flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
        <span>{children}</span>
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-base font-semibold text-white pb-1 mb-2 mt-5 font-sora flex items-center gap-2">
        <Target className="h-4 w-4 text-indigo-400 shrink-0" />
        <span>{children}</span>
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-sm font-semibold text-neutral-100 mt-4 mb-1.5 flex items-center gap-2">
        <Lightbulb className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        <span>{children}</span>
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mt-3 mb-1 flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <span>{children}</span>
      </h4>
    ),
    p: ({ children }: any) => (
      <p className="text-[#e3e3e3] leading-7 my-2 text-[14px]">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="space-y-1.5 my-2.5 pl-5 list-disc text-[#dcdce0] marker:text-neutral-500">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="space-y-2 my-2.5 pl-5 list-decimal text-[#dcdce0] marker:text-neutral-400">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-[14px] leading-7">{children}</li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-2 border-indigo-500/70 bg-[#141418] px-4 py-2.5 my-3 rounded-r-xl text-neutral-300 text-[13.5px]">
        {children}
      </blockquote>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4 rounded-xl border border-[#262626]">
        <table className="min-w-full divide-y divide-[#262626] text-left text-xs">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-[#161616] text-neutral-200 font-semibold">{children}</thead>
    ),
    th: ({ children }: any) => (
      <th className="px-3.5 py-2.5 border-b border-[#262626]">{children}</th>
    ),
    td: ({ children }: any) => (
      <td className="px-3.5 py-2.5 border-t border-[#1e1e1e] text-neutral-300">{children}</td>
    ),
    code: ({ children, className }: any) => {
      const isBlock = className || (typeof children === 'string' && children.includes('\n'));
      if (isBlock) {
        return (
          <div className="my-3 rounded-xl border border-[#262626] bg-[#111113] overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#18181b] border-b border-[#242429] text-[11px] text-neutral-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Code2 className="h-3 w-3 text-indigo-400" />
                Blueprint
              </span>
            </div>
            <pre className="p-3.5 text-xs text-neutral-200 font-mono overflow-x-auto">
              <code>{children}</code>
            </pre>
          </div>
        );
      }
      return (
        <code className="rounded-md bg-[#1c1c22] px-1.5 py-0.5 font-mono text-xs text-indigo-300">
          {children}
        </code>
      );
    },
    hr: () => <hr className="border-t border-[#1f1f1f] my-5" />,
    strong: ({ children }: any) => (
      <strong className="text-white font-semibold">{children}</strong>
    ),
  };

  if (!parsed.hasTopics) {
    return (
      <div className="prose prose-invert max-w-none space-y-3">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Intro section if present */}
      {parsed.introText && (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {parsed.introText}
          </ReactMarkdown>
        </div>
      )}

      {/* Interactive Claude/ChatGPT-style Topic Cards */}
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

      {/* Outro section if present */}
      {parsed.outroText && (
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {parsed.outroText}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

/* ── Main StrategyPage Component ─────────────────────────────────────────── */
export const StrategyPage: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const {
    messages,
    isSending,
    isLoadingMessages,
    error,
    activeConnectors,
    toggleConnector,
    sendMessage,
    selectSession,
    fetchSessions,
    clearCurrentSession,
  } = useStrategyStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sourcesDrawerMessage, setSourcesDrawerMessage] = useState<ChatMessage | null>(null);
  const [showConnectorsMenu, setShowConnectorsMenu] = useState(false);
  const [studioTopic, setStudioTopic] = useState<TopicStrategyItem | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialTriggered = useRef(false);

  const sessionParam = searchParams.get('session');
  const isNewParam = searchParams.get('new');

  // Fetch sessions and restore conversation on mount / reload
  useEffect(() => {
    const init = async () => {
      const loadedSessions = await fetchSessions();
      if (sessionParam) {
        await selectSession(sessionParam);
      } else if (!isNewParam && !location.state?.prompt && loadedSessions.length > 0) {
        await selectSession(loadedSessions[0].id);
        setSearchParams({ session: loadedSessions[0].id }, { replace: true });
      }
    };
    init();
  }, [sessionParam, isNewParam]);

  // Handle incoming navigation state (e.g. from Dashboard or Trends page)
  useEffect(() => {
    if (initialTriggered.current) return;
    const state = location.state as { prompt?: string; topic?: string; autoGenerate?: boolean } | null;
    if (state?.prompt || state?.topic) {
      initialTriggered.current = true;
      const initialText = state.prompt || (state.topic ? `Deep strategy and viral hooks for: ${state.topic}` : '');
      if (initialText) {
        sendMessage(initialText).then((newSessionId) => {
          if (newSessionId) {
            setSearchParams({ session: newSessionId }, { replace: true });
          }
        });
      }
    }
  }, [location.state, sendMessage, setSearchParams]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
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
    const newSessionId = await sendMessage(p);
    if (newSessionId && searchParams.get('session') !== newSessionId) {
      setSearchParams({ session: newSessionId }, { replace: true });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = async () => {
    clearCurrentSession();
    setSourcesDrawerMessage(null);
    setSearchParams({ new: 'true' }, { replace: true });
  };

  const toolsUsed = sourcesDrawerMessage?.metadata?.tools_used || [];

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#0a0a0a] animate-in">
      {/* Main Chat Workspace */}
      <div className="relative flex flex-1 flex-col h-full min-w-0">
        {/* Subtle Floating Top-Right New Chat Action */}
        {messages.length > 0 && (
          <div className="pointer-events-none absolute top-3 right-4 z-10 flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleNewChat}
              className="pointer-events-auto rounded-full bg-[#161616]/90 backdrop-blur-md border-[#282828] px-3.5 py-1.5 text-xs hover:bg-[#222222] text-neutral-300 shadow-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              New Chat
            </Button>
          </div>
        )}

        {/* Full-Width Scrollable Stream */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar px-4 sm:px-6 pt-6 pb-8">
          <div className="mx-auto w-full max-w-3xl space-y-8">
            {messages.length === 0 && !isLoadingMessages && (
              <div className="flex min-h-[62vh] flex-col items-center justify-center text-center space-y-7">
                <div className="space-y-2.5 max-w-lg">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#262626] bg-[#141414] text-indigo-400 shadow-lg">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sora">
                    CreatorIQ Copilot{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
                  </h2>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    Autonomous YouTube strategist powered by live concept radar, outlier detection, and multi-key LLM reasoning.
                  </p>
                </div>

                {/* Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                  {SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessage(s.prompt)}
                      className="flex flex-col justify-between text-left p-4 rounded-2xl border border-[#222222] bg-[#141414] hover:bg-[#1b1b1b] hover:border-[#333333] transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-neutral-200 group-hover:text-white transition-colors flex items-center gap-2">
                          <s.icon className="h-4 w-4 text-indigo-400 shrink-0" />
                          {s.title}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-neutral-300 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === 'user';
              const steps = m.metadata?.steps || [];
              const cards = m.metadata?.cards || [];
              const msgTools = m.metadata?.tools_used || [];
              const cleanContent = m.content.replace(
                /[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\uFE0F\u20E3]/gu,
                ''
              );

              if (isUser) {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[78%] rounded-3xl bg-[#212121] px-5 py-3 text-[14px] leading-relaxed text-[#ececec]">
                      <p className="whitespace-pre-wrap font-normal">{cleanContent}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2a2a35] bg-[#14141c] text-indigo-400">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>

                  {/* Assistant Response Canvas */}
                  <div className="min-w-0 flex-1 space-y-3">
                    {/* Collapsible Research Steps Timeline */}
                    {steps.length > 0 && <ResearchStepsAccordion steps={steps} />}

                    {/* Interactive Cards (e.g. Trends & Outlier Videos) */}
                    {cards.length > 0 && <InteractiveCardsList cards={cards} />}

                    {/* Markdown Content & Claude-style Interactive Topic Cards */}
                    {cleanContent && (
                      <StrategyMessageContent
                        content={cleanContent}
                        onOpenStudio={(t) => setStudioTopic(t)}
                        onAskCopilot={(prompt) => {
                          setInputPrompt(prompt);
                          sendMessage(prompt);
                        }}
                      />
                    )}

                    {/* Action Bar Under Response */}
                    <div className="flex items-center gap-2 pt-1 not-prose">
                      {cleanContent && (
                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, cleanContent)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-500 hover:bg-[#181818] hover:text-neutral-200 transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}

                      {msgTools.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSourcesDrawerMessage(m)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3 py-1 text-xs font-medium text-neutral-400 hover:border-[#383838] hover:bg-[#1c1c1c] hover:text-white transition-colors cursor-pointer"
                        >
                          <Globe className="h-3 w-3 text-indigo-400" />
                          <span>{msgTools.length} Sources</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-start gap-4 animate-in">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2a2a35] bg-[#14141c] text-indigo-400">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                </div>
                <div className="flex items-center gap-2 py-1.5">
                  <span className="text-sm text-neutral-400 animate-pulse">Running live market research...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-300 flex items-center justify-between">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => useStrategyStore.getState().fetchSessions()}
                  className="underline text-red-200 hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Capsule Composer */}
        <div className="shrink-0 w-full bg-[#0a0a0a] px-4 pb-4 pt-1">
          <div className="mx-auto w-full max-w-3xl relative">
            {/* Connectors Popover */}
            {showConnectorsMenu && (
              <div className="absolute bottom-full mb-3 left-2 z-30 w-80 rounded-2xl border border-[#2e2e3a] bg-[#14141c] p-3.5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#22222e]">
                  <span className="text-xs font-bold text-white font-sora">Intelligence Connectors</span>
                  <span className="text-[10px] font-mono text-neutral-400">Real-Time</span>
                </div>

                {/* YouTube Channel Status */}
                <div className="rounded-xl border border-[#22222d] bg-[#0d0d12] p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-rose-400" />
                      YouTube Channel
                    </span>
                    <span className="text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 font-mono font-medium">
                      Connected
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Channel: <strong className="text-white">Tech In Shorts</strong> (Optional connector)
                  </p>
                </div>

                {/* Toggles */}
                <div className="space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => toggleConnector('trends')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1c1c28] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Database className="h-3.5 w-3.5 text-emerald-400" />
                      <span>CreatorIQ Concept Radar</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeConnectors.includes('trends')
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {activeConnectors.includes('trends') ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleConnector('web')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1c1c28] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Globe className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Tavily Live Web Search</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeConnectors.includes('web')
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {activeConnectors.includes('web') ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleConnector('youtube')}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1c1c28] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Flame className="h-3.5 w-3.5 text-amber-400" />
                      <span>Live YouTube Outliers</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeConnectors.includes('youtube')
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {activeConnectors.includes('youtube') ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSend}
              className="relative rounded-3xl border border-[#2e2e2e] bg-[#1b1b1b] px-4 pt-3 pb-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)] focus-within:border-[#404040] transition-all"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about video ideas, hooks, or trend forecasts..."
                className="w-full resize-none bg-transparent px-1 py-0.5 text-sm text-white placeholder-neutral-500 focus:outline-none no-scrollbar font-normal leading-relaxed max-h-36 min-h-[28px]"
              />

              {/* Bottom Action Row inside Capsule */}
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {/* Connectors '+' Pill Button */}
                  <button
                    type="button"
                    onClick={() => setShowConnectorsMenu(!showConnectorsMenu)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-950/30 px-2.5 py-1 text-[11px] font-medium text-indigo-300 hover:bg-indigo-900/40 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <SlidersHorizontal className="h-3 w-3 text-indigo-400" />
                    <span>Connectors ({activeConnectors.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputPrompt('Query CreatorIQ Database for top trending concepts in my niche')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2e2e2e] bg-[#242424] px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:bg-[#2e2e2e] hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Database className="h-3 w-3 text-emerald-400" />
                    <span>DB Radar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputPrompt('Show me recent small creator outlier videos with 5x baseline views')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2e2e2e] bg-[#242424] px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:bg-[#2e2e2e] hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Flame className="h-3 w-3 text-amber-400" />
                    <span>Outliers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputPrompt('Design 3 high-retention 3-second hook variations for ')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2e2e2e] bg-[#242424] px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:bg-[#2e2e2e] hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Zap className="h-3 w-3 text-purple-400" />
                    <span>Hook Architect</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!inputPrompt.trim() || isSending}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black hover:bg-neutral-200 disabled:opacity-30 transition-all cursor-pointer shadow-xs"
                  style={{ backgroundColor: '#ffffff', color: '#000000' }}
                  title="Send message"
                >
                  <ArrowRight className="h-4 w-4 -rotate-90" style={{ color: '#000000' }} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Slide-Over Sources & Telemetry Drawer */}
      {sourcesDrawerMessage && (
        <aside className="w-80 sm:w-96 shrink-0 h-full border-l border-[#24242e] bg-[#0e0e12] flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between p-4 border-b border-[#20202a] bg-[#121217]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Sources &amp; Telemetry</h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  {sourcesDrawerMessage.metadata?.model || 'Free Multi-Model Router'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSourcesDrawerMessage(null)}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-[#1f1f28] transition-colors"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono pb-2 border-b border-[#1c1c24]">
              <span>Signals Used:</span>
              <span className="font-bold text-indigo-300">{toolsUsed.length} Active Sources</span>
            </div>

            {toolsUsed.length === 0 ? (
              <div className="text-center py-10 text-neutral-500 text-xs">
                No external tool calls recorded for this message.
              </div>
            ) : (
              toolsUsed.map((tool: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#22222c] bg-[#14141a] p-3.5 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{tool.label || tool.tool}</span>
                    {tool.duration_ms && (
                      <span className="rounded bg-[#1c1c26] border border-[#2c2c3a] px-1.5 py-0.5 text-[9px] font-mono text-neutral-300">
                        {tool.duration_ms}ms
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">{tool.summary}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Script Studio & Teleprompter Modal */}
      <ScriptStudioModal
        topic={studioTopic}
        isOpen={!!studioTopic}
        onClose={() => setStudioTopic(null)}
      />
    </div>
  );
};
