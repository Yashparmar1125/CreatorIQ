import React from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  Building2,
  Check,
  Crown,
  HelpCircle,
  Mail,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { PublicLayout } from '../components/organisms/PublicLayout';
import { MarketingHero, MarketingSection, MarketingCta } from '../components/marketing/MarketingSections';
import './PublicPages.css';
import type { LucideIcon } from 'lucide-react';

const plans: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular: boolean;
  external?: boolean;
  icon: LucideIcon;
}[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For new creators exploring trends and building a content rhythm.',
    features: [
      '1 free trend feed on onboarding',
      '2 feed refreshes per month',
      'Browse feed history',
      'Trend detail & title ideas',
      'Basic channel profile',
    ],
    cta: 'Start free',
    href: '/signup',
    popular: false,
    icon: Zap,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For creators publishing consistently and scaling with data-backed decisions.',
    features: [
      'Everything in Free',
      '20 feed refreshes per month',
      'Unlimited strategy briefs',
      'Priority AI enrichment',
      'Analytics and planner when released',
    ],
    cta: 'Start Pro trial',
    href: '/signup',
    popular: true,
    icon: Crown,
  },
  {
    name: 'Agency',
    price: 'Custom',
    period: '',
    description: 'For teams managing multiple creator channels and client workflows.',
    features: [
      '100+ feed refreshes per month',
      'Multi-channel management',
      'Dedicated support',
      'Custom onboarding',
      'Team permissions when available',
    ],
    cta: 'Contact sales',
    href: 'mailto:yashparmar11y@gmail.com',
    popular: false,
    external: true,
    icon: Building2,
  },
];

const faqs = [
  {
    q: 'What counts as a feed refresh?',
    a: 'Each time you refresh the feed to generate a new Top 5 snapshot, it uses one credit. Viewing your latest feed and browsing history is free.',
  },
  {
    q: 'Do I get a feed when I sign up?',
    a: 'Yes. Your first personalized Top 5 feed is generated free when you complete onboarding.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings. You keep access until the end of your billing period.',
  },
  {
    q: 'Is there a trial for Pro?',
    a: 'New accounts can explore the Free plan fully. Pro includes a 14-day trial when billing launches.',
  },
];

const comparison = [
  { feature: 'Trend feed (Top 5)', free: true, pro: true, agency: true },
  { feature: 'Monthly refreshes', free: '2', pro: '20', agency: '100+' },
  { feature: 'Feed history', free: true, pro: true, agency: true },
  { feature: 'Strategy briefs', free: 'Limited', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Analytics', free: 'Planned', pro: 'Planned', agency: 'Planned' },
  { feature: 'Planner', free: false, pro: 'Planned', agency: 'Planned' },
  { feature: 'Multi-channel', free: false, pro: false, agency: true },
];

const highlights = [
  { icon: RefreshCw, title: 'Cancel anytime', desc: 'No lock-in contracts on monthly plans.' },
  { icon: Crown, title: 'First feed free', desc: 'Personalized Top 5 on onboarding completion.' },
  { icon: HelpCircle, title: 'Human support', desc: 'Email us directly — we read every message.' },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check size={16} className="mx-auto text-[#167A59]" aria-label="Included" />;
  }
  if (value === false) {
    return (
      <span className="is-empty" aria-label="Not included">
        —
      </span>
    );
  }
  return <span className="text-[13px] text-[#3F3A45]">{value}</span>;
}

export const PricingPage: React.FC = () => {
  return (
    <PublicLayout>
      <MarketingHero
        badge="Simple pricing"
        title="Plans that grow with your channel"
        description="Start free with a personalized trend feed. Upgrade when you need more refreshes, strategy and channel context."
      />

      <MarketingSection>
        <div className="public-grid public-grid-3 mb-8">
          {highlights.map((h) => {
            const Icon = h.icon;
            return (
              <div
                key={h.title}
                className="flex items-start gap-3 rounded-2xl border border-[#E5E0E8] bg-white p-5"
              >
                <span className="public-icon-tile is-inline">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#171717]">{h.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#77717F]">{h.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="public-grid public-grid-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <article
                key={plan.name}
                className={`plan-card${plan.popular ? ' is-popular' : ''}`}
              >
                {plan.popular && <span className="plan-badge">Most popular</span>}

                <div className="plan-head">
                  <span className="plan-icon">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <h2 className="plan-name">{plan.name}</h2>
                </div>

                <div className="plan-price">
                  <strong>{plan.price}</strong>
                  {plan.period && <span>{plan.period}</span>}
                </div>
                <p className="plan-desc">{plan.description}</p>

                <ul className="plan-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={15} aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.external ? (
                  <a
                    href={plan.href}
                    className={plan.popular ? 'pink-button' : 'outline-button'}
                  >
                    <Mail size={15} aria-hidden="true" />
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    to={plan.href}
                    className={plan.popular ? 'pink-button' : 'outline-button'}
                  >
                    {plan.cta}
                  </Link>
                )}
              </article>
            );
          })}
        </div>

        <p className="public-note mt-6">
          Analytics and the content planner are still in development. Current workspaces include
          trend discovery, trend detail, strategy briefs and channel overview.
        </p>
      </MarketingSection>

      <MarketingSection
        title="Compare plans"
        description="See what is included at each tier."
        className="border-t border-[#EFEAF2] bg-white"
      >
        <div className="public-table-wrap">
          <table className="public-table">
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col">Free</th>
                <th scope="col" className="is-pro">
                  Pro
                </th>
                <th scope="col">Agency</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature}>
                  <td>{row.feature}</td>
                  <td>
                    <FeatureCell value={row.free} />
                  </td>
                  <td className="is-pro-col">
                    <FeatureCell value={row.pro} />
                  </td>
                  <td>
                    <FeatureCell value={row.agency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketingSection>

      <MarketingSection title="Frequently asked questions">
        <div className="public-grid public-grid-2">
          {faqs.map((faq) => (
            <article key={faq.q} className="public-card is-faq">
              <div className="flex items-start gap-3">
                <HelpCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-[#7C5CD6]"
                  aria-hidden="true"
                />
                <div>
                  <h3>{faq.q}</h3>
                  <p>{faq.a}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-[#625D68]">
          Questions?{' '}
          <a
            href="mailto:yashparmar11y@gmail.com"
            className="inline-flex items-center gap-1.5 font-semibold text-[#4A2E8F] hover:underline"
          >
            <Mail size={14} aria-hidden="true" />
            Email support
          </a>
        </p>
      </MarketingSection>

      <MarketingCta
        title="Start with a free trend feed"
        description="No credit card required. Connect YouTube and get your Top 5 on day one."
      >
        <Link to="/signup" className="pink-button">
          Create free account
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </MarketingCta>
    </PublicLayout>
  );
};
