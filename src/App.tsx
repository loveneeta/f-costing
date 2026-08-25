import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Dashboard } from './views/Dashboard';
import { RateMaster } from './views/RateMaster';
import { WoodRates } from './views/WoodRates';
import { CostingEditor } from './views/CostingEditor';
import { CostingsList } from './views/CostingsList';
import { TemplatesList } from './views/TemplatesList';
import { Settings } from './views/Settings';
import { Project } from './types';
import { v4 as uuidv4 } from 'uuid';
import { Calculator, LayoutDashboard, Plus, Settings as SettingsIcon, TreePine, FolderOpen, Wrench, Layers, Grid, Grid2X2, MoreHorizontal, FileBox, Copy } from 'lucide-react';
import { TemplateSelectorModal } from './components/TemplateSelectorModal';

type ViewType = 'dashboard' | 'projects' | 'templates' | 'wood_rates' | 'rates_hardware' | 'rates_ply' | 'rates_veneer' | 'rates_board' | 'rates_other' | 'editor' | 'settings';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const startNewProject = () => {
    setShowTemplateModal(true);
  };

  const handleSelectTemplate = (template: Project | null) => {
    setShowTemplateModal(false);
    
    if (template) {
      // Create from template
      const newProj: Project = {
        ...template,
        id: uuidv4(),
        isTemplate: false,
        name: template.name.replace(' (Template)', ''),
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
      };
      // We don't save it immediately, we just put it in editor. It's a new project.
      setEditingProject(newProj);
      setCurrentView('editor');
    } else {
      // Start blank
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
      setCurrentView('editor');
    }
  };

  if (currentView === 'editor' && editingProject) {
    return <CostingEditor project={editingProject} onClose={() => setCurrentView('projects')} />;
  }

  const handleEditProject = (p: Project) => {
    setEditingProject(p);
    setCurrentView('editor');
  };

  return (
    <div className="flex h-screen bg-neutral-100 font-sans text-neutral-900 selection:bg-blue-100 overflow-hidden">
      {showTemplateModal && <TemplateSelectorModal onClose={() => setShowTemplateModal(false)} onSelectTemplate={handleSelectTemplate} />}
      
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-neutral-900 text-neutral-300 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center gap-3 px-6 bg-neutral-950 border-b border-neutral-800">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Calculator size={20} /></div>
          <span className="font-bold text-white tracking-tight">Costing ERP</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${currentView === 'dashboard' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 hover:text-white'}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          
          <button 
            onClick={() => setCurrentView('projects')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${currentView === 'projects' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 hover:text-white'}`}
          >
            <FolderOpen size={18} /> All Costings
          </button>

          <button 
            onClick={() => setCurrentView('templates')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${currentView === 'templates' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 hover:text-white'}`}
          >
            <Copy size={18} /> Item Templates
          </button>
          
          <button 
            onClick={startNewProject} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium text-emerald-400 hover:bg-neutral-800 hover:text-emerald-300`}
          >
            <Plus size={18} /> New Costing
          </button>
          
          <div className="mt-8 mb-2 px-4 pt-4">
            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Rate Master</h3>
          </div>
          
          <button 
            onClick={() => setCurrentView('wood_rates')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${currentView === 'wood_rates' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 hover:text-white'}`}
          >
            <TreePine size={18} /> Wood Rates
          </button>
          <button 
            onClick={() => setCurrentView('rates_hardware')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${currentView === 'rates_hardware' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 hover:text-white'}`}
          >
            <Wrench size={18} /> Hardware Rates
          </button>
          <button 
            onClick={() => setCurrentView('rates_ply')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${currentView === 'rates_ply' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 hover:text-white'}`}
          >
            <Layers size={18} /> Ply Rates
          </button>
          <button 
            onClick={() => setCurrentView('rates_veneer')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${currentView === 'rates_veneer' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 hover:text-white'}`}
          >
            <Grid size={18} /> Veneer Rates
          </button>
          <button 
            onClick={() => setCurrentView('rates_board')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${currentView === 'rates_board' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 hover:text-white'}`}
          >
            <Grid2X2 size={18} /> Board Rates
          </button>
          <button 
            onClick={() => setCurrentView('rates_other')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${currentView === 'rates_other' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 hover:text-white'}`}
          >
            <MoreHorizontal size={18} /> Others
          </button>
          
          <div className="mt-8 mb-2 px-4 pt-4 border-t border-neutral-800"></div>
          <button 
            onClick={() => setCurrentView('settings')} 
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${currentView === 'settings' ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 hover:text-white'}`}
          >
            <SettingsIcon size={18} /> Settings & Profile
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {currentView === 'dashboard' && <Dashboard onEdit={handleEditProject} />}
        {currentView === 'projects' && <CostingsList onEdit={handleEditProject} />}
        {currentView === 'templates' && <TemplatesList onEdit={handleEditProject} onUseTemplate={handleSelectTemplate} />}
        {currentView === 'wood_rates' && <WoodRates />}
        {currentView === 'rates_hardware' && <RateMaster title="Hardware Rates" tabs={[{ id: 'hardware', label: 'Hardware' }]} />}
        {currentView === 'rates_ply' && <RateMaster title="Ply Rates" tabs={[{ id: 'ply', label: 'Ply Sheets' }]} />}
        {currentView === 'rates_veneer' && <RateMaster title="Veneer Rates" tabs={[{ id: 'veneer_sheet', label: 'Veneer Sheet' }, { id: 'veneer_edge', label: 'Edge Strip' }, { id: 'veneer_other', label: 'Others' }]} />}
        {currentView === 'rates_board' && <RateMaster title="Board Rates" tabs={[{ id: 'board', label: 'Board Sheets' }]} />}
        {currentView === 'rates_other' && <RateMaster title="Other Rates" tabs={[{ id: 'edgeband', label: 'PVC Edgeband' }, { id: 'labour', label: 'Labour' }, { id: 'finishing', label: 'Finishing' }, { id: 'other', label: 'General Others' }]} />}
        {currentView === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

