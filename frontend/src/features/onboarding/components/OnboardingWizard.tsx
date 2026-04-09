import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { WelcomeStep } from './steps/WelcomeStep';
import { ConnectStep } from './steps/ConnectStep';
import { NicheStep } from './steps/NicheStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { ReadyStep } from './steps/ReadyStep';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const stepsConfig = [
  { id: 1, name: 'Welcome' },
  { id: 2, name: 'YouTube' },
  { id: 3, name: 'Setup' },
  { id: 4, name: 'Ready' },
];

export const OnboardingWizard: React.FC = () => {
  const { 
    step, nextStep, prevStep, setStep,
    isYoutubeConnected,
    niche, setNiche, 
    customNiche, setCustomNiche,
    country, setCountry,
    connectedChannel, fetchChannels,
    format, setFormat, 
    tone, setTone, 
    frequency, setFrequency,
    completeOnboarding, isLoading, error: onboardingError, reset
  } = useOnboardingStore();

  const { startGoogleOAuth, user } = useAuthStore();

  // Safety Reset: If the browser has a persisted 'step 5+' but the user is not yet onboarded,
  // it means the state is from a previous session. Reset to step 1.
  useEffect(() => {
    if (step >= 5 && user && !user.onboarding_completed) {
      setStep(1);
    }
    // Handle invalid step numbers
    if (step < 1 || step > 5) {
      setStep(1);
    }
  }, [step, user, setStep]);

  // Smart Skip Logic: If user already authenticated with Google (OAuth signup), skip Step 2
  useEffect(() => {
    if (step === 2 && user?.is_google_authenticated) {
      nextStep();
    }
  }, [step, user?.is_google_authenticated, nextStep]);

  useEffect(() => {
    if (step === 2 && !isYoutubeConnected) {
      fetchChannels();
    }
  }, [step, isYoutubeConnected, fetchChannels]);

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return <WelcomeStep onNext={nextStep} />;
      
      case 2:
        return (
          <ConnectStep 
            isLoading={isLoading}
            isYoutubeConnected={isYoutubeConnected}
            onConnect={startGoogleOAuth}
            onNext={nextStep}
            onBack={prevStep}
            connectedChannel={connectedChannel || undefined}
          />
        );

      case 3:
        return (
          <NicheStep 
            selectedNiches={niche}
            customNiche={customNiche || undefined}
            detectedNiches={connectedChannel?.niches}
            onToggleNiche={(n) => {
              if (niche.includes(n)) {
                setNiche(niche.filter(i => i !== n));
              } else if (niche.length < 3) {
                setNiche([...niche, n]);
              }
            }}
            onCustomNicheChange={setCustomNiche}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 4:
        return (
          <PreferencesStep 
            format={format}
            frequency={frequency}
            tone={tone}
            country={country}
            isLoading={isLoading}
            error={onboardingError}
            setFormat={setFormat}
            setFrequency={setFrequency}
            setTone={setTone}
            setCountry={setCountry}
            onComplete={async () => {
              await completeOnboarding();
              setStep(5); // Go to Ready State
            }}
            onBack={prevStep}
          />
        );

      case 5:
        return (
          <ReadyStep 
            onEnter={() => {
              reset();
              window.location.href = '/app/dashboard';
            }} 
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sora">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-600/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-900/40 rounded-full blur-[160px]" />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {step < 5 && (
          <div className="flex justify-center gap-3 mb-16">
            {stepsConfig.map((s) => (
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
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-10 text-[9px] uppercase font-bold tracking-widest text-neutral-600 flex gap-8">
        <span className="text-white/20">© 2026 CreatorIQ</span>
        <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
        <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
      </div>
    </div>
  );
};


