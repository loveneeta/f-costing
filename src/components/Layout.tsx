import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-neutral-100 font-sans text-neutral-900 selection:bg-blue-100 overflow-hidden min-w-0">
      {/* Desktop Docked Sidebar (>= 768px ONLY - Hidden on Mobile) */}
      <aside className="hidden md:flex md:w-64 flex-shrink-0 h-screen z-30 border-r border-neutral-800">
        <Sidebar />
      </aside>

      {/* Main Content Area (Header + Scrollable Page + Footer + Mobile Bottom Clearance) */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto overflow-x-hidden bg-neutral-100 relative">
        <Header />
        
        <main className="flex-1 min-w-0 flex flex-col justify-between w-full pb-20 sm:pb-22 md:pb-0">
          <div className="flex-1 min-w-0 w-full">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation (< 768px ONLY - Hidden on Desktop) */}
      <BottomNav />
    </div>
  );
};
