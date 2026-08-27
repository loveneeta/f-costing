import React from 'react';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-neutral-100 font-sans text-neutral-900 selection:bg-blue-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col justify-between">
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
};
