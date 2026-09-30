import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
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
  collapsed,
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
      collapsed && 'justify-center px-2',
      isActive
        ? 'bg-[#1c1c1c] text-white border border-[#2e2e2e]'
        : 'text-[#8e8e93] hover:bg-[#141414] hover:text-[#d1d1d6]'
    );

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3 custom-scrollbar">
      {/* ChatGPT '+ New chat' Pill Button */}
      <div className="mb-2.5">
        <button
          type="button"
          onClick={handleNewChat}
          className="flex w-full items-center justify-between rounded-lg border border-[#2c2c2c] bg-[#161616] px-3 py-2 text-xs font-semibold text-white hover:bg-[#202020] hover:border-[#383838] transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-neutral-400 group-hover:text-white" />
            <span>New chat</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">AI</span>
        </button>
      </div>

      <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#545458]">
        Platform
      </div>
      {navItems.map((item) => (
        <NavLink key={item.href} to={item.href} className={linkClass} onClick={onNavigate}>
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
      <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex-1 flex flex-col min-h-0">
        <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#545458] flex items-center justify-between">
          <span>Recent History</span>
          {/* <span className="text-[9px] text-neutral-600 font-normal">Fast Cache</span> */}
        </div>

        <div className="space-y-0.5 overflow-y-auto max-h-56 custom-scrollbar pr-1">
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
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare className={cn('h-3 w-3 shrink-0', isSelected ? 'text-indigo-400' : 'text-neutral-500')} />
                    <span className="truncate text-xs">{s.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-500 hover:text-red-400 transition-opacity ml-1 rounded"
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

      <div className="mt-auto border-t border-[#1e1e1e] pt-3">
        <NavLink to="/app/settings" className={linkClass} onClick={onNavigate}>
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const userInitial = user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U';
  const userName = user?.full_name || user?.email?.split('@')[0] || 'Creator';


  return (
    <div className="app-shell flex min-h-screen bg-[#0a0a0a] text-[#ededed]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[#1a1a1a] bg-[#0d0d0d] text-[#ededed] lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-[#1a1a1a] px-4">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity" title="Back to Home">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-pure-white p-0.5 shadow-xs">
              <img src={logo} alt="CreatorIQ" className="h-full w-full object-contain" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-sora text-sm font-semibold tracking-tight text-white">
                CreatorIQ
              </span>
              <span className="rounded bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-medium text-neutral-400 border border-[#2a2a2a]">
                AI
              </span>
            </div>
          </Link>
        </div>

        <SidebarNav />

        {/* ChatGPT-Style Bottom User Pill */}
        <div className="border-t border-[#1a1a1a] p-2.5">
          <div className="flex items-center justify-between gap-2 rounded-xl p-2 hover:bg-[#141414] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white shadow-xs">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white leading-tight">
                  {userName}
                </p>
                <span className="inline-block text-[10px] text-neutral-500 font-medium">
                  Go &bull; Active
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => useAuthStore.getState().logout()}
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-[#1f1616] hover:text-red-400 transition-colors cursor-pointer"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
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
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[#0d0d0d] text-white shadow-2xl border-r border-[#1a1a1a]">
            <div className="flex h-14 items-center justify-between border-b border-[#1a1a1a] px-4">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 hover:opacity-85 transition-opacity" title="Back to Home">
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
      <div className="app-main flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-[#1a1a1a] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden min-w-0 flex-1 sm:block sm:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
                <input
                  type="search"
                  placeholder="Search trends, topics, concepts..."
                  className="h-8 w-full rounded-lg border border-[#242424] bg-[#121212] pl-8 pr-3 text-xs text-[#ededed] placeholder-neutral-500 focus:border-[#383838] focus:bg-[#141414] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-[#ededed] leading-tight">
                  {user?.full_name ?? 'Creator Account'}
                </p>
                <p className="mt-0.5 text-[10px] text-neutral-500 font-normal">{user?.email ?? ''}</p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-neutral-300">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="surface-app flex-1 overflow-x-hidden bg-[#0a0a0a]">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
