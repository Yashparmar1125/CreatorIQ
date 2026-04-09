import React from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

interface ReadyStepProps {
  onEnter: () => void;
}

export const ReadyStep: React.FC<ReadyStepProps> = ({ onEnter }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-8"
    >
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="w-40 h-40 border-[4px] border-dashed border-brand-600/30 rounded-full mx-auto"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
            <div className="relative group">
              <Rocket className="w-10 h-10 text-brand-600 group-hover:scale-110 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="text-4xl font-bold font-sora text-white tracking-tight leading-tight">Setup Complete</h1>
        <p className="text-neutral-500 font-medium max-w-sm mx-auto text-lg leading-relaxed">
          Your account is ready. Explore your personalized dashboard and start growing.
        </p>
      </div>
      <button 
        onClick={onEnter}
        className="px-12 py-5 bg-white text-neutral-900 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-brand-600/10 hover:bg-neutral-100 transition-all active:scale-95 flex items-center gap-3 mx-auto"
      >
        Enter Dashboard
      </button>
    </motion.div>
  );
};
