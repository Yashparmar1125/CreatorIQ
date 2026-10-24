import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { CONNECTOR_OPTIONS, type ConnectorOption } from '../../../lib/connectors';
import { api } from '../../../lib/api';
import { useDashboardStore, type ConnectedChannel } from '../../../stores/useDashboardStore';
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
  const isCalendarConnected = useDashboardStore((s) => s.isCalendarConnected);
  const fetchDashboard = useDashboardStore((s) => s.fetchDashboard);
  const [busyConnector, setBusyConnector] = useState<string | null>(null);

  const handleConnectCalendar = async () => {
    try {
      setBusyConnector('calendar');
      sessionStorage.setItem('oauth_return_url', window.location.pathname);
      const { data } = await api.get('/auth/calendar/oauth-url');
      const url = data?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        setBusyConnector(null);
      }
    } catch {
      setBusyConnector(null);
    }
  };

  const handleDisconnectCalendar = async () => {
    try {
      setBusyConnector('calendar');
      await api.post('/auth/calendar/disconnect');
      disconnectConnector('calendar');
      await fetchDashboard();
    } catch {
      // ignore
    } finally {
      setBusyConnector(null);
    }
  };

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

  const connectedCount =
    (isYouTubeSynced ? 1 : 0) +
    (isCalendarConnected ? 1 : 0) +
    connectedConnectors.filter((c) => c !== 'youtube' && c !== 'calendar' && c !== 'web').length;

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
          aria-label="Connectors"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#EFEBF2] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-sora text-[13px] font-bold text-[#171717]">
                Connectors
              </span>
              {connectedCount > 0 && (
                <span className="rounded-full bg-[#F1ECFF] px-2 py-0.5 text-[10px] font-semibold text-[#4A2E8F]">
                  {connectedCount} connected
                </span>
              )}
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
          <div className="mt-2.5 space-y-2">
            {CONNECTOR_OPTIONS.map((c: ConnectorOption) => {
              const Icon = c.icon;
              const isYouTube = c.id === 'youtube';
              const isCalendar = c.id === 'calendar';
              const isConnected = isYouTube
                ? isYouTubeSynced
                : isCalendar
                  ? isCalendarConnected
                  : connectedConnectors.includes(c.id);
              const isBusy = busyConnector === c.id;

              return (
                <div
                  key={c.id}
                  className={`group relative flex items-center justify-between gap-3 rounded-xl border p-2.5 transition-all ${
                    isConnected
                      ? 'border-[#E5E0E8] bg-[#FBFAF8]'
                      : 'border-[#EFEBF2] bg-white hover:border-[#E5E0E8] hover:bg-[#FBFAF8]'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E5E0E8] bg-white p-1.5 shadow-[0_1px_2px_rgba(23,23,23,0.04)]">
                      <Icon className="h-5 w-5 object-contain" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#171717]">
                          {c.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-[#77717F]">
                        {isYouTube && isConnected && (primaryChannel?.handle || primaryChannel?.name)
                          ? `${primaryChannel.name}${primaryChannel.handle ? ` (${primaryChannel.handle})` : ''}`
                          : c.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Action: Connect vs Disconnect */}
                  <div className="flex shrink-0 items-center gap-2">
                    {isConnected ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          if (isYouTube && onDisconnectYouTube) {
                            onDisconnectYouTube();
                          } else if (isCalendar) {
                            void handleDisconnectCalendar();
                          } else {
                            disconnectConnector(c.id);
                          }
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E0E8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#625D68] transition-colors hover:border-[#B42332]/30 hover:bg-[#FFF0F3] hover:text-[#B42332] disabled:opacity-50"
                      >
                        {isBusy && <Loader2 className="h-3 w-3 animate-spin" />}
                        Disconnect
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          if (isYouTube) {
                            onConnectYouTube();
                          } else if (isCalendar) {
                            void handleConnectCalendar();
                          } else {
                            connectConnector(c.id);
                          }
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#FF98C1] px-3 py-1 text-xs font-semibold text-[#171717] transition-all hover:bg-[#FF80B0] disabled:opacity-50"
                      >
                        {isBusy && <Loader2 className="h-3 w-3 animate-spin" />}
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
