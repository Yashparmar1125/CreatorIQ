import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStrategyStore, type ChatMessage } from '../../../stores/useStrategyStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Button } from '../../../components/ui/Button';
import {
  Sparkles,
  Plus,
  Zap,
  Copy,
  Check,
  ArrowRight,
  Database,
  BarChart3,
  Flame,
  Code2,
  Globe,
  ExternalLink,
  X,
  Layers,
  UserCheck,
  Lightbulb,
  Target,
  TrendingUp,
} from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: Sparkles,
    title: '5 Viral Short Ideas',
    desc: 'Generate high-CTR ideas matched with current Indian trends',
    prompt: 'Give me 5 viral short video ideas tailored to my channel niche with high novelty.',
  },
  {
    icon: Zap,
    title: '3-Second Hook Architect',
    desc: 'Craft visual & audio hooks to eliminate first 3s swipe-aways',
    prompt: 'Design 3 irresistible first 3-second hook variations (Visual + Audio script) for my next video.',
  },
  {
    icon: BarChart3,
    title: 'ML Prophet Trend Forecast',
    desc: 'Run 28-day predictive trajectory modeling on rising topics',
    prompt: 'Run our ML trend forecast model to predict the 28-day growth curve and peak window for AI Coding Tools.',
  },
  {
    icon: Database,
    title: 'CreatorIQ DB Ingest Radar',
    desc: 'Query proprietary scored concepts and momentum signals',
    prompt: 'Query our CreatorIQ database for top scored breakout concepts in Tech and Entertainment.',
  },
];

