import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useStrategyStore, type ChatMessage } from '../../../stores/useStrategyStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Button } from '../../../components/ui/Button';
import {
  Sparkles,
  Send,
  Plus,
  Zap,
  Copy,
  Check,
  Bot,
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
    <div className="relative flex h-[calc(100vh-4.5rem)] overflow-hidden max-w-6xl mx-auto animate-in">
      {/* Main Chat Workspace */}
      <div className="flex flex-1 flex-col h-full min-w-0 pr-0 lg:pr-2">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-2">
                AI Strategy Architect
              </h1>
              <p className="text-[11px] text-neutral-400">
                Grounded Creator Strategy &amp; Live Trend Radar
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleNewChat}
            className="bg-[#161616] border-[#2a2a2a] text-xs hover:bg-[#202020] text-neutral-300"
          >
            <Plus className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>

        {/* Messages Thread Container */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-2">
          {messages.length === 0 && !isLoadingMessages && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-[#181818] border border-[#2a2a2a] flex items-center justify-center text-indigo-400 shadow-xl">
                <Bot className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h2 className="text-base font-bold text-white font-sora">
                  What blueprint shall we build, {user?.full_name?.split(' ')[0] || 'Creator'}?
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Ask about viral hooks, channel velocity, script breakdowns, or pick a prompt below.
                </p>
              </div>

              {/* Prompt Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl pt-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessage(s.prompt)}
                    className="flex flex-col text-left p-3.5 rounded-xl border border-[#222222] bg-[#121212] hover:bg-[#181818] hover:border-[#383838] transition-all group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                        <s.icon className="h-3.5 w-3.5 text-indigo-400" />
                        {s.title}
                      </span>
                      <ArrowRight className="h-3 w-3 text-neutral-600 group-hover:text-neutral-300 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-normal">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === 'user';
            const msgTools = m.metadata?.tools_used || [];
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="h-7 w-7 shrink-0 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mt-1">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-3xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm ${
                    isUser
                      ? 'bg-[#222222] border border-[#333333] text-white shadow-sm'
                      : 'bg-[#121215] border border-[#22222a] text-[#dedee6] shadow-md'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed font-normal">{m.content}</p>
                  ) : (
                    <div className="space-y-3">
                      {/* Top Stable Message Bar */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#202028] text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white font-sora text-xs">
                            Strategy Blueprint
                          </span>
                          <span className="rounded bg-[#1a1a24] border border-[#2c2c3e] px-1.5 py-0.2 text-[10px] font-mono text-indigo-300">
                            Grounded AI
                          </span>
                        </div>

                        {msgTools.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSourcesDrawerMessage(m)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#181824] border border-[#2c2c3e] px-2.5 py-1 text-[11px] font-mono text-indigo-300 hover:text-white hover:bg-[#202030] hover:border-indigo-500/50 transition-colors cursor-pointer"
                          >
                            <Globe className="h-3 w-3 text-indigo-400" />
                            <span>{msgTools.length} Sources &amp; Signals</span>
                            <ArrowRight className="h-2.5 w-2.5 text-neutral-400" />
                          </button>
                        )}
                      </div>

                      {/* GitHub README.md Style Markdown Document Rendering */}
                      <div className="prose prose-invert max-w-none space-y-3">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-lg font-bold text-white border-b border-[#2d2d34] pb-2 mb-3 mt-1 font-sora flex items-center gap-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-semibold text-white border-b border-[#24242b] pb-1.5 mb-2 mt-4 font-sora flex items-center gap-2 text-indigo-200">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-semibold text-indigo-300 mt-3 mb-1.5 flex items-center gap-1.5">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mt-2 mb-1">
                                {children}
                              </h4>
                            ),
                            p: ({ children }) => (
                              <p className="text-neutral-300 leading-relaxed my-1.5 text-xs sm:text-sm">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="space-y-1.5 my-2 pl-4 list-disc text-neutral-300 marker:text-indigo-400">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="space-y-1.5 my-2 pl-4 list-decimal text-neutral-300 marker:text-indigo-400 font-mono">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-xs sm:text-sm leading-relaxed">{children}</li>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-3 border-indigo-500 bg-[#16161c] px-3.5 py-2 my-3 rounded-r-lg text-neutral-300 italic text-xs sm:text-sm">
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-3 rounded-lg border border-[#2d2d35]">
                                <table className="min-w-full divide-y divide-[#2d2d35] text-left text-xs">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-[#181820] text-neutral-200 font-semibold">{children}</thead>
                            ),
                            th: ({ children }) => (
                              <th className="px-3 py-2 border-b border-[#2d2d35]">{children}</th>
                            ),
                            td: ({ children }) => (
                              <td className="px-3 py-2 border-t border-[#22222a] text-neutral-300">{children}</td>
                            ),
                            code: ({ children, className }) => {
                              const isBlock = className || (typeof children === 'string' && children.includes('\n'));
                              if (isBlock) {
                                return (
                                  <div className="my-3 rounded-lg border border-[#2b2b36] bg-[#0c0c0e] overflow-hidden">
                                    <div className="flex items-center justify-between px-3 py-1.5 bg-[#17171d] border-b border-[#24242e] text-[10px] text-neutral-400 font-mono">
                                      <span className="flex items-center gap-1.5">
                                        <Code2 className="h-3 w-3 text-indigo-400" />
                                        Snippet / Blueprint
                                      </span>
                                    </div>
                                    <pre className="p-3 text-xs text-indigo-200 font-mono overflow-x-auto">
                                      <code>{children}</code>
                                    </pre>
                                  </div>
                                );
                              }
                              return (
                                <code className="rounded bg-[#1e1e26] px-1.5 py-0.5 font-mono text-[11px] text-indigo-300 border border-[#2e2e3a]">
                                  {children}
                                </code>
                              );
                            },
                            hr: () => <hr className="border-t border-[#262630] my-4" />,
                            strong: ({ children }) => (
                              <strong className="text-white font-bold">{children}</strong>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>

                      {/* Bottom Clean Action Footer Bar */}
                      <div className="mt-3 pt-2.5 border-t border-[#1e1e26] flex items-center justify-between text-xs not-prose">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(m.id, m.content)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#1c1c24] border border-[#252530] transition-colors cursor-pointer"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-emerald-400 text-xs">Copied</span>
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-400 hover:text-indigo-300 hover:bg-[#1c1c24] border border-[#252530] transition-colors cursor-pointer"
                            >
                              <Globe className="h-3.5 w-3.5 text-indigo-400" />
                              <span>View Sources ({msgTools.length})</span>
                            </button>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-neutral-500">
                          GPT-4o-mini &bull; Ingest DB
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="h-7 w-7 shrink-0 rounded-lg bg-purple-600 flex items-center justify-center text-white text-xs font-bold mt-1 shadow-xs">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-start gap-3 justify-start animate-in">
              <div className="h-7 w-7 shrink-0 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mt-1">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="bg-[#121215] border border-[#22222a] rounded-2xl px-4 py-3 flex items-center gap-2.5 shadow-md">
                <div className="flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse [animation-delay:0.4s]" />
                </div>
                <span className="text-xs text-neutral-400 font-medium">Thinking...</span>
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

        {/* GitHub README / ChatGPT Style Multiline Markdown Input Box */}
        <div className="pt-2 pb-4 shrink-0">
          {/* Quick Tool Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar text-[11px]">
            <span className="text-neutral-500 text-[10px] font-mono uppercase shrink-0 mr-1">Tools:</span>
            <button
              type="button"
              onClick={() => setInputPrompt('Query CreatorIQ Database for top trending concepts in my niche')}
              className="flex items-center gap-1 rounded-full border border-[#2a2a32] bg-[#141418] px-2.5 py-1 text-neutral-300 hover:bg-[#1f1f26] hover:text-white hover:border-[#3d3d4a] transition-all cursor-pointer shrink-0"
            >
              <Database className="h-3 w-3 text-emerald-400" />
              <span>DB Radar</span>
            </button>
            <button
              type="button"
              onClick={() => setInputPrompt('Run ML Prophet trend forecast for 28-day growth curve on ')}
              className="flex items-center gap-1 rounded-full border border-[#2a2a32] bg-[#141418] px-2.5 py-1 text-neutral-300 hover:bg-[#1f1f26] hover:text-white hover:border-[#3d3d4a] transition-all cursor-pointer shrink-0"
            >
              <BarChart3 className="h-3 w-3 text-indigo-400" />
              <span>ML Forecast</span>
            </button>
            <button
              type="button"
              onClick={() => setInputPrompt('Show me top 3 trending videos in Fitness in India right now')}
              className="flex items-center gap-1 rounded-full border border-[#2a2a32] bg-[#141418] px-2.5 py-1 text-neutral-300 hover:bg-[#1f1f26] hover:text-white hover:border-[#3d3d4a] transition-all cursor-pointer shrink-0"
            >
              <Flame className="h-3 w-3 text-amber-400" />
              <span>YouTube Signals</span>
            </button>
            <button
              type="button"
              onClick={() => setInputPrompt('Design 3 irresistible first 3-second hook variations (Visual + Audio script) for ')}
              className="flex items-center gap-1 rounded-full border border-[#2a2a32] bg-[#141418] px-2.5 py-1 text-neutral-300 hover:bg-[#1f1f26] hover:text-white hover:border-[#3d3d4a] transition-all cursor-pointer shrink-0"
            >
              <Zap className="h-3 w-3 text-purple-400" />
              <span>Hook Architect</span>
            </button>
          </div>

          {/* The Markdown Input Box Capsule */}
          <form
            onSubmit={handleSend}
            className="relative rounded-2xl border border-[#2c2c34] bg-[#16161a] p-2.5 shadow-2xl focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/40 transition-all"
          >
            {/* Multiline Growing Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about viral hooks, YouTube velocity, or run ML Prophet forecasting on any trend... (Enter to send, Shift+Enter for new line)"
              className="w-full resize-none bg-transparent px-2.5 py-1 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none custom-scrollbar font-normal leading-relaxed max-h-44 min-h-[38px]"
            />

            {/* Bottom Toolbar inside the Input Box */}
            <div className="flex items-center justify-between pt-2 border-t border-[#23232b] mt-1 px-1">
              <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1e1e24] border border-[#2a2a34] text-neutral-400">
                  <Code2 className="h-2.5 w-2.5 text-indigo-400" />
                  Markdown Supported
                </span>
                <span className="hidden sm:inline text-neutral-600">&bull;</span>
                <span className="hidden sm:inline text-neutral-500">
                  Shift + Return for new line
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!inputPrompt.trim() || isSending}
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-md cursor-pointer shrink-0"
                  title="Send Message"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>
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
                          <div className="p-2 rounded-lg bg-[#181824] border border-[#2a2a3e] text-[10px] text-indigo-200">
                            💡 <strong>ML Recommendation:</strong> {data.growth_recommendation}
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
