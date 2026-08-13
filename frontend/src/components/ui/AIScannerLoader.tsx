import React, { useEffect, useState } from 'react';
import { Sparkles, Cpu } from 'lucide-react';

const MESSAGES = [
  "Connecting to Qdrant Vector Engine...",
  "Scanning 500+ active trend signals in PostgreSQL...",
  "Computing 128-dim dense semantic vector embeddings...",
  "Applying Cosine Similarity search for your niche & tone...",
  "Generating OpenRouter AI Action Plans & Hooks...",
];

export const AIScannerLoader: React.FC<{ message?: string }> = ({ message }) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="surface-card-elevated relative overflow-hidden rounded-2xl border border-brand-500/20 bg-neutral-900/90 p-8 text-white shadow-2xl backdrop-blur-xl">
      {/* Animated glowing background orb */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Pulsing AI Chip icon */}
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
          <Cpu className="h-10 w-10 animate-pulse text-white" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
          </span>
        </div>

        <h3 className="mb-2 flex items-center gap-2 text-xl font-bold tracking-tight text-white">
          <Sparkles className="h-5 w-5 text-brand-400 animate-spin" />
          AI Opportunity Engine Scanning
        </h3>

        <p className="mb-6 h-6 text-sm font-medium text-brand-300">
          {message || MESSAGES[stepIndex]}
        </p>

        {/* Progress step indicators */}
        <div className="mb-8 flex items-center gap-2">
          {MESSAGES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === stepIndex
                  ? 'w-8 bg-brand-400 shadow-sm shadow-brand-400'
                  : i < stepIndex
                  ? 'w-2 bg-emerald-500'
                  : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Shimmering glass card skeletons */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-md"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 animate-pulse rounded bg-white/20" />
                <div className="h-4 w-12 animate-pulse rounded-full bg-brand-500/40" />
              </div>
              <div className="h-5 w-3/4 animate-pulse rounded bg-white/20" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-white/10" />
              <div className="flex justify-between pt-2">
                <div className="h-3 w-20 animate-pulse rounded bg-white/20" />
                <div className="h-3 w-14 animate-pulse rounded bg-white/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
