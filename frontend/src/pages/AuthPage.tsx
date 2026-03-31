import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router';
import { useAuthStore } from '../stores/useAuthStore';
import { Youtube, Mail, User, Lock, Loader2, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
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

export const AuthPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Determine mode from path
  const isLoginPage = location.pathname === '/login';
  const mode = isLoginPage ? 'login' : 'signup';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [oauthRedirectError, setOauthRedirectError] = useState<string | null>(null);

  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const register = useAuthStore((s) => s.register);
  const startGoogleOAuth = useAuthStore((s) => s.startGoogleOAuth);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    clearError();
    setOauthRedirectError(null);
  }, [mode, clearError]);

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (!errorCode) return;
    setOauthRedirectError(OAUTH_LOGIN_ERRORS[errorCode] ?? errorCode.replace(/_/g, ' '));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await loginWithPassword(email, password);
        const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/app/dashboard';
        navigate(from, { replace: true });
      } else {
        await register(name, email, password);
        navigate('/onboarding');
      }
    } catch {
      /* error set in store */
    }
  };

  const handleGoogle = async () => {
    try {
      await startGoogleOAuth();
    } catch {
      /* error set in store */
    }
  };

  return (
    <div className="h-screen bg-neutral-950 flex overflow-hidden relative font-sora">
      <div className="absolute inset-0 mesh-glow opacity-20 pointer-events-none" />

      {/* Left Decoration / Marketing Column */}
      <div className="hidden lg:flex w-1/2 p-12 flex-col justify-between relative border-r border-white/5 bg-white/2 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-brand-600/10 rounded-full blur-[100px] animate-breathe" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-10 flex items-center gap-4"
          >
            <img src={logo} className="h-14 w-auto object-contain" alt="CreatorIQ" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black text-white leading-[1.1] mb-6 tracking-[-0.04em]"
          >
            The <span className="text-brand-400">Professional</span> Standard for <br />
            Creator Growth.
          </motion.h1>

          <div className="space-y-5 max-w-sm">
            {[
              { icon: <Sparkles className="w-5 h-5" />, text: 'AI-driven discovery before trends peak.' },
              { icon: <CheckCircle2 className="w-5 h-5" />, text: 'Automated high-CTR structural blueprints.' },
              { icon: <User className="w-5 h-5" />, text: 'Deep behavior heatmap analysis.' },
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

        {/* Only show testimonial on taller screens to prevent scrolling on 730px height */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 glass-dark p-6 rounded-[32px] border border-white/10 backdrop-blur-xl group cursor-pointer hover:bg-white/5 transition-all mt-4 hidden xl:block"
        >
          <p className="text-white text-base font-bold mb-4 italic leading-relaxed tracking-tight group-hover:text-brand-300 transition-colors">
            &quot;This platform automated 20 hours of my weekly research. It&apos;s the standard for professional creators.&quot;
          </p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 border-2 border-brand-600 shadow-2xl overflow-hidden">
              <img
                src="https://i.pravatar.cc/150?img=11"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                alt="Testimonial"
              />
            </div>
            <div>
              <p className="text-base font-black text-white tracking-tight">James C.</p>
              <p className="text-xs font-black text-brand-400 uppercase tracking-widest">Tech Architect (1.2M Subs)</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-14 relative z-10 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-12 flex items-center gap-4 justify-center">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white font-bold text-xl">
              C
            </div>
            <span className="font-bold text-2xl tracking-tight text-neutral-900">CreatorIQ</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-4xl font-black text-neutral-900 tracking-tight">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-neutral-500 mt-2 font-bold text-base uppercase tracking-wider opacity-60">
                  {mode === 'login' ? 'Sign in to your account.' : 'Start optimizing your channel.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {(error || oauthRedirectError) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm font-black text-red-700 shadow-sm mb-6"
                  >
                    {error || oauthRedirectError}
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
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Full Name</label>
                        <div className="relative group">
                          <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-brand-600 transition-colors" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Elon Musk"
                            required={mode === 'signup'}
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-neutral-100 bg-neutral-50/50 focus:bg-white text-neutral-900 text-sm font-black focus:ring-8 focus:ring-brand-600/5 focus:border-brand-600/20 outline-none transition-all placeholder:text-neutral-300"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
 
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Work Email</label>
                    <div className="relative group">
                      <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-brand-600 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@creatoriq.ai"
                        required
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-neutral-100 bg-neutral-50/50 focus:bg-white text-neutral-900 text-sm font-black focus:ring-8 focus:ring-brand-600/5 focus:border-brand-600/20 outline-none transition-all placeholder:text-neutral-300"
                      />
                    </div>
                  </div>
 
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-end pl-1">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Password</label>
                      {mode === 'login' && (
                        <a href="#" className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:text-brand-500 transition-colors">Forgot?</a>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-brand-600 transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={mode === 'signup' ? 8 : undefined}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-neutral-100 bg-neutral-50/50 focus:bg-white text-neutral-900 text-sm font-black focus:ring-8 focus:ring-brand-600/5 focus:border-brand-600/20 outline-none transition-all placeholder:text-neutral-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-neutral-950 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-brand-600/10 hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
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
                  className="w-full py-4 border-2 border-neutral-100 rounded-2xl font-black text-xs uppercase tracking-widest text-neutral-900 hover:bg-neutral-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  <Youtube className="w-5 h-5 text-[#FF0000]" />
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
                  <a href="#" className="text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-4">Terms</a>
                  {' & '}
                  <a href="#" className="text-neutral-400 hover:text-neutral-900 transition-colors underline underline-offset-4">Privacy</a>
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
