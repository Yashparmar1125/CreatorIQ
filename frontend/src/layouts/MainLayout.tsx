import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import logo from '../assets/logo.png';
import {
  LayoutDashboard,
  TrendingUp,
  Lightbulb,
  Calendar,
  BarChart2,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  User,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { cn } from '../lib/utils';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/app/dashboard' },
  { name: 'Trends', icon: TrendingUp, href: '/app/trends' },
  { name: 'Strategy', icon: Lightbulb, href: '/app/strategy' },
  { name: 'Planner', icon: Calendar, href: '/app/planner' },
  { name: 'Analytics', icon: BarChart2, href: '/app/analytics' },
];

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
      collapsed && 'justify-center px-2',
      isActive
        ? 'bg-gradient-to-r from-brand-600/25 to-brand-600/5 text-white shadow-sm shadow-brand-900/20'
        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
    );

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 custom-scrollbar">
      {navItems.map((item) => (
        <NavLink key={item.href} to={item.href} className={linkClass} onClick={onNavigate}>
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.name}</span>}
        </NavLink>
      ))}
      <div className="mt-auto border-t border-white/10 pt-4">
        <NavLink to="/app/settings" className={linkClass} onClick={onNavigate}>
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </nav>
  );
}

export const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="app-shell flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-neutral-800/80 bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-white shadow-2xl shadow-neutral-950/50 lg:flex">
        <div className="flex h-14 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5">
            <img src={logo} alt="CreatorIQ" className="h-full w-full object-contain" />
          </div>
          <span className="font-sora text-sm font-semibold tracking-tight">
            Creator<span className="text-neutral-500">IQ</span>
          </span>
        </div>
        <SidebarNav />
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={() => useAuthStore.getState().logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-neutral-900/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-neutral-950 text-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white p-0.5">
                  <img src={logo} alt="CreatorIQ" className="h-full w-full object-contain" />
                </div>
                <span className="font-sora text-sm font-semibold">CreatorIQ</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-white/10 p-3">
              <button
                type="button"
                onClick={() => useAuthStore.getState().logout()}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="app-main flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200/80 surface-glass px-4 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden min-w-0 flex-1 sm:block sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                placeholder="Search..."
                className="h-9 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/10"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="relative rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-600" />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900 leading-none">
                  {user?.full_name ?? 'Account'}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">{user?.email ?? ''}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-neutral-900 text-white">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="surface-app flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
