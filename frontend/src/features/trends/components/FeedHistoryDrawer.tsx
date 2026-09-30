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
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
        aria-label="Close feed history"
        onClick={onClose}
      />

      <aside
        className="relative flex h-full w-full max-w-md flex-col border-l border-[#20202a] bg-[#0d0d11] text-white shadow-2xl z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feed-history-title"
      >
        {/* Drawer Header */}
        <div className="flex items-center gap-3 border-b border-[#20202a] bg-[#121218] px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <History className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="feed-history-title" className="text-sm font-semibold text-white">
              Feed history
            </h2>
            <p className="text-xs text-neutral-400">Browse past snapshots &amp; signal feeds</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-400 hover:text-white hover:bg-[#1a1a24] p-1.5"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Drawer Body List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading && feeds.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              Loading history...
            </div>
          ) : feeds.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium text-neutral-200">No past feeds yet</p>
              <p className="mt-1 text-xs text-neutral-500">
                Refresh your feed to start building snapshots.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a22]">
              {feeds.map((feed) => {
                const isActive = feed.feed_id === activeFeedId;

                return (
                  <button
                    key={feed.feed_id}
                    type="button"
                    onClick={() => handleSelect(feed)}
                    className={cn(
                      'w-full px-5 py-4 text-left transition-colors cursor-pointer',
                      isActive
                        ? 'bg-[#181824] border-l-2 border-indigo-500'
                        : 'hover:bg-[#14141c]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                          <span className="text-xs font-semibold text-white">
                            {new Date(feed.created_at).toLocaleString()}
                          </span>
                          {feed.is_current && (
                            <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                              Current
                            </Badge>
                          )}
                          {feed.is_first_feed && (
                            <Badge variant="success" className="text-[10px] py-0 px-1.5">
                              First feed
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs text-neutral-400 leading-relaxed">
                          {(feed.preview_topics ?? feed.topics ?? []).join(' · ') ||
                            `${feed.item_count} trends recorded`}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-[#1a1a24] px-2 py-0.5 text-[10px] font-mono text-neutral-400 border border-[#262636]">
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
