import React from 'react';
import { TrendingUp, BarChart3, Globe, ArrowRight, Shield, Zap } from 'lucide-react';
import { PublicLayout } from '../components/organisms/PublicLayout';
import { MarketingHero, MarketingSection, MarketingCta } from '../components/marketing/MarketingSections';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Link } from 'react-router';

const articles = [
  {
    category: 'Case study',
    title: 'How a comedy channel used trend velocity to 3× weekly views',
    description:
      'By acting on Top 5 shorts signals within 24 hours, one Entertainment creator captured rising search demand before saturation.',
    icon: TrendingUp,
  },
  {
    category: 'Research',
    title: 'YouTube retention in 2026: the first 30 seconds matter more',
    description:
      'Channels that front-load payoff in Shorts see measurably higher average view duration across niches.',
    icon: BarChart3,
  },
  {
    category: 'Playbook',
    title: 'Turning a trend into a publishable video in one afternoon',
    description:
      'A repeatable workflow: trend detail → title ideas → strategy brief → planner slot.',
    icon: Globe,
  },
];

const principles = [
  { icon: Shield, title: 'Evidence-based', desc: 'Insights tied to real platform signals, not hype.' },
  { icon: Zap, title: 'Actionable', desc: 'Every piece ends with a step you can take today.' },
  { icon: TrendingUp, title: 'Creator-focused', desc: 'Written for people who publish, not just analyze.' },
];

export const InsightsPage: React.FC = () => {
  return (
    <PublicLayout>
      <MarketingHero
        badge="Creator intelligence"
        title="Research and playbooks for serious creators"
        description="Case studies, trend analysis, and workflows to help you make better content decisions — faster."
      />

      <MarketingSection className="bg-neutral-50 pt-0">
        <div className="grid gap-6 md:grid-cols-3">
          {articles.map((item) => (
            <Card key={item.title} hover className="flex flex-col">
              <Badge variant="neutral" className="w-fit">
                <item.icon className="h-3 w-3" />
                {item.category}
              </Badge>
              <h3 className="mt-4 text-base font-semibold text-neutral-900 leading-snug">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-neutral-500">{item.description}</p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
              >
                Read more <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection
        title="Resources"
        description="Guides and updates to keep your content strategy sharp."
        className="border-t border-neutral-200 bg-white"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-neutral-900 text-white border-neutral-800">
            <h3 className="text-lg font-semibold">Creator playbook</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Step-by-step guides from first 1K subscribers to a consistent publishing system.
            </p>
            <Button variant="secondary" className="mt-6 bg-white text-neutral-900 hover:bg-neutral-100">
              Coming soon
            </Button>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900">Weekly digest</h3>
            <p className="mt-2 text-sm text-neutral-500">
              Trend highlights, retention tips, and product updates — once a week, no spam.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Input type="email" placeholder="you@email.com" className="flex-1" />
              <Button>Subscribe</Button>
            </div>
          </Card>
        </div>
      </MarketingSection>

      <MarketingSection title="Our editorial principles" className="bg-neutral-50">
        <div className="grid gap-6 md:grid-cols-3">
          {principles.map((p) => (
            <Card key={p.title}>
              <p.icon className="h-5 w-5 text-brand-600" />
              <h3 className="mt-3 text-base font-semibold text-neutral-900">{p.title}</h3>
              <p className="mt-2 text-sm text-neutral-500">{p.desc}</p>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingCta
        title="Put insights into action"
        description="Use CreatorIQ to turn research into your next published video."
      >
        <Link to="/signup">
          <Button size="lg">Get started free</Button>
        </Link>
      </MarketingCta>
    </PublicLayout>
  );
};
