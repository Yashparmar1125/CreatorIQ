import React from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  ChevronRight,
  Lightbulb,
  Play,
  Sparkles,
  Youtube,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import logo from '../assets/logo.png';
import './LandingPage.css';

const opportunities = [
  {
    tag: 'AI tools',
    title: 'AI budgeting tools',
    meta: 'AI tools for smarter money management. Viewers want clear, practical guidance.',
    views: '2.4M',
    lift: '+42%',
    accent: 'mint',
  },
  {
    tag: 'Expected to rise',
    title: 'How to get a job in 2026',
    meta: 'A rising search for practical, step-by-step career advice.',
    views: '1.1M',
    lift: '+18%',
    accent: 'lilac',
  },
];

const featureCards = [
  {
    icon: Youtube,
    eyebrow: '01 —',
    title: 'YouTube data',
    description: 'Public views, engagement and upload patterns. Connect once, watch time only with permission.',
  },
  {
    icon: Sparkles,
    eyebrow: '02 —',
    title: 'AI trend analysis',
    description: 'Grouped related questions, measure acceleration and forecast attention with visible audience metrics.',
  },
  {
    icon: Lightbulb,
    eyebrow: '03 —',
    title: 'Content opportunities',
    description: 'Discover what is next, inspect the evidence and get motivation for your next content.',
  },
];

function LandingHeader() {
  return (
    <header className="landing-header">
      <Link to="/" className="landing-brand">
        <img src={logo} alt="" />
        <span>CreatorIQ</span>
      </Link>
      <nav className="landing-nav" aria-label="Main navigation">
        <Link to="/product">Why CreatorIQ</Link>
        <Link to="/product">How it works</Link>
      </nav>
      <Link to="/signup" className="landing-sign-in">
        Sign in <ArrowRight size={13} />
      </Link>
    </header>
  );
}

function TrendSparkline() {
  return (
    <svg className="trend-sparkline" viewBox="0 0 72 26" aria-hidden="true">
      <path d="M1 23 C12 22 13 17 22 19 S30 15 37 17 S47 12 53 14 S61 5 71 3" />
    </svg>
  );
}

function OpportunityCard({ opportunity }: { opportunity: (typeof opportunities)[number] }) {
  return (
    <article className="opportunity-card">
      <div className={`opportunity-tag ${opportunity.accent}`}>
        <span />
        {opportunity.tag}
      </div>
      <h3>{opportunity.title}</h3>
      <p>{opportunity.meta}</p>
      <div className="opportunity-stats">
        <div><strong>{opportunity.views}</strong><small>views</small></div>
        <div><strong>{opportunity.lift}</strong><small>vs previous 30d</small></div>
        <TrendSparkline />
      </div>
      <div className="opportunity-footer">
        <small>YouTube</small>
        <Link to="/insights">View details <ChevronRight size={12} /></Link>
      </div>
    </article>
  );
}

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const primaryPath = isAuthenticated ? '/app/trends' : '/signup';

  return (
    <div className="landing-page">
      <LandingHeader />

      <section className="landing-hero">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="hero-ribbon hero-ribbon-one" />
        <div className="hero-ribbon hero-ribbon-two" />
        <div className="hero-ribbon hero-ribbon-three" />
        <div className="hero-content">
          <p className="hero-kicker">Your complete YouTube content Planner</p>
          <h1>Find your next YouTube<br />content based on trends</h1>
          <p className="hero-subtitle">Your complete YouTube content Planner</p>
          <div className="hero-actions">
            <Link to={primaryPath} className="pink-button">
              {isAuthenticated ? 'Explore CreatorIQ' : 'Explore CreatorIQ'} <ArrowRight size={14} />
            </Link>
            <Link to="/product" className="outline-button">
              <Play size={12} fill="currentColor" /> How it works
            </Link>
          </div>
        </div>
      </section>

      <section className="signal-section landing-container">
        <h2>Less noise. A tracedable path to insight.</h2>
        <div className="feature-grid">
          {featureCards.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-topline">
                <div className="feature-icon"><feature.icon size={13} /></div>
                <span>{feature.eyebrow}</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="opportunities-section landing-container">
        <h2>See what&apos;s gathering momentum.</h2>
        <div className="opportunity-grid">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.title} opportunity={opportunity} />
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-container">
          <h2>Your next content plan starts with right ideas.</h2>
          <p>Bring an idea. Follow the signals. Decide what deserves a deeper look.</p>
          <Link to={primaryPath} className="pink-button">Start exploring <ArrowRight size={14} /></Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-top">
          <Link to="/" className="landing-brand"><img src={logo} alt="" /><span>CreatorIQ</span></Link>
          <div className="landing-footer-links">
            <Link to="/product">Methodology</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/login">Sign in</Link>
          </div>
        </div>
        <div className="landing-container landing-footer-bottom">
          <span>© 2026 CreatorIQ · Privacy-first intelligence for creators.</span>
          <span>We make patterns visible so ideas can move.</span>
        </div>
      </footer>
    </div>
  );
};
