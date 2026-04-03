import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Database, Lock, Eye, Globe } from 'lucide-react';
import { PublicLayout } from '../components/organisms/PublicLayout';

export const PrivacyPage: React.FC = () => {
  const sections = [
    {
      icon: <Database className="w-5 h-5 text-brand-600" />,
      title: "Data Collection",
      content: "We collect information you provide directly to us when you create an account, connect your YouTube channel, or use our analytics tools. This includes your name, email address, and YouTube channel metadata provided via the Google OAuth 2.0 API."
    },
    {
      icon: <Lock className="w-5 h-5 text-brand-600" />,
      title: "How We Use Data",
      content: "Your data is used to provide AI-driven content optimization, trend analysis, and channel growth strategies. We do not sell your personal information. We use YouTube data only to provide the specific benchmarking and planning features of CreatorIQ."
    },
    {
      icon: <Eye className="w-5 h-5 text-brand-600" />,
      title: "Data Sharing",
      content: "We do not share your private channel data with third parties except as required to provide our service (e.g., secure cloud hosting) or as required by law. All data is processed using industry-standard encryption."
    },
    {
      icon: <Globe className="w-5 h-5 text-brand-600" />,
      title: "YouTube API Services",
      content: "CreatorIQ uses YouTube API Services. By using our platform, you also agree to be bound by the YouTube Terms of Service and the Google Privacy Policy."
    }
  ];

  return (
    <PublicLayout>
      <main className="max-w-3xl mx-auto px-6 pt-48 pb-24 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-16"
        >
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-black tracking-[-0.04em] leading-[0.9]">
              Privacy <span className="text-neutral-300">First.</span>
            </h1>
            <p className="text-neutral-500 text-lg md:text-xl leading-relaxed font-bold opacity-80 max-w-2xl">
              Last updated: April 3, 2026. Your trust is our most valuable asset. We build tools that help you grow, not exploit your data.
            </p>
          </div>

          <div className="grid gap-6">
            {sections.map((section, i) => (
              <motion.section 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="p-10 rounded-[48px] bg-neutral-50/50 border border-neutral-100 hover:bg-white hover:shadow-2xl hover:shadow-neutral-900/5 transition-all group"
              >
                <div className="flex items-center gap-5 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-neutral-100 group-hover:bg-brand-600 group-hover:text-white transition-all transform group-hover:scale-110">
                      {section.icon}
                   </div>
                   <h2 className="text-2xl font-black tracking-tight text-neutral-900">{section.title}</h2>
                </div>
                <p className="text-neutral-500 leading-relaxed font-bold text-base opacity-70">
                  {section.content}
                </p>
              </motion.section>
            ))}
          </div>

          <div className="pt-12">
             <p className="text-sm text-neutral-400 leading-relaxed text-center font-bold italic">
                If you have questions about our privacy practices, please contact us at support@creatoriq.ai
             </p>
          </div>
        </motion.div>
      </main>
    </PublicLayout>
  );
};
