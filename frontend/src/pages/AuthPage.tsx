import React, { useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../stores/useAuthStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { Youtube, Mail, User, Lock, Loader2, Sparkles, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';

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
  email: z.string().email('Please enter a valid work email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AuthFormValues = z.infer<typeof authSchema>;

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
    // Manual validation for Name on signup mode
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
        addNotification('success', 'Account Created', 'Welcome to CreatorIQ. Let\'s set up your profile.');
        navigate('/onboarding');
      }
    } catch (err: any) {
       // Error handled by store and interceptor
    }
  };

  const handleGoogle = async () => {
    try {
      await startGoogleOAuth();
    } catch (err: any) {
      addNotification('error', 'OAuth Error', 'Could not initiate Google sign-in.');
    }
  };

  return (
    <div className="h-screen bg-neutral-950 flex overflow-hidden relative font-sora">
      <div className="absolute inset-0 mesh-glow opacity-20 pointer-events-none" />

      {/* Left Column: Branding/Value Prop */}
      <div className="hidden lg:flex w-1/2 p-12 flex-col justify-between relative border-r border-white/5 bg-white/2 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-brand-600/10 rounded-full blur-[100px] animate-breathe" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 flex items-center gap-2.5"
          >
            <img src={logo} className="h-9 w-auto object-contain" alt="CreatorIQ" />
            <span className="text-xl font-bold font-sora tracking-tight">
              <span className="text-white">Creator</span>
              <span className="text-neutral-500">IQ</span>
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black text-white leading-tight mb-6 tracking-tight"
          >
            The <span className="text-brand-400">Standard</span> for <br />
            YouTube Growth.
          </motion.h1>

          <div className="space-y-5 max-w-sm">
            {[
              { icon: <Sparkles className="w-5 h-5" />, text: 'Spot trends before they go viral.' },
              { icon: <CheckCircle2 className="w-5 h-5" />, text: 'Build videos that people click on.' },
              { icon: <User className="w-5 h-5" />, text: 'Understand what your viewers love.' },
            ].map((benefit, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-6 text-neutral-400 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-400 flex-shrink-0 border border-white/5 group-hover:bg-brand-600 group-hover:text-white transition-all duration-500">
                  {benefit.icon}
                </div>
                <p className="text-sm font-bold leading-relaxed mt-1 group-hover:text-white transition-colors">{benefit.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 glass-dark p-6 rounded-[32px] border border-white/10 backdrop-blur-xl group cursor-pointer hover:bg-white/5 transition-all mt-4 hidden xl:block"
        >
          <p className="text-white text-sm font-bold mb-4 italic leading-relaxed tracking-tight group-hover:text-brand-300 transition-colors">
            &quot;This platform saved me 20 hours of research every week. It&apos;s a must-have for any serious creator.&quot;
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-800 border-2 border-brand-600 shadow-xl overflow-hidden">
              <img
                src="https://i.pravatar.cc/150?img=11"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                alt="Testimonial"
              />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-tight">James C.</p>
              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Tech Creator (1.2M Subs)</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-14 relative z-10 bg-white">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8 text-center lg:text-left">
                <h2 className="text-3xl font-black text-neutral-900 tracking-tight">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-neutral-500 mt-1.5 font-bold text-sm uppercase tracking-wider opacity-60">
                  {mode === 'login' ? 'Sign in to your account.' : 'Start growing your channel.'}
                </p>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                {storeError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-2xl bg-rose-50 border border-rose-100 p-4 text-sm font-black text-rose-700 shadow-sm mb-6 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {storeError}
                  </motion.div>
                )}

                <div className="space-y-4">
                  <AnimatePresence>
                    {mode === 'signup' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="space-y-1.5"
                      >
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Full Name</label>
                        <div className="relative group">
                          <User className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.name ? 'text-rose-500' : 'text-neutral-400 group-focus-within:text-brand-600'}`} />
                          <input
                            {...registerField('name')}
                            type="text"
                            placeholder="Elon Musk"
                            className={`w-full pl-11 pr-4 py-3 rounded-2xl border bg-neutral-50/50 focus:bg-white text-neutral-900 text-sm font-bold outline-none transition-all placeholder:text-neutral-300 ${
                              errors.name ? 'border-rose-200 focus:ring-rose-500/5 focus:border-rose-500/20' : 'border-neutral-100 focus:ring-brand-600/5 focus:border-brand-600/20'
                            }`}
                          />
                        </div>
                        {errors.name && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1">{errors.name.message}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
 
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1">Work Email</label>
                    <div className="relative group">
                      <Mail className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-rose-500' : 'text-neutral-400 group-focus-within:text-brand-600'}`} />
                      <input
                        {...registerField('email')}
                        type="email"
                        placeholder="name@creatoriq.ai"
                        className={`w-full pl-11 pr-4 py-3 rounded-2xl border bg-neutral-50/50 focus:bg-white text-neutral-900 text-sm font-bold outline-none transition-all placeholder:text-neutral-300 ${
                          errors.email ? 'border-rose-200 focus:ring-rose-500/5 focus:border-rose-500/20' : 'border-neutral-100 focus:ring-brand-600/5 focus:border-brand-600/20'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1">{errors.email.message}</p>
                    )}
                  </div>
 
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end pl-1">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Password</label>
                      {mode === 'login' && (
                        <a href="#" className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:text-brand-500 transition-colors">Forgot?</a>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-rose-500' : 'text-neutral-400 group-focus-within:text-brand-600'}`} />
                      <input
                        {...registerField('password')}
                        type="password"
                        placeholder="••••••••"
                        className={`w-full pl-11 pr-4 py-3 rounded-2xl border bg-neutral-50/50 focus:bg-white text-neutral-900 text-sm font-bold outline-none transition-all placeholder:text-neutral-300 ${
                          errors.password ? 'border-rose-200 focus:ring-rose-500/5 focus:border-rose-500/20' : 'border-neutral-100 focus:ring-brand-600/5 focus:border-brand-600/20'
                        }`}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-neutral-950 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-brand-600/10 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {mode === 'login' ? 'Log In' : 'Create Account'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>

                <div className="relative flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-neutral-100" />
                  <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider whitespace-nowrap">Secure Sign-On</span>
                  <div className="flex-1 h-px bg-neutral-100" />
                </div>

                <button
                  type="button"
                  onClick={() => void handleGoogle()}
                  disabled={isLoading}
                  className="w-full py-3 border-2 border-neutral-100 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-neutral-900 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  <Youtube className="w-4 h-4 text-[#FF0000]" />
                  Continue with YouTube
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">
                  {mode === 'login' ? 'New here?' : 'Already have an account?'}
                  {' '}
                  <button 
                    onClick={() => navigate(mode === 'login' ? '/signup' : '/login')}
                    className="text-brand-600 hover:text-brand-400 transition-colors ml-2"
                  >
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>

              {mode === 'signup' && (
                <p className="mt-10 text-center text-[10px] text-neutral-300 font-bold leading-relaxed max-w-xs mx-auto uppercase tracking-tighter">
                  By signing up, you agree to our <br />
                  <Link to="/terms" className="text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-4">Terms</Link>
                  {' & '}
                  <Link to="/privacy" className="text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-4">Privacy</Link>
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
