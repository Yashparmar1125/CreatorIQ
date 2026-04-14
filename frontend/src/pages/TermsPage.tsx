import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Target, Heart, AlertTriangle } from 'lucide-react';
import { PublicLayout } from '../components/organisms/PublicLayout';

export const TermsPage: React.FC = () => {
  const sections = [
    {
      icon: <UserCheck className="w-5 h-5 text-brand-600" />,
      title: "User Obligations",
      content: "You agree to provide accurate, current, and complete information during the registration process. You are responsible for maintaining the security of your password and for all activities that occur under your account."
    },
    {
      icon: <Target className="w-5 h-5 text-brand-600" />,
      title: "Acceptable Use",
      content: "CreatorIQ is a tool for professional content strategy. You agree not to use the service for any unlawful purposes, including but not limited to spamming, scraping public data in violation of terms, or attempting to compromise the security of the platform."
    },
    {
      icon: <Heart className="w-5 h-5 text-brand-600" />,
      title: "Intellectual Property",
      content: "CreatorIQ owns all rights, title, and interest in and to the Service, including all intellectual property rights. You retain ownership of your content, but grant us a license to process it strictly for providing the Service to you."
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-brand-600" />,
      title: "Termination",
      content: "We reserve the right to suspend or terminate your access to the Service at our sole discretion, without notice, if we believe you have violated these Terms. You may delete your account at any time via the User Settings."
    }
  ];

  return (
    <PublicLayout>
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-16 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-16"
        >
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Platform <span className="text-neutral-400">Rules.</span>
            </h1>
            <p className="text-neutral-500 text-base md:text-lg leading-relaxed font-bold opacity-80 max-w-xl">
              Last updated: April 3, 2026. By using CreatorIQ, you agree to these terms. They exist to ensure a professional and safe environment for all creators.
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
                <p className="text-neutral-500 leading-relaxed font-medium text-sm opacity-80">
                  {section.content}
                </p>
              </motion.section>
            ))}
          </div>

          <div className="pt-12">
             <p className="text-sm text-neutral-400 leading-relaxed text-center font-bold italic">
                By clicking "I Agree" or by entering our platform, you acknowledge that you have read and understood these Terms of Service.
             </p>
          </div>
        </motion.div>
      </main>
    </PublicLayout>
  );
};
