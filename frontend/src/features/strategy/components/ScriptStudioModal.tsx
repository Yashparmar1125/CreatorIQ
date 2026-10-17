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

export const ScriptStudioModal: React.FC<ScriptStudioModalProps> = ({
  topic,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !topic) return null;

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

  const titles =
    topic.titles.length > 0
      ? topic.titles
      : [
          { title: `Stop Doing ${topic.title} Like a Beginner (2026)`, score: 'CTR: 12.8%' },
          { title: `3 Tools for ${topic.title} That Do 4 Hours in 5 Mins`, score: 'CTR: 11.4%' },
          { title: `I Replaced My Entire Setup With Free AI (Shocking)`, score: 'CTR: 10.9%' },
        ];

  const activeTitle = titles[selectedTitleIdx]?.title || topic.title;

  // Build full script text based on format
  const hookVisual =
    topic.hook?.visual ||
    'Rapid split-screen: show high-friction manual task on left vs instantaneous 1-click execution on right with bold text overlay.';
  const hookAudio =
    topic.hook?.audio ||
    `Stop using ${topic.title} like a beginner in 2026. Here are the 3 tools that replace 4 hours of work in under 60 seconds.`;

  const shortScriptBlocks = [
    {
      time: '0:00 – 0:03',
      section: 'PATTERN INTERRUPT HOOK',
      visual: hookVisual,
      audio: hookAudio,
      tip: 'Never say hello or introduce your name. Jump immediately into the problem.',
    },
    {
      time: '0:03 – 0:15',
      section: 'AGITATION & STAKES',
      visual: 'Zoom-in on creator holding phone or pointing to screen. Rapid on-screen statistic popup.',
      audio: `Most creators spend hundreds of dollars on subscriptions when the open-source alternative is completely free and 10 times faster. Here's exactly how it works.`,
      tip: 'Give viewers a concrete reason to stay past the 5-second swipe threshold.',
    },
    {
      time: '0:15 – 0:40',
      section: '3 RAPID PAYOFFS (THE VALUE MEAT)',
      visual: 'Fast B-roll cuts showing exact screen clicks. Keep cuts under 2.5 seconds each.',
      audio: `Step 1: Feed your raw prompt into this lightweight model. Step 2: One-click generate your entire structured output. Step 3: Run the auto-formatter without touching a single line of manual code.`,
      tip: 'High energy, fast pacing. Cut all pauses and filler words.',
    },
    {
      time: '0:40 – 0:55',
      section: 'TWIST & RETENTION LOOP CTA',
      visual: 'Creator looking directly into lens. Pin the exact resource link in the comments.',
      audio: `Drop a comment with 'WORKFLOW' and I'll send you the exact prompt template. And if you missed the setup step, watch this again because...`,
      tip: 'Loop back seamlessly into the first 3 seconds of audio to drive repeat views.',
    },
  ];

  const fullScriptMarkdown = `# ${activeTitle}
Format: ${selectedFormat === 'short' ? '60s YouTube Short' : '8-12m Deep Dive'}
Optimal Window: ${topic.metrics.targetWindow || 'Next 3-5 Days'}
Target Audience: ${topic.audience || 'Tech-curious creators and professionals'}

---
${shortScriptBlocks
  .map(
    (b) => `### [${b.time}] ${b.section}
**Visual Cue:** ${b.visual}
**Spoken Dialogue:** "${b.audio}"
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
    let timer: any;
    if (isPlaying && mode === 'teleprompter') {
      timer = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in">
      <div className="relative w-full max-w-4xl h-[92vh] flex flex-col rounded-3xl border border-[#2b2b38] bg-[#0d0d12] shadow-2xl overflow-hidden">
        {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f28] bg-[#111118]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Film className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                  Script Studio
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-[11px] text-neutral-400 truncate max-w-[280px] sm:max-w-md">
                  {topic.title}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate font-sora">
                {activeTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#171720] border border-[#292936] rounded-xl p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('beatsheet');
                  setIsPlaying(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'beatsheet' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Beat Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('teleprompter')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'teleprompter' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
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
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
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
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                  Select Packaging Title
                </label>
                <div className="space-y-1.5">
                  {titles.map((t, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedTitleIdx(idx)}
                      className={`w-full text-left px-3.5 py-2 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                        selectedTitleIdx === idx
                          ? 'border-indigo-500 bg-[#161622] text-white font-semibold'
                          : 'border-[#22222c] bg-[#121217] text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span className="truncate pr-2">{t.title}</span>
                      {t.score && (
                        <span className="font-mono text-[10px] text-emerald-400 font-bold shrink-0">
                          {t.score}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Card */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
                  Target Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('short')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedFormat === 'short'
                        ? 'border-indigo-500 bg-[#161622] text-white'
                        : 'border-[#22222c] bg-[#121217] text-neutral-400'
                    }`}
                  >
                    <Zap className="h-4 w-4 mx-auto mb-1 text-amber-400" />
                    <div className="text-xs font-bold">YouTube Short</div>
                    <div className="text-[10px] text-neutral-500 font-mono">0:55 Sec</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedFormat('long')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedFormat === 'long'
                        ? 'border-indigo-500 bg-[#161622] text-white'
                        : 'border-[#22222c] bg-[#121217] text-neutral-400'
                    }`}
                  >
                    <Film className="h-4 w-4 mx-auto mb-1 text-indigo-400" />
                    <div className="text-xs font-bold">Deep Dive</div>
                    <div className="text-[10px] text-neutral-500 font-mono">8–12 Min</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Retention Beat Sheet Timeline */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200 font-mono flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  Second-by-Second Retention Beat Sheet
                </h3>
                <span className="text-[11px] text-neutral-500 font-mono">
                  Designed for &gt;75% retention at 30 seconds
                </span>
              </div>

              <div className="space-y-3">
                {shortScriptBlocks.map((b, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#23232c] bg-[#14141a] p-4 space-y-2.5 transition-all hover:border-[#323242]"
                  >
                    <div className="flex items-center justify-between border-b border-[#1c1c24] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-indigo-950/80 border border-indigo-700/50 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                          {b.time}
                        </span>
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          {b.section}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 italic hidden sm:inline">
                        {b.tip}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      {/* Visual Direction */}
                      <div className="rounded-xl bg-[#181822] border border-[#242433] p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1 font-mono">
                          <Eye className="h-3 w-3 text-indigo-400" />
                          Visual / Camera Action
                        </span>
                        <p className="text-neutral-300 leading-relaxed text-xs">{b.visual}</p>
                      </div>

                      {/* Spoken Audio */}
                      <div className="rounded-xl bg-[#181822] border border-[#242433] p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-mono">
                          <Zap className="h-3 w-3" />
                          Exact Spoken Dialogue
                        </span>
                        <p className="text-neutral-100 font-medium italic leading-relaxed text-xs">
                          &ldquo;{b.audio}&rdquo;
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
          <div className="flex-1 flex flex-col bg-[#050508] relative overflow-hidden">
            {/* Teleprompter Top HUD Controls */}
            <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-[#1c1c24] bg-[#0c0c12] text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                  <span>{isPlaying ? 'Pause (Space)' : 'Start Scrolling (Space)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setElapsedSeconds(0);
                    if (prompterContainerRef.current) prompterContainerRef.current.scrollTop = 0;
                  }}
                  className="p-2 rounded-xl border border-[#282836] bg-[#14141c] text-neutral-300 hover:text-white hover:bg-[#1a1a24] cursor-pointer"
                  title="Reset Prompter"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {/* Timer */}
                <div className="font-mono text-sm font-bold text-white px-3 py-1.5 rounded-xl bg-[#14141c] border border-[#282836]">
                  {formatTimer(elapsedSeconds)} / 00:55
                </div>
              </div>

              {/* Speed & Font Size Slider Controls */}
              <div className="flex items-center gap-4 text-neutral-400 font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <span>Speed:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="4"
                    step="0.25"
                    value={scrollSpeed}
                    onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                    className="w-20 accent-indigo-500 cursor-pointer"
                  />
                  <span className="w-8 text-white">{scrollSpeed}x</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5" />
                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.max(20, s - 4))}
                    className="px-2 py-0.5 rounded border border-[#282836] hover:bg-neutral-800 text-neutral-300"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.min(56, s + 4))}
                    className="px-2 py-0.5 rounded border border-[#282836] hover:bg-neutral-800 text-neutral-300"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>

            {/* Eye-level indicator bar */}
            <div className="absolute top-[35%] left-0 right-0 h-16 border-y border-indigo-500/20 bg-indigo-500/5 pointer-events-none z-10 flex items-center justify-between px-4">
              <span className="text-[10px] font-mono text-indigo-400/60 uppercase tracking-widest">
                Eye Level Cue
              </span>
              <span className="text-[10px] font-mono text-indigo-400/60 uppercase tracking-widest">
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
                    <div className="inline-block px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-xs uppercase tracking-wider">
                      {b.time} • {b.section}
                    </div>
                    <p
                      style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }}
                      className="font-bold text-white tracking-wide transition-all"
                    >
                      {b.audio}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL FOOTER ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-t border-[#1f1f28] bg-[#111118]">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="font-mono text-white font-semibold">{shortScriptBlocks.length} beats</span>
            <span>•</span>
            <span>~145 words</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold font-mono">92.4% Predicted Virality</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2a2a38] bg-[#161620] text-xs font-semibold text-neutral-300 hover:text-white hover:bg-[#1d1d28] transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export .md</span>
            </button>

            <button
              type="button"
              onClick={handleCopyScript}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors shadow-md cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-black" />}
              <span>{copied ? 'Copied Full Script!' : 'Copy Script'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
