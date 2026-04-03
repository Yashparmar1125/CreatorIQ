import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, ArrowRight, Sparkles, TrendingUp, Cpu, Activity, Layers } from 'lucide-react';
import { Link } from 'react-router';
import { useAuthStore } from '../stores/useAuthStore';
import { PublicLayout } from '../components/organisms/PublicLayout';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      title: 'Viral Topic Finder',
      icon: <Cpu className="w-5 h-5 text-brand-400" />,
      desc: 'Spot viral trends before they go mainstream and get ahead of the curve.',
      stat: '94% Accuracy',
      color: 'bg-brand-600'
    },
    {
      title: 'Audience Insights',
      icon: <Activity className="w-5 h-5 text-accent-400" />,
      desc: 'See exactly where your viewers stop watching and how to keep them engaged.',
      stat: '12.4x Growth',
      color: 'bg-neutral-900'
    },
    {
      title: 'Content Planner',
      icon: <Layers className="w-5 h-5 text-success-400" />,
      desc: 'Plan your upload schedule based on real performance data that works.',
      stat: 'Zero Friction',
      color: 'bg-success-600'
    }
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="pt-48 pb-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-12 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 fill-brand-600" />
              <span className="text-[10px] font-bold text-brand-800 uppercase tracking-widest">Now in Public Access: Creator v2.0</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-5xl md:text-7xl font-black font-sora text-neutral-900 leading-[1.1] tracking-[-0.04em] py-2"
            >
              Grow Your <br />
              <span className="text-neutral-400">Channel</span> with AI.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-neutral-500 font-medium leading-relaxed max-w-xl mx-auto"
            >
              The all-in-one platform for YouTube creators to find viral topics and keep viewers watching longer.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center gap-4 pt-6"
            >
              <Link
                to={isAuthenticated ? "/app/dashboard" : "/signup"}
                className="px-8 py-4.5 bg-neutral-900 text-white rounded-2xl font-bold text-base shadow-xl shadow-neutral-900/20 hover:bg-brand-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group active:scale-98"
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Growing Free"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4.5 bg-white text-neutral-900 border border-neutral-200 rounded-2xl font-bold text-base hover:bg-neutral-50 flex items-center justify-center gap-3 transition-all">
                <PlayCircle className="w-5 h-5 text-brand-600" />
                View Demo
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-20 relative group"
          >
            <div className="glass p-3 rounded-[40px] border border-white/60 shadow-xl relative overflow-hidden group-hover:scale-[1.005] transition-transform duration-1000">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2426&auto=format&fit=crop"
                className="rounded-[50px] w-full h-[700px] object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-1000"
                alt="CreatorIQ Intelligence UI"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60" />

              <div className="absolute top-1/4 right-12 glass p-8 rounded-[40px] border border-white border shadow-2xl animate-float max-w-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-500 text-white flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-black text-neutral-900">Trend Alert</p>
                </div>
                <p className="text-neutral-500 font-bold leading-relaxed text-xs">
                  "AI comparison" topics are peaking. Predicted viral window: Next 48 hours.
                </p>
              </div>

              <div className="absolute bottom-1/4 left-12 glass p-8 rounded-[40px] border border-white border shadow-2xl animate-float delay-1000 max-w-xs space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest text-[10px]">Predicted CTR</p>
                  <p className="text-5xl font-black text-brand-600 font-sora leading-none tracking-tighter">14.2%</p>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-600 w-[14.2%] rounded-full" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="py-40 px-6 max-w-7xl mx-auto space-y-32">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black font-sora tracking-tighter leading-tight">Beyond human intuition.</h2>
          <p className="text-xl text-neutral-500 font-medium">We analyzed 1.2 billion metrics to build the definitive tool for the modern creator economy.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8 }}
              className={`${f.color} p-8 rounded-3xl text-white flex flex-col justify-between min-h-[400px] shadow-xl shadow-neutral-900/5 relative overflow-hidden group`}
            >
              <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[80px] group-hover:bg-white/10 transition-colors" />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-10 border border-white/10 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-4xl font-black font-sora leading-tight tracking-tighter mb-6">{f.title}</h3>
                <p className="text-white/60 text-lg leading-relaxed font-medium">{f.desc}</p>
              </div>

              <div className="relative z-10 pt-12">
                <p className="text-[10px] uppercase font-black tracking-[0.3em] mb-4 opacity-50">Metric benchmark</p>
                <p className="text-5xl font-black font-sora text-white">{f.stat}</p>
                <ArrowRight className="w-8 h-8 mt-10 text-white group-hover:translate-x-4 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Branding Reveal */}
      <section className="py-40 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-neutral-900 rounded-[56px] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-xl shadow-brand-600/5">
            <div className="absolute inset-0 bg-brand-600/10 blur-[150px] translate-y-1/2" />
            <div className="relative z-10 space-y-10">
              <h2 className="text-4xl md:text-6xl font-black font-sora tracking-tighter leading-tight">Start Growing <br /><span className="text-neutral-500">Today.</span></h2>
              <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto font-medium">Stop guessing. Start growing. The next generation of YouTube tools is here.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-10">
                <Link to="/onboarding" className="px-12 py-7 bg-brand-600 text-white rounded-[32px] font-black text-xl hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-brand-600/30">
                  Get Early Access
                </Link>
                <button className="px-12 py-7 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-[32px] font-black text-xl hover:bg-white/10 transition-all">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
