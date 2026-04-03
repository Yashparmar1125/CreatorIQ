import React, { useState } from 'react';
import { useStrategyStore } from '../../../stores/useStrategyStore';
import { Sparkles, Copy, Check, Lightbulb, Target, Layout } from 'lucide-react';

export const StrategyPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const { brief, isLoading, generateBrief } = useStrategyStore();

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="max-w-2xl">
         <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-600/5 text-brand-600 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-4 border border-brand-600/10">
           <Sparkles className="w-3 h-3 fill-current" />
           AI Grounded Strategy
         </div>
         <h2 className="text-3xl font-bold text-neutral-900 tracking-tight font-sora leading-tight">
           Strategy <span className="text-neutral-400">Architect</span>
         </h2>
         <p className="text-neutral-500 text-sm font-medium mt-2">
           Grounded in your channel stats. Our AI maps out your next viral move.
         </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-600 to-accent-500" />
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-1">Target Topic</label>
                <div className="relative group/input">
                  <Lightbulb className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within/input:text-brand-600 transition-colors" />
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. React 19 vs Next.js" 
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white text-sm font-bold focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600/20 transition-all outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pl-1">Primary Goal</label>
                <div className="relative group/select">
                  <Target className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within/select:text-brand-600 transition-colors" />
                  <select className="w-full pl-11 pr-8 py-3 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white text-sm font-bold focus:ring-4 focus:ring-brand-600/5 focus:border-brand-600/20 transition-all outline-none appearance-none">
                    <option>Max Engagement</option>
                    <option>Audience Growth</option>
                    <option>Monetization Focus</option>
                  </select>
                </div>
              </div>
            </div>

            <button 
              onClick={() => topic && generateBrief(topic)}
              disabled={isLoading || !topic}
              className="w-full py-4 bg-neutral-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100" />
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-200" />
                </div>
              ) : (
                "Generate AI Strategy"
              )}
            </button>
          </div>
          
          <div className="bg-neutral-900 rounded-3xl p-8 text-white relative overflow-hidden group border border-white/5 shadow-2xl">
             <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6 border border-white/5">
                   <Sparkles className="w-5 h-5 text-brand-400" />
                </div>
                <h4 className="text-lg font-bold font-sora mb-2 tracking-tight">AI Advantage</h4>
                <p className="text-neutral-400 leading-relaxed font-medium text-xs">
                  This strategy uses <span className="text-white font-bold">OpenRouter GPT-4o</span> grounded in your channel's real niche data.
                </p>
             </div>
             <div className="absolute -right-4 -bottom-4 opacity-10 w-24 h-24 bg-brand-600 blur-3xl rounded-full" />
          </div>
        </div>

        <div className="lg:col-span-8">
          {!brief ? (
            <div className="h-full min-h-[400px] border-2 border-dashed border-neutral-100 rounded-[32px] flex flex-col items-center justify-center text-center p-12 bg-neutral-50/30">
               <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center text-4xl mb-6">
                  🧠
               </div>
               <h3 className="text-xl font-bold text-neutral-900 font-sora tracking-tight">
                 Waiting for input
               </h3>
               <p className="text-neutral-400 font-medium mt-2 max-w-xs text-sm leading-relaxed">
                 Enter a topic to generate a data-backed viral strategy.
               </p>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[40px] border border-neutral-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10">
                  <div className="w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400">
                     <Layout className="w-6 h-6" />
                  </div>
               </div>

               <div className="space-y-12">
                  <section>
                    <div className="mb-10">
                       <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider mb-2">AI Growth Strategy</p>
                       <h4 className="text-3xl font-bold font-sora text-neutral-900 tracking-tight">
                         {brief.topic}
                       </h4>
                       <div className="mt-4 p-4 bg-brand-50 rounded-2xl border border-brand-100 italic text-sm text-brand-900 leading-relaxed font-medium">
                         <Sparkles className="w-4 h-4 inline-block mr-2 text-brand-600" />
                         {brief.strategy_insight}
                       </div>
                    </div>
                  
                    <div className="flex items-center justify-between mb-6 border-b border-neutral-50 pb-4">
                       <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                         Optimized Titles
                       </h5>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {brief.titles.map((t: any, i: number) => (
                        <div key={i} className="group flex items-center justify-between gap-6 p-6 bg-neutral-50 rounded-2xl border border-transparent hover:border-brand-200 hover:bg-white transition-all">
                          <div className="flex-1">
                             <p className="text-base font-bold text-neutral-800 leading-tight">{t.text}</p>
                             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1 block group-hover:text-brand-500 transition-colors">
                                {t.hook_type || 'Custom Hook'}
                             </span>
                          </div>
                          <button 
                            onClick={() => handleCopy(t.text, i)}
                            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-neutral-900 hover:text-white transition-all shadow-sm"
                          >
                            {copied === i ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-neutral-400 group-hover:text-white" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                  
                  <section>
                    <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-6 border-b border-neutral-50 pb-4">
                       Master Script Outline
                    </h5>
                    <div className="grid grid-cols-1 gap-6">
                       <div className="p-6 bg-neutral-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-20">
                             <span className="text-4xl font-bold uppercase tracking-tighter">Hook</span>
                          </div>
                          <h6 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-4">Phase 1: Attention</h6>
                          <p className="text-lg leading-relaxed font-medium text-neutral-100">
                             {brief.script_outline.hook}
                          </p>
                       </div>

                       <div className="p-6 bg-white rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-5">
                             <span className="text-4xl font-bold uppercase tracking-tighter">Mid</span>
                          </div>
                          <h6 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Phase 2: Retention Loop</h6>
                          <p className="text-base leading-relaxed font-bold text-neutral-800">
                             {brief.script_outline.retention_mid}
                          </p>
                       </div>

                       <div className="p-6 bg-brand-600 rounded-3xl text-white shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-20">
                             <span className="text-2xl font-bold uppercase tracking-tighter">Action</span>
                          </div>
                          <h6 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4">Phase 3: Conversion</h6>
                          <p className="text-lg leading-relaxed font-bold">
                             {brief.script_outline.cta}
                          </p>
                       </div>
                    </div>
                  </section>

                  <section>
                     <h5 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-6 border-b border-neutral-50 pb-4">
                        SEO Tags
                     </h5>
                     <div className="flex flex-wrap gap-2">
                        {brief.tags.map((tag: string, i: number) => (
                           <span key={i} className="px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded-lg text-xs font-bold text-neutral-600 hover:bg-white hover:border-brand-200 hover:text-brand-600 transition-all cursor-default">
                              #{tag}
                           </span>
                        ))}
                     </div>
                  </section>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
