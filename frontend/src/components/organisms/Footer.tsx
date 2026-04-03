import React from 'react';
import { Link } from 'react-router';
import logo from '../../assets/logo.png';
import { Globe, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-24 border-t border-neutral-100 mt-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-20">
        <div className="space-y-8 col-span-1 md:col-span-2">
          <div className="flex items-center gap-3">
            <Link to="/">
              <img src={logo} className="h-6 w-auto object-contain brightness-0 opacity-80 hover:opacity-100 transition-opacity" alt="CreatorIQ" />
            </Link>
          </div>
          <p className="text-neutral-400 font-medium max-w-xs">Building the platform for the next decade of content creation.</p>
          <div className="flex gap-6">
            <div className="w-10 h-10 rounded-full border border-neutral-100 flex items-center justify-center">
              <Globe className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="w-10 h-10 rounded-full border border-neutral-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-900">Ecosystem</h4>
          <ul className="space-y-4 text-sm font-bold text-neutral-400">
            <li><a href="#" className="hover:text-brand-600 transition-colors">Insights Hub</a></li>
            <li><a href="#" className="hover:text-brand-600 transition-colors">Strategic Planning</a></li>
            <li><a href="#" className="hover:text-brand-600 transition-colors">Advanced Analytics</a></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-900">Company</h4>
          <ul className="space-y-4 text-sm font-bold text-neutral-400">
            <li><Link to="/privacy" className="hover:text-brand-600 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-brand-600 transition-colors">Terms of Service</Link></li>
            <li><a href="#" className="hover:text-brand-600 transition-colors">Documentation</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-20 pt-12 border-t border-neutral-50 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black text-neutral-300 uppercase tracking-widest text-center md:text-left">
        <span>© 2026 CreatorIQ Studio. Built for growth.</span>
        <div className="flex gap-4">
          <Link to="/terms" className="hover:text-neutral-900 transition-colors">Terms</Link>
          <span>&</span>
          <Link to="/privacy" className="hover:text-neutral-900 transition-colors">Privacy</Link>
          <span className="opacity-40 ml-2">• 1.0.4-stable</span>
        </div>
      </div>
    </footer>
  );
};
