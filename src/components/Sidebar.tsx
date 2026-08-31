import React from 'react';
import { Calculator, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getFilteredNavSections } from '../navigationConfig';

export const Sidebar: React.FC = () => {
  const { appUser, logout, hasPermission } = useAuth();
  const { tenant, canAccessFeature } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;
  const isSuperAdmin = appUser?.role === 'super_admin';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navSections = getFilteredNavSections(isSuperAdmin, appUser, hasPermission, canAccessFeature);

  const NavLink = ({ to, icon: Icon, label, exact = true }: { to: string, icon: any, label: string, exact?: boolean }) => {
    const isActive = exact 
      ? currentPath === to 
      : currentPath === to || (to !== '/' && currentPath.startsWith(to));

    return (
      <Link 
        to={to}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
          isActive 
            ? 'bg-neutral-800 text-white shadow-xs' 
            : 'hover:bg-neutral-800/80 hover:text-white text-neutral-300'
        }`}
      >
        <Icon size={18} className="shrink-0" /> 
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mt-5 mb-2 px-4 pt-3 border-t border-neutral-800/50">
      <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{title}</h3>
    </div>
  );

  return (
    <nav className="w-full h-full bg-neutral-900 text-neutral-300 flex flex-col flex-shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-5 bg-neutral-950 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0">
            <Calculator size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-white tracking-tight leading-tight">Costing ERP</span>
            <span className="text-[10px] text-blue-400 font-medium truncate max-w-[140px] leading-tight">
              {isSuperAdmin ? 'Platform Administration' : tenant?.name || 'Loading...'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Navigation Links Scroll Area */}
      <div className="flex-1 py-4 px-3.5 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
        {navSections.map((section, idx) => (
          <React.Fragment key={section.title}>
            {idx === 0 ? (
              <div className="mb-2 px-4 pt-1">
                <h3 className={`text-[10px] font-bold uppercase tracking-widest ${
                  isSuperAdmin ? 'text-blue-400' : 'text-neutral-500'
                }`}>
                  {section.title}
                </h3>
              </div>
            ) : (
              <SectionHeader title={section.title} />
            )}

            {section.items.map((item) => (
              <NavLink 
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                exact={item.exact}
              />
            ))}
          </React.Fragment>
        ))}

        <div className="mt-6 mb-2 px-4 pt-3 border-t border-neutral-800"></div>
        <button 
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium text-red-400 hover:bg-neutral-800 hover:text-red-300 active:scale-[0.99]"
        >
          <LogOut size={18} className="shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
};
