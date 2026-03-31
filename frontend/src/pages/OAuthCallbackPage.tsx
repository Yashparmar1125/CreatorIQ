import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const applyHashTokens = useAuthStore((s) => s.applyHashTokens);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) {
      setErr('No OAuth data received');
      return;
    }
    void (async () => {
      try {
        await applyHashTokens(hash);
        window.history.replaceState(null, '', window.location.pathname);
        const u = useAuthStore.getState().user;
        navigate(u?.onboarding_completed ? '/app/dashboard' : '/onboarding', { replace: true });
      } catch {
        setErr('Could not complete sign-in');
      }
    })();
  }, [applyHashTokens, navigate]);

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
        <div className="text-center max-w-md">
          <p className="text-red-400 font-bold mb-4">{err}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="px-6 py-2 rounded-xl bg-white text-neutral-900 font-bold text-sm"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-brand-400" />
      <p className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Completing sign-in…</p>
    </div>
  );
};
