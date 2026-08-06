import React, { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import {
  Youtube,
  Mail,
  User,
  Lock,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

const OAUTH_LOGIN_ERRORS: Record<string, string> = {
  missing_code: 'Sign-in was cancelled or incomplete.',
  invalid_state: 'Session expired. Please try again.',
  token_exchange: 'Could not complete sign-in with Google.',
  profile: 'Could not load your Google profile.',
  missing_profile: 'Your Google account did not return an email.',
  account_conflict: 'This email is linked to another Google account.',
  access_denied: 'Google sign-in was cancelled.',
};

const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AuthFormValues = z.infer<typeof authSchema>;

const benefits = [
  { icon: TrendingUp, text: 'Personalized Top 5 trend feed on day one' },
  { icon: Sparkles, text: 'AI strategy briefs grounded in your niche' },
  { icon: BarChart2, text: 'Analytics and planning in one workspace' },
];

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotificationStore();

  const isLoginPage = location.pathname === '/login';
  const mode = isLoginPage ? 'login' : 'signup';

  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const register = useAuthStore((s) => s.register);
  const startGoogleOAuth = useAuthStore((s) => s.startGoogleOAuth);
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

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode) {
      const message = OAUTH_LOGIN_ERRORS[errorCode] ?? errorCode.replace(/_/g, ' ');
      addNotification('error', 'Authentication Failed', message);
    }
  }, [searchParams, addNotification]);

  const onFormSubmit = async (data: AuthFormValues) => {
    if (mode === 'signup' && (!data.name || data.name.length < 2)) {
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

  const handleGoogle = async () => {
    try {
      await startGoogleOAuth();
    } catch {
      addNotification('error', 'OAuth Error', 'Could not initiate Google sign-in.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="surface-dark relative hidden w-1/2 flex-col justify-between overflow-hidden p-10 lg:flex xl:p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl animate-breathe" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
              <img src={logo} className="h-full w-full object-contain" alt="CreatorIQ" />
            </div>
            <span className="font-sora text-lg font-semibold text-white">
              Creator<span className="text-neutral-500">IQ</span>
            </span>
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-16 max-w-md font-sora text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl"
          >
            Grow your channel with{' '}
            <span className="text-gradient-brand">clear signals</span>, not guesswork.
          </motion.h1>

          <div className="mt-10 space-y-4">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex items-center gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-brand-300">
                  <benefit.icon className="h-4 w-4" />
                </div>
                <p className="text-sm text-neutral-300">{benefit.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative z-10 glass-dark rounded-2xl p-6"
        >
          <p className="text-sm leading-relaxed text-neutral-300">
            &ldquo;CreatorIQ cut my research time in half. The trend feed actually matches my niche.&rdquo;
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/20 text-sm font-semibold text-brand-300">
              JC
            </div>
            <div>
              <p className="text-sm font-medium text-white">James C.</p>
              <p className="text-xs text-neutral-500">Tech creator · 1.2M subs</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Form panel */}
      <div className="surface-app flex w-full flex-col items-center justify-center px-4 py-10 sm:px-6 lg:w-1/2">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5 shadow-sm">
            <img src={logo} alt="CreatorIQ" className="h-full w-full object-contain" />
          </div>
          <span className="font-sora text-base font-semibold text-neutral-900">CreatorIQ</span>
        </div>

        <Card variant="elevated" className="w-full max-w-md shadow-xl shadow-neutral-900/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="font-sora text-2xl font-semibold tracking-tight text-neutral-900">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="mt-1.5 text-sm text-neutral-500">
                  {mode === 'login'
                    ? 'Sign in to continue to your workspace.'
                    : 'Start free — your first trend feed is on us.'}
                </p>
              </div>

              {storeError && (
                <Alert variant="error" className="mb-5 flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {storeError}
                </Alert>
              )}

              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <AnimatePresence>
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      <label className="text-xs font-medium text-neutral-600">Full name</label>
                      <Input
                        {...registerField('name')}
                        icon={<User className="h-4 w-4" />}
                        placeholder="Your name"
                        className={errors.name ? 'border-red-300' : ''}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-600">{errors.name.message}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-neutral-600">Email</label>
                  <Input
                    {...registerField('email')}
                    type="email"
                    icon={<Mail className="h-4 w-4" />}
                    placeholder="you@example.com"
                    className={errors.email ? 'border-red-300' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-neutral-600">Password</label>
                    {mode === 'login' && (
                      <button type="button" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    {...registerField('password')}
                    type="password"
                    icon={<Lock className="h-4 w-4" />}
                    placeholder="At least 8 characters"
                    className={errors.password ? 'border-red-300' : ''}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === 'login' ? (
                    'Sign in'
                  ) : (
                    'Create account'
                  )}
                </Button>

                <div className="relative flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-neutral-200" />
                  <span className="text-xs text-neutral-400">or</span>
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  size="lg"
                  onClick={() => void handleGoogle()}
                  disabled={isLoading}
                >
                  <Youtube className="h-4 w-4 text-red-600" />
                  Continue with YouTube
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-neutral-500">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => navigate(mode === 'login' ? '/signup' : '/login')}
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>

              {mode === 'signup' && (
                <p className="mt-6 text-center text-xs leading-relaxed text-neutral-400">
                  By signing up, you agree to our{' '}
                  <Link to="/terms" className="text-neutral-600 hover:text-neutral-900">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-neutral-600 hover:text-neutral-900">
                    Privacy Policy
                  </Link>
                  .
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </Card>

        <div className="mt-6 hidden items-center gap-6 text-xs text-neutral-400 lg:flex">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-success-600" />
            Free first feed
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-success-600" />
            No credit card
          </span>
        </div>
      </div>
    </div>
  );
};
