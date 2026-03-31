import React, { useEffect } from 'react';
import { useTrendsStore } from '../../../stores/useTrendsStore';
import { TrendingUp, PlayCircle, Zap, Search, Target, Activity, Sparkles } from 'lucide-react';

export const TrendsPage: React.FC = () => {
  const { trends, isLoading, fetchTrends, toggleSaveTrend } = useTrendsStore();

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  if (isLoading && trends.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-72 bg-white/50 rounded-[48px] border border-neutral-100 shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
        <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-600/10 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-600/10">
                <Zap className="w-3 h-3 fill-current" />
                AI Velocity Engine
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-success-600/10 text-success-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-success-600/10 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-success-600" />
                Live Signals
              </div>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-neutral-900 tracking-[-0.04em] font-sora leading-tight">
             Viral <span className="text-neutral-300">Discovery</span>
           </h2>
           <p className="text-neutral-500 font-bold text-lg leading-relaxed mt-4">
             Identify breakout patterns before they saturate. Our neural engine analyzes search intent and competitor velocity in real-time.
           </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="relative group/search">
            <Search className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within/search:text-brand-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Detect breakout niches..." 
              className="pl-16 pr-8 py-5 bg-white glass border border-white/60 rounded-[24px] text-sm font-black focus:outline-none focus:ring-8 focus:ring-brand-600/5 focus:border-brand-600 transition-all w-80 shadow-2xl shadow-neutral-200/20 placeholder:text-neutral-300"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {trends.map((trend, i) => (
          <div key={i} className="glass p-12 rounded-[56px] border border-white/60 premium-shadow-hover group cursor-pointer relative overflow-hidden flex flex-col min-h-[520px]">
             {/* Archetype Badge */}
             <div className="absolute top-0 right-0 p-8">
                <div className={`px-6 py-2 rounded-2xl ${
                  trend.archetype === 'The Greenlight' ? 'bg-success-600/10 text-success-600' :
                  trend.archetype === 'The Viral Spike' ? 'bg-brand-600/10 text-brand-600' :
                  'bg-neutral-900/10 text-neutral-900'
                } text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-current/10 animate-in zoom-in duration-500`}>
                   {trend.archetype}
                </div>
             </div>

             <div className="mb-12 flex-1">
                <div className="flex gap-2 flex-wrap mb-8">
                  {trend.niches.map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 border border-brand-100/50 px-4 py-1.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-4xl font-black font-sora text-neutral-900 leading-tight tracking-tighter group-hover:text-brand-600 transition-colors pr-24">
                  {trend.topic}
                </h3>
                
                {/* Growth Advice Section */}
                <div className="mt-8 p-6 bg-neutral-900 rounded-[32px] text-white relative overflow-hidden group/advice">
                   <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                         <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Growth Strategy</p>
                         <p className="text-sm font-bold leading-relaxed">{trend.growth_tip}</p>
                      </div>
                   </div>
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/advice:rotate-12 transition-transform">
                      <Target className="w-12 h-12" />
                   </div>
                </div>
             </div>

             {/* Metric Intelligence Row */}
             <div className="grid grid-cols-2 gap-8 mb-10 pb-10 border-b border-neutral-100">
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Activity className="w-3 h-3" />
                      Stability Index
                    </p>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden w-full">
                       <div className="h-full bg-success-600 transition-all duration-1000" style={{ width: `${trend.stability_score}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Target className="w-3 h-3" />
                      Saturation
                    </p>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden w-full">
                       <div className="h-full bg-brand-600 transition-all duration-1000" style={{ width: `${trend.saturation_index}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="pl-6 border-l border-neutral-100">
                   <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                     <TrendingUp className="w-3 h-3" />
                     Velocity
                   </p>
                   <p className="text-3xl font-black text-neutral-900 font-sora">
                     {trend.velocity}
                   </p>
                </div>
             </div>

             <div className="flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Est. Reach</p>
                   <p className="text-2xl font-black text-neutral-900 font-mono tracking-tighter">{trend.volume}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSaveTrend(trend.id);
                  }}
                  className={`flex items-center gap-4 px-10 py-5 ${trend.saved ? 'bg-success-600' : 'bg-neutral-900'} text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-neutral-900/10 active:scale-95 group/btn overflow-hidden relative`}
                >
                   <span className="relative z-10">{trend.saved ? 'Blueprint Locked' : 'Map Blueprint'}</span>
                   <PlayCircle className="w-6 h-6 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                   <div className="absolute inset-0 bg-success-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
