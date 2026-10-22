import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { BrandLogo } from '../brand/BrandLogo';
import { cn } from '../../lib/utils';

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
    <div className="min-h-screen bg-[#FBFAF8] text-[#171717] font-sans antialiased selection:bg-[#FF98C1]/30">
      <header className="sticky top-0 z-50 border-b border-[#EFEAF3] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] w-full max-w-[1180px] items-center justify-between gap-6 px-6 sm:px-8">
          <BrandLogo to="/" size="md" />

          <nav className="hidden items-center gap-8 text-[14px] font-medium text-[#625D68] md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = link.to === `${pathname}${hash}`;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative py-1.5 transition-colors hover:text-[#171717]',
                    active &&
                      "font-bold text-[#171717] after:absolute after:inset-x-0 after:-bottom-[2px] after:h-[2px] after:rounded-full after:bg-[#E0548A] after:content-['']"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Link
            to={isAuthenticated ? '/app/dashboard' : '/login'}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#FF98C1] px-5 text-[13px] font-bold text-[#171717] shadow-xs transition-all hover:bg-[#FF86B7] hover:-translate-y-0.5 active:translate-y-0"
          >
            {isAuthenticated ? 'Open app' : 'Sign in'}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-[#EFEAF3] bg-white py-12">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col justify-between gap-6 border-b border-[#EFEAF3] px-6 pb-8 sm:flex-row sm:items-center sm:px-8">
          <div>
            <BrandLogo to="/" size="sm" />
            <p className="mt-2 text-xs text-[#77717F]">
              Evidence-backed content intelligence for YouTube creators.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-xs text-[#625D68]" aria-label="Footer navigation">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="transition-colors hover:text-[#171717]">
                {link.label}
              </Link>
            ))}
            <Link
              to={isAuthenticated ? '/app/dashboard' : '/login'}
              className="font-bold text-[#171717] hover:text-[#7C5CD6] transition-colors"
            >
              {isAuthenticated ? 'Dashboard' : 'Sign in'}
            </Link>
          </nav>
        </div>
        <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center justify-between gap-4 px-6 pt-6 text-xs text-[#77717F] sm:flex-row sm:px-8">
          <span>© 2026 CreatorIQ</span>
          <span>Forecasts are projections, not guarantees.</span>
        </div>
      </footer>
    </div>
  );
};
