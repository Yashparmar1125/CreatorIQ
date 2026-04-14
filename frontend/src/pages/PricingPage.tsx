import React from 'react';
import { motion } from 'framer-motion';
import { Check, Info, ArrowRight, Zap, Target, Shield, Users } from 'lucide-react';
import { Link } from 'react-router';
import { PublicLayout } from '../components/organisms/PublicLayout';

export const PricingPage: React.FC = () => {
  const plans = [
    {
      name: "Starter",
      price: "0",
      description: "Perfect for new creators identifying their niche.",
      features: [
        "Basic Channel Analytics",
        "3 AI Topic Suggestions / Week",
        "Last 30 Days Retention Data",
        "Public Trends Access"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Pro",
      price: "49",
      description: "For serious creators scaling their audience.",
      features: [
        "Everything in Starter",
        "Unlimited AI Topic Discovery",
        "Retention Heatmaps & Hook AI",
        "Predictive Performance Tools",
        "Community Discord Access"
      ],
      cta: "Go Pro Now",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Tailored solutions for media houses and teams.",
      features: [
        "Multi-Channel Management",
        "API Access & Custom Reports",
        "Priority AI Processing",
        "Dedicated Growth Strategist",
        "SSO & Team Permissions"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <PublicLayout>
      <section className="pt-48 pb-24 px-6 text-center space-y-12">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-6"
        >
          <h1 className="text-5xl md:text-8xl font-black font-sora tracking-tighter leading-tight">
             Simple, Transparent <br />
             <span className="text-neutral-400">Pricing.</span>
          </h1>
          <p className="text-xl text-neutral-500 font-medium max-w-2xl mx-auto leading-relaxed italic opacity-80">
            Choose the plan that fits your current stage. Upgrade as you grow. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-8 pt-10">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-10 rounded-[40px] border w-full max-w-xs flex flex-col justify-between text-left transition-all group ${
                plan.popular 
                  ? 'bg-neutral-900 text-white border-neutral-800 shadow-2xl scale-105 z-10' 
                  : 'bg-white text-neutral-900 border-neutral-100 hover:border-neutral-200 hover:shadow-xl'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-brand-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-600/30">
                  Most Popular
                </div>
              )}
              
              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className={`text-xl font-bold uppercase tracking-[0.2em] ${plan.popular ? 'text-brand-400' : 'text-neutral-400'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black font-sora">${plan.price}</span>
                    {plan.price !== "Custom" && (
                      <span className={`text-sm font-bold opacity-60 ${plan.popular ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        /mo
                      </span>
                    )}
                  </div>
                </div>
                
                <p className={`text-sm font-medium leading-relaxed opacity-80 ${plan.popular ? 'text-neutral-400' : 'text-neutral-500'}`}>
                   {plan.description}
                </p>

                <ul className="space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm font-bold tracking-tight">
                      <Check className={`w-4 h-4 ${plan.popular ? 'text-brand-600' : 'text-success-600'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-12">
                 <Link
                   to="/signup"
                   className={`w-full py-4.5 rounded-2xl font-black text-sm tracking-widest uppercase text-center block transition-all hover:scale-[1.02] active:scale-95 ${
                     plan.popular
                       ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/30'
                       : 'bg-neutral-900 text-white'
                   }`}
                 >
                   {plan.cta}
                 </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Mini-Section */}
      <section className="py-32 px-6 max-w-5xl mx-auto">
        <div className="text-center space-y-12">
           <h2 className="text-3xl md:text-5xl font-black font-sora tracking-tighter">Everything you need <br /><span className="text-neutral-400 text-3xl">to scale your channel.</span></h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: <Zap className="w-5 h-5" />, title: "Instant Access", color: 'text-brand-600' },
                { icon: <Target className="w-5 h-5" />, title: "Goal Tracking", color: 'text-accent-600' },
                { icon: <Shield className="w-5 h-5" />, title: "Safe & Secure", color: 'text-success-600' },
                { icon: <Users className="w-5 h-5" />, title: "Global Network", color: 'text-brand-400' },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-[32px] border border-neutral-100 hover:bg-neutral-50 transition-colors flex flex-col items-center gap-4 text-center">
                   <div className={`${item.color} w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-neutral-100 shadow-sm`}>
                      {item.icon}
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-neutral-900">{item.title}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* FAQ Link or Mini-Section */}
      <section className="py-32 px-6 bg-neutral-50/50">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
             <h2 className="text-3xl font-black font-sora tracking-tight">Common Questions</h2>
             <p className="text-neutral-500 font-medium">Everything you need to know about the product and pricing.</p>
          </div>
          <div className="space-y-6">
             {[
               { q: "Can I cancel my subscription any time?", a: "Absolutely. You can cancel your subscription from your account dashboard at any point. You'll keep your access until the end of the billing cycle." },
               { q: "Is there a free trial for the Pro plan?", a: "Yes, we offer a 14-day free trial of the Pro plan for all new users so you can test the AI tools yourself." },
               { q: "Do you offer discounts for educational creators?", a: "We love educators! Contact our support team with proof of your educational affiliation for a special discount." }
             ].map((faq, i) => (
               <div key={i} className="p-8 rounded-3xl bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <h4 className="text-sm font-black text-neutral-900 mb-3 flex items-center justify-between">
                    {faq.q}
                    <Info className="w-4 h-4 text-neutral-300" />
                  </h4>
                  <p className="text-sm text-neutral-500 font-medium leading-relaxed opacity-80">{faq.a}</p>
               </div>
             ))}
          </div>
          <div className="text-center pt-8">
             <p className="text-sm text-neutral-400 font-bold">Still have questions? <Link to="/contact" className="text-brand-600 underline">Contact our support team.</Link></p>
          </div>
        </div>
      </section>

      {/* CTA Branding Reveal */}
      <section className="py-40 relative px-6">
        <div className="max-w-5xl mx-auto p-12 md:p-24 bg-neutral-900 rounded-[56px] text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-brand-600/10 blur-[150px] translate-y-1/2" />
            <h2 className="text-4xl md:text-6xl font-black font-sora tracking-tighter leading-tight mb-8">Start your journey <br />into <span className="text-neutral-400 italic">intelligence.</span></h2>
            <Link to="/signup" className="inline-flex items-center gap-3 px-10 py-5 bg-brand-600 text-white rounded-full font-black text-lg hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-brand-600/30 group">
              Get Started for Free <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
        </div>
      </section>
    </PublicLayout>
  );
};
