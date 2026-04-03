import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { Analytics } from '@vercel/analytics/react';
import { MainLayout } from './layouts/MainLayout';
import { OnboardingWizard } from './features/onboarding/components/OnboardingWizard';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/Toaster';

// Feature Pages
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { TrendsPage } from './features/trends/pages/TrendsPage';
import { StrategyPage } from './features/strategy/pages/StrategyPage';
import { PlannerPage } from './features/planner/pages/PlannerPage';
import { AnalyticsPage } from './features/analytics/pages/AnalyticsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/signup',
    element: <AuthPage />,
  },
  {
    path: '/auth/callback',
    element: <OAuthCallbackPage />,
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingWizard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: <Navigate to="/app/dashboard" replace />,
  },
  {
    path: '/trends',
    element: <Navigate to="/app/trends" replace />,
  },
  {
    path: '/strategy',
    element: <Navigate to="/app/strategy" replace />,
  },
  {
    path: '/planner',
    element: <Navigate to="/app/planner" replace />,
  },
  {
    path: '/analytics',
    element: <Navigate to="/app/analytics" replace />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'trends',
        element: <TrendsPage />,
      },
      {
        path: 'strategy',
        element: <StrategyPage />,
      },
      {
        path: 'planner',
        element: <PlannerPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: '*',
        element: (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-100 shadow-sm">
            <h1 className="text-4xl font-bold font-sora text-neutral-300 mb-2">404</h1>
            <p className="text-neutral-500 font-medium tracking-tight">Feature currently in production...</p>
            <div className="mt-6 flex justify-center gap-4">
               <div className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />
               <div className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse delay-100" />
               <div className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse delay-200" />
            </div>
          </div>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
      <Analytics />
    </>
  );
}

export default App;
