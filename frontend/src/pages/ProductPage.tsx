import React from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  BarChart2,
  Calendar,
  Check,
  Lightbulb,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { PublicLayout } from '../components/organisms/PublicLayout';
import { MarketingHero, MarketingSection, MarketingCta } from '../components/marketing/MarketingSections';

const modules = [
  {
    icon: TrendingUp,
    title: 'Trend Engine',
    status: 'Available',
    description:
      'A personalized Top 5 feed built from public YouTube upload signals, niche fit and your channel profile.',
    benefits: ['Niche-fit scoring', 'Evidence on every card', 'Feed history'],
  },
  {
    icon: Lightbulb,
    title: 'Strategy Architect',
    status: 'Available',
    description:
      'Turn a trend into titles, a hook, a script outline, retention beats, CTAs and SEO tags — grounded in your channel context.',
    benefits: ['Copy-ready titles', 'Structured script outline', 'Channel-aware tone'],
  },
  {
    icon: BarChart2,
    title: 'Channel analytics',
    status: 'In development',
    description:
      'Retention, traffic sources and audience composition. YouTube analytics access depends on the permissions granted during channel connection.',
    benefits: ['Retention overview', 'Traffic breakdown', 'Audience composition'],
  },
  {
    icon: Calendar,
    title: 'Content planner',
    status: 'In development',
    description:
      'A production calendar for moving a strategy brief into a draft, a slot and a publishing rhythm.',
    benefits: ['Monthly view', 'Draft slots', 'Publishing rhythm'],
  },
];

const pillars = [
  {
    icon: Zap,
    title: 'Real signals',
    body: 'Recommendations are built from public YouTube video momentum, not just search strings.',
  },
  {
    icon: Target,
    title: 'Niche-first',
    body: 'Trends are filtered against your niche and format before they are ranked for your channel.',
  },
  {
    icon: Shield,
    title: 'Privacy-first',
    body: 'YouTube access uses OAuth. We only read what you explicitly grant.',
  },
];

export const ProductPage: React.FC = () => {
  return (
    <PublicLayout>
      <MarketingHero
        badge="Platform overview"
        title="The intelligence layer for YouTube creators"
        description="CreatorIQ connects trend discovery, strategy and channel context — so every video starts with a signal you can inspect."
        actions={
          <>
            <Link to="/signup" className="pink-button">
              Start free
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/pricing" className="outline-button">
              See pricing
            </Link>
          </>
        }
      />

      <MarketingSection
        id="how"
        title="Four modules, one workflow"
        description="Each part answers a specific question in your content pipeline. Anything still in development is labelled honestly."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const available = mod.status === 'Available';
            return (
              <article key={mod.title} className="flex flex-col p-7 border border-[#E5E0E8] rounded-[18px] bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-[#F1ECFF] text-[#4A2E8F]">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                      available ? 'bg-[#E8FBF4] text-[#0F5C43]' : 'bg-[#F2EFF4] text-[#625D68]'
                    }`}
                  >
                    {mod.status}
                  </span>
                </div>
                <h3 className="mt-5 mb-2.5 font-sora text-xl font-bold tracking-[-0.015em] text-[#171717]">{mod.title}</h3>
                <p className="text-[15px] leading-[1.65] text-[#625D68]">{mod.description}</p>
                <ul className="mt-5 pt-4 border-t border-[#EFEAF2] list-none grid gap-2.5">
                  {mod.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-[#625D68]">
                      <Check size={14} aria-hidden="true" className="shrink-0 text-[#167A59]" />
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection
        title="How trends are ranked"
        description="The opportunity score combines momentum, niche fit, geography and format alignment. Every input comes from data the platform already has."
        className="border-t border-[#EFEAF2] bg-white"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <article className="flex flex-col p-7 border border-[#E5E0E8] rounded-[18px] bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
            <h3 className="mb-2.5 font-sora text-xl font-bold tracking-[-0.015em] text-[#171717]">Signal sources</h3>
            <ul className="mt-2 list-none p-0">
              <li className="flex items-baseline justify-between gap-4 py-3 border-b border-[#F0EDF3] text-sm text-[#625D68]">
                <span>YouTube video velocity</span>
                <strong className="font-semibold text-[#171717] text-right">Primary</strong>
              </li>
              <li className="flex items-baseline justify-between gap-4 py-3 border-b border-[#F0EDF3] text-sm text-[#625D68]">
                <span>Web search corroboration</span>
                <strong className="font-semibold text-[#171717] text-right">Supporting</strong>
              </li>
              <li className="flex items-baseline justify-between gap-4 py-3 border-b-0 text-sm text-[#625D68]">
                <span>Channel profile &amp; geography</span>
                <strong className="font-semibold text-[#171717] text-right">Personalization</strong>
              </li>
            </ul>
          </article>

          <article className="flex flex-col p-7 border border-[#CFEDE1] rounded-[18px] bg-[#F1FCF8] shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
            <h3 className="mb-2.5 font-sora text-xl font-bold tracking-[-0.015em] text-[#171717]">On every refresh</h3>
            <ol className="mt-2 list-none p-0 grid gap-3.5 [counter-reset:step]">
              <li className="flex gap-3 text-sm leading-relaxed text-[#3F3A45] before:[counter-increment:step] before:content-[counter(step)] before:shrink-0 before:grid before:place-items-center before:w-6 before:h-6 before:rounded-full before:bg-[#F1ECFF] before:text-[#4A2E8F] before:font-mono before:text-[11px] before:font-bold">Filter concepts by niche fit and quality</li>
              <li className="flex gap-3 text-sm leading-relaxed text-[#3F3A45] before:[counter-increment:step] before:content-[counter(step)] before:shrink-0 before:grid before:place-items-center before:w-6 before:h-6 before:rounded-full before:bg-[#F1ECFF] before:text-[#4A2E8F] before:font-mono before:text-[11px] before:font-bold">Score by opportunity and audience geography</li>
              <li className="flex gap-3 text-sm leading-relaxed text-[#3F3A45] before:[counter-increment:step] before:content-[counter(step)] before:shrink-0 before:grid before:place-items-center before:w-6 before:h-6 before:rounded-full before:bg-[#F1ECFF] before:text-[#4A2E8F] before:font-mono before:text-[11px] before:font-bold">Apply freshness so repeat feeds stay useful</li>
              <li className="flex gap-3 text-sm leading-relaxed text-[#3F3A45] before:[counter-increment:step] before:content-[counter(step)] before:shrink-0 before:grid before:place-items-center before:w-6 before:h-6 before:rounded-full before:bg-[#F1ECFF] before:text-[#4A2E8F] before:font-mono before:text-[11px] before:font-bold">Add generated angles and title ideas where available</li>
            </ol>
          </article>
        </div>
      </MarketingSection>

      <MarketingSection title="Built on principles that matter">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <article key={p.title} className="flex flex-col p-7 border border-[#E5E0E8] rounded-[18px] bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-[#F1ECFF] text-[#4A2E8F] mb-5">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <h3 className="mb-2.5 font-sora text-xl font-bold tracking-[-0.015em] text-[#171717]">{p.title}</h3>
                <p className="text-[15px] leading-[1.65] text-[#625D68]">{p.body}</p>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingCta
        title="See it on your own channel"
        description="Connect YouTube and get your first personalized trend feed in minutes."
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/signup" className="pink-button">
            Create free account
          </Link>
          <Link to="/pricing" className="outline-button">
            View pricing
          </Link>
        </div>
      </MarketingCta>
    </PublicLayout>
  );
};
