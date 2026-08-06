import React from 'react';
import { Link } from 'react-router';
import {
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Crown,
  Building2,
  RefreshCw,
  HelpCircle,
  Mail,
} from 'lucide-react';
import { PublicLayout } from '../components/organisms/PublicLayout';
import { MarketingHero, MarketingSection, MarketingCta } from '../components/marketing/MarketingSections';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
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
      'Full analytics dashboard',
      'Content planner',
      'Priority AI enrichment',
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
      'API access',
      'Dedicated support',
      'Custom onboarding',
      'SSO & team permissions',
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
    a: 'Each time you click Refresh Feed to generate a new Top 5 snapshot, it uses one credit. Viewing your latest feed and browsing history is always free.',
  },
  {
    q: 'Do I get a feed when I sign up?',
    a: 'Yes. Your first personalized Top 5 feed is generated free when you complete onboarding — no credit required.',
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
  { feature: 'Analytics', free: 'Basic', pro: 'Full', agency: 'Full' },
  { feature: 'Planner', free: false, pro: true, agency: true },
  { feature: 'Multi-channel', free: false, pro: false, agency: true },
];

const highlights = [
  { icon: RefreshCw, title: 'Cancel anytime', desc: 'No lock-in contracts on monthly plans.' },
  { icon: Sparkles, title: 'First feed free', desc: 'Personalized Top 5 on onboarding completion.' },
  { icon: HelpCircle, title: 'Human support', desc: 'Email us directly — we read every message.' },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-success-600" />;
  if (value === false) return <span className="text-neutral-300">—</span>;
  return <span className="text-sm text-neutral-700">{value}</span>;
}

export const PricingPage: React.FC = () => {
  return (
    <PublicLayout>
      <MarketingHero
        badge="Simple pricing"
        badgeIcon={<Sparkles className="h-3.5 w-3.5" />}
        title="Plans that grow with your channel"
        description="Start free with a personalized trend feed. Upgrade when you need more refreshes, strategy, and analytics."
      />

      <MarketingSection className="-mt-4 bg-neutral-50 pt-0">
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <h.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">{h.title}</p>
                <p className="mt-1 text-xs text-neutral-500">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'relative flex flex-col shadow-sm transition-shadow hover:shadow-md',
                plan.popular && 'border-brand-600 ring-1 ring-brand-600 lg:scale-[1.02]'
              )}
            >
              {plan.popular && (
                <Badge variant="brand" className="absolute -top-3 left-4">
                  Most popular
                </Badge>
              )}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      plan.popular ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600'
                    )}
                  >
                    <plan.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900">{plan.name}</h3>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-neutral-900">
                    {plan.price}
                  </span>
                  {plan.period && <span className="text-sm text-neutral-500">{plan.period}</span>}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-500">{plan.description}</p>
              </div>
              <ul className="mb-8 flex-1 space-y-3 border-t border-neutral-100 pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-neutral-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.external ? (
                <a href={plan.href}>
                  <Button variant={plan.popular ? 'primary' : 'secondary'} className="w-full">
                    <Mail className="h-4 w-4" />
                    {plan.cta}
                  </Button>
                </a>
              ) : (
                <Link to={plan.href}>
                  <Button variant={plan.popular ? 'primary' : 'secondary'} className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              )}
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        title="Compare plans"
        description="See what is included at each tier."
        className="border-t border-neutral-200 bg-white"
      >
        <div className="overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-5 py-4 font-medium text-neutral-900">Feature</th>
                <th className="px-5 py-4 text-center font-medium text-neutral-900">Free</th>
                <th className="px-5 py-4 text-center font-medium text-brand-600">Pro</th>
                <th className="px-5 py-4 text-center font-medium text-neutral-900">Agency</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature} className="border-b border-neutral-100 last:border-0">
                  <td className="px-5 py-3.5 text-neutral-700">{row.feature}</td>
                  <td className="px-5 py-3.5 text-center">
                    <FeatureCell value={row.free} />
                  </td>
                  <td className="bg-brand-50/30 px-5 py-3.5 text-center">
                    <FeatureCell value={row.pro} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <FeatureCell value={row.agency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MarketingSection>

      <MarketingSection title="Frequently asked questions" className="bg-neutral-50">
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.q} className="shadow-sm">
              <div className="flex items-start gap-3">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <div>
                  <h3 className="text-sm font-medium text-neutral-900">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{faq.a}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-neutral-500">
          Questions?{' '}
          <a href="mailto:yashparmar11y@gmail.com" className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline">
            <Mail className="h-3.5 w-3.5" />
            Email support
          </a>
        </p>
      </MarketingSection>

      <MarketingCta
        variant="dark"
        title="Start with a free trend feed"
        description="No credit card required. Connect YouTube and get your Top 5 on day one."
      >
        <Link to="/signup">
          <Button size="lg">
            Create free account
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </MarketingCta>
    </PublicLayout>
  );
};
