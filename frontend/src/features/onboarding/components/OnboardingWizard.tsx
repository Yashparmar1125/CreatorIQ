import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
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
    <div className="relative flex h-screen w-full flex-col justify-between overflow-hidden bg-[#0a0a0a] font-sora text-[#ededed]">
      {/* Subtle Ambient Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[55%] w-[55%] rounded-full bg-brand-600/10 blur-[140px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[45%] w-[45%] rounded-full bg-cyan-500/8 blur-[130px]" />
      </div>

      {/* Full-Width 3-Zone Top Navigation Bar (Left: Brand, Center: Stepper, Right: Step Counter) */}
      <header className="relative z-10 grid h-14 w-full shrink-0 grid-cols-2 items-center border-b border-[#1a1a1a] bg-[#0d0d0d]/90 px-6 backdrop-blur-md lg:grid-cols-3 lg:px-10">
        {/* Left Zone: Brand Logo */}
        <div className="flex items-center gap-2.5 justify-self-start">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-pure-white p-0.5 shadow-sm">
            <img src={logo} alt="CreatorIQ" className="h-full w-full object-contain" />
          </div>
          <span className="font-sora text-sm font-semibold tracking-tight text-white">
            Creator<span className="text-neutral-500">IQ</span>
          </span>
        </div>

        {/* Center Zone: Stepper */}
        {step < 6 ? (
          <nav
            aria-label="Onboarding progress"
            className="hidden items-center justify-center gap-2 justify-self-center lg:flex"
          >
            {stepsConfig.map((s, idx) => {
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300',
                        isCompleted
                          ? 'bg-brand-600 text-white'
                          : isCurrent
                            ? 'border border-brand-400 bg-brand-500/20 text-white ring-2 ring-brand-500/20'
                            : 'border border-[#262626] bg-[#141414] text-neutral-500'
                      )}
                    >
                      {isCompleted ? <Check className="h-3 w-3" /> : s.id}
                    </div>
                    <span
                      className={cn(
                        'whitespace-nowrap text-xs font-medium transition-colors',
                        isCurrent
                          ? 'text-white'
                          : isCompleted
                            ? 'text-neutral-300'
                            : 'text-neutral-500'
                      )}
                    >
                      {s.name}
                    </span>
                  </div>
                  {idx < stepsConfig.length - 1 && (
                    <div
                      className={cn(
                        'h-[1.5px] w-6 transition-colors duration-300',
                        step > s.id ? 'bg-brand-500/70' : 'bg-[#242424]'
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        ) : (
          <div className="hidden lg:block" />
        )}

        {/* Right Zone: Step Pill */}
        <div className="flex items-center gap-3 justify-self-end">
          {step < 6 && (
            <span className="rounded-lg border border-[#242424] bg-[#141414] px-2.5 py-1 text-[11px] font-medium text-neutral-400">
              Step <span className="font-semibold text-white">{step}</span> of 5
            </span>
          )}
        </div>
      </header>

      {/* Main Viewport-Centered Area */}
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-3 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div key={step} className="w-full">
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};




