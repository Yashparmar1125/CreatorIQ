import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, ArrowRight, Sparkles, Globe, Shield, Cpu, Activity, Layers, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { useAuthStore } from '../stores/useAuthStore';
import logo from '../assets/logo.png';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      title: 'Trend Analysis Engine',
      icon: <Cpu className="w-6 h-6 text-brand-400" />,
      desc: 'Recursive monitoring of 50M+ data points to catch peaks before they break.',
      stat: '94% Accuracy',
      color: 'bg-brand-600'
    },
    {
      title: 'Retention Analysis',
      icon: <Activity className="w-6 h-6 text-accent-400" />,
      desc: 'Heatmap projections that tell you exactly when viewers click away.',
      stat: '12.4x Growth',
      color: 'bg-neutral-900'
    },
    {
      title: 'Strategic Planning',
      icon: <Layers className="w-6 h-6 text-success-400" />,
      desc: 'Production pipelines optimized for the YouTube algorithm cadence.',
      stat: 'Zero Friction',
      color: 'bg-success-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-brand-600/10 overflow-x-hidden">
      {/* Decorative Body Mesh - Handled by index.css but reinforced here for branding */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/5 blur-[120px] rounded-full animate-breathe" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-500/5 blur-[150px] rounded-full animate-breathe delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
        <div className="glass px-8 py-5 rounded-[32px] border border-white/40 flex items-center justify-between shadow-2xl shadow-neutral-900/5">
          <div className="flex items-center gap-3 group cursor-pointer">
            <img src={logo} className="h-14 w-auto object-contain" alt="CreatorIQ" />
          </div>

          <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400">
            <a href="#" className="hover:text-neutral-900 transition-colors">Product</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Network</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Insights</a>
            <a href="#" className="hover:text-neutral-900 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="text-xs font-black uppercase tracking-widest text-neutral-900 hover:text-brand-600 transition-colors hidden sm:block px-4">
                  Access
                </Link>
                <Link to="/signup" className="px-8 py-4 bg-neutral-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-600 hover:scale-[1.05] transition-all shadow-2xl shadow-neutral-900/20 active:scale-95">
                  Get Started
                </Link>
              </>
            ) : (
              <Link to="/app/dashboard" className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-500 hover:scale-[1.05] transition-all shadow-2xl shadow-brand-600/20 active:scale-95">
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-64 pb-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-12 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-brand-50 border border-brand-100 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-brand-600 fill-brand-600" />
              <span className="text-[10px] font-black text-brand-800 uppercase tracking-widest">Now in Public Access: V2.0 Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="text-7xl md:text-[110px] font-black font-sora text-neutral-900 leading-[0.85] tracking-[-0.06em] py-4"
            >
              Master the <br />
              <span className="text-neutral-300">Retention</span> Era.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-neutral-500 font-medium leading-relaxed max-w-2xl mx-auto"
            >
              Scientific YouTube growth for professional creators. Turn fragmented data into 100% predictable viral blueprints.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center gap-6 pt-8"
            >
              <Link 
                to={isAuthenticated ? "/app/dashboard" : "/signup"} 
                className="px-12 py-7 bg-neutral-900 text-white rounded-[32px] font-black text-lg shadow-2xl shadow-neutral-900/40 hover:bg-brand-600 hover:scale-[1.05] transition-all flex items-center justify-center gap-4 group active:scale-95"
              >
                {isAuthenticated ? "Go to Dashboard" : "Optimize My Channel"}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-12 py-7 bg-white text-neutral-900 border border-neutral-200 rounded-[32px] font-black text-lg hover:bg-neutral-50 flex items-center justify-center gap-4 transition-all">
                <PlayCircle className="w-6 h-6 text-brand-600" />
                View Features
              </button>
            </motion.div>
          </div>

          {/* Interactive Showcase Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-32 relative group"
          >
            <div className="absolute inset-0 bg-brand-600/5 blur-[120px] rounded-full -z-10 animate-breathe" />
            <div className="glass p-4 rounded-[64px] border border-white/60 shadow-2xl relative overflow-hidden group-hover:scale-[1.01] transition-transform duration-1000">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2426&auto=format&fit=crop"
                className="rounded-[50px] w-full h-[700px] object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-1000"
                alt="CreatorIQ Intelligence UI"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60" />

              {/* Contextual Floating UI */}
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
              whileHover={{ y: -10 }}
              className={`${f.color} p-12 rounded-[56px] text-white flex flex-col justify-between min-h-[500px] shadow-2xl shadow-neutral-900/10 relative overflow-hidden group`}
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
          <div className="bg-neutral-900 rounded-[72px] p-16 md:p-32 text-center text-white relative overflow-hidden shadow-2xl shadow-brand-600/10">
            <div className="absolute inset-0 bg-brand-600/10 blur-[150px] translate-y-1/2" />
            <div className="relative z-10 space-y-12">
              <h2 className="text-5xl md:text-8xl font-black font-sora tracking-tighter leading-[0.85]">Join the <br /><span className="text-neutral-500">Top Creators.</span></h2>
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

      {/* Footer */}
      <footer className="py-24 border-t border-neutral-100 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="space-y-8 col-span-1 md:col-span-2">
            <div className="flex items-center gap-3">
              <img src={logo} className="h-6 w-auto object-contain brightness-0" alt="CreatorIQ" />
            </div>
            <p className="text-neutral-400 font-medium max-w-xs">Building the platform for the next decade of content creation.</p>
            <div className="flex gap-6">
              <div className="w-10 h-10 rounded-full border border-neutral-100 flex items-center justify-center">
                <Globe className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="w-10 h-10 rounded-full border border-neutral-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-neutral-400" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-900">Ecosystem</h4>
            <ul className="space-y-4 text-sm font-bold text-neutral-400">
              <li><a href="#" className="hover:text-brand-600 transition-colors">Insights Hub</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Strategic Planning</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Advanced Analytics</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-900">Company</h4>
            <ul className="space-y-4 text-sm font-bold text-neutral-400">
              <li><a href="#" className="hover:text-brand-600 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Documentation</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-12 border-t border-neutral-50 flex justify-between items-center text-[10px] font-black text-neutral-300 uppercase tracking-widest">
          <span>© 2026 CreatorIQ Studio. Built for growth.</span>
          <span>Terms & Privacy • 1.0.4-stable</span>
        </div>
      </footer>
    </div>
  );
};
