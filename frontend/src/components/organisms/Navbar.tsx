import React from 'react';
import { Link } from 'react-router';
import logo from '../../assets/logo.png';
import { useAuthStore } from '../../stores/useAuthStore';

export const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
      <div className="glass px-6 py-3 rounded-2xl border border-white/40 flex items-center justify-between shadow-xl shadow-neutral-900/5">
        <div className="flex items-center gap-2 group cursor-pointer">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} className="h-8 w-auto object-contain" alt="CreatorIQ" />
            <span className="text-sm font-bold font-sora tracking-tight">
              <span className="text-neutral-900">Creator</span>
              <span className="text-neutral-400">IQ</span>
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
          <Link to="/" className="hover:text-neutral-900 transition-colors">Product</Link>
          <a href="#" className="hover:text-neutral-900 transition-colors">Network</a>
          <a href="#" className="hover:text-neutral-900 transition-colors">Insights</a>
          <a href="#" className="hover:text-neutral-900 transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-[10px] font-bold uppercase tracking-widest text-neutral-900 hover:text-brand-600 transition-colors hidden sm:block px-4">
                Access
              </Link>
              <Link to="/signup" className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-brand-600 hover:scale-[1.02] transition-all shadow-lg shadow-neutral-900/10 active:scale-98">
                Get Started
              </Link>
            </>
          ) : (
            <Link to="/app/dashboard" className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-brand-500 hover:scale-[1.02] transition-all shadow-lg shadow-brand-600/10 active:scale-98">
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
