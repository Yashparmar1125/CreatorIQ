import React, { useEffect } from 'react';
import { Clock, History, Loader2, X } from 'lucide-react';
import type { FeedHistoryEntry } from '../../../stores/useTrendsStore';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
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
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px]"
        aria-label="Close feed history"
        onClick={onClose}
      />

      <aside
        className="relative flex h-full w-full max-w-md flex-col border-l border-neutral-200/80 bg-white shadow-2xl animate-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feed-history-title"
      >
        <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <History className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="feed-history-title" className="text-sm font-semibold text-neutral-900">
              Feed history
            </h2>
            <p className="text-xs text-neutral-500">Browse past snapshots for free</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading && feeds.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
              Loading history...
            </div>
          ) : feeds.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium text-neutral-900">No past feeds yet</p>
              <p className="mt-1 text-xs text-neutral-500">
                Refresh your feed to start building history.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {feeds.map((feed) => {
                const isActive = feed.feed_id === activeFeedId;

                return (
                  <button
                    key={feed.feed_id}
                    type="button"
                    onClick={() => handleSelect(feed)}
                    className={cn(
                      'w-full px-5 py-4 text-left transition-colors hover:bg-neutral-50',
                      isActive && 'bg-brand-50/60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-900">
                            {new Date(feed.created_at).toLocaleString()}
                          </span>
                          {feed.is_current && <Badge variant="brand">Current</Badge>}
                          {feed.is_first_feed && <Badge variant="success">First feed</Badge>}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm text-neutral-500">
                          {(feed.preview_topics ?? feed.topics ?? []).join(' · ') ||
                            `${feed.item_count} trends`}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-neutral-400">{feed.item_count}</span>
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
