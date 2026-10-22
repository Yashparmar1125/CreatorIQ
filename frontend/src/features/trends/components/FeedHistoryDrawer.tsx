import React, { useEffect } from 'react';
import { Clock, History, Loader2, X } from 'lucide-react';
import type { FeedHistoryEntry } from '../../../stores/useTrendsStore';
import { cn } from '../../../lib/utils';

interface FeedHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  feeds: FeedHistoryEntry[];
  isLoading: boolean;
  activeFeedId: string | null;
  onSelect: (feedId: string) => void;
  onSelectCurrent: () => void;
}

const Chip: React.FC<{ tone: 'current' | 'first'; children: React.ReactNode }> = ({
  tone,
  children,
}) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-bold',
      tone === 'current'
        ? 'border-[#D9CEF5] bg-[#F1ECFF] text-[#4A2E8F]'
        : 'border-[#B8EED8] bg-[#E8FBF4] text-[#0F5C43]'
    )}
  >
    {children}
  </span>
);

export const FeedHistoryDrawer: React.FC<FeedHistoryDrawerProps> = ({
  open,
  onClose,
  feeds,
  isLoading,
  activeFeedId,
  onSelect,
  onSelectCurrent,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (feed: FeedHistoryEntry) => {
    if (feed.is_current) {
      onSelectCurrent();
    } else {
      onSelect(feed.feed_id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-[#171717]/35 backdrop-blur-[2px]"
        aria-label="Close feed history"
        onClick={onClose}
      />

      <aside
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#E5E0E8] bg-white shadow-[0_0_48px_rgba(23,23,23,0.14)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feed-history-title"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#EFEBF2] bg-[#FBFAF8] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D9CEF5] bg-[#F1ECFF] text-[#4A2E8F]">
            <History className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="feed-history-title" className="text-sm font-bold text-[#171717]">
              Feed history
            </h2>
            <p className="text-xs text-[#77717F]">Browse past snapshots of your signal feed</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1.5 text-[#77717F] transition-colors hover:bg-[#F1ECFF] hover:text-[#171717]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {isLoading && feeds.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#77717F]">
              <Loader2 className="h-4 w-4 animate-spin text-[#7C5CD6]" />
              Loading history…
            </div>
          ) : feeds.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-semibold text-[#171717]">No past feeds yet</p>
              <p className="mt-1 text-xs leading-relaxed text-[#77717F]">
                Refresh your feed to start building snapshots you can return to.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EFEBF2]">
              {feeds.map((feed) => {
                const isActive = feed.feed_id === activeFeedId;

                return (
                  <button
                    key={feed.feed_id}
                    type="button"
                    onClick={() => handleSelect(feed)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'w-full cursor-pointer px-5 py-4 text-left transition-colors',
                      isActive
                        ? 'border-l-2 border-[#7C5CD6] bg-[#F6F3FF]'
                        : 'border-l-2 border-transparent hover:bg-[#FBFAF8]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-[#A79FB0]" />
                          <span className="text-xs font-semibold text-[#171717]">
                            {new Date(feed.created_at).toLocaleString()}
                          </span>
                          {feed.is_current && <Chip tone="current">Current</Chip>}
                          {feed.is_first_feed && <Chip tone="first">First feed</Chip>}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#625D68]">
                          {(feed.preview_topics ?? feed.topics ?? []).join(' · ') ||
                            `${feed.item_count} trends recorded`}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md border border-[#E5E0E8] bg-white px-2 py-0.5 font-mono text-[10px] text-[#625D68]">
                        {feed.item_count} items
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
