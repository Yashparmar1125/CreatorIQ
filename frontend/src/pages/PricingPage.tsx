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
      <span className="text-[#B0A9B6]" aria-label="Not included">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {highlights.map((h) => {
            const Icon = h.icon;
            return (
              <div
                key={h.title}
                className="flex items-start gap-3 rounded-2xl border border-[#E5E0E8] bg-white p-5 shadow-[0_1px_2px_rgba(23,23,23,0.03)]"
              >
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-[#F1ECFF] text-[#4A2E8F] shrink-0">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <article
                key={plan.name}
                className={`relative flex flex-col p-7 border rounded-[18px] bg-white transition-all ${
                  plan.popular
                    ? 'border-[#C9B8EE] shadow-[0_14px_34px_rgba(74,46,143,0.1)]'
                    : 'border-[#E5E0E8] shadow-[0_1px_2px_rgba(23,23,23,0.03)]'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[#FF98C1] text-[#171717] text-[11px] font-bold tracking-wide uppercase">
                    Most popular
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <span
                    className={`grid place-items-center w-[42px] h-[42px] rounded-xl ${
                      plan.popular ? 'bg-[#FFE3EE] text-[#A32458]' : 'bg-[#F1ECFF] text-[#4A2E8F]'
                    }`}
                  >
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <h2 className="m-0 font-sora text-[17px] font-bold text-[#171717]">{plan.name}</h2>
                </div>

                <div className="flex items-baseline gap-1.5 mt-5">
                  <strong className="font-sora text-4xl font-bold tracking-tight text-[#171717]">{plan.price}</strong>
                  {plan.period && <span className="text-[13px] font-semibold text-[#77717F]">{plan.period}</span>}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#625D68]">{plan.description}</p>

                <ul className="my-6 pt-5 border-t border-[#EFEAF2] list-none grid gap-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm leading-normal text-[#3F3A45]">
                      <Check size={15} aria-hidden="true" className="shrink-0 mt-0.5 text-[#167A59]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.external ? (
                  <a
                    href={plan.href}
                    className={`w-full h-11 px-4 text-xs font-bold shadow-none ${
                      plan.popular ? 'pink-button' : 'outline-button'
                    }`}
                  >
                    <Mail size={15} aria-hidden="true" />
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    to={plan.href}
                    className={`w-full h-11 px-4 text-xs font-bold shadow-none ${
                      plan.popular ? 'pink-button' : 'outline-button'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}
              </article>
            );
          })}
        </div>

        <p className="mt-6 p-3.5 sm:px-4 border border-[#E5E0E8] rounded-xl bg-white text-[13px] leading-relaxed text-[#625D68]">
          Analytics and the content planner are still in development. Current workspaces include
          trend discovery, trend detail, strategy briefs and channel overview.
        </p>
      </MarketingSection>

      <MarketingSection
        title="Compare plans"
        description="See what is included at each tier."
        className="border-t border-[#EFEAF2] bg-white"
      >
        <div className="overflow-x-auto rounded-2xl border border-[#E5E0E8] bg-white">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr>
                <th scope="col" className="bg-[#FAF8FC] px-5 py-3.5 border-b border-[#F0EDF3] text-xs font-bold tracking-wider uppercase text-[#625D68]">Feature</th>
                <th scope="col" className="bg-[#FAF8FC] px-5 py-3.5 border-b border-[#F0EDF3] text-xs font-bold tracking-wider uppercase text-[#625D68] text-center">Free</th>
                <th scope="col" className="bg-[#FAF8FC] px-5 py-3.5 border-b border-[#F0EDF3] text-xs font-bold tracking-wider uppercase text-[#4A2E8F] text-center">
                  Pro
                </th>
                <th scope="col" className="bg-[#FAF8FC] px-5 py-3.5 border-b border-[#F0EDF3] text-xs font-bold tracking-wider uppercase text-[#625D68] text-center">Agency</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature} className="last:[&>td]:border-b-0">
                  <td className="px-5 py-3.5 border-b border-[#F0EDF3] text-[#3F3A45] font-medium text-left">{row.feature}</td>
                  <td className="px-5 py-3.5 border-b border-[#F0EDF3] text-center text-[#171717]">
                    <FeatureCell value={row.free} />
                  </td>
                  <td className="px-5 py-3.5 border-b border-[#F0EDF3] text-center text-[#171717] bg-[#FAF7FF]">
                    <FeatureCell value={row.pro} />
                  </td>
                  <td className="px-5 py-3.5 border-b border-[#F0EDF3] text-center text-[#171717]">
                    <FeatureCell value={row.agency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketingSection>

      <MarketingSection title="Frequently asked questions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {faqs.map((faq) => (
            <article key={faq.q} className="p-6 border border-[#E5E0E8] rounded-[18px] bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
              <div className="flex items-start gap-3">
                <HelpCircle
                  size={17}
                  className="mt-0.5 shrink-0 text-[#7C5CD6]"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="mb-2 text-[15px] font-bold text-[#171717]">{faq.q}</h3>
                  <p className="text-sm leading-relaxed text-[#625D68]">{faq.a}</p>
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
