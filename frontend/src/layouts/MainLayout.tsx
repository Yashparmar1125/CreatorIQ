import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import logo from '../assets/logo.png';
import {
  LayoutDashboard,
  TrendingUp,
  Settings,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Plus,
  MessageSquare,
  Trash2,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Sliders,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { useStrategyStore } from '../stores/useStrategyStore';
import { cn } from '../lib/utils';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/app/dashboard' },
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

  const handleNewChat = async () => {
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
      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
      collapsed && 'mx-auto h-9 w-9 justify-center px-0 py-0',
      isActive
        ? 'bg-[#1c1c1c] text-white border border-[#2e2e2e]'
        : 'text-[#8e8e93] hover:bg-[#141414] hover:text-[#d1d1d6]'
    );

  return (
    <nav
      className={cn(
        'flex flex-1 flex-col gap-1 overflow-y-auto py-3 custom-scrollbar',
        collapsed ? 'items-center px-2' : 'px-3'
      )}
    >
      {/* '+ New chat' Pill Button */}
      <div className={cn('mb-2.5 w-full', collapsed && 'flex justify-center')}>
        <button
          type="button"
          onClick={handleNewChat}
          title="New AI Strategy chat"
          className={cn(
            'flex items-center rounded-lg border border-[#2c2c2c] bg-[#161616] text-xs font-semibold text-white hover:bg-[#202020] hover:border-[#383838] transition-all shadow-xs group cursor-pointer',
            collapsed
              ? 'h-9 w-9 justify-center p-0'
              : 'w-full justify-between px-3 py-2'
          )}
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-neutral-400 group-hover:text-white" />
            {!collapsed && <span>New chat</span>}
          </div>
          {!collapsed && <span className="text-[10px] font-mono text-neutral-500">AI</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#545458]">
          Platform
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
                  isActive ? 'text-white' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
                )}
              />
              {!collapsed && <span className="tracking-tight">{item.name}</span>}
            </>
          )}
        </NavLink>
      ))}

      {/* Dynamic Strategy & Chat History Section */}
      {!collapsed ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-[#1a1a1a] pt-3">
          <div className="mb-1.5 flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-[#545458]">
            <span>Recent History</span>
          </div>

          <div className="max-h-56 space-y-0.5 overflow-y-auto pr-1 custom-scrollbar">
            {sessions.length === 0 ? (
              <div className="px-2.5 py-2 text-[11px] text-neutral-600">
                No chats yet. Start asking above.
              </div>
            ) : (
              sessions.map((s) => {
                const isSelected = currentSessionId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSession(s.id)}
                    className={cn(
                      'group relative flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-[#1e1e1e] text-white font-medium border border-[#2d2d2d]'
                        : 'text-neutral-400 hover:bg-[#141414] hover:text-neutral-200'
                    )}
                    title={s.title}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <MessageSquare
                        className={cn(
                          'h-3 w-3 shrink-0',
                          isSelected ? 'text-indigo-400' : 'text-neutral-500'
                        )}
                      />
                      <span className="truncate text-xs">{s.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="ml-1 rounded p-0.5 text-neutral-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                      title="Delete chat"
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

      <div className={cn('mt-auto border-t border-[#1e1e1e] pt-3', collapsed ? 'w-full flex justify-center' : '')}>
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
                  isActive ? 'text-white' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
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

  if (location.pathname.startsWith('/app/strategy')) {
    return <Outlet />;
  }

  return (
    <div className="app-shell flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[#1a1a1a] bg-[#0d0d0d] text-[#ededed] transition-all duration-200 ease-in-out lg:flex',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        <div
          className={cn(
            'flex h-14 items-center border-b border-[#1a1a1a]',
            collapsed ? 'justify-center px-2' : 'px-4'
          )}
        >
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
            title="Back to Home"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-pure-white p-0.5 shadow-xs">
              <img src={logo} alt="CreatorIQ" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1.5">
                <span className="font-sora text-sm font-semibold tracking-tight text-white">
                  CreatorIQ
                </span>
                <span className="rounded border border-[#2a2a2a] bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-medium text-neutral-400">
                  AI
                </span>
              </div>
            )}
          </Link>
        </div>

        <SidebarNav collapsed={collapsed} />

        {/* Bottom User Pill */}
        <div className="border-t border-[#1a1a1a] p-2.5">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2 rounded-xl p-2 transition-colors hover:bg-[#141414]">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-xs">
                  {userInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold leading-tight text-white">
                    {userName}
                  </p>
                  <span className="inline-block text-[10px] font-medium text-neutral-500">
                    Go &bull; Active
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => useAuthStore.getState().logout()}
                className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-[#1f1616] hover:text-red-400 cursor-pointer"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-xs"
                title={userName}
              >
                {userInitial}
              </div>
              <button
                type="button"
                onClick={() => useAuthStore.getState().logout()}
                className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-[#1f1616] hover:text-red-400 cursor-pointer"
                title="Log out"
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
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-[#1a1a1a] bg-[#0d0d0d] text-white shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-[#1a1a1a] px-4">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
                title="Back to Home"
              >
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-pure-white p-0.5">
                  <img src={logo} alt="CreatorIQ" className="h-full w-full object-contain" />
                </div>
                <span className="font-sora text-sm font-semibold text-white">CreatorIQ</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-[#1a1a1a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-[#1a1a1a] p-3">
              <button
                type="button"
                onClick={() => useAuthStore.getState().logout()}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#71717a] hover:bg-[#1a1212] hover:text-[#f87171]"
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
          'app-main flex min-h-screen flex-1 flex-col transition-all duration-200 ease-in-out',
          collapsed ? 'lg:pl-[68px]' : 'lg:pl-60'
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a]/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile drawer button */}
            <button
              type="button"
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-[#1a1a1a] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop collapse/expand toggle button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden rounded-lg border border-transparent p-1.5 text-neutral-400 transition-colors hover:border-[#262626] hover:bg-[#141414] hover:text-white lg:inline-flex cursor-pointer"
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
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
                <input
                  type="search"
                  placeholder="Search trends, topics, concepts..."
                  className="h-8 w-full rounded-lg border border-[#242424] bg-[#121212] pl-8 pr-3 text-xs text-[#ededed] placeholder-neutral-500 transition-all focus:border-[#383838] focus:bg-[#141414] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Top-Right Profile Accordion / Popover */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-left transition-all cursor-pointer',
                profileOpen
                  ? 'border-[#333333] bg-[#181818] text-white'
                  : 'border-transparent bg-transparent hover:border-[#242424] hover:bg-[#141414]'
              )}
              aria-expanded={profileOpen}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-neutral-300">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
              </div>
              <span className="hidden max-w-[140px] truncate text-xs font-medium text-[#ededed] sm:inline-block">
                {user?.full_name ?? 'Creator Account'}
              </span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 text-neutral-400 transition-transform duration-200',
                  profileOpen && 'rotate-180 text-white'
                )}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-[#262626] bg-[#121212] shadow-2xl shadow-black/80 animate-in">
                {/* User Account Info Header */}
                <div className="border-b border-[#1f1f1f] bg-[#161616]/70 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                      {userInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">
                        {user?.full_name ?? 'Creator Account'}
                      </p>
                      <p className="truncate text-[11px] text-neutral-400">
                        {user?.email ?? ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Accordion Menu Actions */}
                <div className="p-1.5">
                  <Link
                    to="/app/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:bg-[#1c1c1c] hover:text-white"
                  >
                    <Settings className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Profile & Preferences</span>
                  </Link>
                  <Link
                    to="/onboarding"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:bg-[#1c1c1c] hover:text-white"
                  >
                    <Sliders className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Recalibrate Onboarding</span>
                  </Link>
                </div>

                {/* Logout Footer */}
                <div className="border-t border-[#1f1f1f] p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      useAuthStore.getState().logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-[#1f1414] hover:text-red-300 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main
          className={cn(
            'surface-app flex-1 bg-[#0a0a0a]',
            location.pathname.startsWith('/app/strategy')
              ? 'h-[calc(100vh-3.5rem)] overflow-hidden'
              : 'overflow-x-hidden'
          )}
        >
          {location.pathname.startsWith('/app/strategy') ? (
            <Outlet />
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


