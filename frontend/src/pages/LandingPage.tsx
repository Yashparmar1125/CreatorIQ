import React from 'react';
import { Link } from 'react-router';
import { ArrowRight, ChevronRight, Lightbulb, Sparkles, Youtube } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { PublicLayout } from '../components/organisms/PublicLayout';
import { cn } from '../lib/utils';

const featureCards = [
  {
    icon: Youtube,
    step: '01',
    title: 'YouTube data',
    description:
      'Public views, engagement and publishing patterns for the videos already winning in a topic. Connect your channel to align recommendations with your own audience.',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'AI trend analysis',
    description:
      'Related questions are grouped into concepts, acceleration is measured from real uploads, and forecasts are shown with their uncertainty range.',
  },
  {
    icon: Lightbulb,
    step: '03',
    title: 'Content opportunities',
    description:
      'See what is rising in your niche, inspect the evidence behind it, and turn the strongest signal into a concrete content plan.',
  },
];

const opportunities = [
  {
    tag: 'AI tools',
    tone: 'mint' as const,
    title: 'AI budgeting tools',
    description:
      'A practical finance topic with clear search intent. Viewers want step-by-step guidance, not another list of apps.',
    path: '2,34 18,33 26,30 38,31 50,28 58,25 72,26 84,21 92,16 108,14 122,12 138,11',
  },
  {
    tag: 'Expected to rise',
    tone: 'lilac' as const,
    title: 'How to get a job in 2026',
    description:
      'A recurring career question with fresh demand each hiring cycle. A strong fit for explainer and personal-experience formats.',
    path: '2,30 16,31 24,26 36,27 48,26 56,30 70,24 80,22 90,22 102,18 114,17 122,16 138,9',
  },
];

function OpportunitySparkline({ path, tone }: { path: string; tone: 'mint' | 'lilac' }) {
  const stroke = tone === 'mint' ? '#167A59' : '#7C5CD6';
  return (
    <svg
      className="h-11 w-full"
      viewBox="0 0 140 44"
      preserveAspectRatio="none"
      role="img"
      aria-label="Illustrative trend shape for this example opportunity"
    >
      <polyline
        points={path}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function OpportunityCard({ opportunity }: { opportunity: (typeof opportunities)[number] }) {
  const isMint = opportunity.tone === 'mint';
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[#E5E0E8] bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div>
        <div className="mb-4">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
              isMint ? 'bg-[#91F5D3]/25 text-[#167A59]' : 'bg-[#F1ECFF] text-[#7C5CD6]'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isMint ? 'bg-[#167A59]' : 'bg-[#7C5CD6]'
              )}
            />
            {opportunity.tag}
          </span>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-[#171717]">{opportunity.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#625D68]">{opportunity.description}</p>

        <div className="my-6 rounded-xl border border-[#E5E0E8]/60 bg-[#FBFAF8] p-4">
          <OpportunitySparkline path={opportunity.path} tone={opportunity.tone} />
          <span className="mt-2 block text-center text-[11px] text-[#77717F]">
            Illustrative trend shape
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#E5E0E8]/70 pt-4 text-xs text-[#77717F]">
        <span>Illustrative example, not live results</span>
        <Link
          to="/login"
          className="inline-flex items-center gap-1 font-bold text-[#171717] transition-colors hover:text-[#7C5CD6]"
        >
          View details <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const primaryPath = isAuthenticated ? '/app/trends' : '/signup';

  return (
    <PublicLayout>
      {/* Hero Section — fully consumes screen viewport */}
      <section
        className="relative isolate flex min-h-[calc(100vh-76px)] min-h-[calc(100dvh-76px)] flex-col items-center justify-center overflow-hidden bg-[#FBFAF8] bg-cover bg-center bg-no-repeat py-14 text-center"
        style={{ backgroundImage: 'url(/background.png)' }}
        aria-labelledby="hero-title"
      >
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          <div className="absolute -left-44 top-10 h-[480px] w-[480px] rounded-full bg-[#91F5D3]/40 blur-[60px]" />
          <div className="absolute -right-36 -top-28 h-[420px] w-[420px] rounded-full bg-[#FF98C1]/35 blur-[60px]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-col items-center px-6 sm:px-8">
          <h1
            id="hero-title"
            className="mx-auto max-w-[17ch] text-balance text-4xl font-bold tracking-tight text-[#171717] leading-[1.05] sm:text-5xl lg:text-7xl"
          >
            Find your next YouTube content based on trends
          </h1>
          <p className="mx-auto mt-6 max-w-[58ch] text-base leading-relaxed text-[#625D68] sm:text-lg">
            CreatorIQ turns public YouTube signals into a ranked shortlist for your niche — then
            shows the evidence behind every opportunity.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={primaryPath}
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#FF98C1] px-7 text-[15px] font-bold text-[#171717] shadow-[0_8px_22px_rgba(224,84,138,0.18)] transition-all hover:bg-[#FF86B7] hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(224,84,138,0.24)]"
            >
              Explore CreatorIQ
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full border border-[#D9D2E0] bg-white/90 px-7 text-[15px] font-bold text-[#171717] transition-all hover:border-[#BDB2C9] hover:bg-white hover:-translate-y-0.5"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Value Section */}
      <section
        className="bg-[#F1ECFF] py-20 lg:py-24"
        id="how"
        aria-labelledby="value-title"
      >
        <div className="mx-auto w-full max-w-[1180px] px-6 sm:px-8">
          <div className="mb-12 max-w-[760px]">
            <h2
              id="value-title"
              className="text-3xl font-bold tracking-tight text-[#171717] sm:text-4xl lg:text-5xl"
            >
              Less noise. A traceable path to insight.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#625D68] sm:text-lg">
              Three connected steps take you from raw channel activity to a decision you can act on.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  className="flex flex-col justify-between rounded-2xl border border-[#E5E0E8] bg-white p-7 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  key={feature.title}
                >
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6F3FF] text-[#4A2E8F]">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="font-mono text-xs font-bold text-[#77717F]">
                        {feature.step}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-[#171717]">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#625D68]">
                      {feature.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Opportunities Section */}
      <section
        className="py-20 lg:py-24"
        aria-labelledby="opportunities-title"
      >
        <div className="mx-auto w-full max-w-[1180px] px-6 sm:px-8">
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2
                id="opportunities-title"
                className="text-3xl font-bold tracking-tight text-[#171717] sm:text-4xl lg:text-5xl"
              >
                See what&apos;s gathering momentum.
              </h2>
            </div>
            <p className="max-w-[420px] text-sm text-[#77717F]">
              Examples of the CreatorIQ format. Sign in to see live opportunities ranked for your
              niche.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.title} opportunity={opportunity} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="border-t border-[#EFEAF3] bg-[#FBFAF8] py-20 text-center"
        aria-labelledby="cta-title"
      >
        <div className="mx-auto w-full max-w-[1180px] px-6 sm:px-8">
          <h2
            id="cta-title"
            className="text-3xl font-bold tracking-tight text-[#171717] sm:text-4xl lg:text-5xl"
          >
            Your next content plan starts with the right ideas.
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] text-base text-[#625D68]">
            Bring an idea. Follow the signals. Decide what deserves a deeper look.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to={primaryPath}
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#FF98C1] px-7 text-[15px] font-bold text-[#171717] shadow-[0_8px_22px_rgba(224,84,138,0.18)] transition-all hover:bg-[#FF86B7] hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(224,84,138,0.24)]"
            >
              Start exploring
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
