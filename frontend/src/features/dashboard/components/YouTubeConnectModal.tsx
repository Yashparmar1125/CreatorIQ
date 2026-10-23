import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, Sparkles, X, Youtube } from 'lucide-react';
import { api } from '../../../lib/api';
import type { ConnectedChannel } from '../../../stores/useDashboardStore';

interface YouTubeConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryChannel: ConnectedChannel | null;
  onChannelUpdated?: () => void;
}

export const YouTubeConnectModal: React.FC<YouTubeConnectModalProps> = ({
  isOpen,
  onClose,
  primaryChannel,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartOAuth = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.get<{ data: { url: string } }>('/auth/google/oauth-url');
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
        return;
      }
      throw new Error('OAuth initiation did not return a redirection URL.');
    } catch (err: any) {
      setLoading(false);
      const detail = err.response?.data?.detail;
      if (detail?.code === 'GOOGLE_OAUTH_NOT_CONFIGURED') {
        setErrorMsg(
          'Google OAuth credentials are not configured in your backend .env file (GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET). You are currently running in Manual Profile Mode.'
        );
      } else {
        setErrorMsg(
          err.response?.data?.error?.message ||
            detail?.message ||
            'Could not initiate Google OAuth. Please check your network connection or server status.'
        );
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-[#E5E0E8] bg-white p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-[#77717F] hover:bg-[#F6F3FF] hover:text-[#171717]"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header Icon */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#FFD6E5] bg-[#FFF0F5] text-[#D81B60]">
                <Youtube className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-sora text-base font-bold text-[#171717]">
                  Connect YouTube Account
                </h3>
                <p className="text-xs text-[#625D68]">
                  OAuth 2.0 Real-Time Channel Intelligence
                </p>
              </div>
            </div>

            {/* Current Status Box */}
            <div className="mt-4 rounded-xl border border-[#EFEBF2] bg-[#FBFAF8] p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#77717F]">Current Status</span>
                {primaryChannel?.is_oauth_connected ? (
                  <span className="inline-flex items-center gap-1 font-bold text-[#167A59]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Live OAuth Synced
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-[#D81B60]">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Manual Profile Mode (Unsynced)
                  </span>
                )}
              </div>

              {primaryChannel && (
                <div className="mt-2 text-xs text-[#171717]">
                  Target handle:{' '}
                  <span className="font-mono font-bold text-[#4A2E8F]">
                    @{primaryChannel.handle?.replace(/^@/, '') || primaryChannel.name}
                  </span>
                </div>
              )}
            </div>

            {/* Value Proposition bullets */}
            <div className="mt-4 space-y-2 text-xs text-[#625D68]">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7C5CD6]" />
                <span>
                  <strong>Full Channel Memory:</strong> Ground copilot strategies in your actual retention curves and viewer drop-off points.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7C5CD6]" />
                <span>
                  <strong>Real View Signals:</strong> Ingest genuine subscriber baselines rather than public approximations.
                </span>
              </div>
            </div>

            {/* Error / Alert notice if OAuth is not configured */}
            {errorMsg && (
              <div className="mt-4 rounded-xl border border-[#FCD8DF] bg-[#FFF0F3] p-3 text-xs leading-relaxed text-[#B42332]">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B42332]" />
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleStartOAuth}
                disabled={loading}
                className="app-btn-pink inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting to Google…
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4" />
                    Connect via Google OAuth
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-full items-center justify-center rounded-xl text-xs font-semibold text-[#77717F] hover:bg-[#F6F3FF] hover:text-[#171717]"
              >
                Continue in Manual Profile Mode
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
