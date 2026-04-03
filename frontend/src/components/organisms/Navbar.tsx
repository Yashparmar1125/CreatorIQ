import React from 'react';
import { Link } from 'react-router';
import logo from '../../assets/logo.png';
import { useAuthStore } from '../../stores/useAuthStore';

export const Navbar: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
      <div className="glass px-8 py-5 rounded-[32px] border border-white/40 flex items-center justify-between shadow-2xl shadow-neutral-900/5">
        <div className="flex items-center gap-3 group cursor-pointer">
          <Link to="/">
            <img src={logo} className="h-14 w-auto object-contain" alt="CreatorIQ" />
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400">
          <Link to="/" className="hover:text-neutral-900 transition-colors">Product</Link>
          <a href="#" className="hover:text-neutral-900 transition-colors">Network</a>
          <a href="#" className="hover:text-neutral-900 transition-colors">Insights</a>
          <a href="#" className="hover:text-neutral-900 transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-xs font-black uppercase tracking-widest text-neutral-900 hover:text-brand-600 transition-colors hidden sm:block px-4">
                Access
              </Link>
              <Link to="/signup" className="px-8 py-4 bg-neutral-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-600 hover:scale-[1.05] transition-all shadow-2xl shadow-neutral-900/20 active:scale-95">
                Get Started
              </Link>
            </>
          ) : (
            <Link to="/app/dashboard" className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-50 hover:scale-[1.05] transition-all shadow-2xl shadow-brand-600/20 active:scale-95">
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
