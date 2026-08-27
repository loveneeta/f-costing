import React from 'react';
import { 
  Calculator, LayoutDashboard, Settings as SettingsIcon, TreePine, 
  FolderOpen, Wrench, Layers, FileBox, Copy, Users, Building, 
  ShieldAlert, CreditCard, Code, Flag, Activity, FileText, Bug, TestTube
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const { appUser, logout, hasPermission } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const NavLink = ({ to, icon: Icon, label, exact = true }: { to: string, icon: any, label: string, exact?: boolean }) => {
    const isActive = exact ? currentPath === to : currentPath.startsWith(to);
    return (
      <Link 
        to={to}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${isActive ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 hover:text-white'}`}
      >
        <Icon size={18} /> {label}
      </Link>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mt-6 mb-2 px-4 pt-4 border-t border-neutral-800/50">
      <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{title}</h3>
    </div>
  );

  const isSuperAdmin = appUser?.role === 'super_admin';

  return (
    <nav className="w-64 bg-neutral-900 text-neutral-300 flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center gap-3 px-6 bg-neutral-950 border-b border-neutral-800">
        <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Calculator size={20} /></div>
        <div className="flex flex-col">
          <span className="font-bold text-white tracking-tight leading-tight">Costing ERP</span>
          <span className="text-[10px] text-blue-400 font-medium truncate max-w-[150px] leading-tight">
            {isSuperAdmin ? 'Platform Administration' : tenant?.name || 'Loading...'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 py-4 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {isSuperAdmin ? (
          <>
            <div className="mb-2 px-4 pt-2">
              <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Platform Admin</h3>
            </div>
            <NavLink to="/superadmin/dashboard" icon={ShieldAlert} label="Platform Dashboard" />
            
            <NavLink to="/superadmin/subscriptions" icon={Layers} label="Subscriptions" />


            <SectionHeader title="Developer" />
            <NavLink to="/superadmin/developer/features" icon={Flag} label="Feature Flags" />
            <NavLink to="/superadmin/developer/modules" icon={Code} label="Modules" />
            <NavLink to="/superadmin/developer/beta" icon={TestTube} label="Beta Features" />
            <NavLink to="/superadmin/developer/testing" icon={Bug} label="Test Environment" />
            <NavLink to="/superadmin/developer/diagnostics" icon={Activity} label="Diagnostics" />
            <NavLink to="/superadmin/developer/logs" icon={FileText} label="Application Logs" />

            <SectionHeader title="Platform" />
            <NavLink to="/superadmin/settings" icon={SettingsIcon} label="Platform Settings" />
            <NavLink to="/superadmin/audit" icon={Activity} label="Platform Audit" />
          </>
        ) : (
          <>
            <div className="mb-2 px-4 pt-2">
              <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Workspace</h3>
            </div>
            <NavLink to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavLink to="/projects" icon={FolderOpen} label="All Costings" />
            <NavLink to="/templates" icon={Copy} label="Item Templates" />

            {(appUser?.role === 'company_admin' || hasPermission('employees.view')) && (
              <>
                <SectionHeader title="Company" />
                <NavLink to="/employees" icon={Users} label="Employees" />
              </>
            )}

            <SectionHeader title="Rate Master" />
            <NavLink to="/rates/wood" icon={TreePine} label="Wood Rates" />
            <NavLink to="/rates/hardware" icon={Wrench} label="Hardware Rates" />
            <NavLink to="/rates/veneer" icon={Layers} label="Veneer Rates" />
            <NavLink to="/rates/ply" icon={FileBox} label="Ply Sheets" />
            <NavLink to="/rates/board" icon={FileBox} label="Board Sheets" />
            <NavLink to="/rates/other" icon={SettingsIcon} label="Other Rates" />

            <SectionHeader title="User" />
            <NavLink to="/profile" icon={SettingsIcon} label="Profile & Settings" />
            {(appUser?.role === 'company_admin' || hasPermission('subscription.view')) && (
              <NavLink to="/billing" icon={CreditCard} label="Billing & Subscription" />
            )}
          </>
        )}

        <div className="mt-8 mb-2 px-4 pt-4 border-t border-neutral-800"></div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium text-red-400 hover:bg-neutral-800 hover:text-red-300"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
};
