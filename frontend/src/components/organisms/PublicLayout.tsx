import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-brand-600/10 overflow-x-hidden">
      {/* Shared Decorative Body Mesh */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/5 blur-[120px] rounded-full animate-breathe" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-500/5 blur-[150px] rounded-full animate-breathe delay-1000" />
      </div>

      <Navbar />
      
      <div className="relative">
        {children}
      </div>

      <Footer />
    </div>
  );
};
