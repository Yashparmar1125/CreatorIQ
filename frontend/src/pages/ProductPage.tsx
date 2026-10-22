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
import './PublicPages.css';

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
        <div className="public-grid public-grid-2">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const available = mod.status === 'Available';
            return (
              <article key={mod.title} className="public-card">
                <div className="flex items-start justify-between gap-3">
                  <span className="public-icon-tile is-inline">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span
                    className={`public-badge ${
                      available ? 'public-badge-mint' : 'public-badge-muted'
                    }`}
                  >
                    {mod.status}
                  </span>
                </div>
                <h3 className="mt-5">{mod.title}</h3>
                <p>{mod.description}</p>
                <ul className="public-check-list">
                  {mod.benefits.map((b) => (
                    <li key={b}>
                      <Check size={14} aria-hidden="true" />
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
        <div className="public-grid public-grid-2">
          <article className="public-card">
            <h3>Signal sources</h3>
            <ul className="public-rows mt-2">
              <li>
                <span>YouTube video velocity</span>
                <strong>Primary</strong>
              </li>
              <li>
                <span>Web search corroboration</span>
                <strong>Supporting</strong>
              </li>
              <li>
                <span>Channel profile &amp; geography</span>
                <strong>Personalization</strong>
              </li>
            </ul>
          </article>

          <article className="public-card is-mint">
            <h3>On every refresh</h3>
            <ol className="public-steps mt-2">
              <li>Filter concepts by niche fit and quality</li>
              <li>Score by opportunity and audience geography</li>
              <li>Apply freshness so repeat feeds stay useful</li>
              <li>Add generated angles and title ideas where available</li>
            </ol>
          </article>
        </div>
      </MarketingSection>

      <MarketingSection title="Built on principles that matter">
        <div className="public-grid public-grid-3">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <article key={p.title} className="public-card">
                <span className="public-icon-tile">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingCta
        title="See it on your own channel"
        description="Connect YouTube and get your first personalized trend feed in minutes."
      >
        <div className="public-cta-actions">
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
