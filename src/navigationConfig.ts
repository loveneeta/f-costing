import {
  LayoutDashboard,
  FolderOpen,
  Copy,
  TreePine,
  Wrench,
  Layers,
  FileBox,
  Settings as SettingsIcon,
  Users,
  CreditCard,
  ShieldAlert,
  Code,
  Flag,
  Activity,
  FileText,
  Bug,
  TestTube,
  LucideIcon
} from 'lucide-react';
import { AppUser } from './contexts/AuthContext';

export interface NavItemConfig {
  to: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  exact?: boolean;
  section: string;
  isPrimaryBottomNav?: boolean;
  requiredPermission?: string;
  allowedRoles?: ('super_admin' | 'company_admin' | 'manager' | 'employee')[];
}

export interface NavSectionConfig {
  title: string;
  items: NavItemConfig[];
}

/**
 * Standard Tenant User Navigation Structure
 */
export const TENANT_NAV_SECTIONS: NavSectionConfig[] = [
  {
    title: 'Workspace',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        shortLabel: 'Home',
        icon: LayoutDashboard,
        exact: true,
        section: 'Workspace',
        isPrimaryBottomNav: true
      },
      {
        to: '/projects',
        label: 'All Costings',
        shortLabel: 'Costings',
        icon: FolderOpen,
        section: 'Workspace',
        isPrimaryBottomNav: true
      },
      {
        to: '/templates',
        label: 'Item Templates',
        shortLabel: 'Templates',
        icon: Copy,
        section: 'Workspace',
        isPrimaryBottomNav: true
      }
    ]
  },
  {
    title: 'Company',
    items: [
      {
        to: '/employees',
        label: 'Employees',
        shortLabel: 'Employees',
        icon: Users,
        section: 'Company',
        requiredPermission: 'employees.view'
      },
      {
        to: '/billing',
        label: 'Billing & Subscription',
        shortLabel: 'Billing',
        icon: CreditCard,
        section: 'Company',
        requiredPermission: 'subscription.view'
      }
    ]
  },
  {
    title: 'Rate Master',
    items: [
      {
        to: '/rates/wood',
        label: 'Wood Rates',
        shortLabel: 'Wood',
        icon: TreePine,
        section: 'Rate Master'
      },
      {
        to: '/rates/hardware',
        label: 'Hardware Rates',
        shortLabel: 'Hardware',
        icon: Wrench,
        section: 'Rate Master'
      },
      {
        to: '/rates/veneer',
        label: 'Veneer Rates',
        shortLabel: 'Veneer',
        icon: Layers,
        section: 'Rate Master'
      },
      {
        to: '/rates/ply',
        label: 'Ply Sheets',
        shortLabel: 'Ply',
        icon: FileBox,
        section: 'Rate Master'
      },
      {
        to: '/rates/board',
        label: 'Board Sheets',
        shortLabel: 'Board',
        icon: FileBox,
        section: 'Rate Master'
      },
      {
        to: '/rates/other',
        label: 'Other Rates',
        shortLabel: 'Other',
        icon: SettingsIcon,
        section: 'Rate Master'
      }
    ]
  },
  {
    title: 'User',
    items: [
      {
        to: '/profile',
        label: 'Profile & Settings',
        shortLabel: 'Settings',
        icon: SettingsIcon,
        section: 'User',
        isPrimaryBottomNav: true
      }
    ]
  }
];

/**
 * Super Admin Navigation Structure
 */
export const SUPERADMIN_NAV_SECTIONS: NavSectionConfig[] = [
  {
    title: 'Platform Admin',
    items: [
      {
        to: '/superadmin/dashboard',
        label: 'Platform Dashboard',
        shortLabel: 'Dashboard',
        icon: ShieldAlert,
        section: 'Platform Admin',
        isPrimaryBottomNav: true
      },
      {
        to: '/superadmin/subscriptions',
        label: 'Subscriptions',
        shortLabel: 'Billing',
        icon: Layers,
        section: 'Platform Admin',
        isPrimaryBottomNav: true
      }
    ]
  },
  {
    title: 'Developer',
    items: [
      {
        to: '/superadmin/developer/features',
        label: 'Feature Flags',
        shortLabel: 'Features',
        icon: Flag,
        section: 'Developer',
        isPrimaryBottomNav: true
      },
      {
        to: '/superadmin/developer/modules',
        label: 'Developer Modules',
        shortLabel: 'Modules',
        icon: Code,
        section: 'Developer'
      },
      {
        to: '/superadmin/developer/beta',
        label: 'Beta Features',
        shortLabel: 'Beta',
        icon: TestTube,
        section: 'Developer'
      },
      {
        to: '/superadmin/developer/testing',
        label: 'Test Environment',
        shortLabel: 'Testing',
        icon: Bug,
        section: 'Developer'
      },
      {
        to: '/superadmin/developer/diagnostics',
        label: 'Diagnostics',
        shortLabel: 'Diagnostics',
        icon: Activity,
        section: 'Developer'
      },
      {
        to: '/superadmin/developer/logs',
        label: 'Application Logs',
        shortLabel: 'Logs',
        icon: FileText,
        section: 'Developer'
      }
    ]
  },
  {
    title: 'Platform',
    items: [
      {
        to: '/superadmin/settings',
        label: 'Platform Settings',
        shortLabel: 'Settings',
        icon: SettingsIcon,
        section: 'Platform',
        isPrimaryBottomNav: true
      },
      {
        to: '/superadmin/audit',
        label: 'Platform Audit',
        shortLabel: 'Audit',
        icon: Activity,
        section: 'Platform'
      }
    ]
  }
];

/**
 * Helper to check if a user is authorized to see a specific NavItem
 */
export function isNavItemAllowed(
  item: NavItemConfig,
  appUser: AppUser | null,
  hasPermission: (perm: string) => boolean
): boolean {
  if (!appUser) return false;

  // Super admin can access superadmin routes
  if (appUser.role === 'super_admin') {
    return true;
  }

  // If item specifies allowed roles, check role
  if (item.allowedRoles && !item.allowedRoles.includes(appUser.role as any)) {
    return false;
  }

  // If item has a permission requirement
  if (item.requiredPermission) {
    if (appUser.role === 'company_admin') {
      return true; // Admin has all company permissions
    }
    return hasPermission(item.requiredPermission);
  }

  return true;
}

/**
 * Filter sections and their items based on user permissions
 */
export function getFilteredNavSections(
  isSuperAdmin: boolean,
  appUser: AppUser | null,
  hasPermission: (perm: string) => boolean
): NavSectionConfig[] {
  const sourceSections = isSuperAdmin ? SUPERADMIN_NAV_SECTIONS : TENANT_NAV_SECTIONS;

  return sourceSections
    .map(section => ({
      title: section.title,
      items: section.items.filter(item => isNavItemAllowed(item, appUser, hasPermission))
    }))
    .filter(section => section.items.length > 0);
}
