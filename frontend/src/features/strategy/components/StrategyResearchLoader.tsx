import React, { useEffect, useState } from 'react';
import { Bot, Check, Loader2, Search } from 'lucide-react';
import type { AgentStep } from '../../../stores/useStrategyStore';

/**
 * Chat-style thinking indicator.
 *
 * Everything shown is real: the tool steps come from the SSE stream and the
 * timer is measured from the moment the request started. No simulated progress.
 */
export const StrategyResearchLoader: React.FC<{
  steps: AgentStep[];
  liveResearch: boolean;
}> = ({ steps, liveResearch }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const runningStep = steps.find((s) => s.status === 'running');
  const doneCount = steps.filter((s) => s.status === 'done').length;

  const heading = liveResearch
    ? runningStep?.summary || 'Researching live sources'
    : runningStep?.summary || 'Thinking…';

  return (
    <div className="flex items-start gap-3.5" role="status" aria-live="polite">
      <div className="w-8 h-8 rounded-full bg-[#F1ECFF] border border-[#E5E0E8] flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-[#4A2E8F]" />
      </div>

      <div className="flex-1 min-w-0 max-w-2xl rounded-2xl border border-[#E5E0E8] bg-white px-4 sm:px-5 py-4 shadow-xs">
        {/* Typing dots */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C9BCF0] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-[#C9BCF0] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 rounded-full bg-[#C9BCF0] animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="ml-2 text-xs font-semibold text-[#171717]">{heading}</span>
        </div>

        {/* Real tool steps */}
        {steps.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {steps.map((s, i) => (
              <li key={`${s.tool}-${i}`} className="flex items-center gap-2 text-[11px]">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                  {s.status === 'running' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#77717F]" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-[#167A59]" />
                  )}
                </span>
                <span className="font-semibold text-[#171717]">{s.label}</span>
                <span className="truncate text-[#77717F]">{s.summary}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Status line */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-[#77717F]">
          {liveResearch ? (
            <>
              <Search className="h-3 w-3" />
              <span>
                {doneCount} of {steps.length} {steps.length === 1 ? 'source' : 'sources'} checked
              </span>
            </>
          ) : (
            <span>Answering from the model — live sources are off</span>
          )}
          <span className="font-mono ml-auto">{elapsed}s</span>
        </div>
      </div>
    </div>
  );
};
