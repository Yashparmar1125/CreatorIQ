import React from 'react';
import { Link } from 'react-router';
import { ArrowRight, ChevronRight, Lightbulb, Sparkles, Youtube } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { PublicLayout } from '../components/organisms/PublicLayout';

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
      className="opportunity-sparkline"
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
  return (
    <article className="opportunity-card">
      <div className="opportunity-card-top">
        <span className={`status-badge ${opportunity.tone}`}>
          <span className="status-dot" />
          {opportunity.tag}
        </span>
      </div>

      <h3>{opportunity.title}</h3>
      <p>{opportunity.description}</p>

      <div className="opportunity-chart">
        <OpportunitySparkline path={opportunity.path} tone={opportunity.tone} />
        <span className="opportunity-chart-label">Illustrative trend shape</span>
      </div>

      <div className="opportunity-footer">
        <span>Illustrative example, not live results</span>
        <Link to="/login" className="opportunity-link">
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
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="hero-decoration" aria-hidden="true">
          <div className="hero-shape hero-shape-mint" />
          <div className="hero-shape hero-shape-pink" />
        </div>

        <div className="landing-container hero-content">
          <h1 id="hero-title">Find your next YouTube content based on trends</h1>
          <p className="hero-subtitle">
            CreatorIQ turns public YouTube signals into a ranked shortlist for your niche — then
            shows the evidence behind every opportunity.
          </p>
          <div className="hero-actions">
            <Link to={primaryPath} className="pink-button">
              Explore CreatorIQ
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <a href="#how" className="outline-button">
              How it works
            </a>
          </div>
        </div>
      </section>

      <section className="landing-section value-section" id="how" aria-labelledby="value-title">
        <div className="landing-container">
          <div className="section-heading">
            <h2 id="value-title">Less noise. A traceable path to insight.</h2>
            <p className="section-lead">
              Three connected steps take you from raw channel activity to a decision you can act on.
            </p>
          </div>

          <div className="feature-grid">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="feature-card" key={feature.title}>
                  <div className="feature-topline">
                    <span className="feature-icon">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className="feature-step">{feature.step}</span>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section opportunities-section" aria-labelledby="opportunities-title">
        <div className="landing-container">
          <div className="section-heading section-heading-row">
            <div>
              <h2 id="opportunities-title">See what&apos;s gathering momentum.</h2>
            </div>
            <p className="section-note">
              Examples of the CreatorIQ format. Sign in to see live opportunities ranked for your
              niche.
            </p>
          </div>

          <div className="opportunity-grid">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.title} opportunity={opportunity} />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta" aria-labelledby="cta-title">
        <div className="landing-container">
          <h2 id="cta-title">Your next content plan starts with the right ideas.</h2>
          <p>Bring an idea. Follow the signals. Decide what deserves a deeper look.</p>
          <Link to={primaryPath} className="pink-button">
            Start exploring
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};
