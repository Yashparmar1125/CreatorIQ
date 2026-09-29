import React from 'react';
import { Link } from 'react-router';
import logo from '../../assets/logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-[#222222] bg-[#0a0a0a]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="space-y-4 md:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md bg-pure-white p-0.5">
              <img src={logo} className="h-full w-full object-contain opacity-90" alt="CreatorIQ" />
            </div>
            <span className="text-sm font-semibold text-white">CreatorIQ</span>
          </Link>
          <p className="max-w-sm text-sm text-neutral-400">
            The intelligence platform for YouTube creators — trends, strategy, and analytics in one place.
          </p>
          <p className="text-xs text-neutral-500">support@creatoriq.ai</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-white">Product</h4>
          <ul className="mt-4 space-y-3 text-sm text-neutral-400">
            <li>
              <Link to="/product" className="hover:text-white transition-colors">
                Platform
              </Link>
            </li>
            <li>
              <Link to="/insights" className="hover:text-white transition-colors">
                Insights
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="hover:text-white transition-colors">
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-white">Legal</h4>
          <ul className="mt-4 space-y-3 text-sm text-neutral-400">
            <li>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#1e1e1e]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-neutral-500 sm:flex-row sm:px-6">
          <span>© 2026 CreatorIQ</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-neutral-300 transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-neutral-300 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
