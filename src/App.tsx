import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { PlatformSettingsProvider } from './contexts/PlatformSettingsContext';
import { StoreProvider } from './context/StoreContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginView } from './views/LoginView';
import { UnauthorizedView } from './views/UnauthorizedView';
import { SuspendedView } from './views/SuspendedView';
import { SuperAdminDashboard } from './views/SuperAdminDashboard';
import { SuperAdminSubscriptions } from './views/SuperAdminSubscriptions';

import { SuperAdminSettings } from './views/SuperAdminSettings';
import { DeveloperFeatures } from './views/developer/DeveloperFeatures';
import { DeveloperModules } from './views/developer/DeveloperModules';
import { DeveloperBeta } from './views/developer/DeveloperBeta';
import { DeveloperTesting } from './views/developer/DeveloperTesting';
import { DeveloperDiagnostics } from './views/developer/DeveloperDiagnostics';
import { DeveloperLogs } from './views/developer/DeveloperLogs';
import { SuperAdminAudit } from './views/SuperAdminAudit';
import { CompanyBilling } from './views/CompanyBilling';
import { EmployeeManagement } from './views/EmployeeManagement';


import { Dashboard } from './views/Dashboard';
import { RateMaster } from './views/RateMaster';
import { WoodRates } from './views/WoodRates';
import { CostingsList } from './views/CostingsList';
import { TemplatesList } from './views/TemplatesList';
import { Settings } from './views/Settings';
import { Project } from './types';
import { CostingEditor } from './views/CostingEditor';
import { v4 as uuidv4 } from 'uuid';
import { ErrorBoundary } from './components/ErrorBoundary';

import { useAuth } from './contexts/AuthContext';

import { AcceptInvitation } from './views/AcceptInvitation';

function AppRoutes() {
  const { appUser } = useAuth();
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);

  const handleEditProject = (p: Project) => {
    setEditingProject(p);
  };

  const handleSelectTemplate = (template: Project | null) => {
    if (template) {
      const newProj: Project = {
        ...template,
        id: uuidv4(),
        isTemplate: false,
        name: template.name.replace(' (Template)', ''),
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
      };
      setEditingProject(newProj);
    } else {
      const newProj: Project = {
        id: uuidv4(),
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        name: '',
        category: '',
        overallL: 0,
        overallW: 0,
        overallH: 0,
        sheetComponents: [],
        solidWoodComponents: [],
        hardware: [],
        finishing: [],
        labour: [],
      };
      setEditingProject(newProj);
    }
  };

  if (editingProject) {
    return (
      <ProtectedRoute>
        <CostingEditor project={editingProject} onClose={() => setEditingProject(null)} />
      </ProtectedRoute>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path="/unauthorized" element={<UnauthorizedView />} />
      <Route path="/suspended" element={<SuspendedView />} />
      
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Dashboard onEdit={handleEditProject} />} />
        <Route path="/projects" element={<CostingsList onEdit={handleEditProject} />} />
        <Route path="/templates" element={<TemplatesList onEdit={handleEditProject} onUseTemplate={handleSelectTemplate} />} />
        <Route path="/profile" element={<Settings />} />
        <Route 
          path="/billing" 
          element={
            <ProtectedRoute requiredPermission="subscription.view">
              <CompanyBilling />
            </ProtectedRoute>
          } 
        />
        <Route path="/rates/wood" element={<WoodRates />} />
        <Route path="/rates/hardware" element={<RateMaster title="Hardware Rates" tabs={[{ id: 'hardware', label: 'Hardware' }]} />} />
        <Route path="/rates/ply" element={<RateMaster title="Ply Rates" tabs={[{ id: 'ply', label: 'Ply Sheets' }]} />} />
        <Route path="/rates/veneer" element={<RateMaster title="Veneer Rates" tabs={[{ id: 'veneer_sheet', label: 'Veneer Sheet' }, { id: 'veneer_edge', label: 'Edge Strip' }, { id: 'veneer_other', label: 'Others' }]} />} />
        <Route path="/rates/board" element={<RateMaster title="Board Rates" tabs={[{ id: 'board', label: 'Board Sheets' }]} />} />
        <Route path="/rates/other" element={<RateMaster title="Other Rates" tabs={[{ id: 'edgeband', label: 'PVC Edgeband' }, { id: 'labour', label: 'Labour' }, { id: 'finishing', label: 'Finishing' }, { id: 'other', label: 'General Others' }]} />} />
        
        <Route 
          path="/employees" 
          element={
            <ProtectedRoute requiredPermission="employees.view">
              <EmployeeManagement />
            </ProtectedRoute>
          } 
        />
      </Route>

      <Route element={
        <ProtectedRoute requireSuperAdmin>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        
        <Route path="/superadmin/subscriptions" element={<SuperAdminSubscriptions />} />

        <Route path="/superadmin/settings" element={<SuperAdminSettings />} />
        <Route path="/superadmin/developer/features" element={<DeveloperFeatures />} />
        <Route path="/superadmin/developer/modules" element={<DeveloperModules />} />
        <Route path="/superadmin/developer/beta" element={<DeveloperBeta />} />
        <Route path="/superadmin/developer/testing" element={<DeveloperTesting />} />
        <Route path="/superadmin/developer/diagnostics" element={<DeveloperDiagnostics />} />
        <Route path="/superadmin/developer/logs" element={<DeveloperLogs />} />
        <Route path="/superadmin/audit" element={<SuperAdminAudit />} />
        
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PlatformSettingsProvider>
          <TenantProvider>
            <StoreProvider>
              <HashRouter>
                <AppRoutes />
              </HashRouter>
            </StoreProvider>
          </TenantProvider>
        </PlatformSettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
