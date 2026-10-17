import React, { useState } from 'react';
import {
  Zap,
  Copy,
  Check,
  Film,
  Target,
  Bookmark,
  MessageSquare,
  TrendingUp,
  Clock,
  Flame,
  Layers,
  ChevronRight,
  Award,
  BarChart3,
} from 'lucide-react';

export interface TopicStrategyItem {
  id: string;
  rank: number;
  priorityLabel?: string;
  title: string;
  category?: string;
  metrics: {
    viralityProb?: string;
    momentumScore?: string;
    reachMultiplier?: string;
    lifecycle?: string;
    targetWindow?: string;
  };
  audience?: string;
  titles: Array<{
    title: string;
    score?: string;
    angle?: string;
  }>;
  hook?: {
    visual?: string;
    audio?: string;
    pacing?: string[];
  };
  evidenceSummary?: string;
  rawText?: string;
}

interface TopicStrategyCardProps {
  topic: TopicStrategyItem;
  onOpenStudio?: (topic: TopicStrategyItem) => void;
  onAskCopilot?: (prompt: string) => void;
  onSaveTopic?: (topic: TopicStrategyItem) => void;
}

export const TopicStrategyCard: React.FC<TopicStrategyCardProps> = ({
  topic,
  onOpenStudio,
  onAskCopilot,
  onSaveTopic,
}) => {
  const [activeTab, setActiveTab] = useState<'hook' | 'titles' | 'proof'>('hook');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = () => {
    setIsSaved(true);
    if (onSaveTopic) onSaveTopic(topic);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Rank badge styling
  const rank = topic.rank || 1;
  const isTopRank = rank === 1;

  return (
    <div className="group relative rounded-2xl border border-[#262630] bg-[#121217] shadow-xl overflow-hidden transition-all hover:border-indigo-500/40 hover:shadow-indigo-500/5 my-4">
      {/* Subtle glowing ambient back-drop */}
      {isTopRank && (
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* ── CARD HEADER ──────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-[#1f1f28] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold font-mono uppercase tracking-wider ${
                isTopRank
                  ? 'bg-indigo-950/80 border border-indigo-500/50 text-indigo-300'
                  : 'bg-neutral-900 border border-neutral-700/60 text-neutral-300'
              }`}
            >
              {isTopRank ? (
                <>
                  <Award className="h-3.5 w-3.5 text-indigo-400" />
                  #1 Top Opportunity
                </>
              ) : (
                <>
                  <Layers className="h-3 w-3 text-neutral-400" />
                  Priority {rank}
                </>
              )}
            </span>

            {topic.category && (
              <span className="rounded-md bg-[#191920] border border-[#272733] px-2 py-0.5 text-[11px] text-neutral-400 font-medium">
                {topic.category}
              </span>
            )}
          </div>

          {/* Metric Chips Header */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            {topic.metrics.viralityProb && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/70 border border-emerald-600/40 px-2 py-0.5 font-bold text-emerald-300">
                <Zap className="h-3 w-3 text-emerald-400" />
                {topic.metrics.viralityProb} Virality
              </span>
            )}

            {topic.metrics.reachMultiplier && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/70 border border-amber-600/40 px-2 py-0.5 font-bold text-amber-300">
                <Flame className="h-3 w-3 text-amber-400" />
                {topic.metrics.reachMultiplier} Reach
              </span>
            )}

            {topic.metrics.momentumScore && (
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 border border-neutral-800 px-2 py-0.5 font-medium text-neutral-300">
                <TrendingUp className="h-3 w-3 text-indigo-400" />
                {topic.metrics.momentumScore}
              </span>
            )}
          </div>
        </div>

        {/* Topic Title */}
        <h3 className="font-sora text-base sm:text-lg font-bold text-white tracking-tight leading-snug group-hover:text-indigo-200 transition-colors">
          {topic.title}
        </h3>

        {/* Quick Audience One-Liner if present */}
        {topic.audience && (
          <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
            <span className="text-neutral-300 font-medium">Target Audience:</span> {topic.audience}
          </p>
        )}
      </div>

      {/* ── CARD TAB NAVIGATION (Claude/ChatGPT style) ────────────────────────── */}
      <div className="flex items-center gap-1 px-4 sm:px-5 pt-2.5 border-b border-[#1b1b24] bg-[#0e0e13]">
        <button
          type="button"
          onClick={() => setActiveTab('hook')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-b-2 ${
            activeTab === 'hook'
              ? 'border-indigo-500 text-white bg-[#15151e]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Film className="h-3.5 w-3.5 text-indigo-400" />
          <span>Hook &amp; Script Blueprint</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('titles')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-b-2 ${
            activeTab === 'titles'
              ? 'border-indigo-500 text-white bg-[#15151e]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Target className="h-3.5 w-3.5 text-emerald-400" />
          <span>High-CTR Titles ({topic.titles.length || 3})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('proof')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-b-2 ${
            activeTab === 'proof'
              ? 'border-indigo-500 text-white bg-[#15151e]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
          <span>Proof &amp; Strategy</span>
        </button>
      </div>

      {/* ── CARD TAB BODY ────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 text-xs space-y-4">
        {/* TAB 1: HOOK & SCRIPT BLUEPRINT */}
        {activeTab === 'hook' && (
          <div className="space-y-3.5 animate-in">
            {/* Visual Hook Box */}
            <div className="rounded-xl border border-[#23232c] bg-[#16161d] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1 font-mono">
                  <Film className="h-3 w-3" />
                  0–3s Visual Hook (Pattern Interrupt)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      topic.hook?.visual ||
                        'Rapid split-screen: show high-friction manual task on left vs instantaneous 1-click execution on right with bold text overlay.',
                      'visual'
                    )
                  }
                  className="text-neutral-400 hover:text-white transition-colors p-1 rounded hover:bg-neutral-800"
                  title="Copy visual hook"
                >
                  {copiedKey === 'visual' ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Copied
                    </span>
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <p className="text-neutral-200 leading-relaxed text-xs">
                {topic.hook?.visual ||
                  'Rapid split-screen showing 21 tabs of manual documentation converted into 10 seconds using a modern tool. Fast text overlay: "You are wasting 10 hours a week"'}
              </p>
            </div>

            {/* Audio Hook Box */}
            <div className="rounded-xl border border-[#23232c] bg-[#16161d] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-mono">
                  <Zap className="h-3 w-3" />
                  Spoken Audio Dialogue (Word-for-Word)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      topic.hook?.audio ||
                        `Stop doing this the old way. In the next 60 seconds, I'll show you how to automate your entire workflow without spending a penny.`,
                      'audio'
                    )
                  }
                  className="text-neutral-400 hover:text-white transition-colors p-1 rounded hover:bg-neutral-800"
                  title="Copy audio hook"
                >
                  {copiedKey === 'audio' ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Copied
                    </span>
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <p className="text-neutral-200 italic font-medium leading-relaxed text-xs">
                &ldquo;{topic.hook?.audio ||
                  `Stop using ChatGPT like a beginner in 2026. Here are the 3 tools that replace 4 hours of tedious work in under 60 seconds.`}&rdquo;
              </p>
            </div>

            {/* Retention Beat Sheet Pacing Pill Timeline */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3 text-indigo-400" />
                Retention Beat Sheet Timeline (60s Short)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="rounded-lg bg-[#181822] border border-[#272736] p-2 space-y-0.5">
                  <div className="text-[9px] font-bold text-indigo-400 uppercase">0:00–0:03</div>
                  <div className="text-white font-medium text-[10px] truncate">Visual Interrupt</div>
                </div>
                <div className="rounded-lg bg-[#181822] border border-[#272736] p-2 space-y-0.5">
                  <div className="text-[9px] font-bold text-emerald-400 uppercase">0:03–0:15</div>
                  <div className="text-white font-medium text-[10px] truncate">Agitation &amp; Proof</div>
                </div>
                <div className="rounded-lg bg-[#181822] border border-[#272736] p-2 space-y-0.5">
                  <div className="text-[9px] font-bold text-amber-400 uppercase">0:15–0:45</div>
                  <div className="text-white font-medium text-[10px] truncate">3 Core Payoffs</div>
                </div>
                <div className="rounded-lg bg-[#181822] border border-[#272736] p-2 space-y-0.5">
                  <div className="text-[9px] font-bold text-rose-400 uppercase">0:45–0:60</div>
                  <div className="text-white font-medium text-[10px] truncate">Loop Back CTA</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HIGH-CTR TITLES */}
        {activeTab === 'titles' && (
          <div className="space-y-2.5 animate-in">
            {(topic.titles.length > 0
              ? topic.titles
              : [
                  { title: `Stop Doing ${topic.title} Like a Beginner (2026)`, score: 'CTR: 12.8%', angle: 'Tension' },
                  { title: `3 Tools for ${topic.title} That Do 4 Hours in 5 Mins`, score: 'CTR: 11.4%', angle: 'Curiosity Gap' },
                  { title: `I Replaced My Entire Setup With Free AI (Shocking)`, score: 'CTR: 10.9%', angle: 'Transformation' },
                ]
            ).map((t, idx) => (
              <div
                key={idx}
                className="group/item flex items-center justify-between rounded-xl border border-[#23232c] bg-[#16161d] p-3 hover:border-emerald-500/40 hover:bg-[#181822] transition-all"
              >
                <div className="space-y-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-neutral-400">#{idx + 1}</span>
                    {t.angle && (
                      <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] font-medium text-neutral-300">
                        {t.angle}
                      </span>
                    )}
                    {t.score && (
                      <span className="rounded bg-emerald-950/80 border border-emerald-600/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 font-mono">
                        {t.score}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white group-hover/item:text-emerald-300 transition-colors leading-snug">
                    {t.title}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(t.title, `title-${idx}`)}
                  className="shrink-0 p-1.5 rounded-lg border border-[#2a2a38] bg-[#1c1c24] text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors cursor-pointer"
                  title="Copy Title"
                >
                  {copiedKey === `title-${idx}` ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: PROOF & STRATEGY */}
        {activeTab === 'proof' && (
          <div className="space-y-3.5 animate-in">
            {/* Algorithmic Evidence */}
            <div className="rounded-xl border border-[#23232c] bg-[#16161d] p-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 font-mono">
                <BarChart3 className="h-3 w-3" />
                Algorithmic Signal &amp; Benchmark Proof
              </span>
              <p className="text-neutral-300 text-xs leading-relaxed">
                {topic.evidenceSummary ||
                  'Multiple channels under 25K subscribers have achieved 8x–14x their 30-day view baseline when covering this exact angle in the past 14 days.'}
              </p>
            </div>

            {/* Target Audience Pain Point */}
            {topic.audience && (
              <div className="rounded-xl border border-[#23232c] bg-[#16161d] p-3.5 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1 font-mono">
                  <Target className="h-3 w-3" />
                  Audience Trigger &amp; Demand
                </span>
                <p className="text-neutral-300 text-xs leading-relaxed">{topic.audience}</p>
              </div>
            )}

            {/* Optimal Publish Window */}
            <div className="flex items-center justify-between rounded-xl border border-[#23232c] bg-[#14141a] px-3.5 py-2.5 text-neutral-300">
              <span className="flex items-center gap-1.5 font-medium text-[11px]">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                Optimal Publish Window
              </span>
              <span className="font-mono font-bold text-white text-[11px]">
                {topic.metrics.targetWindow || 'Next 3–5 Days'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── CARD ACTION FOOTER (Claude Artifacts style) ──────────────────────── */}
      <div className="px-4 sm:px-5 py-3 border-t border-[#1f1f28] bg-[#0c0c10] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* Save Topic Button */}
          <button
            type="button"
            onClick={handleSave}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300'
                : 'border-[#2a2a38] bg-[#14141c] text-neutral-300 hover:bg-[#1a1a24] hover:text-white'
            }`}
          >
            {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Bookmark className="h-3.5 w-3.5" />}
            {isSaved ? 'Saved to Pipeline' : 'Save Topic'}
          </button>

          {/* Ask Copilot to Expand */}
          {onAskCopilot && (
            <button
              type="button"
              onClick={() =>
                onAskCopilot(
                  `Write a complete, full-length YouTube video script and retention beat sheet for Topic #${rank}: "${topic.title}". Include exact B-roll instructions and spoken dialogue.`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a38] bg-[#14141c] text-xs font-semibold text-neutral-300 hover:bg-[#1a1a24] hover:text-white transition-all cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
              <span>Ask Copilot</span>
            </button>
          )}
        </div>

        {/* Primary Action: Open Script Studio */}
        <button
          type="button"
          onClick={() => onOpenStudio && onOpenStudio(topic)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shadow-md cursor-pointer group/btn"
        >
          <Film className="h-3.5 w-3.5 text-black" />
          <span>Open Script Studio</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
