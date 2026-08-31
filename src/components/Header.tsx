import React from 'react';
import { Calculator, User, Building, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { GlobalSearch } from './GlobalSearch';
import { Project } from '../types';

const ROUTE_TITLES: Record<string, { title: string; subtitle?: string; section?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Costing & Manufacturing Overview', section: 'Workspace' },
  '/projects': { title: 'All Costings', subtitle: 'Saved Costings & Production Quotes', section: 'Workspace' },
  '/templates': { title: 'Item Templates', subtitle: 'Modular Reusable Product Templates', section: 'Workspace' },
  '/rates/wood': { title: 'Wood Rates', subtitle: 'Species & Cubic Foot Benchmark Rates', section: 'Rate Master' },
  '/rates/hardware': { title: 'Hardware Rates', subtitle: 'Fasteners, Hinges & Accessories', section: 'Rate Master' },
  '/rates/veneer': { title: 'Veneer Rates', subtitle: 'Natural Sheets & Edge Strips', section: 'Rate Master' },
  '/rates/ply': { title: 'Ply Sheets', subtitle: 'Plywood Thickness & Sheet Rates', section: 'Rate Master' },
  '/rates/board': { title: 'Board Sheets', subtitle: 'MDF, HDHMR & Particle Boards', section: 'Rate Master' },
  '/rates/other': { title: 'Other Rates', subtitle: 'Edgeband, Labour & Overheads', section: 'Rate Master' },
  '/employees': { title: 'Employees', subtitle: 'Staff Directory & Access Roles', section: 'Company' },
  '/billing': { title: 'Billing & Subscription', subtitle: 'Invoices & Plan Entitlements', section: 'Company' },
  '/profile': { title: 'Profile & Settings', subtitle: 'Company Identity & Dynamic Pricing Rules', section: 'User' },
  '/superadmin/dashboard': { title: 'Platform Dashboard', subtitle: 'Tenants & Infrastructure Overview', section: 'Platform Admin' },
  '/superadmin/subscriptions': { title: 'Subscriptions', subtitle: 'Enterprise Plans & Billing Control', section: 'Platform Admin' },
  '/superadmin/settings': { title: 'Platform Settings', subtitle: 'Global System Configurations', section: 'Platform Admin' },
  '/superadmin/audit': { title: 'Platform Audit', subtitle: 'Security & Activity Logs', section: 'Platform Admin' },
  '/superadmin/developer/features': { title: 'Feature Flags', subtitle: 'Runtime Toggles & Rollouts', section: 'Developer' },
  '/superadmin/developer/modules': { title: 'Developer Modules', subtitle: 'System Architecture & Add-ons', section: 'Developer' },
  '/superadmin/developer/beta': { title: 'Beta Features', subtitle: 'Experimental Previews', section: 'Developer' },
  '/superadmin/developer/testing': { title: 'Test Environment', subtitle: 'Mock Scenarios & Sandbox', section: 'Developer' },
  '/superadmin/developer/diagnostics': { title: 'Diagnostics', subtitle: 'Database & System Health', section: 'Developer' },
  '/superadmin/developer/logs': { title: 'Application Logs', subtitle: 'Event Stream & Traces', section: 'Developer' },
};

interface HeaderProps {
  onEdit?: (p: Project) => void;
}

export const Header: React.FC<HeaderProps> = ({ onEdit }) => {
  const location = useLocation();
  const { appUser } = useAuth();
  const { tenant } = useTenant();
  const currentPath = location.pathname;

  const pageInfo = ROUTE_TITLES[currentPath] || {
    title: currentPath.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' / ') || 'Workspace',
    subtitle: '',
    section: 'ERP'
  };

  const isSuperAdmin = appUser?.role === 'super_admin';

  return (
    <header className="sticky top-0 z-20 w-full bg-white/95 backdrop-blur-sm border-b border-neutral-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex-shrink-0 transition-colors">
      <div className="w-full px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 min-w-0">
        
        {/* Left: Branding & Current Page Title */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
          {/* Mobile compact title */}
          <div className="flex items-center gap-2 min-w-0 md:hidden">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0">
              <Calculator size={16} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-neutral-900 truncate leading-tight">
                {pageInfo.title}
              </h1>
              <p className="text-[10px] text-neutral-500 truncate leading-tight font-medium">
                {isSuperAdmin ? 'Platform Admin' : tenant?.name || 'Costing ERP'}
              </p>
            </div>
          </div>

          {/* Desktop full breadcrumb and page title */}
          <div className="hidden md:flex flex-col min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              <span>{pageInfo.section}</span>
              <span>/</span>
              <span className="text-blue-600 font-bold">{pageInfo.title}</span>
            </div>
            <h1 className="text-lg font-bold text-neutral-900 tracking-tight leading-tight truncate">
              {pageInfo.title}
            </h1>
          </div>

          {!isSuperAdmin && <GlobalSearch onEdit={onEdit} />}
        </div>

        {/* Right: Tenant/User Info & Badges */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Workspace Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-neutral-50 border border-neutral-200/80 rounded-xl text-xs">
            {isSuperAdmin ? (
              <ShieldCheck size={14} className="text-blue-600 shrink-0" />
            ) : (
              <Building size={14} className="text-neutral-500 shrink-0" />
            )}
            <span className="font-semibold text-neutral-800 max-w-[130px] lg:max-w-[200px] truncate">
              {isSuperAdmin ? 'Platform Admin' : tenant?.name || 'Workspace'}
            </span>
          </div>

          {/* User Account Capsule */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white">
              {appUser?.name ? (
                appUser.name.charAt(0).toUpperCase()
              ) : appUser?.email ? (
                appUser.email.charAt(0).toUpperCase()
              ) : (
                <User size={14} />
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-neutral-800 leading-tight max-w-[110px] truncate">
                {appUser?.name || appUser?.email?.split('@')[0] || 'User'}
              </span>
              <span className="text-[10px] text-neutral-400 capitalize font-medium leading-tight">
                {appUser?.role === 'super_admin' ? 'Super Admin' : appUser?.role === 'company_admin' ? 'Admin' : 'Member'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
