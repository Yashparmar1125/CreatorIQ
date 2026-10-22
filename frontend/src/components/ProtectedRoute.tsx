import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    void fetchMe();
  }, [hydrated, accessToken, fetchMe]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFAF8] text-[#171717]">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C5CD6]" />
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle Onboarding Redirection
  if (user) {
    const isOnboardingPage = location.pathname === '/onboarding';
    
    if (!user.onboarding_completed && !isOnboardingPage) {
      return <Navigate to="/onboarding" replace />;
    }
    
    if (user.onboarding_completed && isOnboardingPage) {
      return <Navigate to="/app/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
