import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { CONNECTOR_OPTIONS, type ConnectorOption } from '../../../lib/connectors';
import type { ConnectedChannel } from '../../../stores/useDashboardStore';

interface ConnectorPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  activeConnectors: string[];
  onToggle: (connectorId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  primaryChannel: ConnectedChannel | null;
  onConnectYouTube: () => void;
}

export const ConnectorPopover: React.FC<ConnectorPopoverProps> = ({
  isOpen,
  onClose,
  activeConnectors,
  onToggle,
  onSelectAll,
  onClearAll,
  primaryChannel,
  onConnectYouTube,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const isYouTubeSynced = Boolean(primaryChannel?.is_oauth_connected);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-full left-0 mt-2 z-50 w-[360px] sm:w-[420px] rounded-2xl border border-[#E5E0E8] bg-white p-3.5 shadow-[0_18px_42px_rgba(23,23,23,0.14)] max-w-[calc(100vw-2rem)]"
          role="dialog"
          aria-label="Copilot Connectors Menu"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#EFEBF2] pb-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sora text-[13px] font-bold text-[#171717]">
                  Copilot Connectors
                </span>
                <span className="rounded-full bg-[#F1ECFF] px-2 py-0.5 text-[10px] font-bold text-[#4A2E8F]">
                  {activeConnectors.length} active
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#77717F]">
                Pick live context sources to ground copilot responses.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={activeConnectors.length === CONNECTOR_OPTIONS.length ? onClearAll : onSelectAll}
                className="cursor-pointer font-semibold text-[#4A2E8F] hover:underline"
              >
                {activeConnectors.length === CONNECTOR_OPTIONS.length ? 'Reset' : 'Select all'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-md p-1 text-[#77717F] hover:bg-[#F6F3FF] hover:text-[#171717]"
                aria-label="Close connectors menu"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Connectors List */}
          <div className="mt-2.5 space-y-1.5">
            {CONNECTOR_OPTIONS.map((c: ConnectorOption) => {
              const isOn = activeConnectors.includes(c.id);
              const Icon = c.icon;
              const isYouTube = c.id === 'youtube';

              return (
                <div
                  key={c.id}
                  className={`group relative flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-all ${
                    isOn
                      ? 'border-[#D9CEF5] bg-[#FAF8FF]'
                      : 'border-[#EFEBF2] bg-white hover:border-[#E5E0E8] hover:bg-[#FBFAF8]'
                  }`}
                >
                  <div
                    onClick={() => onToggle(c.id)}
                    className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5"
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        isOn
                          ? 'border-[#D9CEF5] bg-[#F1ECFF] text-[#4A2E8F]'
                          : 'border-[#EFEBF2] bg-[#FBFAF8] text-[#77717F] group-hover:text-[#171717]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#171717]">
                          {c.label}
                        </span>
                        {c.badge && (
                          <span className="rounded bg-[#F6F3FF] px-1.5 py-0.5 text-[9.5px] font-semibold text-[#625D68]">
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] leading-relaxed text-[#77717F]">
                        {c.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Action / State */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {isYouTube && !isYouTubeSynced ? (
                      <button
                        type="button"
                        onClick={onConnectYouTube}
                        className="inline-flex cursor-pointer items-center rounded-lg bg-[#FF98C1] px-2.5 py-1 text-xs font-semibold text-[#171717] transition-all hover:bg-[#FF80B0]"
                        title="Connect YouTube account via OAuth"
                      >
                        Connect
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggle(c.id)}
                        className={`inline-flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors ${
                          isOn ? 'bg-[#167A59]' : 'bg-[#E5E0E8]'
                        }`}
                        aria-pressed={isOn}
                        aria-label={`Toggle ${c.label}`}
                      >
                        <span
                          className={`h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            isOn ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer explanation */}
          <div className="mt-3 flex items-center justify-between border-t border-[#EFEBF2] pt-2 text-[11px] text-[#77717F]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[#7C5CD6]" />
              Sources are queried only during research
            </span>
            {isYouTubeSynced && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[#167A59]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#167A59]" />
                Live sync
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