export const StrategyPage: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const {
    messages,
    isSending,
    isLoadingMessages,
    error,
    sendMessage,
    selectSession,
    fetchSessions,
    clearCurrentSession,
  } = useStrategyStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sourcesDrawerMessage, setSourcesDrawerMessage] = useState<ChatMessage | null>(null);
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
        {/* Subtle Floating Top-Right New Chat Action (Gemini / ChatGPT style) */}
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

        {/* Full-Width Scrollable Stream (Scrollbar hidden — pure ChatGPT / Gemini canvas) */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar px-4 sm:px-6 pt-6 pb-8">
          <div className="mx-auto w-full max-w-3xl space-y-8">
            {messages.length === 0 && !isLoadingMessages && (
              <div className="flex min-h-[62vh] flex-col items-center justify-center text-center space-y-7">
                <div className="space-y-2.5 max-w-lg">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#262626] bg-[#141414] text-indigo-400 shadow-lg">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sora">
                    Hello, {user?.full_name?.split(' ')[0] || 'Creator'}
                  </h2>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    How can I help you architect your next viral video today?
                  </p>
                </div>

                {/* Gemini / ChatGPT Suggestion Cards */}
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
                  {/* Gemini / ChatGPT Circular Sparkle Avatar */}
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2a2a35] bg-[#14141c] text-indigo-400">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>

                  {/* Open-Canvas Assistant Response (No Box Border!) */}
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="prose prose-invert max-w-none space-y-3">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-lg font-bold text-white pb-1 mb-2 mt-2 font-sora flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
                              <span>{children}</span>
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base font-semibold text-white pb-1 mb-2 mt-5 font-sora flex items-center gap-2">
                              <Target className="h-4 w-4 text-indigo-400 shrink-0" />
                              <span>{children}</span>
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-semibold text-neutral-100 mt-4 mb-1.5 flex items-center gap-2">
                              <Lightbulb className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                              <span>{children}</span>
                            </h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mt-3 mb-1 flex items-center gap-1.5">
                              <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              <span>{children}</span>
                            </h4>
                          ),
                          p: ({ children }) => (
                            <p className="text-[#e3e3e3] leading-7 my-2 text-[14px]">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="space-y-1.5 my-2.5 pl-5 list-disc text-[#dcdce0] marker:text-neutral-500">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="space-y-2 my-2.5 pl-5 list-decimal text-[#dcdce0] marker:text-neutral-400">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-[14px] leading-7">{children}</li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-indigo-500/70 bg-[#141418] px-4 py-2.5 my-3 rounded-r-xl text-neutral-300 text-[13.5px]">
                              {children}
                            </blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-4 rounded-xl border border-[#262626]">
                              <table className="min-w-full divide-y divide-[#262626] text-left text-xs">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-[#161616] text-neutral-200 font-semibold">{children}</thead>
                          ),
                          th: ({ children }) => (
                            <th className="px-3.5 py-2.5 border-b border-[#262626]">{children}</th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3.5 py-2.5 border-t border-[#1e1e1e] text-neutral-300">{children}</td>
                          ),
                          code: ({ children, className }) => {
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
                          strong: ({ children }) => (
                            <strong className="text-white font-semibold">{children}</strong>
                          ),
                        }}
                      >
                        {cleanContent}
                      </ReactMarkdown>
                    </div>

                    {/* Subtle ChatGPT / Gemini Action Bar Under Response */}
                    <div className="flex items-center gap-2 pt-1 not-prose">
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
                  <span className="text-sm text-neutral-400 animate-pulse">Thinking...</span>
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

        {/* ChatGPT / Gemini Bottom Capsule Composer (Never overlaps text, zero scrollbar clutter) */}
        <div className="shrink-0 w-full bg-[#0a0a0a] px-4 pb-4 pt-1">
          <div className="mx-auto w-full max-w-3xl">
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

              {/* Integrated Bottom Action Row inside Capsule (ChatGPT / Gemini style) */}
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                    onClick={() => setInputPrompt('Run ML trend forecast for 28-day growth curve on ')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2e2e2e] bg-[#242424] px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:bg-[#2e2e2e] hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <BarChart3 className="h-3 w-3 text-indigo-400" />
                    <span>ML Forecast</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputPrompt('Show me top 3 trending videos in my niche in India right now')}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2e2e2e] bg-[#242424] px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:bg-[#2e2e2e] hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    <Flame className="h-3 w-3 text-amber-400" />
                    <span>YouTube Signals</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputPrompt('Design 3 irresistible first 3-second hook variations (Visual + Audio script) for ')}
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

      {/* Right Slide-Over Sources & Telemetry Drawer (ChatGPT / Gemini / Perplexity Style) */}
      {sourcesDrawerMessage && (
        <aside className="w-80 sm:w-96 shrink-0 h-full border-l border-[#24242e] bg-[#0e0e12] flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#20202a] bg-[#121217]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Sources &amp; Telemetry</h3>
                <p className="text-[10px] text-neutral-400 font-mono">Grounding Data &amp; Models</p>
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

          {/* Drawer Scrollable Content */}
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
              toolsUsed.map((tool: any, idx: number) => {
                const data = tool.data || {};
                const name = tool.name;

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#22222c] bg-[#14141a] p-3.5 space-y-2.5 shadow-sm"
                  >
                    {/* Tool Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {name === 'get_youtube_trends' && <Flame className="h-4 w-4 text-amber-400" />}
                        {name === 'predict_trend_forecast_ml' && <BarChart3 className="h-4 w-4 text-indigo-400" />}
                        {name === 'query_creatoriq_database' && <Database className="h-4 w-4 text-emerald-400" />}
                        {name === 'get_creator_profile' && <UserCheck className="h-4 w-4 text-purple-400" />}
                        <span className="font-bold text-white text-xs">{tool.label}</span>
                      </div>
                      <span className="rounded bg-[#1c1c26] border border-[#2c2c3a] px-1.5 py-0.5 text-[9px] font-mono text-neutral-300">
                        {tool.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-snug">{tool.summary}</p>

                    {/* 1. YouTube Signals Breakdown */}
                    {name === 'get_youtube_trends' && data.trending_videos_and_signals && (
                      <div className="space-y-2 pt-1 border-t border-[#1f1f28]">
                        <span className="text-[10px] font-mono uppercase text-neutral-500">Live Video Signals:</span>
                        {data.trending_videos_and_signals.map((v: any, vIdx: number) => (
                          <div
                            key={vIdx}
                            className="p-2 rounded-lg bg-[#0e0e12] border border-[#1e1e26] space-y-1 text-[11px]"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="font-semibold text-neutral-200 line-clamp-1">
                                {v.video_title || v.title}
                              </span>
                              {v.video_id && (
                                <a
                                  href={`https://youtube.com/watch?v=${v.video_id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-neutral-500 hover:text-red-400 shrink-0"
                                  title="Open on YouTube"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                              {v.channel_name && <span>{v.channel_name}</span>}
                              {v.views && <span>&bull; {Number(v.views).toLocaleString()} views</span>}
                              {v.velocity_score && (
                                <span className="text-amber-400 font-bold">&bull; Vel: {v.velocity_score}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2. Prophet ML Forecast Breakdown */}
                    {name === 'predict_trend_forecast_ml' && (
                      <div className="space-y-2 pt-1 border-t border-[#1f1f28] text-[11px]">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded-lg bg-[#0e0e12] border border-[#1e1e26]">
                            <span className="text-[9px] font-mono uppercase text-neutral-500 block">1-Week Target</span>
                            <span className="font-bold text-emerald-400 text-xs">
                              {data['1_week_forecast']?.forecast_score || '78.6'}
                            </span>
                            <span className="text-[9px] text-neutral-400 block">
                              {data['1_week_forecast']?.direction || '+4.8% growth'}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-[#0e0e12] border border-[#1e1e26]">
                            <span className="text-[9px] font-mono uppercase text-neutral-500 block">28-Day Target</span>
                            <span className="font-bold text-indigo-400 text-xs">
                              {data['1_month_forecast']?.forecast_score || '70.0'}
                            </span>
                            <span className="text-[9px] text-neutral-400 block">
                              {data['1_month_forecast']?.direction || 'Peak Window'}
                            </span>
                          </div>
                        </div>
                        {data.growth_recommendation && (
                          <div className="flex items-start gap-1.5 p-2 rounded-lg bg-[#181824] border border-[#2a2a3e] text-[10px] text-indigo-200">
                            <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span><strong>ML Recommendation:</strong> {data.growth_recommendation}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. CreatorIQ DB Concepts Breakdown */}
                    {name === 'query_creatoriq_database' && data.concepts && (
                      <div className="space-y-1.5 pt-1 border-t border-[#1f1f28]">
                        <span className="text-[10px] font-mono uppercase text-neutral-500">Scored Concepts:</span>
                        {data.concepts.slice(0, 3).map((c: any, cIdx: number) => (
                          <div
                            key={cIdx}
                            className="p-2 rounded-lg bg-[#0e0e12] border border-[#1e1e26] space-y-0.5 text-[11px]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-neutral-200 truncate">{c.concept_title}</span>
                              <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0 ml-1">
                                {c.momentum_score ? `${Number(c.momentum_score).toFixed(1)} TVS` : 'Scored'}
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {c.why_trending || c.indicator}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 4. Creator Profile Breakdown */}
                    {name === 'get_creator_profile' && (
                      <div className="p-2 rounded-lg bg-[#0e0e12] border border-[#1e1e26] text-[10px] space-y-1 font-mono text-neutral-300">
                        <div>Niches: {data.niches?.join(', ') || 'Tech, Entertainment'}</div>
                        <div>Target Region: {data.country || 'India'}</div>
                        <div>Tone: {data.tone || 'High energy, authentic'}</div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
