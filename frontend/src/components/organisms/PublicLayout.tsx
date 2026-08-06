import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="mesh-gradient min-h-screen text-neutral-900">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
};
