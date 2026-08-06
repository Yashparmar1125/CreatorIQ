import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { MaturityBadge, type ProfileMaturity } from '../MaturityBadge';
import { OnboardingStepShell } from '../OnboardingStepShell';
import { Badge } from '../../../../components/ui/Badge';

interface AnalysisStatusStepProps {
  isLoading: boolean;
  analysisStatus: {
    connected: boolean;
    sync_status: string;
    profile_maturity: ProfileMaturity;
    message: string;
    detected_niches: string[];
    run_analysis: boolean;
  } | null;
  onPoll: () => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

export const AnalysisStatusStep: React.FC<AnalysisStatusStepProps> = ({
  isLoading,
  analysisStatus,
  onPoll,
  onNext,
  onBack,
}) => {
  const [polled, setPolled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await onPoll();
      if (!cancelled) setPolled(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [onPoll]);

  const maturity = analysisStatus?.profile_maturity ?? 'new';
  const isNew = maturity === 'new';

  return (
    <OnboardingStepShell
      title="Channel analysis"
      description={
        isNew
          ? 'Your channel is new — we will use your manual preferences for now.'
          : 'Analyzing your channel to personalize recommendations.'
      }
      onBack={onBack}
      onNext={onNext}
      nextDisabled={isLoading || !polled}
      cardClassName="space-y-5 text-left"
    >
      {isLoading || !polled ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          <p className="text-sm text-neutral-500">Checking channel...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Profile mode</p>
                <p className="text-xs text-neutral-500">
                  {isNew ? 'Manual setup' : 'Analysis-assisted'}
                </p>
              </div>
            </div>
            <MaturityBadge maturity={maturity} />
          </div>

          <p className="text-sm leading-relaxed text-neutral-600">{analysisStatus?.message}</p>

          {!isNew && analysisStatus?.detected_niches && analysisStatus.detected_niches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-500">Detected topics</p>
              <div className="flex flex-wrap gap-2">
                {analysisStatus.detected_niches.map((n) => (
                  <Badge key={n} variant="neutral">
                    {n}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {isNew && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
              Publish videos and use <strong>Reconfigure</strong> in Profile later to auto-detect your niche.
            </div>
          )}
        </>
      )}
    </OnboardingStepShell>
  );
};
