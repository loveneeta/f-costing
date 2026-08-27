import React from 'react';

interface FooterProps {
  className?: string;
  dark?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ className = '', dark = false }) => {
  return (
    <footer
      className={`w-full py-5 px-6 text-center border-t text-xs select-none transition-colors ${
        dark
          ? 'border-slate-800 bg-slate-900/90 text-slate-400'
          : 'border-slate-200/80 bg-slate-50/60 text-slate-400'
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap font-normal">
        <span className="text-slate-500 font-medium">
          © {new Date().getFullYear()} Furniture Costing Pro by Loveneet Arora
        </span>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-700">—</span>
        <span className="text-slate-400 dark:text-slate-500">
          Advanced Manufacturing Costing Engine
        </span>
      </div>
    </footer>
  );
};

