import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { BrandLogo } from '../components/brand/BrandLogo';
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import './AuthPage.css';

const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AuthFormValues = z.infer<typeof authSchema>;

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();

  const isLoginPage = location.pathname === '/login';
  const mode = isLoginPage ? 'login' : 'signup';

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const register = useAuthStore((s) => s.register);
  const storeError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const isLoading = useAuthStore((s) => s.isLoading);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    mode: 'onTouched',
  });

  useEffect(() => {
    clearError();
    reset();
  }, [mode, clearError, reset]);

  const onFormSubmit = async (data: AuthFormValues) => {
    if (mode === 'signup' && (!data.name || data.name.trim().length < 2)) {
      setError('name', { type: 'manual', message: 'Full name must be at least 2 characters' });
      return;
    }

    try {
      if (mode === 'login') {
        await loginWithPassword(data.email, data.password);
        addNotification('success', 'Welcome Back!', 'Redirecting to your dashboard...');
        const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/app/dashboard';
        navigate(from, { replace: true });
      } else {
        await register(data.name || '', data.email, data.password);
        addNotification('success', 'Account Created', "Welcome to CreatorIQ. Let's set up your profile.");
        navigate('/onboarding');
      }
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="auth-page min-h-screen flex flex-col justify-between bg-white text-[#181719]">
      {/* Top Header */}
      <header className="w-full max-w-[1340px] mx-auto px-6 sm:px-10 lg:px-12 pt-6 sm:pt-8 pb-4 flex items-center justify-between">
        <BrandLogo to="/" size="md" />

        <Link
          to="/"
          className="text-xs sm:text-[13px] font-medium text-[#23202a] hover:text-black transition-colors"
        >
          â€” Back to Home
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center w-full max-w-[1340px] mx-auto px-6 sm:px-10 lg:px-12 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center w-full">
          {/* Left Column: Lavender Visual Card */}
          <div className="lg:col-span-7 flex justify-center lg:justify-start w-full">
            <div className="auth-lavender-box w-full max-w-[580px] p-8 sm:p-11 lg:p-12 flex flex-col justify-between">
              <div>
                <p className="text-[10px] sm:text-[10.5px] font-bold tracking-[0.14em] text-[#716c7d] uppercase mb-4 sm:mb-5">
                  YOUR PLANNING, A LITTLE CLEARER.
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold font-cal-sans text-[#14121a] leading-[1.14] tracking-[-0.03em] mb-8 sm:mb-10">
                  Find your trending content,
                  <br />
                  Then we plan it
                </h1>
              </div>

              {/* Floating White Trend Metric Card with Neobrutalist Mint Drop Shadow */}
              <div className="auth-metric-card p-6 sm:p-7">
                {/* Booming pill tag */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8faf3] text-[#059669] text-xs font-bold border border-[#a7f3d0]/60">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Booming</span>
                </div>

                {/* Card Title */}
                <h2 className="text-xl sm:text-[22px] font-bold text-[#14121a] font-cal-sans mt-3.5 mb-1.5">
                  AI budgeting tools
                </h2>

                {/* Card Description */}
                <p className="text-xs sm:text-[13px] text-[#6b6775] leading-relaxed">
                  Audience attention is building across 42 sampled channels.
                </p>

                {/* Card Bottom Row */}
                <div className="mt-8 flex items-baseline justify-between">
                  <div className="text-[28px] sm:text-[32px] font-extrabold text-[#14121a] font-cal-sans tracking-tight flex items-center gap-1">
                    +28% <ArrowUpRight className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div className="text-[11px] sm:text-[11.5px] text-[#716c7a] font-medium text-right leading-tight">
                    <div>Next 30d attention</div>
                    <div className="mt-0.5">81% model confidence</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Auth Form */}
          <div className="lg:col-span-5 flex justify-center lg:justify-start w-full">
            <div className="w-full max-w-[390px]">
              {/* Title & Subtitle */}
              <div className="mb-6 sm:mb-7">
                <h2 className="text-3xl sm:text-[38px] font-extrabold text-[#14121a] font-cal-sans tracking-[-0.025em] leading-tight">
                  {mode === 'login' ? 'Welcome back.' : 'Create an account.'}
                </h2>
                <p className="text-[13px] sm:text-[13.5px] text-[#6b6775] mt-2">
                  {mode === 'login'
                    ? 'Sign in to pick up your next investigation.'
                    : 'Start finding high-impact trending content today.'}
                </p>
              </div>

              {/* Server / Store Error Alert */}
              {storeError && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{storeError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs sm:text-[13px] font-bold text-[#181719] mb-1.5">
                      Full name
                    </label>
                    <input
                      {...registerField('name')}
                      placeholder="Asha Sharma"
                      className="auth-page-input"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#181719] mb-1.5">
                    Email address
                  </label>
                  <input
                    {...registerField('email')}
                    type="email"
                    placeholder="asha@example.com"
                    className="auth-page-input"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-[13px] font-bold text-[#181719] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      {...registerField('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      className="auth-page-input pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#716c7a] hover:text-[#181719] transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                {mode === 'login' && (
                  <div className="flex items-center gap-2.5 pt-1 select-none">
                    <button
                      type="button"
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all cursor-pointer ${
                        rememberMe
                          ? 'bg-[#8b5cf6] border border-[#8b5cf6]'
                          : 'bg-white border-[1.5px] border-[#dcd7e3]'
                      }`}
                      aria-checked={rememberMe}
                      role="checkbox"
                    >
                      {rememberMe && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                    <span
                      onClick={() => setRememberMe(!rememberMe)}
                      className="text-xs sm:text-[13px] font-medium text-[#181719] cursor-pointer"
                    >
                      Remember me
                    </span>
                  </div>
                )}

                {/* Pink CTA Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="auth-cta-btn mt-5"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#181719]" />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>

              {/* Switch Auth Mode Link */}
              <div className="text-center mt-5 mb-5">
                <button
                  type="button"
                  onClick={() => navigate(mode === 'login' ? '/signup' : '/login')}
                  className="text-xs sm:text-[13px] font-semibold text-[#181719] hover:underline cursor-pointer"
                >
                  {mode === 'login'
                    ? 'New to Orbit? Create an account â†’'
                    : 'Already have an account? Sign in â†’'}
                </button>
              </div>

              {/* Privacy Badge */}
              <div className="auth-privacy-box p-3.5 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
                <p className="text-[11.5px] sm:text-xs text-[#4b5563] leading-snug">
                  Your activity is private. You control which channel analytics you connect.
                </p>
              </div>

              {/* Bottom Legal Notice */}
              <p className="text-[11px] sm:text-[11.5px] text-[#8e8995] text-center mt-6">
                By {mode === 'login' ? 'signing in' : 'signing up'}, you agree to the{' '}
                <Link to="/terms" className="underline hover:text-[#181719]">
                  Terms
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="underline hover:text-[#181719]">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom spacer / aesthetic breathing room */}
      <footer className="w-full py-2"></footer>
    </div>
  );
};
