import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { CONNECTOR_OPTIONS, type ConnectorOption } from '../../../lib/connectors';
import type { ConnectedChannel } from '../../../stores/useDashboardStore';
import { useStrategyStore } from '../../../stores/useStrategyStore';

interface ConnectorPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  primaryChannel: ConnectedChannel | null;
  onConnectYouTube: () => void;
  onDisconnectYouTube?: () => void;
}

export const ConnectorPopover: React.FC<ConnectorPopoverProps> = ({
  isOpen,
  onClose,
  primaryChannel,
  onConnectYouTube,
  onDisconnectYouTube,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { connectedConnectors, connectConnector, disconnectConnector } = useStrategyStore();

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

  // Total connected count
  const connectedCount =
    (isYouTubeSynced ? 1 : 0) +
    connectedConnectors.filter((c) => c !== 'youtube' && c !== 'web').length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-full left-0 mt-2 z-50 w-[380px] sm:w-[430px] rounded-2xl border border-[#E5E0E8] bg-white p-3.5 shadow-[0_18px_42px_rgba(23,23,23,0.14)] max-w-[calc(100vw-2rem)]"
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
                  {connectedCount} connected
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#77717F]">
                Connected tools are queried autonomously by Copilot reasoning when needed.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md p-1 text-[#77717F] hover:bg-[#F6F3FF] hover:text-[#171717]"
              aria-label="Close connectors menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Connectors List */}
          <div className="mt-2.5 space-y-1.5">
            {CONNECTOR_OPTIONS.map((c: ConnectorOption) => {
              const Icon = c.icon;
              const isYouTube = c.id === 'youtube';
              const isConnected = isYouTube
                ? isYouTubeSynced
                : connectedConnectors.includes(c.id);

              return (
                <div
                  key={c.id}
                  className={`group relative flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-all ${
                    isConnected
                      ? 'border-[#D9CEF5]/70 bg-[#FAF8FF]'
                      : 'border-[#EFEBF2] bg-white hover:border-[#E5E0E8] hover:bg-[#FBFAF8]'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        isConnected
                          ? 'border-[#D9CEF5] bg-[#F1ECFF] text-[#4A2E8F]'
                          : 'border-[#EFEBF2] bg-[#FBFAF8] text-[#77717F]'
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

                  {/* Right Action / State: Connect vs Disconnect */}
                  <div className="flex shrink-0 items-center gap-2">
                    {isConnected ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#E8FBF4] px-2 py-0.5 text-[10.5px] font-semibold text-[#167A59]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#167A59]" />
                          Connected
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (isYouTube && onDisconnectYouTube) {
                              onDisconnectYouTube();
                            } else {
                              disconnectConnector(c.id);
                            }
                          }}
                          className="cursor-pointer text-[10.5px] font-medium text-[#77717F] hover:text-[#B42332] hover:underline"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (isYouTube) {
                            onConnectYouTube();
                          } else {
                            connectConnector(c.id);
                          }
                        }}
                        className="inline-flex cursor-pointer items-center rounded-lg bg-[#FF98C1] px-3 py-1 text-xs font-semibold text-[#171717] transition-all hover:bg-[#FF80B0]"
                        title={`Connect ${c.label}`}
                      >
                        Connect
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
              Copilot reasoning engine queries tools only when needed
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
