import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Play,
  Globe,
  Zap
} from 'lucide-react';
import { useAnalyticsStore } from '../../../stores/useAnalyticsStore';

export const AnalyticsPage: React.FC = () => {
  const { retentionData, trafficSources, audienceDemographics, loading } = useAnalyticsStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-6 h-6 text-brand-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 rounded-lg border border-brand-100">
            <BarChart3 className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Analytics</span>
          </div>
          <h1 className="text-3xl font-bold font-sora tracking-tight text-neutral-900">
            Analytics <span className="text-brand-600">Overview</span>
          </h1>
          <p className="text-neutral-500 text-sm font-medium max-w-xl">
            Performance metrics and audience retention across your channel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 bg-white border border-neutral-200 rounded-xl font-bold text-xs shadow-sm hover:bg-neutral-50 transition-all">
            Export
          </button>
          <button className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-neutral-800 transition-all">
            Live View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Retention Chart */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden group">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
               <div className="space-y-0.5">
                 <h3 className="text-xl font-bold font-sora text-neutral-900 tracking-tight">Retention Flow</h3>
                 <p className="text-neutral-400 text-xs font-medium">Video Performance</p>
               </div>
               <div className="flex p-1 bg-neutral-50 rounded-xl border border-neutral-100">
                 <select className="px-4 py-1.5 bg-transparent border-none text-[10px] font-bold uppercase tracking-wider text-neutral-900 focus:ring-0 outline-none cursor-pointer appearance-none">
                   <option>Latest Data</option>
                   <option>High Velocity</option>
                   <option>Baseline</option>
                 </select>
               </div>
             </div>

             <div className="relative h-64 w-full bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.4))]" />
                <div className="absolute inset-x-8 bottom-8 flex items-end justify-between px-6 pointer-events-none h-40">
                   {[40, 70, 45, 90, 65, 80, 55, 100, 75, 40].map((h, i) => (
                     <div key={i} className="w-1.5 bg-brand-600/10 rounded-t-lg transition-all duration-1000 group-hover:bg-brand-600/30" style={{ height: `${h}%` }} />
                   ))}
                </div>
                <div className="relative z-10 flex flex-col items-center gap-3">
                   <Play className="w-10 h-10 text-brand-600/40" />
                   <div className="px-3 py-1 bg-neutral-900/5 rounded-full">
                      <p className="text-neutral-400 font-bold tracking-widest uppercase text-[9px]">Live Stream Active</p>
                   </div>
                </div>
             </div>

             <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 bg-brand-50/50 rounded-2xl border border-brand-100/50 hover:bg-brand-50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] uppercase font-bold text-brand-600 tracking-wider">Intro Hook</p>
                    <ArrowUpRight className="w-4 h-4 text-success-600" />
                  </div>
                  <p className="text-3xl font-bold text-neutral-900 font-sora tabular-nums tracking-tight">{retentionData?.intro}%</p>
                  <p className="text-[10px] font-medium text-neutral-400 mt-2">Retention at 0:30</p>
                </div>

                <div className="p-6 bg-success-50/50 rounded-2xl border border-success-100/50 hover:bg-success-50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] uppercase font-bold text-success-700 tracking-wider">Engagement</p>
                    <TrendingUp className="w-4 h-4 text-success-600" />
                  </div>
                  <p className="text-3xl font-bold text-neutral-900 font-sora tabular-nums tracking-tight">{retentionData?.value}%</p>
                  <p className="text-[10px] font-medium text-neutral-400 mt-2">Average View Duration</p>
                </div>

                <div className="p-6 bg-neutral-900 rounded-2xl shadow-lg relative overflow-hidden">
                   <div className="relative z-10">
                     <div className="flex items-center justify-between mb-4">
                       <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Outro</p>
                       <ArrowDownRight className="w-4 h-4 text-brand-400" />
                     </div>
                     <p className="text-3xl font-bold text-white font-sora tabular-nums tracking-tight">{retentionData?.outro}%</p>
                     <p className="text-[10px] font-medium text-neutral-500 mt-2">CTR point</p>
                   </div>
                </div>
             </div>
           </div>
        </div>

        {/* Traffic Sources & Demographics */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
            <h4 className="text-lg font-bold font-sora text-neutral-900 tracking-tight mb-8 flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-600" />
              Traffic Sources
            </h4>
            <div className="space-y-6">
              {trafficSources.map((source: any, i: number) => (
                <div key={i} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-neutral-700">{source.source}</span>
                    <span className="text-[10px] font-bold text-neutral-400">{source.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${source.value}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-neutral-900 group-hover:bg-brand-600 transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm">
            <h4 className="text-lg font-bold font-sora text-neutral-900 tracking-tight mb-8 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              Audience
            </h4>
            <div className="space-y-6">
               <div className="flex flex-wrap gap-2">
                  {audienceDemographics.ageGroups.map((group: any, i: number) => (
                    <div key={i} className="px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-100 flex-1 min-w-[80px]">
                       <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{group.group}</p>
                       <p className="text-lg font-bold text-neutral-900 font-sora">{group.percentage}%</p>
                    </div>
                  ))}
               </div>
               <div className="pt-4 space-y-3 border-t border-neutral-50">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Top Locations</p>
                  {audienceDemographics.locations.map((loc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                       <span className="text-xs font-medium text-neutral-600">{loc.country}</span>
                       <span className="text-xs font-bold text-neutral-900">{loc.percentage}%</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
