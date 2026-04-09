import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Activity, Layers, Sparkles, ArrowRight, Zap, Shield, Target } from 'lucide-react';
import { Link } from 'react-router';
import { PublicLayout } from '../components/organisms/PublicLayout';

export const ProductPage: React.FC = () => {
  const features = [
    {
      title: "AI Topic Discovery",
      icon: <Cpu className="w-6 h-6 text-brand-600" />,
      description: "Our proprietary neural networks analyze billions of data points across the creator economy to identify breakout trends before they peak. Stay ahead of the curve with zero manual research.",
      benefits: ["Predictive Trend Scoring", "Niche-Specific Alerts", "Competitor Gap Analysis"]
    },
    {
      title: "Retention Intelligence",
      icon: <Activity className="w-6 h-6 text-brand-600" />,
      description: "Understand exactly why your audience leaves. Our AI analyzes frame-by-frame retention data to provide actionable feedback on pacing, hooks, and content structure.",
      benefits: ["Frame-by-Frame Heatmaps", "Hook Effectiveness Score", "AI-Generated Edit Suggestions"]
    },
    {
      title: "Strategic Content Planner",
      icon: <Layers className="w-6 h-6 text-brand-600" />,
      description: "Stop guessing your upload schedule. CreatorIQ suggests the optimal time, format, and topic sequence based on your channel's unique audience behavior.",
      benefits: ["Automated Editorial Calendar", "Multi-Platform Sync", "Performance Forecasting"]
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100 mb-4"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600 fill-brand-600" />
            <span className="text-[10px] font-bold text-brand-800 uppercase tracking-widest">Built for the next decade of creators</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black font-sora tracking-tighter leading-tight"
          >
            The Intelligence <br />
            <span className="text-neutral-400">Layer</span> of YouTube.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-neutral-500 font-medium max-w-2xl mx-auto leading-relaxed"
          >
            CreatorIQ replaces intuition with data. We've built the most advanced AI engine specifically designed to grow channels and maximize viewer retention.
          </motion.p>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-32 px-6 max-w-7xl mx-auto space-y-24">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className={`flex flex-col lg:flex-row items-center gap-20 ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
          >
            <div className="flex-1 space-y-8">
              <div className="w-14 h-14 rounded-2xl bg-brand-600/10 flex items-center justify-center border border-brand-100 shadow-sm">
                {feature.icon}
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black font-sora tracking-tight leading-none text-neutral-900">{feature.title}</h2>
                <p className="text-lg text-neutral-500 font-medium leading-relaxed italic opacity-80">{feature.description}</p>
              </div>
              <ul className="space-y-4">
                {feature.benefits.map((benefit, j) => (
                  <li key={j} className="flex items-center gap-3 text-neutral-900 font-bold text-sm tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="inline-flex items-center gap-2 text-brand-600 font-bold hover:gap-4 transition-all">
                Learn more and deploy <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="flex-1 w-full">
              <div className="glass p-3 rounded-[40px] border border-white/60 shadow-2xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-brand-600/5 group-hover:bg-brand-600/10 transition-colors" />
                <div className="bg-neutral-900 rounded-[32px] h-[450px] flex items-center justify-center overflow-hidden relative">
                   <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,theme(colors.brand.600),transparent)]" />
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Advanced Visualization {i + 1}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Technical Edge Stats */}
      <section className="py-40 px-6 bg-neutral-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-600/5 blur-[150px] -translate-y-1/2" />
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="space-y-4">
             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 mb-6">
               <Zap className="w-6 h-6 text-brand-400" />
             </div>
             <h3 className="text-2xl font-black font-sora">Real-time Pulse</h3>
             <p className="text-neutral-400 font-medium leading-relaxed text-sm">Analyze data as it happens. Our sub-second latency ensures you never miss a trending wave.</p>
          </div>
          <div className="space-y-4">
             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 mb-6">
               <Target className="w-6 h-6 text-accent-400" />
             </div>
             <h3 className="text-2xl font-black font-sora">99.8% Accuracy</h3>
             <p className="text-neutral-400 font-medium leading-relaxed text-sm">Advanced ML models trained on over a petabyte of YouTube metadata for results you can bank on.</p>
          </div>
          <div className="space-y-4">
             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 mb-6">
               <Shield className="w-6 h-6 text-success-400" />
             </div>
             <h3 className="text-2xl font-black font-sora">Privacy First</h3>
             <p className="text-neutral-400 font-medium leading-relaxed text-sm">We never sell your data. Secure OAuth integration means your channel security is always the top priority.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6">
        <div className="max-w-5xl mx-auto glass p-16 md:p-24 rounded-[56px] border border-white/60 text-center space-y-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-brand-600/5 blur-[100px] rounded-full animate-breathe" />
          <h2 className="text-4xl md:text-6xl font-black font-sora tracking-tighter leading-tight relative z-10">
            Ready to <span className="text-neutral-400">evolve?</span>
          </h2>
          <p className="text-xl text-neutral-500 font-medium max-w-xl mx-auto relative z-10">
             Join 20,000+ creators who use CreatorIQ to build sustainable, data-driven careers.
          </p>
          <div className="pt-8 relative z-10">
            <Link to="/signup" className="px-12 py-6 bg-neutral-900 text-white rounded-[32px] font-black text-xl hover:bg-brand-600 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neutral-900/10">
              Start Your Free Trial
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
