import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ChevronRight, Youtube, Check, Sparkles, Rocket } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const steps = [
  { id: 1, name: 'Welcome' },
  { id: 2, name: 'YouTube' },
  { id: 3, name: 'Niche' },
  { id: 4, name: 'Location' },
  { id: 5, name: 'Preferences' },
  { id: 6, name: 'Ready' },
];

export const OnboardingWizard: React.FC = () => {
  const { 
    step, nextStep, prevStep, 
    isYoutubeConnected,
    niche, setNiche, 
    customNiche, setCustomNiche,
    country, setCountry,
    connectedChannel, fetchChannels,
    format, setFormat, 
    tone, setTone, 
    frequency, setFrequency,
    completeOnboarding, isLoading, error: onboardingError
  } = useOnboardingStore();

  const { startGoogleOAuth } = useAuthStore();

  React.useEffect(() => {
    if (step === 2 && !isYoutubeConnected) {
      fetchChannels();
    }
  }, [step, isYoutubeConnected, fetchChannels]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="text-center space-y-8"
          >
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl border border-neutral-100 relative group">
               <Sparkles className="w-10 h-10 text-brand-600 relative z-10" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold font-sora tracking-tight text-white leading-tight">
                Welcome to <span className="text-brand-400">CreatorIQ</span>
              </h1>
              <p className="text-neutral-500 text-lg font-medium max-w-md mx-auto leading-relaxed">
                Connect your YouTube account to start optimizing your content with AI.
              </p>
            </div>
            <button 
              onClick={() => nextStep()}
              className="px-10 py-4 bg-white text-neutral-900 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-neutral-100 transition-all shadow-lg flex items-center gap-3 mx-auto group active:scale-95"
            >
              Get Started
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 max-w-md mx-auto"
          >
            <div className="space-y-3">
              <h2 className="text-3xl font-bold font-sora text-white tracking-tight">Connect YouTube</h2>
              <p className="text-neutral-500 font-medium text-sm">Link your channel to analyze performance.</p>
            </div>
            
            <div className="p-10 bg-white rounded-3xl border border-neutral-100 shadow-xl space-y-6 relative overflow-hidden group">
              <div className="flex justify-center relative z-10">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-neutral-50 flex items-center justify-center border border-neutral-100 shadow-sm">
                    <Youtube className="w-10 h-10 text-[#FF0000]" />
                  </div>
                  {isYoutubeConnected && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-brand-600 rounded-xl border-4 border-white flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              {isLoading ? (
                <div className="w-full py-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Syncing Channel...</span>
                </div>
              ) : !isYoutubeConnected ? (
                <button 
                  onClick={startGoogleOAuth}
                  className="w-full py-4 bg-neutral-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all border border-white/5 shadow-2 [box-shadow:0_0_20px_rgba(255,255,255,0.05)]"
                >
                  Connect YouTube Channel
                  <Youtube className="w-4 h-4 text-red-500" />
                </button>
              ) : (
                <div className="space-y-4">
                   <div className="flex items-center gap-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-100 transition-all hover:bg-neutral-100/50">
                      <div className="w-14 h-14 rounded-xl bg-white overflow-hidden border border-neutral-200 shadow-sm flex-shrink-0">
                        {connectedChannel?.thumbnail ? (
                          <img src={connectedChannel.thumbnail} alt="Channel" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand-600/10">
                            <Youtube className="w-7 h-7 text-brand-600" />
                          </div>
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-base font-bold text-neutral-900 leading-none truncate">
                            {connectedChannel?.name || 'Your YouTube Channel'}
                          </p>
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg border border-green-100">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                             <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest leading-none">Healthy</p>
                          </div>
                        </div>
                        {connectedChannel?.handle && (
                          <p className="text-[11px] font-medium text-neutral-400 mt-1.5">{connectedChannel.handle}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-200/50">
                           <div>
                             <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Subscribers</p>
                             <p className="text-xs font-black text-neutral-900 mt-1">{connectedChannel?.subscriber_count?.toLocaleString() || '0'}</p>
                           </div>
                           <div className="w-px h-6 bg-neutral-200" />
                           <div>
                             <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest leading-none">Videos</p>
                             <p className="text-xs font-black text-neutral-900 mt-1">{connectedChannel?.video_count?.toLocaleString() || '0'}</p>
                           </div>
                        </div>
                      </div>
                   </div>
                   <button 
                    onClick={nextStep}
                    className="w-full py-4 bg-white text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-neutral-100 transition-all border border-neutral-100"
                  >
                    Continue Onboarding
                  </button>
                </div>
              )}
            </div>
            
            <button onClick={prevStep} className="text-neutral-600 text-[10px] font-bold uppercase tracking-wider hover:text-white transition-colors">Go Back</button>
          </motion.div>
        );

      case 3:
        const niches = ['Tech', 'Gaming', 'Finance', 'Fitness', 'Cooking', 'Vlog', 'Education', 'Entertainment', 'Beauty', 'Travel', 'Music', 'Fashion', 'Other'];
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center space-y-8 max-w-2xl mx-auto"
          >
            <div className="space-y-3">
              <h2 className="text-3xl font-bold font-sora text-white tracking-tight">Channel Category</h2>
              <p className="text-neutral-500 font-medium text-sm">Select up to 3 categories that best describe your content.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {niches.map((n) => {
                const isDetected = connectedChannel?.niches?.includes(n);
                return (
                  <button
                    key={n}
                    onClick={() => {
                      if (niche.includes(n)) {
                        setNiche(niche.filter(i => i !== n));
                      } else if (niche.length < 3) {
                        setNiche([...niche, n]);
                      }
                    }}
                    className={cn(
                      "px-6 py-3 rounded-xl border transition-all font-bold text-[11px] uppercase tracking-wider relative",
                      niche.includes(n) 
                        ? "bg-brand-600 border-brand-600 text-white shadow-lg scale-105" 
                        : "bg-white/5 border-white/5 text-neutral-400 hover:border-white/10 hover:text-white"
                    )}
                  >
                    {n}
                    {isDetected && (
                      <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-yellow-400 text-neutral-900 text-[7px] font-black rounded-lg border border-neutral-900 shadow-sm animate-pulse">
                        DETECTED
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {niche.includes('Other') && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="space-y-2 text-left"
                >
                   <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-2">Custom Niche Name</label>
                   <input
                    type="text"
                    value={customNiche || ''}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    placeholder="Enter your unique niche..."
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm outline-none focus:border-brand-600 focus:bg-white/10 transition-all placeholder:text-neutral-700"
                   />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex justify-center gap-4 pt-4">
               <button onClick={prevStep} className="px-6 py-3 bg-white/5 text-neutral-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all">Back</button>
               <button 
                onClick={nextStep} 
                disabled={niche.length === 0 || (niche.includes('Other') && !customNiche)}
                className="px-10 py-3 bg-white text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-neutral-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
               >
                 Confirm
               </button>
            </div>
          </motion.div>
        );
       case 4:
        const countries = [
          'United States', 'United Kingdom', 'Canada', 'Australia', 'India', 
          'Brazil', 'Japan', 'Germany', 'France', 'Spain', 'Mexico', 'South Korea', 'Italy'
        ];
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center space-y-8 max-w-2xl mx-auto"
          >
            <div className="space-y-3">
              <h2 className="text-3xl font-bold font-sora text-white tracking-tight">Location</h2>
              <p className="text-neutral-500 font-medium text-sm">Where is your primary audience located?</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {countries.map((c) => (
                <button
                  key={c}
                  onClick={() => setCountry(c)}
                  className={cn(
                    "px-4 py-4 rounded-xl border transition-all font-bold text-[11px] uppercase tracking-wider text-left flex items-center justify-between",
                    country === c 
                      ? "bg-brand-600 border-brand-600 text-white shadow-lg" 
                      : "bg-white/5 border-white/5 text-neutral-400 hover:border-white/10 hover:text-white"
                  )}
                >
                  {c}
                  {country === c && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
            
            <div className="flex justify-center gap-4 pt-4">
               <button onClick={prevStep} className="px-6 py-3 bg-white/5 text-neutral-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all">Back</button>
               <button 
                onClick={nextStep} 
                disabled={!country}
                className="px-10 py-3 bg-white text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-neutral-100 disabled:opacity-20 transition-all"
               >
                 Next
               </button>
            </div>
          </motion.div>
        );

       case 5:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8 max-w-md mx-auto"
          >
            <div className="space-y-3">
              <h2 className="text-3xl font-bold font-sora text-white tracking-tight">Channel Details</h2>
              <p className="text-neutral-500 font-medium text-sm">Help us tailor recommendations to your style.</p>
            </div>
            
            <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-6 text-left">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-1">Primary Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Long-form', 'Shorts', 'Hybrid'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f.toLowerCase() as any)}
                      className={cn(
                        "py-3 rounded-xl border text-[10px] uppercase font-bold tracking-wider transition-all",
                        format === f.toLowerCase() ? "bg-brand-600 border-brand-600 text-white shadow-lg" : "bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-1">Posting Frequency</label>
                <select 
                  className="w-full p-4 bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm outline-none transition-all appearance-none cursor-pointer"
                  value={frequency || ''}
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <option value="" className="bg-neutral-900">Select frequency...</option>
                  <option value="daily" className="bg-neutral-900">Daily</option>
                  <option value="3x_week" className="bg-neutral-900">3x per Week</option>
                  <option value="weekly" className="bg-neutral-900">Weekly</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-1">Channel Tone</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Educational', 'Magnetic', 'Expert', 'Casual'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={cn(
                        "py-3 px-4 rounded-xl border text-[10px] uppercase font-bold tracking-wider transition-all text-left flex justify-between items-center",
                        tone === t ? "bg-brand-600 border-brand-600 text-white shadow-lg" : "bg-white/5 border-white/5 text-neutral-500 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {t}
                      {tone === t && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
             <div className="flex justify-center gap-4">
                <button onClick={prevStep} className="px-6 py-3 bg-white/5 text-neutral-400 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all">Back</button>
                <button 
                 onClick={completeOnboarding} 
                 disabled={!format || !tone || isLoading}
                 className="px-10 py-3 bg-white text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-neutral-100 disabled:opacity-20 transition-all active:scale-95 flex items-center gap-2"
                >
                  {isLoading ? 'Saving...' : 'Finish Setup'}
                </button>
             </div>
             {onboardingError && <p className="text-[10px] text-error-500 font-bold uppercase tracking-widest mt-4">{onboardingError}</p>}
           </motion.div>
         );
 
       case 6:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                className="w-40 h-40 border-[4px] border-dashed border-brand-600/30 rounded-full mx-auto"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
                  <Rocket className="w-10 h-10 text-brand-600" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold font-sora text-white tracking-tight leading-tight">Setup Complete</h1>
              <p className="text-neutral-500 font-medium max-w-sm mx-auto text-lg">
                Your account is ready. Explore your personalized dashboard and start growing.
              </p>
            </div>
            <button 
              onClick={() => window.location.href = '/app/dashboard'}
              className="px-12 py-5 bg-white text-neutral-900 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand-600/10 hover:bg-neutral-100 transition-all active:scale-95"
            >
              Enter Dashboard
            </button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-600/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-900/40 rounded-full blur-[160px]" />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {step < 6 && (
          <div className="flex justify-center gap-3 mb-16">
            {steps.map((s) => (
              <div 
                key={s.id}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  step >= s.id ? "bg-brand-600 w-12" : "bg-white/10 w-6"
                )}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={step}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-10 text-[9px] uppercase font-bold tracking-widest text-neutral-600 flex gap-8">
        <span className="text-white/20">© 2026 CreatorIQ</span>
        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
      </div>
    </div>
  );
};

