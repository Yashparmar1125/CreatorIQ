import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';
import {
  LayoutDashboard,
  TrendingUp,
  Lightbulb,
  Calendar,
  BarChart2,
  Settings,
  Youtube,
  Search,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/app/dashboard' },
  { name: 'Trends', icon: TrendingUp, href: '/app/trends' },
  { name: 'Strategy', icon: Lightbulb, href: '/app/strategy' },
  { name: 'Planner', icon: Calendar, href: '/app/planner' },
  { name: 'Analytics', icon: BarChart2, href: '/app/analytics' },
  { name: 'Channels', icon: Youtube, href: '/app/channels' },
];

export const MainLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen bg-white text-neutral-900 font-sans selection:bg-brand-600/10 transition-colors duration-500 overflow-hidden">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-brand-600/5 blur-[120px] rounded-full animate-breathe" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-500/5 blur-[150px] rounded-full animate-breathe delay-1000" />
      </div>

      {/* Sidebar - Pro Dark Glass Drawer */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarCollapsed ? 80 : 288,
          transition: { type: 'spring', stiffness: 300, damping: 30 }
        }}
        className={cn(
          "fixed left-0 top-0 h-full bg-neutral-950 text-white z-50 flex flex-col shadow-2xl overflow-hidden group border-r border-white/5",
        )}
      >
        <div className="absolute inset-0 bg-brand-600/5 blur-3xl opacity-20 pointer-events-none" />

        <div className="h-20 flex items-center relative z-10 border-b border-white/5">
          <div className={cn("flex items-center w-full px-6", isSidebarCollapsed ? "justify-center px-0 transition-all duration-500" : "gap-4")}>
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-1 shadow-2xl shadow-white/10 border border-white/20 shrink-0 overflow-hidden">
              <img src={logo} alt="CreatorIQ" className="w-full h-full object-contain scale-125" />
            </div>
            {!isSidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-sora font-extrabold text-2xl tracking-tighter whitespace-nowrap"
              >
                Creator<span className="text-neutral-500">IQ</span>
              </motion.span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center rounded-2xl transition-all duration-300 group relative mx-2",
                isSidebarCollapsed ? "justify-center p-3" : "gap-3 p-3.5",
                isActive
                  ? "bg-white/10 text-white shadow-xl border border-white/10 backdrop-blur-md"
                  : "text-neutral-500 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-all duration-300",
                    isActive ? "text-brand-400 scale-110" : "group-hover:text-neutral-300 group-hover:scale-110"
                  )} />
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[13px] font-bold tracking-tight whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                  {isSidebarCollapsed && (
                    <div className="absolute left-16 bg-neutral-900 border border-white/10 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl translate-x-4 group-hover:translate-x-0 z-50 whitespace-nowrap">
                      {item.name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}

          <div className="pt-4 mt-4 border-t border-white/5 mx-2">
            <NavLink
              to="/app/settings"
              className={({ isActive }) => cn(
                "flex items-center rounded-2xl transition-all duration-300 group relative",
                isSidebarCollapsed ? "justify-center p-3" : "gap-3 p-3.5",
                isActive ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <Settings className={cn("w-5 h-5 transition-all duration-300")} />
              {!isSidebarCollapsed && (
                <span className="text-[13px] font-bold tracking-tight">Settings</span>
              )}
            </NavLink>
          </div>
        </nav>

        <div className="p-4 relative z-10 border-t border-white/5 bg-neutral-950/50 backdrop-blur-xl">
          <div className={cn("flex items-center justify-between gap-2", isSidebarCollapsed && "flex-col justify-center")}>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-3 w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-neutral-500 hover:text-white hover:bg-brand-600 transition-all border border-white/5 shadow-inner"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <button
              onClick={() => useAuthStore.getState().logout()}
              className={cn(
                "flex items-center justify-center rounded-xl transition-all group",
                isSidebarCollapsed
                  ? "p-3 w-10 h-10 text-neutral-500 hover:bg-red-500/10 hover:text-red-400 border border-white/5"
                  : "flex-1 gap-2 px-4 py-3 text-neutral-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20"
              )}
            >
              <LogOut className="w-4 h-4" />
              {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.div
        animate={{
          paddingLeft: isSidebarCollapsed ? 80 : 288,
          transition: { type: 'spring', stiffness: 300, damping: 30 }
        }}
        className="flex-1 transition-all duration-700 relative"
      >
        {/* Top Bar - Clean Glass */}
        <motion.header
          animate={{
            left: isSidebarCollapsed ? 80 : 288,
            transition: { type: 'spring', stiffness: 300, damping: 30 }
          }}
          className="h-20 fixed top-0 right-0 z-40 flex items-center px-8 justify-between bg-white/80 backdrop-blur-md border-b border-neutral-100"
        >
          <div className="flex items-center gap-8 flex-1 max-w-2xl">
            <div className="relative flex-1 group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-brand-600 transition-colors" />
              <input
                type="text"
                placeholder="Search videos, trends or creators..."
                className="w-full bg-neutral-100/50 border border-neutral-200 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600/20 transition-all placeholder:text-neutral-400"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-400 bg-white px-1.5 py-0.5 rounded border border-neutral-200 pointer-events-none">
                ⌘K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 p-1 bg-neutral-50 rounded-xl border border-neutral-100">
              <button className="p-2 text-neutral-500 hover:text-brand-600 rounded-lg hover:bg-white transition-all relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-600 rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2 text-neutral-500 hover:text-brand-600 rounded-lg hover:bg-white transition-all">
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="h-8 w-px bg-neutral-200 mx-2"></div>

            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="text-right hidden xl:block">
                <p className="text-sm font-bold text-neutral-900 leading-none">{user?.full_name ?? 'Account'}</p>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
                  {(user?.plan_tier ?? 'free').toString()} · {user?.email ?? ''}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center border-2 border-white shadow-lg transition-all group-hover:scale-105 overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Page Content handles its own scrolling */}
        <main className="pt-20 h-screen overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto p-8">
            <Outlet />
          </div>

          {/* Subtle Page Footer Decor */}
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-600/5 blur-[100px] rounded-full -mr-48 -mb-48 pointer-events-none" />
        </main>
      </motion.div>
    </div>
  );
};
