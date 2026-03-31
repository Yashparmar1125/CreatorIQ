import React, { useEffect } from 'react';
import { useDashboardStore } from '../../../stores/useDashboardStore';
import { BarChart2, Calendar, ChevronRight, Activity, TrendingUp, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';

export const DashboardPage: React.FC = () => {
  const { stats, insights, isLoading, fetchDashboard } = useDashboardStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (isLoading && stats.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-48 bg-white/50 rounded-[32px] border border-neutral-100 shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-600/5 text-brand-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-brand-600/10">
             <Activity className="w-3 h-3" />
             Channel Status
           </div>
           <h2 className="text-3xl font-bold text-neutral-900 tracking-tight font-sora">
             Hey, <span className="text-neutral-400">{user?.full_name?.split(' ')[0] || 'there'}</span>
           </h2>
           <p className="text-neutral-500 text-sm font-medium">
             Your performance is <span className="text-brand-600 font-bold">14.2% up</span> this week.
           </p>
        </div>
        
        <div className="flex gap-3">
           <button className="px-5 py-2.5 bg-white border border-neutral-200 rounded-xl font-bold text-xs shadow-sm hover:bg-neutral-50 transition-all flex items-center gap-2">
             <Calendar className="w-3.5 h-3.5 text-neutral-400" />
             Report
           </button>
           <button className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-neutral-800 transition-all">
             Strategy
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-bold font-sora text-neutral-900 tracking-tight">{stat.value}</h3>
               </div>
               <div className="p-2.5 rounded-xl bg-neutral-50 text-neutral-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                 {stat.icon}
               </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
               <div className="inline-flex items-center gap-1 text-success-600 text-[10px] font-bold">
                 <TrendingUp className="w-3 h-3" />
                 {stat.trend}
               </div>
               <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(dot => <div key={dot} className={`w-1 h-2 rounded-full ${dot <= 3 ? 'bg-brand-600' : 'bg-neutral-100'}`} />)}
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
           <div className="flex items-center justify-between gap-6 mb-8">
             <div className="space-y-0.5">
               <h3 className="text-xl font-bold font-sora text-neutral-900 tracking-tight">Performance Forecast</h3>
               <p className="text-neutral-400 text-xs font-medium">Estimated growth based on recent performance</p>
             </div>
             <div className="flex p-1 bg-neutral-50 rounded-xl border border-neutral-100">
               {['28d', '90d', 'ALL'].map(tab => (
                 <button key={tab} className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${tab === '28d' ? 'bg-white text-neutral-900 shadow-sm border border-neutral-100' : 'text-neutral-500 hover:text-neutral-900'}`}>
                   {tab}
                 </button>
               ))}
             </div>
           </div>
           
           <div className="relative h-64 w-full bg-neutral-50 rounded-2xl border border-neutral-100 flex flex-col items-center justify-center overflow-hidden">
             <BarChart2 className="w-12 h-12 text-neutral-200" />
             <p className="text-sm font-bold font-sora text-neutral-300 mt-4">Loading Channel Data...</p>
             
             <div className="absolute bottom-8 left-8 right-8 h-20 flex items-end justify-between px-2 pointer-events-none">
                {[40, 70, 45, 90, 65, 80, 55, 100, 75, 40].map((h, i) => (
                  <div key={i} className="w-1 bg-brand-600/10 rounded-full transition-all duration-1000 group-hover:bg-brand-600/30" style={{ height: `${h}%` }} />
                ))}
             </div>
           </div>
        </div>

        <div className="lg:col-span-4 bg-neutral-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden flex flex-col group">
           <div className="relative z-10 flex-1">
             <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-400 border border-white/5">
                 <Sparkles className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="text-lg font-bold font-sora tracking-tight">AI Insights</h3>
                 <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mt-0.5">3 Actions Available</p>
               </div>
             </div>
             
             <div className="space-y-4">
               {insights.map((item, j) => (
                 <div key={j} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer flex flex-col gap-2 group/item">
                   <div className="flex items-center justify-between">
                      <div className="px-2 py-0.5 bg-white/10 rounded-md text-[9px] font-bold text-white uppercase tracking-wider border border-white/5">
                         Priority {j + 1}
                      </div>
                      <ChevronRight className="w-3 h-3 text-neutral-600 group-hover/item:text-white transition-all" />
                   </div>
                   <p className="text-xs font-bold text-neutral-200 leading-snug">{item.title}</p>
                   <div className="flex items-center gap-1.5">
                     <div className="w-1 h-1 rounded-full bg-success-500" />
                     <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">{item.impact}</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
           
           <button className="w-full mt-8 py-3.5 bg-white text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-neutral-100 transition-all shadow-lg">
              View Insights
           </button>
        </div>
      </div>
    </div>
  );
};
