import React from 'react';
import { Link } from 'react-router';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  Lightbulb,
  Shield,
  Zap,
  Target,
  Check,
  ArrowRight,
} from 'lucide-react';
import { PublicLayout } from '../components/organisms/PublicLayout';
import { MarketingHero, MarketingSection, MarketingCta } from '../components/marketing/MarketingSections';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const modules = [
  {
    icon: TrendingUp,
    title: 'Trend Engine',
    description:
      'A personalized Top 5 feed built from real YouTube video velocity, Google Trends corroboration, and your niche profile.',
    benefits: ['Niche-fit scoring', 'AI content angles', 'Feed history'],
  },
  {
    icon: Lightbulb,
    title: 'Strategy Architect',
    description:
      'Generate titles, hooks, script outlines, and SEO tags for any topic — grounded in your channel context.',
    benefits: ['Copy-ready titles', '3-phase script', 'Channel-aware tone'],
  },
  {
    icon: BarChart2,
    title: 'Analytics',
    description:
      'Retention flow, traffic sources, and audience demographics to see where viewers engage and drop off.',
    benefits: ['Retention metrics', 'Traffic breakdown', 'Audience geo'],
  },
  {
    icon: Calendar,
    title: 'Planner',
    description:
      'A production calendar to schedule drafts, track uploads, and keep your publishing rhythm consistent.',
    benefits: ['Monthly view', 'Draft events', 'Team-ready layout'],
  },
];

const pillars = [
  {
    icon: Zap,
    title: 'Real signals',
    body: 'YouTube Data API for video momentum — not just search strings.',
  },
  {
    icon: Target,
    title: 'Niche-first',
    body: 'Hard filters ensure trends match your content clusters before ranking.',
  },
  {
    icon: Shield,
    title: 'Privacy-first',
    body: 'OAuth-only YouTube access. Your data stays yours.',
  },
];

export const ProductPage: React.FC = () => {
  return (
    <PublicLayout>
      <MarketingHero
        badge="Platform overview"
        title="The intelligence layer for YouTube creators"
        description="CreatorIQ connects trend discovery, strategy, analytics, and planning — so every video starts with a clear signal."
        actions={
          <Link to="/signup">
            <Button size="lg">
              Start free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <MarketingSection
        title="Four modules, one workflow"
        description="Each tool is designed to answer a specific question in your content pipeline."
        className="bg-neutral-50"
      >
        <div className="grid gap-6 md:grid-cols-2">
          {modules.map((mod) => (
            <Card key={mod.title}>
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <mod.icon className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">{mod.title}</h3>
              <p className="mt-2 text-sm text-neutral-500">{mod.description}</p>
              <ul className="mt-4 space-y-2">
                {mod.benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-neutral-600">
                    <Check className="h-3.5 w-3.5 text-success-600" />
                    {b}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        title="How trends are ranked"
        description="Opportunity score combines momentum, niche fit, geography, and format alignment."
        className="border-t border-neutral-200 bg-white"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-sm font-medium text-neutral-900">Signal sources</h3>
            <ul className="mt-4 space-y-3 text-sm text-neutral-600">
              <li className="flex justify-between border-b border-neutral-100 pb-2">
                <span>YouTube video velocity</span>
                <span className="font-medium text-neutral-900">Primary</span>
              </li>
              <li className="flex justify-between border-b border-neutral-100 pb-2">
                <span>Google Trends (YouTube)</span>
                <span className="font-medium text-neutral-900">Corroboration</span>
              </li>
              <li className="flex justify-between">
                <span>Channel profile & geo</span>
                <span className="font-medium text-neutral-900">Personalization</span>
              </li>
            </ul>
          </Card>
          <Card className="bg-neutral-900 text-white border-neutral-800">
            <h3 className="text-sm font-medium">On every refresh</h3>
            <ol className="mt-4 space-y-3 text-sm text-neutral-300">
              <li>1. Filter concepts by niche fit and quality</li>
              <li>2. Score by opportunity + audience geography</li>
              <li>3. Apply freshness (≥3 new items when possible)</li>
              <li>4. AI-enrich cards with angles and growth tips</li>
            </ol>
          </Card>
        </div>
      </MarketingSection>

      <MarketingSection title="Built on principles that matter" className="bg-neutral-50">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <Card key={p.title}>
              <p.icon className="h-5 w-5 text-brand-600" />
              <h3 className="mt-4 text-base font-semibold text-neutral-900">{p.title}</h3>
              <p className="mt-2 text-sm text-neutral-500">{p.body}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingCta
        title="See it on your own channel"
        description="Connect YouTube and get your first personalized trend feed in minutes."
      >
        <Link to="/signup">
          <Button size="lg">Create free account</Button>
        </Link>
        <Link to="/pricing">
          <Button variant="secondary" size="lg">
            View pricing
          </Button>
        </Link>
      </MarketingCta>
    </PublicLayout>
  );
};
