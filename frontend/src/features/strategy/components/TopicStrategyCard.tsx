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

const MISSING = 'Not returned by the research response.';

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

  const rank = topic.rank || 1;
  const isTopRank = rank === 1;

  const tabBase =
    'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all cursor-pointer border-b-2';
  const tabActive = 'border-[#4A2E8F] text-[#171717] bg-white';
  const tabIdle = 'border-transparent text-[#625D68] hover:text-[#171717]';

  return (
    <div className="group relative rounded-2xl border border-[#E5E0E8] bg-white shadow-xs overflow-hidden transition-all hover:border-[#C9C0DA] my-4">
      {/* ── CARD HEADER ──────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-[#EFEBF2] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold font-mono uppercase tracking-wider ${
                isTopRank
                  ? 'bg-[#F1ECFF] border border-[#D9CEF5] text-[#4A2E8F]'
                  : 'bg-[#F6F3FF] border border-[#E5E0E8] text-[#625D68]'
              }`}
            >
              {isTopRank ? (
                <>
                  <Award className="h-3.5 w-3.5 text-[#4A2E8F]" />
                  #1 Top Opportunity
                </>
              ) : (
                <>
                  <Layers className="h-3 w-3 text-[#77717F]" />
                  Priority {rank}
                </>
              )}
            </span>

            {topic.category && (
              <span className="rounded-md bg-[#FBFAF8] border border-[#E5E0E8] px-2 py-0.5 text-[11px] text-[#625D68] font-medium">
                {topic.category}
              </span>
            )}
          </div>

          {/* Metric Chips Header */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            {topic.metrics.viralityProb && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E4FBF2] border border-[#B9EFDD] px-2 py-0.5 font-bold text-[#167A59]">
                <Zap className="h-3 w-3 text-[#167A59]" />
                {topic.metrics.viralityProb} Virality
              </span>
            )}

            {topic.metrics.reachMultiplier && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4E0] border border-[#F5DCB0] px-2 py-0.5 font-bold text-[#8A5B00]">
                <Flame className="h-3.5 w-3.5 text-[#8A5B00]" />
                {topic.metrics.reachMultiplier} Reach
              </span>
            )}

            {topic.metrics.momentumScore && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F6F3FF] border border-[#E9E2F7] px-2 py-0.5 font-medium text-[#4A2E8F]">
                <TrendingUp className="h-3.5 w-3.5 text-[#4A2E8F]" />
                {topic.metrics.momentumScore}
              </span>
            )}
          </div>
        </div>

        {/* Topic Title */}
        <h3 className="font-sora text-base sm:text-lg font-bold text-[#171717] tracking-tight leading-snug">
          {topic.title}
        </h3>

        {/* Quick Audience One-Liner if present */}
        {topic.audience && (
          <p className="text-xs text-[#625D68] leading-relaxed line-clamp-2">
            <span className="text-[#171717] font-medium">Target Audience:</span> {topic.audience}
          </p>
        )}
      </div>

      {/* ── CARD TAB NAVIGATION ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-4 sm:px-5 pt-2.5 border-b border-[#E5E0E8] bg-[#FBFAF8]">
        <button
          type="button"
          onClick={() => setActiveTab('hook')}
          className={`${tabBase} ${activeTab === 'hook' ? tabActive : tabIdle}`}
        >
          <Film className="h-3.5 w-3.5 text-[#4A2E8F]" />
          <span>Hook &amp; Script Blueprint</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('titles')}
          className={`${tabBase} ${activeTab === 'titles' ? tabActive : tabIdle}`}
        >
          <Target className="h-3.5 w-3.5 text-[#167A59]" />
          <span>High-CTR Titles ({topic.titles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('proof')}
          className={`${tabBase} ${activeTab === 'proof' ? tabActive : tabIdle}`}
        >
          <BarChart3 className="h-3.5 w-3.5 text-[#8A5B00]" />
          <span>Proof &amp; Strategy</span>
        </button>
      </div>

      {/* ── CARD TAB BODY ────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 text-xs space-y-4">
        {/* TAB 1: HOOK & SCRIPT BLUEPRINT */}
        {activeTab === 'hook' && (
          <div className="space-y-3.5 animate-in">
            {/* Visual Hook Box */}
            <div className="rounded-xl border border-[#E5E0E8] bg-[#FBFAF8] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A2E8F] flex items-center gap-1 font-mono">
                  <Film className="h-3 w-3" />
                  0–3s Visual Hook (Pattern Interrupt)
                </span>
                {topic.hook?.visual && (
                  <button
                    type="button"
                    onClick={() => handleCopy(topic.hook!.visual!, 'visual')}
                    className="text-[#625D68] hover:text-[#171717] transition-colors p-1 rounded hover:bg-[#F1ECFF]"
                    title="Copy visual hook"
                    aria-label="Copy visual hook"
                  >
                    {copiedKey === 'visual' ? (
                      <span className="text-[10px] text-[#167A59] flex items-center gap-1">
                        <Check className="h-3 w-3" /> Copied
                      </span>
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-[#2C2834] leading-relaxed text-xs">
                {topic.hook?.visual || MISSING}
              </p>
            </div>

            {/* Audio Hook Box */}
            <div className="rounded-xl border border-[#E5E0E8] bg-[#FBFAF8] p-3.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#167A59] flex items-center gap-1 font-mono">
                  <Zap className="h-3 w-3" />
                  Spoken Audio Dialogue (Word-for-Word)
                </span>
                {topic.hook?.audio && (
                  <button
                    type="button"
                    onClick={() => handleCopy(topic.hook!.audio!, 'audio')}
                    className="text-[#625D68] hover:text-[#171717] transition-colors p-1 rounded hover:bg-[#F1ECFF]"
                    title="Copy audio hook"
                    aria-label="Copy audio hook"
                  >
                    {copiedKey === 'audio' ? (
                      <span className="text-[10px] text-[#167A59] flex items-center gap-1">
                        <Check className="h-3 w-3" /> Copied
                      </span>
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-[#2C2834] italic font-medium leading-relaxed text-xs">
                {topic.hook?.audio ? `“${topic.hook.audio}”` : MISSING}
              </p>
            </div>

            {/* Retention Beat Sheet Pacing Pill Timeline */}
            {topic.hook?.pacing && topic.hook.pacing.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#625D68] flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3 text-[#4A2E8F]" />
                  Retention Beat Sheet Timeline
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  {topic.hook.pacing.map((beat, idx) => (
                    <div key={idx} className="rounded-lg bg-[#F6F3FF] border border-[#E9E2F7] p-2 space-y-0.5">
                      <div className="text-[9px] font-bold text-[#4A2E8F] uppercase">
                        Beat {idx + 1}
                      </div>
                      <div className="text-[#171717] font-medium text-[10px] leading-snug">{beat}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#625D68] flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3 text-[#4A2E8F]" />
                  Retention Beat Sheet Timeline
                </span>
                <p className="text-[#625D68] leading-relaxed text-xs">{MISSING}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HIGH-CTR TITLES */}
        {activeTab === 'titles' && (
          <div className="space-y-2.5 animate-in">
            {topic.titles.length > 0 ? (
              topic.titles.map((t, idx) => (
                <div
                  key={idx}
                  className="group/item flex items-center justify-between rounded-xl border border-[#E5E0E8] bg-[#FBFAF8] p-3 hover:border-[#B9EFDD] transition-all"
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#77717F]">#{idx + 1}</span>
                      {t.angle && (
                        <span className="rounded bg-[#F1ECFF] px-1.5 py-0.5 text-[9px] font-medium text-[#4A2E8F]">
                          {t.angle}
                        </span>
                      )}
                      {t.score && (
                        <span className="rounded bg-[#E4FBF2] border border-[#B9EFDD] px-1.5 py-0.5 text-[9px] font-bold text-[#167A59] font-mono">
                          {t.score}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#171717] leading-snug">{t.title}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(t.title, `title-${idx}`)}
                    className="shrink-0 p-1.5 rounded-lg border border-[#E5E0E8] bg-white text-[#625D68] hover:text-[#171717] hover:border-[#C9C0DA] transition-colors cursor-pointer"
                    title="Copy Title"
                    aria-label={`Copy title ${idx + 1}`}
                  >
                    {copiedKey === `title-${idx}` ? (
                      <Check className="h-3.5 w-3.5 text-[#167A59]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-[#625D68] leading-relaxed text-xs">{MISSING}</p>
            )}
          </div>
        )}

        {/* TAB 3: PROOF & STRATEGY */}
        {activeTab === 'proof' && (
          <div className="space-y-3.5 animate-in">
            {/* Algorithmic Evidence */}
            <div className="rounded-xl border border-[#E5E0E8] bg-[#FBFAF8] p-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A5B00] flex items-center gap-1 font-mono">
                <BarChart3 className="h-3 w-3" />
                Algorithmic Signal &amp; Benchmark Proof
              </span>
              <p className="text-[#2C2834] text-xs leading-relaxed">
                {topic.evidenceSummary || MISSING}
              </p>
            </div>

            {/* Target Audience Pain Point */}
            <div className="rounded-xl border border-[#E5E0E8] bg-[#FBFAF8] p-3.5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A2E8F] flex items-center gap-1 font-mono">
                <Target className="h-3 w-3" />
                Audience Trigger &amp; Demand
              </span>
              <p className="text-[#2C2834] text-xs leading-relaxed">
                {topic.audience || MISSING}
              </p>
            </div>

            {/* Optimal Publish Window */}
            <div className="flex items-center justify-between rounded-xl border border-[#E5E0E8] bg-[#FBFAF8] px-3.5 py-2.5 text-[#625D68]">
              <span className="flex items-center gap-1.5 font-medium text-[11px]">
                <Clock className="h-3.5 w-3.5 text-[#4A2E8F]" />
                Optimal Publish Window
              </span>
              <span className="font-mono font-bold text-[#171717] text-[11px]">
                {topic.metrics.targetWindow || 'Not provided'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── CARD ACTION FOOTER ───────────────────────────────────────────────── */}
      <div className="px-4 sm:px-5 py-3 border-t border-[#EFEBF2] bg-[#FBFAF8] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* Save Topic Button — local to this session, not sent anywhere */}
          <button
            type="button"
            onClick={handleSave}
            title="Kept for this session only — it is not added to your channel plan."
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isSaved
                ? 'bg-[#E4FBF2] border-[#B9EFDD] text-[#167A59]'
                : 'border-[#E5E0E8] bg-white text-[#625D68] hover:bg-[#F6F3FF] hover:text-[#171717]'
            }`}
          >
            {isSaved ? <Check className="h-3.5 w-3.5 text-[#167A59]" /> : <Bookmark className="h-3.5 w-3.5" />}
            {isSaved ? 'Saved for this session' : 'Save topic'}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E0E8] bg-white text-xs font-semibold text-[#625D68] hover:bg-[#F6F3FF] hover:text-[#171717] transition-all cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#4A2E8F]" />
              <span>Ask Copilot</span>
            </button>
          )}
        </div>

        {/* Primary Action: Open Script Studio */}
        <button
          type="button"
          onClick={() => onOpenStudio && onOpenStudio(topic)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FF98C1] border border-[#F27DA8] text-[#171717] font-bold text-xs hover:bg-[#FF8AB8] transition-all cursor-pointer group/btn"
        >
          <Film className="h-3.5 w-3.5 text-[#171717]" />
          <span>Open Script Studio</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
