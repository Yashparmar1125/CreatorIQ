import React from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  TrendingUp,
  BarChart2,
  Calendar,
  Lightbulb,
  Check,
  Sparkles,
  Youtube,
  Layers,
  Rocket,
  PlayCircle,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { PublicLayout } from '../components/organisms/PublicLayout';
import { MarketingHero, MarketingSection, MarketingCta } from '../components/marketing/MarketingSections';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const features = [
  {
    icon: TrendingUp,
    title: 'Trend opportunities',
    description:
      'Personalized Top 5 feed ranked by niche fit, YouTube momentum, and audience geography.',
    points: ['Real YouTube video signals', 'AI-curated angles', 'Feed history'],
    accent: 'border-brand-600',
  },
  {
    icon: Lightbulb,
    title: 'Strategy briefs',
    description:
      'Turn a topic into titles, hooks, and a script outline grounded in your channel profile.',
    points: ['Optimized titles', 'Retention outline', 'SEO tags'],
    accent: 'border-violet-500',
  },
  {
    icon: BarChart2,
    title: 'Channel analytics',
    description:
      'Retention, traffic sources, and audience breakdowns to understand what is working.',
    points: ['Retention metrics', 'Traffic sources', 'Audience geo'],
    accent: 'border-cyan-500',
  },
  {
    icon: Calendar,
    title: 'Content planner',
    description: 'Schedule drafts and coordinate your production calendar in one view.',
    points: ['Monthly calendar', 'Draft tracking', 'Publishing rhythm'],
    accent: 'border-emerald-500',
  },
];

const steps = [
  {
    icon: Youtube,
    title: 'Connect YouTube',
    body: 'Link your channel and complete a short onboarding profile.',
  },
  {
    icon: Layers,
    title: 'Get your Top 5',
    body: 'Receive a personalized trend feed on day one — free.',
  },
  {
    icon: Rocket,
    title: 'Plan and publish',
    body: 'Use Strategy and Planner to ship content with confidence.',
  },
];

const trustMetrics = [
  { icon: Target, label: 'Niche-fit scoring', value: 'Per channel' },
  { icon: Activity, label: 'Signal sources', value: 'YouTube + Trends' },
  { icon: Zap, label: 'First feed', value: 'Free on signup' },
];

function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-brand-100/60 to-transparent blur-2xl" />
      <Card variant="elevated" className="relative overflow-hidden shadow-xl shadow-neutral-900/8">
        <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <Badge variant="brand">
            <Sparkles className="h-3 w-3" />
            Live feed
          </Badge>
        </div>
        <div className="grid lg:grid-cols-5">
          <div className="space-y-3 border-b border-neutral-200 p-4 lg:col-span-3 lg:border-b-0 lg:border-r">
            <p className="text-xs font-medium text-neutral-500">Top opportunities · Entertainment</p>
            {[
              { title: 'Phir Har Gaya comedy short', meta: '18.8M views · Score 76', hot: true },
              { title: 'Indian Dad New Car', meta: '214K/hr velocity', hot: false },
              { title: 'Meme format spike', meta: 'Rising in IN', hot: false },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
                  <p className="text-xs text-neutral-500">{item.meta}</p>
                </div>
                {item.hot && (
                  <Badge variant="brand" className="ml-auto shrink-0">
                    Hot
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <div className="bg-neutral-900 p-4 text-white lg:col-span-2">
            <div className="flex items-center gap-2 text-brand-300">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-medium">AI insight</p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-200">
              Test this trend with a 15-second Short using the same audio within 24 hours.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Velocity</p>
                <p className="mt-1 text-lg font-semibold">214K/hr</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-neutral-500">Niche fit</p>
                <p className="mt-1 text-lg font-semibold">98%</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <PublicLayout>
      <MarketingHero
        badge="Built for YouTube creators"
        badgeIcon={<Youtube className="h-3.5 w-3.5" />}
        title={
          <>
            Grow your channel with{' '}
            <span className="text-gradient-brand">clear signals</span>, not guesswork.
          </>
        }
        description="CreatorIQ combines trend discovery, AI strategy, analytics, and planning — so you spend less time researching and more time creating."
        actions={
          <>
            <Link to={isAuthenticated ? '/app/dashboard' : '/signup'}>
              <Button size="lg">
                {isAuthenticated ? 'Go to dashboard' : 'Start free'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/product">
              <Button variant="secondary" size="lg">
                <PlayCircle className="h-4 w-4" />
                See how it works
              </Button>
            </Link>
          </>
        }
        footer={
          <div className="mt-10 grid gap-4 border-t border-neutral-200/80 pt-8 sm:grid-cols-3">
            {trustMetrics.map((m) => (
              <div key={m.label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 ring-1 ring-brand-200/50 shadow-sm">
                  <m.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{m.value}</p>
                  <p className="text-xs text-neutral-500">{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        }
        visual={<HeroPreview />}
      />

      <MarketingSection
        title="Everything you need in one workspace"
        description="Four connected tools — from spotting a trend to publishing the video."
        className="bg-neutral-50"
        align="center"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((feature) => (
            <Card
              key={feature.title}
              variant="elevated"
              hover
              className={`h-full border-l-4 ${feature.accent}`}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 ring-1 ring-brand-200/50">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{feature.description}</p>
              <ul className="mt-5 space-y-2.5">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-center gap-2.5 text-sm text-neutral-700">
                    <Check className="h-4 w-4 shrink-0 text-success-600" />
                    {point}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        title="How it works"
        description="From signup to your first personalized feed in minutes."
        className="border-t border-neutral-200 bg-white"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((item, i) => (
            <div
              key={item.title}
              className="surface-card-elevated relative rounded-xl p-6 transition-transform duration-200 hover:-translate-y-1"
            >
              {i < steps.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-neutral-200 md:block" />
              )}
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 text-white shadow-lg">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-neutral-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">{item.body}</p>
            </div>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        title="Built for creators who publish consistently"
        description="Actionable signals tied to your niche — not generic viral noise."
        className="bg-neutral-50"
        align="center"
      >
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: Layers, stat: 'Top 5', label: 'Curated opportunities per feed' },
            { icon: Youtube, stat: 'YouTube', label: 'Real video velocity signals' },
            { icon: Sparkles, stat: 'AI', label: 'Personalized angles & titles' },
          ].map((item) => (
            <Card key={item.label} variant="elevated" hover className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 ring-1 ring-brand-200/50">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl font-semibold text-neutral-900">{item.stat}</p>
              <p className="mt-1 text-sm text-neutral-500">{item.label}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingCta
        variant="dark"
        title="Ready to find your next video idea?"
        description="Create a free account and get your first personalized trend feed on onboarding."
      >
        <Link to={isAuthenticated ? '/app/trends' : '/signup'}>
          <Button size="lg">
            {isAuthenticated ? 'View my trends' : 'Get started free'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/pricing">
          <Button variant="secondary" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            View pricing
          </Button>
        </Link>
      </MarketingCta>
    </PublicLayout>
  );
};
