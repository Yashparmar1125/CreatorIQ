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
import { cn } from '../../../lib/utils';
import './Onboarding.css';

const stepsConfig = [
  { id: 1, name: 'Welcome' },
  { id: 2, name: 'Channel' },
  { id: 3, name: 'Niche' },
  { id: 4, name: 'Strategy' },
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
    <div className="onboarding-page min-h-screen flex flex-col justify-between bg-[#fbfbfe] text-[#181719]">
      {/* Top Navigation Bar */}
      <header className="relative z-10 grid h-16 w-full shrink-0 grid-cols-2 items-center border-b border-[#ede9f2] bg-white px-6 sm:px-10 lg:grid-cols-3">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-2 justify-self-start">
          <div className="w-7 h-7 flex items-center justify-center text-black">
            <svg
              className="w-6 h-6 text-black shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2.4" />
              <path
                d="M12 6.5C8.96243 6.5 6.5 8.96243 6.5 12C6.5 15.0376 8.96243 17.5 12 17.5C15.0376 17.5 17.5 15.0376 17.5 12"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="2.2" fill="currentColor" />
            </svg>
          </div>
          <span className="font-cal-sans text-base sm:text-lg font-extrabold tracking-tight text-[#14121a]">
            CreatorIQ
          </span>
        </div>

        {/* Center: Stepper */}
        {step < 6 ? (
          <nav
            aria-label="Onboarding progress"
            className="hidden items-center justify-center gap-2.5 justify-self-center lg:flex"
          >
            {stepsConfig.map((s, idx) => {
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200',
                        isCompleted
                          ? 'bg-[#f0ebff] text-[#7033ea] border border-[#d8cbf9]'
                          : isCurrent
                            ? 'border-[1.5px] border-[#181719] bg-[#f0ebff] text-[#14121a] shadow-[2px_2px_0px_#181719]'
                            : 'border border-[#dcd7e3] bg-white text-[#9ca3af]'
                      )}
                    >
                      {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : s.id}
                    </div>
                    <span
                      className={cn(
                        'whitespace-nowrap text-xs font-bold transition-colors',
                        isCurrent
                          ? 'text-[#14121a]'
                          : isCompleted
                            ? 'text-[#6b6775]'
                            : 'text-[#9ca3af]'
                      )}
                    >
                      {s.name}
                    </span>
                  </div>
                  {idx < stepsConfig.length - 1 && (
                    <div
                      className={cn(
                        'h-[1.5px] w-6 transition-colors duration-300',
                        step > s.id ? 'bg-[#8b5cf6]' : 'bg-[#e5e0ea]'
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

        {/* Right: Step Counter Badge */}
        <div className="flex items-center gap-3 justify-self-end">
          {step < 6 && (
            <span className="rounded-full border border-[#d8cbf9] bg-[#f0ebff] px-3.5 py-1 text-xs font-bold text-[#6035c0]">
              Step <span className="text-[#14121a]">{step}</span> of 5
            </span>
          )}
        </div>
      </header>

      {/* Main Viewport Content Area */}
      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div key={step} className="w-full">
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom spacer / aesthetic breathing room */}
      <footer className="w-full py-2"></footer>
    </div>
  );
};
