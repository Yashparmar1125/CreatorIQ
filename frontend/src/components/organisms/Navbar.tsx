import React, { useState } from 'react';
import { Link, NavLink } from 'react-router';
import logo from '../../assets/logo.png';
import { useAuthStore } from '../../stores/useAuthStore';
import { Button } from '../ui/Button';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const navLinks = [
  { to: '/product', label: 'Product' },
  { to: '/insights', label: 'Insights' },
  { to: '/pricing', label: 'Pricing' },
];

export const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logo} className="h-7 w-auto" alt="CreatorIQ" />
          <span className="font-sora text-sm font-semibold text-neutral-900">
            Creator<span className="text-neutral-400">IQ</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors',
                  isActive ? 'text-brand-600' : 'text-neutral-600 hover:text-neutral-900'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!isAuthenticated ? (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          ) : (
            <Link to="/app/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-neutral-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4">
            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)}>
                  <Button className="w-full">Get started</Button>
                </Link>
              </>
            ) : (
              <Link to="/app/dashboard" onClick={() => setOpen(false)}>
                <Button className="w-full">Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
