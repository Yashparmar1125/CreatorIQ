import React from 'react';
import { motion } from 'framer-motion';
import { Database, Lock, Globe, ShieldCheck, Trash2 } from 'lucide-react';
import { PublicLayout } from '../components/organisms/PublicLayout';

export const PrivacyPage: React.FC = () => {
  const sections = [
    {
      icon: <Database className="w-5 h-5 text-brand-600" />,
      title: "Data Collection & Access",
      content: "CreatorIQ uses YouTube API Services to access metadata from your connected YouTube channel. This include channel statistics, video metadata, and performance metrics. We only request the minimum permissions (OAuth scopes) necessary to provide our analytics and planning features."
    },
    {
      icon: <Lock className="w-5 h-5 text-brand-600" />,
      title: "How We Use Google Data",
      content: "The data retrieved from Google is used exclusively to power the CreatorIQ dashboard, providing you with AI-driven content optimization, trend analysis, and benchmarking. We do not use this data for advertising or sell it to third-party brokers."
    },
    {
      icon: <Trash2 className="w-5 h-5 text-brand-600" />,
      title: "Data Storage & Retention",
      content: "We store your YouTube metadata securely using industry-standard encryption. We retain this data only for as long as your account is active or as needed to provide you with historical analytics. You can request data deletion at any time via your account settings."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-brand-600" />,
      title: "Revoking Access",
      content: (
        <span>
          You can revoke CreatorIQ's access to your data at any time via the{' '}
          <a 
            href="https://security.google.com/settings/security/permissions" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-brand-600 underline hover:text-brand-700"
          >
            Google Security Settings page
          </a>.
        </span>
      )
    },
    {
      icon: <Globe className="w-5 h-5 text-brand-600" />,
      title: "Third-Party Services",
      content: (
        <span>
          CreatorIQ uses YouTube API Services. By using our platform, you agree to be bound by the{' '}
          <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">YouTube Terms of Service</a>
          {' '}and the{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">Google Privacy Policy</a>.
        </span>
      )
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
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Privacy <span className="text-neutral-400">First.</span>
            </h1>
            <p className="text-neutral-500 text-base md:text-lg leading-relaxed font-bold opacity-80 max-w-xl">
              Last updated: April 5, 2026. Your trust is our most valuable asset. CreatorIQ is committed to protecting your data and being transparent about our practices.
            </p>
          </div>

          <div className="grid gap-6">
            {sections.map((section, i) => (
              <motion.section
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="p-8 rounded-3xl bg-neutral-50/50 border border-neutral-100 hover:bg-white hover:shadow-xl hover:shadow-neutral-900/5 transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-neutral-100 group-hover:bg-brand-600 group-hover:text-white transition-all transform group-hover:scale-105">
                    {section.icon}
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-neutral-900">{section.title}</h2>
                </div>
                <div className="text-neutral-500 leading-relaxed font-medium text-sm opacity-80">
                  {section.content}
                </div>
              </motion.section>
            ))}
          </div>

          <div className="pt-12">
            <p className="text-sm text-neutral-400 leading-relaxed text-center font-bold italic">
              If you have questions about our privacy practices, please contact us at yashparmar11y@gmail.com
            </p>
          </div>
        </motion.div>
      </main>
    </PublicLayout>
  );
};
