import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, BarChart3, Globe, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';
import { PublicLayout } from '../components/organisms/PublicLayout';

export const InsightsPage: React.FC = () => {
  const caseStudies = [
    {
       category: "Case Study",
       title: "How CreatorIQ helped a tech channel grow 400% in 3 months.",
       description: "Using AI Topic Discovery, we identified a niche within the 'Coding' trend that had low competition and high search volume.",
       icon: <TrendingUp className="w-5 h-5 text-brand-600" />,
       image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2426&auto=format&fit=crop"
    },
    {
       category: "Market Report",
       title: "The State of YouTube Retention in 2026",
       description: "An analysis of 1.2 billion metrics shows that the first 5 seconds are now 40% more critical than they were in 2024.",
       icon: <BarChart3 className="w-5 h-5 text-accent-600" />,
       image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
    },
    {
       category: "Success Story",
       title: "Crossing the 1 Million Mark with Retention AI",
       description: "How a gaming creator used frame-by-frame heatmaps to fix their mid-roll drop-off and explode their revenue.",
       icon: <Globe className="w-5 h-5 text-success-600" />,
       image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2426&auto=format&fit=crop"
    }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="pt-48 pb-24 px-6 relative">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600 fill-brand-600" />
            <span className="text-[10px] font-bold text-brand-800 uppercase tracking-widest">The Creator Intelligence Hub</span>
          </motion.div>
          <h1 className="text-5xl md:text-8xl font-black font-sora tracking-tighter leading-tight">
             Data that <br />
             <span className="text-neutral-400 text-5xl md:text-7xl underline underline-offset-8">Drives Decisions.</span>
          </h1>
          <p className="text-xl text-neutral-500 font-medium max-w-2xl mx-auto leading-relaxed italic opacity-80 pt-4">
             Explore deep-dive research, case studies, and market trends built on 1.2 billion creator metrics.
          </p>
        </div>
      </section>

      {/* Featured Insights Feed */}
      <section className="py-32 px-6 max-w-7xl mx-auto space-y-32">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {caseStudies.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer space-y-6"
              >
                <div className="aspect-[16/10] rounded-[40px] overflow-hidden border border-neutral-100 relative shadow-md group-hover:shadow-2xl transition-all duration-700">
                   <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" alt={item.title} />
                   <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="absolute top-6 left-6 px-4 py-2 bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                      {item.icon}
                      {item.category}
                   </div>
                </div>
                <div className="space-y-4 px-4">
                   <h3 className="text-2xl font-black font-sora tracking-tight leading-tight group-hover:text-brand-600 transition-colors">{item.title}</h3>
                   <p className="text-sm text-neutral-500 font-medium leading-relaxed opacity-80">{item.description}</p>
                   <div className="pt-4 inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-900 group-hover:gap-6 transition-all">
                      Read full report <ArrowRight className="w-4 h-4 text-brand-600" />
                   </div>
                </div>
              </motion.div>
            ))}
         </div>
      </section>

      {/* Resource Categories Bento */}
      <section className="py-40 px-6 max-w-7xl mx-auto space-y-24">
         <div className="text-center md:text-left space-y-6 max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black font-sora tracking-tighter leading-tight">Master your craft <br /><span className="text-neutral-400">with proven data.</span></h2>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-12 rounded-[56px] bg-neutral-900 text-white space-y-12 relative overflow-hidden group shadow-2xl">
               <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-brand-600/10 blur-[100px] rounded-full group-hover:bg-brand-600/20 transition-colors" />
               <div className="space-y-8 relative z-10">
                  <div className="w-16 h-16 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                     <BookOpen className="w-8 h-8 text-brand-400" />
                  </div>
                  <h3 className="text-4xl font-black font-sora tracking-tight">The Academy</h3>
                  <p className="text-neutral-400 text-lg leading-relaxed font-medium">Step-by-step guides for creators of all levels. From your first 1,000 subscribers to managing a media empire.</p>
                  <button className="flex items-center gap-3 text-sm font-black uppercase tracking-widest hover:gap-6 transition-all">
                     Explore Academy <ArrowRight className="w-5 h-5 text-brand-600" />
                  </button>
               </div>
            </div>

            <div className="p-12 rounded-[56px] bg-white border border-neutral-100 flex flex-col justify-between space-y-12 group hover:shadow-2xl hover:border-white transition-all duration-700">
               <div className="space-y-8">
                  <div className="w-16 h-16 rounded-[24px] bg-brand-50 flex items-center justify-center border border-brand-100 group-hover:bg-brand-600 group-hover:text-white transition-all">
                     <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="text-4xl font-black font-sora tracking-tight">Intelligence Newsletter</h3>
                  <p className="text-neutral-500 text-lg leading-relaxed font-medium">Join 50,000+ creators who get weekly insights on trends, retention hacks, and creator economy news.</p>
               </div>
               
               <div className="flex bg-neutral-100 p-2 rounded-3xl items-center gap-4">
                  <input type="email" placeholder="yash@creatoriq.ai" className="bg-transparent px-6 py-2 outline-none flex-1 font-bold text-sm" />
                  <button className="bg-neutral-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 active:scale-95 transition-all">
                     Join Now
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* Technical Edge Stats Mini-Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto border-t border-neutral-100">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
            {[
              { icon: <Shield className="w-5 h-5 text-brand-600" />, title: "Verified Data", desc: "All research is peer-reviewed by growth experts." },
              { icon: <TrendingUp className="w-5 h-5 text-accent-600" />, title: "Live Updates", desc: "New insights added every 48 hours for market speed." },
              { icon: <Zap className="w-5 h-5 text-success-600" />, title: "Action Focused", desc: "No fluff. Just specific actions you can take today." },
              { icon: <Sparkles className="w-5 h-5 text-brand-400" />, title: "AI Augmented", desc: "Research enhanced by our proprietary neural networks." },
            ].map((stat, i) => (
              <div key={i} className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center border border-neutral-100 shadow-sm mb-4">
                   {stat.icon}
                </div>
                <h4 className="text-sm font-black text-neutral-900 uppercase tracking-widest">{stat.title}</h4>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed opacity-80">{stat.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* CTA Reveal Section */}
      <section className="py-40 px-6">
        <div className="max-w-5xl mx-auto glass p-16 md:p-32 rounded-[64px] text-center text-neutral-900 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-brand-600/5 blur-[120px] rounded-full translate-y-1/2" />
          <h2 className="text-5xl md:text-7xl font-black font-sora tracking-tighter leading-tight relative z-10 mb-10 underline decoration-brand-600/20 underline-offset-8">Evolve your <br />content.</h2>
          <div className="pt-8 relative z-10">
             <button className="px-12 py-7 bg-neutral-900 text-white rounded-[32px] font-black text-xl flex items-center justify-center gap-4 mx-auto group hover:bg-brand-600 transition-all active:scale-95 shadow-xl shadow-neutral-900/10">
                Unlock Intelligent Analytics
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
             </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
