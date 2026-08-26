import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  requireAdmin?: boolean;
  requiredPermission?: string;
  requireActiveTenant?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSuperAdmin = false,
  requireAdmin = false,
  requiredPermission,
  requireActiveTenant = true
}) => {
  const { user, appUser, loading: authLoading, hasPermission } = useAuth();
  const { isTenantActive, loading: tenantLoading } = useTenant();
  const location = useLocation();

  if (authLoading || tenantLoading || (user && !appUser)) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-100 font-sans text-neutral-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Loading security context...</p>
        </div>
      </div>
    );
  }

  if (!user || !appUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSuperAdmin && appUser.role !== 'super_admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  // If not super admin, check tenant restrictions
  if (appUser.role !== 'super_admin') {
    if (requireActiveTenant && !isTenantActive) {
      return <Navigate to="/suspended" replace />;
    }

    if (requireAdmin && appUser.role !== 'company_admin') {
      return <Navigate to="/unauthorized" replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};
