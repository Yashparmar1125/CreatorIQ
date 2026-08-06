import React from 'react';
import { Link } from 'react-router';
import logo from '../../assets/logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="space-y-4 md:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logo} className="h-6 w-auto opacity-80" alt="CreatorIQ" />
            <span className="text-sm font-semibold text-neutral-900">CreatorIQ</span>
          </Link>
          <p className="max-w-sm text-sm text-neutral-500">
            The intelligence platform for YouTube creators — trends, strategy, and analytics in one place.
          </p>
          <p className="text-xs text-neutral-400">yashparmar11y@gmail.com</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-neutral-900">Product</h4>
          <ul className="mt-4 space-y-3 text-sm text-neutral-500">
            <li>
              <Link to="/product" className="hover:text-brand-600">
                Platform
              </Link>
            </li>
            <li>
              <Link to="/insights" className="hover:text-brand-600">
                Insights
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="hover:text-brand-600">
                Pricing
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium text-neutral-900">Legal</h4>
          <ul className="mt-4 space-y-3 text-sm text-neutral-500">
            <li>
              <Link to="/privacy" className="hover:text-brand-600">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-brand-600">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-neutral-400 sm:flex-row sm:px-6">
          <span>© 2026 CreatorIQ</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-neutral-600">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-neutral-600">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
