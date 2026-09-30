import React from 'react';

export const AIScannerLoader: React.FC<{ message?: string }> = ({ message = 'Loading live trends...' }) => {
  return (
    <div className="space-y-4 py-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
        <span>{message}</span>
      </div>

      {/* Clean Skeleton Shimmer Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-[#1e1e24] bg-[#121216] p-4.5 text-left"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-14 animate-pulse rounded-full bg-indigo-500/20" />
            </div>
            <div className="h-5 w-4/5 animate-pulse rounded bg-white/10" />
            <div className="h-12 w-full animate-pulse rounded-lg bg-white/5" />
            <div className="flex justify-between pt-2">
              <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
