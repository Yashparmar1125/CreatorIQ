import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="mesh-gradient min-h-screen bg-[#0a0a0a] text-[#ededed]">
      <Navbar />
      <main className="bg-[#0a0a0a]">{children}</main>
      <Footer />
    </div>
  );
};
