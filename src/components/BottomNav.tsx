import React, { useState, useEffect, useId } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MoreHorizontal, 
  X, 
  LogOut, 
  ChevronRight, 
  User, 
  ShieldCheck, 
  Building 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { getFilteredNavSections, NavItemConfig } from '../navigationConfig';

export const BottomNav: React.FC = () => {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { appUser, logout, hasPermission } = useAuth();
  const { tenant } = useTenant();
  const moreMenuTitleId = useId();

  const isSuperAdmin = appUser?.role === 'super_admin';
  const currentPath = location.pathname;

  // Get all filtered sections based on user role and permissions
  const navSections = getFilteredNavSections(isSuperAdmin, appUser, hasPermission);
  
  // Extract all available items
  const allItems: NavItemConfig[] = navSections.flatMap(section => section.items);

  // Determine primary bottom navigation items (up to 4, leaving slot 5 for "More")
  const primaryItems = allItems.filter(item => item.isPrimaryBottomNav).slice(0, 4);
  
  // Secondary items go into the "More" drawer
  const primaryPaths = new Set(primaryItems.map(item => item.to));
  const moreSections = navSections.map(section => ({
    title: section.title,
    items: section.items.filter(item => !primaryPaths.has(item.to))
  })).filter(section => section.items.length > 0);

  // Check if current route is among the "More" items
  const isMoreRouteActive = allItems
    .filter(item => !primaryPaths.has(item.to))
    .some(item => (item.exact ? currentPath === item.to : currentPath.startsWith(item.to)));

  // Close more sheet on navigation
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && moreOpen) {
        setMoreOpen(false);
      }
    };
    if (moreOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Lock body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [moreOpen]);

  const handleLogout = async () => {
    setMoreOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/98 backdrop-blur-md border-t border-neutral-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] transition-colors select-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch justify-around h-14 sm:h-15 max-w-lg mx-auto px-1">
          {/* Primary Nav Links */}
          {primaryItems.map((item) => {
            const isActive = item.exact 
              ? currentPath === item.to 
              : currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to));
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex-1 flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-0.5 group transition-all duration-150 ${
                  isActive 
                    ? 'text-blue-600 font-semibold' 
                    : 'text-neutral-500 hover:text-neutral-900 active:scale-95'
                }`}
              >
                {/* Active Top Glow/Indicator Bar */}
                {isActive && (
                  <span 
                    aria-hidden="true" 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-0.5 bg-blue-600 rounded-full shadow-[0_1px_3px_rgba(37,99,235,0.4)]" 
                  />
                )}

                {/* Icon Capsule */}
                <div className={`flex items-center justify-center p-1 rounded-xl transition-colors ${
                  isActive ? 'bg-blue-50/80 text-blue-600' : 'text-neutral-500 group-hover:bg-neutral-100'
                }`}>
                  <Icon size={20} className="shrink-0 transition-transform group-hover:scale-105" />
                </div>

                {/* Short Label */}
                <span className={`text-[10px] sm:text-[11px] leading-tight truncate max-w-full text-center tracking-tight mt-0.5 ${
                  isActive ? 'font-bold text-blue-600' : 'font-medium text-neutral-600'
                }`}>
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}

          {/* "More" Trigger Button */}
          <button
            type="button"
            onClick={() => setMoreOpen(prev => !prev)}
            aria-expanded={moreOpen}
            aria-label="Open More Navigation Options"
            className={`relative flex-1 flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-0.5 group transition-all duration-150 ${
              moreOpen || isMoreRouteActive 
                ? 'text-blue-600 font-semibold' 
                : 'text-neutral-500 hover:text-neutral-900 active:scale-95'
            }`}
          >
            {/* Active Top Bar for secondary route or open sheet */}
            {(moreOpen || isMoreRouteActive) && (
              <span 
                aria-hidden="true" 
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-0.5 bg-blue-600 rounded-full shadow-[0_1px_3px_rgba(37,99,235,0.4)]" 
              />
            )}

            <div className={`flex items-center justify-center p-1 rounded-xl transition-colors ${
              moreOpen || isMoreRouteActive ? 'bg-blue-50/80 text-blue-600' : 'text-neutral-500 group-hover:bg-neutral-100'
            }`}>
              <MoreHorizontal size={20} className="shrink-0 transition-transform group-hover:scale-105" />
            </div>

            <span className={`text-[10px] sm:text-[11px] leading-tight truncate max-w-full text-center tracking-tight mt-0.5 ${
              moreOpen || isMoreRouteActive ? 'font-bold text-blue-600' : 'font-medium text-neutral-600'
            }`}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* "More" Bottom Sheet Overlay */}
      {moreOpen && (
        <div 
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* "More" Slide-up Sheet */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={moreMenuTitleId}
        className={`fixed left-0 right-0 z-40 md:hidden bg-white border-t border-neutral-200 rounded-t-2xl shadow-2xl transition-transform duration-250 ease-out flex flex-col ${
          moreOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
          maxHeight: 'calc(80vh - 3.5rem - env(safe-area-inset-bottom, 0px))'
        }}
      >
        {/* Sheet Grab Handle & Header */}
        <div className="flex-shrink-0 pt-3 pb-2.5 px-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              {isSuperAdmin ? <ShieldCheck size={16} /> : <Building size={16} />}
            </div>
            <div className="min-w-0">
              <h2 id={moreMenuTitleId} className="text-sm font-bold text-neutral-900 truncate">
                {isSuperAdmin ? 'Platform Management' : tenant?.name || 'Workspace Menu'}
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium truncate">
                {appUser?.email || 'Authenticated User'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            aria-label="Close more menu"
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sheet Scrollable Links Content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 custom-scrollbar">
          {moreSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-2.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                {section.title}
              </h3>
              <div className="grid grid-cols-1 gap-1">
                {section.items.map((item) => {
                  const isActive = item.exact 
                    ? currentPath === item.to 
                    : currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 font-semibold' 
                          : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 active:bg-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          <Icon size={16} />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight size={16} className={`shrink-0 ${isActive ? 'text-blue-500' : 'text-neutral-300'}`} />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* User Account & Logout Section */}
          <div className="pt-2 border-t border-neutral-100 space-y-2">
            <div className="px-2 flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <User size={13} className="text-neutral-400" />
                Role: <span className="font-semibold text-neutral-700 capitalize">{appUser?.role?.replace('_', ' ') || 'User'}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors min-h-[44px]"
            >
              <LogOut size={16} className="shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
