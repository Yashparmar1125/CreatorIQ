import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { useStrategyStore } from '../../../stores/useStrategyStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Sparkles,
  Send,
  Plus,
  Zap,
  Film,
  TrendingUp,
  Copy,
  Check,
  Bot,
  ArrowRight,
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
    icon: TrendingUp,
    title: 'Competitor Opportunity Scan',
    desc: 'Find audience demand gaps and underserved angles',
    prompt: 'What are the biggest content gaps and rising trend opportunities in my niche right now?',
  },
  {
    icon: Film,
    title: '7-Day Content Blueprint',
    desc: 'Structured schedule balancing Shorts velocity & Long-form depth',
    prompt: 'Create a strategic 7-day YouTube posting calendar balancing viral shorts and high-retention concepts.',
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
        // Auto restore most recent session on page reload
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isSending) return;
    const p = inputPrompt;
    setInputPrompt('');
    const newSessionId = await sendMessage(p);
    if (newSessionId && searchParams.get('session') !== newSessionId) {
      setSearchParams({ session: newSessionId }, { replace: true });
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = async () => {
    clearCurrentSession();
    setSearchParams({ new: 'true' }, { replace: true });
  };

  const renderFormattedContent = (content: string) => {
    // Render lines with markdown-like bold/headers styling cleanly
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-xs sm:text-sm text-neutral-200 leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ') || line.startsWith('#### ')) {
            return (
              <h4 key={idx} className="font-bold text-white text-sm pt-2 flex items-center gap-1.5 text-indigo-300">
                {line.replace(/^#+\s*/, '')}
              </h4>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-indigo-400 mt-1 shrink-0 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatBold(line.slice(2)) }} />
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2 py-0.5">
                <span className="text-indigo-400 font-mono font-bold shrink-0">{line.match(/^\d+\./)?.[0]}</span>
                <span dangerouslySetInnerHTML={{ __html: formatBold(line.replace(/^\d+\.\s*/, '')) }} />
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatBold(line) }} />
          );
        })}
      </div>
    );
  };

  const formatBold = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
  };

  return (
    <div className="flex h-[calc(100vh-4.5rem)] flex-col max-w-5xl mx-auto animate-in">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Creator Strategy Architect
              <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                AI Powered
              </Badge>
            </h1>
            <p className="text-[11px] text-neutral-400">
              Personalized for your channel profile &bull; OpenRouter &amp; Trend Engine
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
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
            <div className="h-12 w-12 rounded-2xl bg-[#181818] border border-[#2a2a2a] flex items-center justify-center text-indigo-400 shadow-xl">
              <Bot className="h-6 w-6" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h2 className="text-base font-bold text-white font-sora">
                What strategy shall we build today, {user?.full_name?.split(' ')[0] || 'Creator'}?
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Ask anything about YouTube velocity, retention hooks, title testing, or pick a prompt below.
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
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in`}
            >
              {!isUser && (
                <div className="h-7 w-7 shrink-0 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mt-0.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`relative group max-w-3xl rounded-2xl p-4 text-xs sm:text-sm ${
                  isUser
                    ? 'bg-[#222222] border border-[#333333] text-white'
                    : 'bg-[#141414] border border-[#222222] text-[#ededed] shadow-md'
                }`}
              >
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => handleCopy(m.id, m.content)}
                    className="absolute top-3 right-3 p-1 rounded-md text-neutral-500 hover:text-white hover:bg-[#222222] transition-colors opacity-0 group-hover:opacity-100"
                    title="Copy blueprint"
                  >
                    {copiedId === m.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}

                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                ) : (
                  renderFormattedContent(m.content)
                )}
              </div>

              {isUser && (
                <div className="h-7 w-7 shrink-0 rounded-lg bg-purple-600 flex items-center justify-center text-white text-xs font-bold mt-0.5 shadow-xs">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-start gap-3 justify-start animate-in">
            <div className="h-7 w-7 shrink-0 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mt-0.5">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-neutral-400 ml-1.5 font-medium">
                Synthesizing viral strategy &amp; hooks...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg border border-red-900/40 bg-red-950/20 text-xs text-red-300">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Capsule Box */}
      <div className="pt-2 pb-2 shrink-0 border-t border-[#1a1a1a]">
        <form
          onSubmit={handleSend}
          className="relative flex items-center rounded-2xl border border-[#2e2e2e] bg-[#181818] px-3.5 py-2.5 shadow-xl focus-within:border-[#444444] transition-all"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask about video ideas, viral hooks, script breakdowns..."
            disabled={isSending}
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none border-0"
          />

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isSending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-black hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer shadow-xs ml-2"
            style={{ backgroundColor: '#ffffff', color: '#000000' }}
          >
            <Send className="h-3.5 w-3.5" style={{ color: '#000000' }} />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1.5 px-2">
          <span>AI Strategy Assistant &bull; CreatorIQ v1</span>
          <span className="hidden sm:inline">Responses cached in Redis for fast recovery</span>
        </div>
      </div>
    </div>
  );
};
