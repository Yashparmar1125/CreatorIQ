import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { BrandLogo } from '../brand/BrandLogo';
import '../../pages/LandingPage.css';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { label: 'Why CreatorIQ?', to: '/product' },
  { label: 'How it works', to: '/product#how' },
  { label: 'Pricing', to: '/pricing' },
];

const FOOTER_LINKS = [
  { label: 'Methodology', to: '/model-performance' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Insights', to: '/insights' },
  { label: 'Privacy', to: '/privacy' },
];

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const frame = window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <BrandLogo to="/" size="md" />

          <nav className="landing-nav" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              /*
               * A link is active only when it is the exact current location.
               * "/product" and "/product#how" are different destinations, so
               * only one of them can ever be underlined at a time.
               */
              const active = link.to === `${pathname}${hash}`;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                  className={active ? 'is-active' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Link to={isAuthenticated ? '/app/dashboard' : '/login'} className="landing-signin">
            {isAuthenticated ? 'Open app' : 'Sign in'}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main>{children}</main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-top">
          <div>
            <BrandLogo to="/" size="sm" />
            <p className="landing-footer-tagline">
              Evidence-backed content intelligence for YouTube creators.
            </p>
          </div>
          <nav className="landing-footer-links" aria-label="Footer navigation">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
            <Link to={isAuthenticated ? '/app/dashboard' : '/login'}>
              {isAuthenticated ? 'Dashboard' : 'Sign in'}
            </Link>
          </nav>
        </div>
        <div className="landing-container landing-footer-bottom">
          <span>© 2026 CreatorIQ</span>
          <span>Forecasts are projections, not guarantees.</span>
        </div>
      </footer>
    </div>
  );
};
