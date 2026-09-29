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
    <header className="sticky top-0 z-50 border-b border-[#222222] bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-pure-white p-0.5">
            <img src={logo} className="h-full w-full object-contain" alt="CreatorIQ" />
          </div>
          <span className="font-sora text-sm font-semibold text-white">
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
                  isActive ? 'text-white' : 'text-neutral-400 hover:text-white'
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
                <Button variant="ghost" size="sm" className="text-neutral-300 hover:text-white hover:bg-[#181818]">
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
          className="rounded-lg p-2 text-neutral-400 hover:bg-[#181818] hover:text-white md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#222222] bg-[#0d0d0d] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 hover:bg-[#181818] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-[#222222] pt-4">
            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="secondary" className="w-full bg-[#181818] border-[#2c2c2c] text-[#ededed]">
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
