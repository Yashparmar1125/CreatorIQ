import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Download,
  Film,
  Zap,
  Clock,
  Eye,
  Type,
  Layers,
} from 'lucide-react';
import type { TopicStrategyItem } from './TopicStrategyCard';

interface ScriptStudioModalProps {
  topic: TopicStrategyItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const MISSING = 'Not returned by the research response.';

export const ScriptStudioModal: React.FC<ScriptStudioModalProps> = ({
  topic,
  isOpen,
  onClose,
}) => {
  /* All hooks must run before the early return below. */
  const [mode, setMode] = useState<'beatsheet' | 'teleprompter'>('beatsheet');
  const [selectedFormat, setSelectedFormat] = useState<'short' | 'long'>('short');
  const [selectedTitleIdx, setSelectedTitleIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  // Teleprompter states
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1.5); // pixels per tick
  const [fontSize, setFontSize] = useState(32); // px
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const prompterContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const titles = topic?.titles ?? [];
  const activeTitle = titles[selectedTitleIdx]?.title || topic?.title || '';

  // Only the hook beat is sourced from the research response. The remaining
  // beats are an explicit scaffold the creator fills in.
  const hookVisual = topic?.hook?.visual || '';
  const hookAudio = topic?.hook?.audio || '';

  const shortScriptBlocks = [
    {
      time: '0:00 – 0:03',
      section: 'PATTERN INTERRUPT HOOK',
      visual: hookVisual,
      audio: hookAudio,
      tip: 'Jump straight into the problem — never open with a greeting.',
      sourced: Boolean(hookVisual || hookAudio),
    },
    {
      time: '0:03 – 0:15',
      section: 'AGITATION & STAKES',
      visual: '',
      audio: '',
      tip: 'Give viewers a concrete reason to stay past the 5-second swipe.',
      sourced: false,
    },
    {
      time: '0:15 – 0:40',
      section: 'CORE PAYOFFS',
      visual: '',
      audio: '',
      tip: 'High energy, fast pacing. Cut pauses and filler words.',
      sourced: false,
    },
    {
      time: '0:40 – 0:55',
      section: 'TWIST & RETENTION LOOP CTA',
      visual: '',
      audio: '',
      tip: 'Loop back into the first 3 seconds to drive repeat views.',
      sourced: false,
    },
  ];

  const spokenText = shortScriptBlocks.map((b) => b.audio).filter(Boolean).join(' ');
  const wordCount = spokenText ? spokenText.trim().split(/\s+/).length : 0;

  const fullScriptMarkdown = `# ${activeTitle}
Format: ${selectedFormat === 'short' ? '60s YouTube Short' : '8-12m Deep Dive'}
Optimal Window: ${topic?.metrics.targetWindow || 'Not provided'}
Target Audience: ${topic?.audience || 'Not provided'}

> Beats marked [template] are scaffolding from the studio template — replace them with your own script.

---
${shortScriptBlocks
  .map(
    (b) => `### [${b.time}] ${b.section}${b.sourced ? '' : ' [template]'}
**Visual Cue:** ${b.visual || MISSING}
**Spoken Dialogue:** ${b.audio ? `"${b.audio}"` : MISSING}
*Retention Tip: ${b.tip}*
`
  )
  .join('\n---\n')}
`;

  // Handle auto-scroll in teleprompter mode
  useEffect(() => {
    if (!isPlaying || mode !== 'teleprompter') {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const scrollContainer = prompterContainerRef.current;
    if (!scrollContainer) return;

    let lastTimestamp = performance.now();

    const step = (timestamp: number) => {
      const elapsed = timestamp - lastTimestamp;
      if (elapsed >= 16) {
        // approx 60fps
        scrollContainer.scrollTop += scrollSpeed * (elapsed / 16);
        lastTimestamp = timestamp;
      }
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, scrollSpeed, mode]);

  // Teleprompter Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isPlaying && mode === 'teleprompter') {
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, mode]);

  // Spacebar play/pause in teleprompter mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'teleprompter' && e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.code === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onClose]);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(fullScriptMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullScriptMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_script.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !topic) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171717]/40 backdrop-blur-sm p-3 sm:p-6 animate-in">
      <div className="relative w-full max-w-4xl h-[92vh] flex flex-col rounded-3xl border border-[#E5E0E8] bg-white shadow-xl overflow-hidden">
        {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E0E8] bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-[#F1ECFF] border border-[#D9CEF5] flex items-center justify-center shrink-0">
              <Film className="h-4 w-4 text-[#4A2E8F]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#4A2E8F] font-bold">
                  Script Studio
                </span>
                <span className="text-[#B5AEC0]">•</span>
                <span className="text-[11px] text-[#625D68] truncate max-w-[280px] sm:max-w-md">
                  {topic.title}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[#171717] truncate font-sora">
                {activeTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#FBFAF8] border border-[#E5E0E8] rounded-xl p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('beatsheet');
                  setIsPlaying(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'beatsheet'
                    ? 'bg-[#F1ECFF] text-[#171717] border border-[#D9CEF5]'
                    : 'text-[#625D68] hover:text-[#171717]'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Beat Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('teleprompter')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'teleprompter'
                    ? 'bg-[#F1ECFF] text-[#171717] border border-[#D9CEF5]'
                    : 'text-[#625D68] hover:text-[#171717]'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Teleprompter</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Script Studio"
              className="p-2 rounded-xl text-[#625D68] hover:text-[#171717] hover:bg-[#F6F3FF] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── MODE 1: BEAT SHEET STUDIO ───────────────────────────────────────── */}
        {mode === 'beatsheet' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 no-scrollbar">
            {/* Format & Title Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#625D68] font-mono">
                  Select Packaging Title
                </label>
                {titles.length > 0 ? (
                  <div className="space-y-1.5">
                    {titles.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedTitleIdx(idx)}
                        className={`w-full text-left px-3.5 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          selectedTitleIdx === idx
                            ? 'border-[#C9BCF0] bg-[#F1ECFF] text-[#171717] font-semibold'
                            : 'border-[#E5E0E8] bg-[#FBFAF8] text-[#625D68] hover:text-[#171717]'
                        }`}
                      >
                        <span className="truncate pr-2">{t.title}</span>
                        {t.score && (
                          <span className="font-mono text-[10px] text-[#167A59] font-bold shrink-0">
                            {t.score}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#625D68] leading-relaxed rounded-xl border border-[#E5E0E8] bg-[#FBFAF8] px-3.5 py-2.5">
                    {MISSING}
                  </p>
                )}
              </div>

              {/* Format Card */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#625D68] font-mono">
                  Target Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('short')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedFormat === 'short'
                        ? 'border-[#C9BCF0] bg-[#F1ECFF] text-[#171717]'
                        : 'border-[#E5E0E8] bg-[#FBFAF8] text-[#625D68]'
                    }`}
                  >
                    <Zap className="h-4 w-4 mx-auto mb-1 text-[#625D68]" />
                    <div className="text-xs font-bold">YouTube Short</div>
                    <div className="text-[10px] text-[#77717F] font-mono">0:55 Sec</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFormat('long')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedFormat === 'long'
                        ? 'border-[#C9BCF0] bg-[#F1ECFF] text-[#171717]'
                        : 'border-[#E5E0E8] bg-[#FBFAF8] text-[#625D68]'
                    }`}
                  >
                    <Film className="h-4 w-4 mx-auto mb-1 text-[#4A2E8F]" />
                    <div className="text-xs font-bold">Deep Dive</div>
                    <div className="text-[10px] text-[#77717F] font-mono">8–12 Min</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Retention Beat Sheet Timeline */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717] font-mono flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#4A2E8F]" />
                  Second-by-Second Retention Beat Sheet
                </h3>
                <span className="text-[11px] text-[#77717F] font-mono">Studio template</span>
              </div>

              <div className="space-y-3">
                {shortScriptBlocks.map((b, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#E5E0E8] bg-[#FBFAF8] p-4 space-y-2.5 transition-all hover:border-[#C9C0DA]"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-[#EFEBF2] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#F1ECFF] border border-[#D9CEF5] px-2 py-0.5 text-[10px] font-mono font-bold text-[#4A2E8F]">
                          {b.time}
                        </span>
                        <span className="text-xs font-bold text-[#171717] uppercase tracking-wider font-mono">
                          {b.section}
                        </span>
                        {!b.sourced && (
                          <span className="rounded bg-[#F6F3FF] border border-[#E5E0E8] px-1.5 py-0.5 text-[9px] font-bold text-[#625D68] uppercase">
                            Template
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#77717F] italic hidden sm:inline">
                        {b.tip}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      {/* Visual Direction */}
                      <div className="rounded-xl bg-white border border-[#E5E0E8] p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#625D68] flex items-center gap-1 font-mono">
                          <Eye className="h-3 w-3 text-[#4A2E8F]" />
                          Visual / Camera Action
                        </span>
                        <p className="text-[#2C2834] leading-relaxed text-xs">
                          {b.visual || MISSING}
                        </p>
                      </div>

                      {/* Spoken Audio */}
                      <div className="rounded-xl bg-white border border-[#E5E0E8] p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#167A59] flex items-center gap-1 font-mono">
                          <Zap className="h-3 w-3" />
                          Exact Spoken Dialogue
                        </span>
                        <p className="text-[#171717] font-medium italic leading-relaxed text-xs">
                          {b.audio ? `“${b.audio}”` : MISSING}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MODE 2: TELEPROMPTER MODE ────────────────────────────────────────── */}
        {mode === 'teleprompter' && (
          <div className="flex-1 flex flex-col bg-[#FBFAF8] relative overflow-hidden">
            {/* Teleprompter Top HUD Controls */}
            <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-[#E5E0E8] bg-white text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isPlaying
                      ? 'border border-[#E5E0E8] bg-white text-[#171717] hover:bg-[#F6F3FF]'
                      : 'bg-[#171717] text-white hover:bg-[#2C2834]'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 fill-current" />
                  )}
                  <span>{isPlaying ? 'Pause (Space)' : 'Start Scrolling (Space)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setElapsedSeconds(0);
                    if (prompterContainerRef.current) prompterContainerRef.current.scrollTop = 0;
                  }}
                  className="p-2 rounded-xl border border-[#E5E0E8] bg-white text-[#625D68] hover:text-[#171717] hover:bg-[#F6F3FF] cursor-pointer"
                  title="Reset Prompter"
                  aria-label="Reset teleprompter"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {/* Timer */}
                <div className="font-mono text-sm font-bold text-[#171717] px-3 py-1.5 rounded-xl bg-white border border-[#E5E0E8]">
                  {formatTimer(elapsedSeconds)} / 00:55
                </div>
              </div>

              {/* Speed & Font Size Slider Controls */}
              <div className="flex items-center gap-4 text-[#625D68] font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <span>Speed:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="4"
                    step="0.25"
                    value={scrollSpeed}
                    onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                    aria-label="Scroll speed"
                    className="w-20 accent-[#4A2E8F] cursor-pointer"
                  />
                  <span className="w-8 text-[#171717]">{scrollSpeed}x</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5" />
                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.max(20, s - 4))}
                    aria-label="Decrease font size"
                    className="px-2 py-0.5 rounded border border-[#E5E0E8] bg-white hover:bg-[#F6F3FF] text-[#625D68]"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.min(56, s + 4))}
                    aria-label="Increase font size"
                    className="px-2 py-0.5 rounded border border-[#E5E0E8] bg-white hover:bg-[#F6F3FF] text-[#625D68]"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>

            {/* Eye-level indicator bar */}
            <div className="absolute top-[35%] left-0 right-0 h-16 border-y border-[#D9CEF5] bg-[#F1ECFF] pointer-events-none z-10 flex items-center justify-between px-4">
              <span className="text-[10px] font-mono text-[#4A2E8F]/70 uppercase tracking-widest">
                Eye Level Cue
              </span>
              <span className="text-[10px] font-mono text-[#4A2E8F]/70 uppercase tracking-widest">
                Read Here
              </span>
            </div>

            {/* Auto-scrolling prompt container */}
            <div
              ref={prompterContainerRef}
              className="flex-1 overflow-y-auto px-8 sm:px-16 pt-[25vh] pb-[50vh] no-scrollbar text-center select-none"
            >
              <div className="max-w-2xl mx-auto space-y-12">
                {shortScriptBlocks.map((b, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="inline-block px-3 py-1 rounded-full bg-white border border-[#E5E0E8] text-[#625D68] font-mono text-xs uppercase tracking-wider">
                      {b.time} • {b.section}
                    </div>
                    <p
                      style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }}
                      className="font-bold text-[#171717] tracking-wide transition-all"
                    >
                      {b.audio || MISSING}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL FOOTER ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-[#E5E0E8] bg-white">
          <div className="flex items-center gap-2 text-xs text-[#625D68]">
            <span className="font-mono text-[#171717] font-semibold">{shortScriptBlocks.length} beats</span>
            <span>•</span>
            <span>{wordCount} spoken words</span>
            <span>•</span>
            <span className="text-[#77717F] font-mono">Studio template</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E0E8] bg-white text-xs font-semibold text-[#625D68] hover:text-[#171717] hover:bg-[#F6F3FF] transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export .md</span>
            </button>

            <button
              type="button"
              onClick={handleCopyScript}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#FF98C1] border border-[#F27DA8] text-[#171717] text-xs font-bold hover:bg-[#FF8AB8] transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[#171717]" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-[#171717]" />
              )}
              <span>{copied ? 'Copied!' : 'Copy Script'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
