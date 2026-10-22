import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { BrandLogo } from '../components/brand/BrandLogo';
import {
  LayoutGrid,
  TrendingUp,
  Settings,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Plus,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Sliders,
  ArrowRight,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useStrategyStore } from '../stores/useStrategyStore';
import { cn } from '../lib/utils';

const navItems = [
  { name: 'Overview', icon: LayoutGrid, href: '/app/dashboard' },
  { name: 'Trends', icon: TrendingUp, href: '/app/trends' },
  { name: 'AI Strategy', icon: Sparkles, href: '/app/strategy' },
];

function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const {
    sessions,
    currentSessionId,
    fetchSessions,
    selectSession,
    deleteSession,
    clearCurrentSession,
  } = useStrategyStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleNewResearch = async () => {
    clearCurrentSession();
    navigate('/app/strategy?new=true');
    if (onNavigate) onNavigate();
  };

  const handleSelectSession = async (sessionId: string) => {
    await selectSession(sessionId);
    navigate(`/app/strategy?session=${sessionId}`);
    if (onNavigate) onNavigate();
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    e.preventDefault();
    await deleteSession(sessionId);
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150',
      collapsed && 'mx-auto h-9 w-9 justify-center px-0 py-0',
      isActive
        ? 'bg-white border border-[#E5E0E8] text-[#171717] font-bold shadow-xs'
        : 'bg-transparent border border-transparent text-[#625D68] hover:bg-[#F1ECFF] hover:text-[#171717]'
    );

  return (
    <nav
      className={cn(
        'flex flex-1 flex-col gap-1 overflow-y-auto py-4 custom-scrollbar',
        collapsed ? 'items-center px-2' : 'px-3'
      )}
    >
      {/* '+ New research' primary action */}
      <div className={cn('mb-4 w-full', collapsed && 'flex justify-center')}>
        <button
          type="button"
          onClick={handleNewResearch}
          title="Start a new research session"
          aria-label="Start a new research session"
          className={cn(
            'inline-flex items-center justify-center gap-1.5 rounded-full font-bold bg-[#FF98C1] border border-[#F27DA8] text-[#171717] transition-all hover:bg-[#FF8AB8] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer text-[13px]',
            collapsed ? 'h-9 w-9 p-0' : 'h-11 w-full px-3'
          )}
        >
          <Plus className={cn('h-4 w-4', collapsed ? 'stroke-[3]' : 'stroke-[3]')} />
          {!collapsed && <span>New research</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="mb-1.5 px-2 text-[10px] font-bold tracking-[0.14em] uppercase text-[#77717F]">
          Workspace
        </div>
      )}

      {navItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          title={collapsed ? item.name : undefined}
          className={linkClass}
          onClick={onNavigate}
        >
          {({ isActive }) => (
            <>
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-[#4A2E8F]' : 'text-[#77717F] group-hover:text-[#171717]'
                )}
              />
              {!collapsed && <span className="tracking-tight">{item.name}</span>}
            </>
          )}
        </NavLink>
      ))}

      {/* Planning history — real sessions from the API */}
      {!collapsed ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col border-t border-[#E5E0E8] pt-4">
          <div className="mb-2 px-2 text-[10px] font-bold tracking-[0.14em] uppercase text-[#77717F]">
            Your planning history
          </div>

          <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1 custom-scrollbar">
            {sessions.length === 0 ? (
              <p className="px-2 text-[11px] leading-relaxed text-[#77717F]">
                No research sessions yet. Start one to plan your next video.
              </p>
            ) : (
              sessions.map((s) => {
                const isSelected = currentSessionId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    className={cn(
                      'group relative flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors',
                      isSelected
                        ? 'bg-white font-bold text-[#171717]'
                        : 'text-[#625D68] hover:bg-[#F1ECFF] hover:text-[#171717]'
                    )}
                    title={s.title}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <MessageSquare
                        className={cn(
                          'h-3 w-3 shrink-0',
                          isSelected ? 'text-[#4A2E8F]' : 'text-[#A79FB0]'
                        )}
                      />
                      <span className="truncate">{s.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="ml-1 rounded p-0.5 text-[#A79FB0] opacity-60 transition-opacity hover:text-[#B42332] group-hover:opacity-100 focus-visible:opacity-100"
                      title="Delete session"
                      aria-label={`Delete session ${s.title}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div
        className={cn(
          'mt-auto border-t border-[#E5E0E8] pt-3',
          collapsed ? 'flex w-full justify-center' : ''
        )}
      >
        <NavLink
          to="/app/settings"
          title={collapsed ? 'Settings' : undefined}
          className={linkClass}
          onClick={onNavigate}
        >
          {({ isActive }) => (
            <>
              <Settings
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-[#4A2E8F]' : 'text-[#77717F] group-hover:text-[#171717]'
                )}
              />
              {!collapsed && <span className="tracking-tight">Settings</span>}
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ciq_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ciq_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const user = useAuthStore((s) => s.user);

  const userInitial = user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U';
  const userName = user?.full_name || user?.email?.split('@')[0] || 'Creator';
  const planLabel = user?.plan_tier ? `${user.plan_tier} plan` : 'Active plan';

  if (location.pathname.startsWith('/app/strategy')) {
    return <Outlet />;
  }

  const isDashboard = location.pathname.startsWith('/app/dashboard');

  return (
    <div className="flex min-h-screen bg-[#FBFAF8] text-[#171717]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col bg-[#F6F3FF] border-r border-[#E5E0E8] transition-all duration-200 ease-in-out lg:flex',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-[#E5E0E8]',
            collapsed ? 'justify-center px-2' : 'px-4'
          )}
        >
          <BrandLogo
            to="/"
            size="sm"
            showWordmark={!collapsed}
            title="Back to Home"
          />
        </div>

        <SidebarNav collapsed={collapsed} />

        {/* Bottom account area */}
        <div className="border-t border-[#E5E0E8] p-2.5">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2 rounded-xl p-2 transition-colors hover:bg-white">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#91F5D3] text-xs font-bold text-[#171717]">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold leading-tight text-[#171717]">
                    {userName}
                  </p>
                  <span className="inline-block text-[10px] font-medium capitalize text-[#77717F]">
                    {planLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => useAuthStore.getState().logout()}
                className="cursor-pointer rounded-lg p-1.5 text-[#77717F] transition-colors hover:bg-[#FDECEF] hover:text-[#B42332]"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#91F5D3] text-xs font-bold text-[#171717]"
                title={userName}
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <button
                type="button"
                onClick={() => useAuthStore.getState().logout()}
                className="cursor-pointer rounded-lg p-1.5 text-[#77717F] transition-colors hover:bg-[#FDECEF] hover:text-[#B42332]"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#171717]/40 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[#F6F3FF] border-r border-[#E5E0E8] shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-[#E5E0E8] px-4">
              <BrandLogo
                to="/"
                size="sm"
                title="Back to Home"
                onClick={() => setMobileOpen(false)}
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-[#625D68] transition-colors hover:bg-white hover:text-[#171717]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-[#E5E0E8] p-3">
              <button
                type="button"
                onClick={() => useAuthStore.getState().logout()}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#625D68] transition-colors hover:bg-white hover:text-[#B42332]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div
        className={cn(
          'flex min-h-screen flex-1 flex-col bg-[#FBFAF8] transition-all duration-200 ease-in-out',
          collapsed ? 'lg:pl-[68px]' : 'lg:pl-64'
        )}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E0E8] bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile drawer button */}
            <button
              type="button"
              className="rounded-lg p-1.5 text-[#625D68] transition-colors hover:bg-[#F6F3FF] hover:text-[#171717] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop collapse/expand toggle button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden cursor-pointer rounded-lg border border-transparent p-1.5 text-[#625D68] transition-colors hover:border-[#E5E0E8] hover:bg-[#F6F3FF] hover:text-[#171717] lg:inline-flex"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            <div className="hidden min-w-0 flex-1 sm:block sm:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A79FB0]" />
                <input
                  type="search"
                  placeholder="Search trends, topics, concepts..."
                  className="h-9 w-full rounded-xl border border-[#E5E0E8] bg-white pl-9 pr-3 text-xs text-[#171717] placeholder-[#9B94A5] transition-colors focus:border-[#7C5CD6] focus:outline-none focus:ring-2 focus:ring-[#7C5CD6]/20"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/app/trends"
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#625D68] transition-colors hover:bg-[#F6F3FF] hover:text-[#171717] sm:inline-flex"
            >
              View all ideas
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            {/* Top-Right Profile Accordion / Popover */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-xl border px-2 py-1.5 text-left transition-all',
                  profileOpen
                    ? 'border-[#E5E0E8] bg-[#F6F3FF] text-[#171717]'
                    : 'border-transparent bg-transparent hover:border-[#E5E0E8] hover:bg-[#F6F3FF]'
                )}
                aria-expanded={profileOpen}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E5E0E8] bg-white text-[#625D68]">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className="hidden max-w-[140px] truncate text-xs font-semibold text-[#171717] sm:inline-block">
                  {user?.full_name ?? 'Creator Account'}
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-[#77717F] transition-transform duration-200',
                    profileOpen && 'rotate-180 text-[#171717]'
                  )}
                />
              </button>

              {profileOpen && (
                <div className="animate-in absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-[#E5E0E8] bg-white shadow-lg shadow-black/5">
                  {/* User Account Info Header */}
                  <div className="border-b border-[#EFEBF2] bg-[#F6F3FF] px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#91F5D3] text-xs font-bold text-[#171717]">
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          userInitial
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#171717]">
                          {user?.full_name ?? 'Creator Account'}
                        </p>
                        <p className="truncate text-[11px] text-[#625D68]">{user?.email ?? ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Accordion Menu Actions */}
                  <div className="p-1.5">
                    <Link
                      to="/app/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#625D68] transition-colors hover:bg-[#F6F3FF] hover:text-[#171717]"
                    >
                      <Settings className="h-3.5 w-3.5 text-[#77717F]" />
                      <span>Profile &amp; Preferences</span>
                    </Link>
                    <Link
                      to="/onboarding"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#625D68] transition-colors hover:bg-[#F6F3FF] hover:text-[#171717]"
                    >
                      <Sliders className="h-3.5 w-3.5 text-[#77717F]" />
                      <span>Recalibrate Onboarding</span>
                    </Link>
                  </div>

                  {/* Logout Footer */}
                  <div className="border-t border-[#EFEBF2] p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        useAuthStore.getState().logout();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#B42332] transition-colors hover:bg-[#FDECEF]"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          className={cn(
            'surface-app flex-1 bg-[#FBFAF8]',
            location.pathname.startsWith('/app/strategy')
              ? 'h-[calc(100vh-4rem)] overflow-hidden'
              : 'overflow-x-hidden'
          )}
        >
          {location.pathname.startsWith('/app/strategy') ? (
            <Outlet />
          ) : isDashboard ? (
            <div className="w-full px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
              <Outlet />
            </div>
          ) : (
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
