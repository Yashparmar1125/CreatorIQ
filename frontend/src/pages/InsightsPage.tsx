import React from 'react';
import { Link } from 'react-router';
import { ArrowRight, BarChart3, Globe, Shield, TrendingUp, Zap } from 'lucide-react';
import { PublicLayout } from '../components/organisms/PublicLayout';
import { MarketingHero, MarketingSection, MarketingCta } from '../components/marketing/MarketingSections';
import './PublicPages.css';

const steps = [
  {
    icon: Globe,
    title: 'Collect public uploads',
    body: 'Recent public videos are gathered for each concept, along with views, engagement and subscriber counts. No private viewer data is used for discovery.',
  },
  {
    icon: BarChart3,
    title: 'Filter before ranking',
    body: 'Uploads pass duration, language and relevance checks. A concept only reaches the feed when enough verified videos support it.',
  },
  {
    icon: TrendingUp,
    title: 'Measure against channel size',
    body: 'A video is compared with the size of the channel that published it. That reach ratio shows whether a topic is travelling beyond its usual audience.',
  },
  {
    icon: Zap,
    title: 'Rank and explain',
    body: 'Niche fit, momentum, geography and format are combined into an opportunity score. The evidence behind the score stays visible on the card and detail page.',
  },
];

const signals = [
  {
    title: 'Reach ratio',
    body: 'Views divided by subscribers for a tracked upload. Above 1× means the video reached beyond the channel’s own audience.',
    caveat: 'A median, not a guarantee for your channel.',
  },
  {
    title: 'Interaction density',
    body: 'Likes plus comments divided by views. Useful for spotting engagement, not for ranking raw popularity.',
    caveat: 'Different niches have different baselines.',
  },
  {
    title: 'Small-channel wins',
    body: 'The number of tracked uploads that beat their channel baseline from smaller channels in the concept.',
    caveat: 'A signal of openness, not a promise of virality.',
  },
  {
    title: 'Stability',
    body: 'How consistent the concept’s performance is across tracked uploads.',
    caveat: 'Show only when enough uploads exist to measure it.',
  },
  {
    title: 'Saturation',
    body: 'How crowded the topic already is. Lower saturation means more room for a distinct angle.',
    caveat: 'Crowded topics can still work with a better angle.',
  },
  {
    title: 'Forecast band',
    body: 'A time-series projection with lower and upper bounds, using the measured daily series.',
    caveat: 'A projection is not a guarantee of future views.',
  },
];

const principles = [
  {
    icon: Shield,
    title: 'Evidence first',
    body: 'Every recommendation shows the measured signals behind it. Generated text is labelled as generated.',
  },
  {
    icon: TrendingUp,
    title: 'Honest uncertainty',
    body: 'Forecasts appear with their bounds. Missing data is shown as missing, never filled with a guess.',
  },
  {
    icon: Zap,
    title: 'Built for decisions',
    body: 'The product ends in a next step: save the trend, open the detail, or generate a strategy brief.',
  },
];

export const InsightsPage: React.FC = () => {
  return (
    <PublicLayout>
      <MarketingHero
        badge="Methodology"
        title="How CreatorIQ reads a trend"
        description="The signals behind a recommendation, what each one means, and what it does not mean."
      />

      <MarketingSection
        title="From public uploads to an opportunity"
        description="Four steps happen before a trend reaches your shortlist."
      >
        <div className="public-grid public-grid-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="public-card is-compact">
                <div className="flex items-center justify-between">
                  <span className="public-icon-tile is-inline">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[12px] font-bold tracking-[0.08em] text-[#9B94A5]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5">{step.title}</h3>
                <p>{step.body}</p>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection
        title="What the signals mean"
        description="Each term below matches a value shown in the product."
        className="border-t border-[#EFEAF2] bg-white"
      >
        <div className="public-grid public-grid-3">
          {signals.map((signal) => (
            <article key={signal.title} className="public-card is-compact">
              <h3>{signal.title}</h3>
              <p>{signal.body}</p>
              <p className="mt-4 border-t border-[#F0EDF3] pt-3 text-[12px] leading-relaxed text-[#9B94A5]">
                {signal.caveat}
              </p>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title="Our editorial principles">
        <div className="public-grid public-grid-3">
          {principles.map((p) => {
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
        title="Put the evidence to work"
        description="Open your own shortlist and see which signals are strongest for your niche."
      >
        <div className="public-cta-actions">
          <Link to="/signup" className="pink-button">
            Get started free
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link to="/model-performance" className="outline-button">
            Model performance
          </Link>
        </div>
      </MarketingCta>
    </PublicLayout>
  );
};
