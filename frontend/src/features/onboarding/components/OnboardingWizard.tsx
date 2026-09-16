import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore } from '../stores/onboardingStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { WelcomeStep } from './steps/WelcomeStep';
import { ManualChannelStep } from './steps/ManualChannelStep';
import { NicheStep } from './steps/NicheStep';
import { PreferencesStep } from './steps/PreferencesStep';
import { ProfileReviewStep } from './steps/ProfileReviewStep';
import { ReadyStep } from './steps/ReadyStep';
import logo from '../../../assets/logo.png';
import { cn } from '../../../lib/utils';

const stepsConfig = [
  { id: 1, name: 'Welcome' },
  { id: 2, name: 'Channel' },
  { id: 3, name: 'Niche' },
  { id: 4, name: 'Preferences' },
  { id: 5, name: 'Review' },
];

export const OnboardingWizard: React.FC = () => {
  const {
    step,
    nextStep,
    prevStep,
    setStep,
    channelName,
    setChannelName,
    channelHandle,
    setChannelHandle,
    subscriberCount,
    setSubscriberCount,
    niche,
    setNiche,
    customNiche,
    setCustomNiche,
    country,
    setCountry,
    profileMaturity,
    format,
    setFormat,
    tone,
    setTone,
    frequency,
    setFrequency,
    completeOnboarding,
    isLoading,
    error: onboardingError,
    reset,
  } = useOnboardingStore();

  const { user } = useAuthStore();

  const TOTAL_STEPS = 6;

  useEffect(() => {
    if (step >= TOTAL_STEPS && user && !user.onboarding_completed) {
      setStep(1);
    }
    if (step < 1 || step > TOTAL_STEPS) {
      setStep(1);
    }
  }, [step, user, setStep, TOTAL_STEPS]);

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return <WelcomeStep onNext={nextStep} />;

      case 2:
        return (
          <ManualChannelStep
            channelName={channelName}
            channelHandle={channelHandle}
            subscriberCount={subscriberCount}
            onChannelNameChange={setChannelName}
            onChannelHandleChange={setChannelHandle}
            onSubscriberCountChange={setSubscriberCount}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case 3:
        return (
          <NicheStep
            selectedNiches={niche}
            customNiche={customNiche || undefined}
            detectedNiches={[]}
            isNewChannel={true}
            onToggleNiche={(n) => {
              if (niche.includes(n)) {
                setNiche(niche.filter((i) => i !== n));
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
            isLoading={false}
            setFormat={setFormat}
            setFrequency={setFrequency}
            setTone={setTone}
            setCountry={setCountry}
            onComplete={nextStep}
            onBack={prevStep}
          />
        );

      case 5:
        return (
          <ProfileReviewStep
            channelName={channelName}
            channelHandle={channelHandle}
            subscriberCount={subscriberCount}
            niche={niche.filter((n) => n !== 'Other').concat(
              niche.includes('Other') && customNiche ? [customNiche] : []
            )}
            format={format}
            tone={tone}
            frequency={frequency}
            country={country}
            profileMaturity={profileMaturity}
            isLoading={isLoading}
            error={onboardingError}
            onConfirm={async () => {
              await completeOnboarding();
              setStep(6);
            }}
            onBack={prevStep}
          />
        );

      case 6:
        return (
          <ReadyStep
            onEnter={() => {
              reset();
              window.location.href = '/app/trends';
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-neutral-950 via-neutral-950 to-indigo-950 p-6 font-sora">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[60%] w-[60%] rounded-full bg-brand-600/15 blur-[120px] animate-breathe" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[50%] w-[50%] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white p-0.5">
          <img src={logo} alt="CreatorIQ" className="h-full w-full object-contain" />
        </div>
        <span className="font-sora text-sm font-semibold text-white">
          Creator<span className="text-neutral-500">IQ</span>
        </span>
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {step < 6 && (
          <div className="mb-10 flex justify-center gap-2">
            {stepsConfig.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  step >= s.id ? 'w-8 bg-gradient-to-r from-brand-500 to-brand-600' : 'w-3 bg-white/10'
                )}
                title={s.name}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={step}>{renderCurrentStep()}</motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 flex gap-6 text-[10px] font-medium uppercase tracking-wider text-neutral-600">
        <span>© 2026 CreatorIQ</span>
        <Link to="/privacy" className="hover:text-neutral-400 transition-colors">
          Privacy
        </Link>
        <Link to="/terms" className="hover:text-neutral-400 transition-colors">
          Terms
        </Link>
      </div>
    </div>
  );
};
