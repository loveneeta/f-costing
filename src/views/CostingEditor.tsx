import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useTenant } from '../contexts/TenantContext';
import { Project } from '../types';
import { calculateProjectCost, compareProjectRates } from '../engine';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Save, 
  FileText, 
  Layers, 
  TreePine, 
  Wrench, 
  Copy, 
  HardHat, 
  Paintbrush, 
  Lock, 
  Sparkles, 
  TrendingUp, 
  ChevronDown,
  ChevronUp,
  Ruler
} from 'lucide-react';
import { SaveSuccessModal } from '../components/SaveSuccessModal';
import { UpdatePricingModal } from '../components/UpdatePricingModal';
import { Footer } from '../components/Footer';

interface Props {
  project: Project;
  onClose: () => void;
}

export function CostingEditor({ project: initialProject, onClose }: Props) {
  const { rates, woodTypes, settings, updateProject, addProject, projects } = useStore();
  const { canAccessFeature } = useTenant();
  
  const [project, setProject] = useState<Project>(initialProject);
  const [successModal, setSuccessModal] = useState<{show: boolean, title: string, sub?: string}>({show: false, title: ''});
  const [showUpdatePricingModal, setShowUpdatePricingModal] = useState(false);
  const [showMobileBreakdown, setShowMobileBreakdown] = useState(false);

  const isNew = !projects.find(p => p.id === project.id);

  // Compare locked saved rates vs current live rates
  const rateComparison = useMemo(() => {
    return compareProjectRates(project, rates, settings.pricing, woodTypes);
  }, [project, rates, settings.pricing, woodTypes]);

  const handleSave = () => {
    const updated: Project = { 
      ...project, 
      dateModified: new Date().toISOString(),
      isPricingLocked: true,
      ratesSnapshot: project.ratesSnapshot && project.ratesSnapshot.length > 0 ? project.ratesSnapshot : rates,
      woodTypesSnapshot: project.woodTypesSnapshot && project.woodTypesSnapshot.length > 0 ? project.woodTypesSnapshot : woodTypes,
      pricingSnapshot: project.pricingSnapshot || settings.pricing,
      ratesLockedAt: project.ratesLockedAt || new Date().toISOString(),
    };

    setProject(updated);

    if (isNew) {
      addProject(updated);
    } else {
      updateProject(updated);
    }
    setSuccessModal({ 
      show: true, 
      title: project.isTemplate ? 'Template saved successfully' : 'Costing saved successfully',
      sub: project.isTemplate 
        ? 'You can reuse this template anytime from the Item Templates menu.' 
        : 'Pricing is now locked. Changes to raw material rates in Rate Master will not alter this saved costing unless you explicitly choose to update on today\'s pricing.'
    });
  };

  const handleSaveAsTemplate = () => {
    const template: Project = {
      ...project,
      id: uuidv4(),
      isTemplate: true,
      name: `${project.name || 'Custom Item'} (Template)`,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      isPricingLocked: false,
      ratesSnapshot: rates,
      woodTypesSnapshot: woodTypes,
      pricingSnapshot: settings.pricing,
      ratesLockedAt: new Date().toISOString()
    };
    addProject(template);
    setSuccessModal({ 
      show: true, 
      title: 'Saved as new Item Template!',
      sub: 'This costing is now saved as a reusable template. You can access it when creating a new item.'
    });
  };

  const handleConfirmUpdatePricing = (newCopyName: string) => {
    const newCopy: Project = {
      ...project,
      id: uuidv4(),
      name: newCopyName,
      ratesSnapshot: rates,
      woodTypesSnapshot: woodTypes,
      pricingSnapshot: settings.pricing,
      ratesLockedAt: new Date().toISOString(),
      isPricingLocked: true,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
    };

    addProject(newCopy);
    setProject(newCopy);
    setShowUpdatePricingModal(false);

    setSuccessModal({
      show: true,
      title: 'Created updated copy on today\'s pricing!',
      sub: `New costing "${newCopyName}" has been created with today's raw material rates. Your original costing "${project.name}" remains preserved with its locked historical rates.`
    });
  };

  const results = useMemo(() => {
    return calculateProjectCost(project, rates, settings.pricing, woodTypes);
  }, [project, rates, settings.pricing, woodTypes]);

  const sheetRates = rates.filter(r => ['sheet', 'ply', 'board', 'veneer_sheet'].includes(r.category));
  const edgeRates = rates.filter(r => ['edgeband', 'veneer_edge'].includes(r.category));
  const hwRates = rates.filter(r => r.category === 'hardware');
  const finishingRates = rates.filter(r => r.category === 'finishing');
  
  const updateProj = (updates: Partial<Project>) => setProject(prev => ({ ...prev, ...updates }));

  const unit = project.dimensionUnit || 'mm';

  const formattedLockedDate = project.ratesLockedAt 
    ? new Date(project.ratesLockedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : (project.dateModified ? new Date(project.dateModified).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden font-sans">
      {successModal.show && (
        <SaveSuccessModal 
          message={successModal.title} 
          subMessage={successModal.sub} 
          onClose={() => setSuccessModal({show: false, title: ''})} 
          onSaveAsTemplate={successModal.title === 'Costing saved successfully' ? handleSaveAsTemplate : undefined} 
        />
      )}

      {showUpdatePricingModal && (
        <UpdatePricingModal
          project={project}
          rates={rates}
          woodTypes={woodTypes}
          pricing={settings.pricing}
          onClose={() => setShowUpdatePricingModal(false)}
          onConfirm={handleConfirmUpdatePricing}
        />
      )}

      {/* Editor Top Navigation Bar */}
      <header className="min-h-16 bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 truncate max-w-[180px] sm:max-w-md">
                {project.name || 'Untitled Item'}
              </h1>
              {project.isTemplate && (
                <span className="bg-indigo-50 text-indigo-700 text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded border border-indigo-200">
                  TEMPLATE
                </span>
              )}
              {!project.isTemplate && (project.isPricingLocked || project.ratesSnapshot) && (
                <span className="bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Lock size={10} /> Locked ({formattedLockedDate || 'Saved'})
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              {project.category ? `${project.category} • ` : ''}
              {project.overallL || project.overallW || project.overallH ? `${project.overallL || 0} × ${project.overallW || 0} × ${project.overallH || 0} ${unit}` : 'Specifications & BOM'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {!project.isTemplate && !isNew && (
            <button 
              type="button"
              onClick={() => setShowUpdatePricingModal(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-xs font-bold shadow-sm transition-all"
              title="Recalculate pricing with today's material rates"
            >
              <Sparkles size={14} className="text-blue-600 shrink-0" /> 
              <span className="hidden sm:inline">Update on Today's Rates</span>
              <span className="sm:hidden">Update</span>
            </button>
          )}

          {!project.isTemplate && (
            <button 
              type="button"
              onClick={handleSaveAsTemplate} 
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all"
            >
              <Copy size={14} /> Template
            </button>
          )}

          <button 
            type="button"
            onClick={handleSave} 
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
          >
            <Save size={14} /> {project.isTemplate ? 'Save Template' : 'Save Costing'}
          </button>
        </div>
      </header>

      {/* Main Container: 2-column on desktop, stacked on mobile/tablet */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-w-0">
        {/* Left Main Workspace Pane */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 relative custom-scrollbar min-w-0">
          <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6 pb-28 lg:pb-12 min-w-0">
            
            {/* Historical Pricing Notice Banner */}
            {!project.isTemplate && (project.isPricingLocked || project.ratesSnapshot) && rateComparison.hasPriceChange && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg mt-0.5 shrink-0">
                    <TrendingUp size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-amber-900">
                      Raw Material Rates Updated in Rate Master
                    </h4>
                    <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                      Locked at <span className="font-bold">₹{rateComparison.lockedGrandTotal.toLocaleString('en-IN')}</span> ({formattedLockedDate}). 
                      Today's rate calculates to <span className="font-bold">₹{rateComparison.liveGrandTotal.toLocaleString('en-IN')}</span> ({rateComparison.difference > 0 ? `+₹${rateComparison.difference}` : `-₹${Math.abs(rateComparison.difference)}`}).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUpdatePricingModal(true)}
                  className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  <Sparkles size={14} />
                  Update & Create Copy
                </button>
              </div>
            )}
            
            {/* 1. Item Specifications Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 min-w-0">
              <div className="flex items-center justify-between mb-4 sm:mb-5 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-600" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Item Specifications</h2>
                </div>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">General Details & Dimensions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4">
                {/* Item Name */}
                <div className="sm:col-span-2 md:col-span-4 min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Item Name</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all text-slate-800 font-medium"
                    value={project.name}
                    onChange={e => updateProj({ name: e.target.value })}
                    placeholder="e.g. Bedside Table"
                  />
                </div>

                {/* Sub Name / Variation */}
                <div className="md:col-span-4 min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Variation / Sub Name</label>
                  <input
                    type="text"
                    list="variation-suggestions"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all text-slate-800"
                    value={project.subName || ''}
                    onChange={e => updateProj({ subName: e.target.value })}
                    placeholder="e.g. 1 tier, 2 door"
                  />
                  <datalist id="variation-suggestions">
                    <option value="1-tier" />
                    <option value="2-tier" />
                    <option value="3-tier" />
                    <option value="1-door" />
                    <option value="2-door" />
                    <option value="1-drawer" />
                    <option value="2-drawer" />
                    <option value="Shelf" />
                    <option value="Glass Door" />
                  </datalist>
                </div>

                {/* Category */}
                <div className="md:col-span-4 min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all text-slate-800"
                    value={project.category}
                    onChange={e => updateProj({ category: e.target.value })}
                    placeholder="e.g. Cabinet, Wardrobe, Table"
                  />
                </div>

                {/* Unit Selection */}
                <div className="sm:col-span-1 md:col-span-3 min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Dimension Unit</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-800 cursor-pointer"
                    value={project.dimensionUnit || 'mm'}
                    onChange={e => updateProj({ dimensionUnit: e.target.value as any })}
                  >
                    <option value="mm">Millimeters (mm)</option>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="inch">Inches (in)</option>
                    <option value="ft">Feet (ft)</option>
                    <option value="m">Meters (m)</option>
                  </select>
                </div>

                {/* Overall Dimensions (L × W × H) */}
                <div className="sm:col-span-2 md:col-span-9 min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Overall Outer Dimensions ({unit})
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="relative flex items-center min-w-0">
                      <span className="absolute left-2.5 sm:left-3 text-xs font-bold text-slate-400">L:</span>
                      <input
                        type="number"
                        placeholder="Length"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 sm:pl-8 pr-2 sm:pr-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs sm:text-sm font-mono text-slate-800 transition-all min-w-0"
                        value={project.overallL || ''}
                        onChange={e => updateProj({ overallL: Number(e.target.value) })}
                      />
                    </div>
                    <div className="relative flex items-center min-w-0">
                      <span className="absolute left-2.5 sm:left-3 text-xs font-bold text-slate-400">W:</span>
                      <input
                        type="number"
                        placeholder="Width"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 sm:pl-8 pr-2 sm:pr-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs sm:text-sm font-mono text-slate-800 transition-all min-w-0"
                        value={project.overallW || ''}
                        onChange={e => updateProj({ overallW: Number(e.target.value) })}
                      />
                    </div>
                    <div className="relative flex items-center min-w-0">
                      <span className="absolute left-2.5 sm:left-3 text-xs font-bold text-slate-400">H:</span>
                      <input
                        type="number"
                        placeholder="Height"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 sm:pl-8 pr-2 sm:pr-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-xs sm:text-sm font-mono text-slate-800 transition-all min-w-0"
                        value={project.overallH || ''}
                        onChange={e => updateProj({ overallH: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {(canAccessFeature('ply_sheets') || canAccessFeature('board_sheets')) && (
            <>
              {/* 2. Sheet Material Parts Section */}
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-0">
              <div className="p-3.5 sm:p-4 md:px-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="text-indigo-600 shrink-0" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">Sheet Material Parts</h2>
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium shrink-0">
                    {project.sheetComponents.length} {project.sheetComponents.length === 1 ? 'part' : 'parts'}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => updateProj({ 
                    sheetComponents: [
                      ...project.sheetComponents, 
                      { 
                        id: uuidv4(), 
                        name: '', 
                        l: 0, 
                        w: 0, 
                        qty: 1, 
                        rateId: sheetRates[0]?.id || '', 
                        edgeTop: false, 
                        edgeBottom: false, 
                        edgeLeft: false, 
                        edgeRight: false, 
                        edgeRateId: edgeRates[0]?.id || '' 
                      }
                    ] 
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors shrink-0"
                >
                  <Plus size={14} /> Add Part
                </button>
              </div>

              {project.sheetComponents.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs text-slate-500 mb-3">No sheet materials added yet (plywood, MDF, boards, laminates).</p>
                  <button
                    type="button"
                    onClick={() => updateProj({ 
                      sheetComponents: [
                        ...project.sheetComponents, 
                        { 
                          id: uuidv4(), 
                          name: '', 
                          l: 0, 
                          w: 0, 
                          qty: 1, 
                          rateId: sheetRates[0]?.id || '', 
                          edgeTop: false, 
                          edgeBottom: false, 
                          edgeLeft: false, 
                          edgeRight: false, 
                          edgeRateId: edgeRates[0]?.id || '' 
                        }
                      ] 
                    })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add First Sheet Part
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View (>= 768px) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          <th className="p-3.5 pl-5 w-48">Component Name</th>
                          <th className="p-3.5 w-16 text-center">Qty</th>
                          <th className="p-3.5 w-44 text-center">Size (L × W) in {unit}</th>
                          <th className="p-3.5 w-52">Material Rate</th>
                          <th className="p-3.5 text-center border-l border-slate-200" colSpan={4}>Edgeband (T B L R)</th>
                          <th className="p-3.5 w-40 border-l border-slate-200">Edge Type</th>
                          <th className="p-3.5 text-right font-mono pr-4">Cost</th>
                          <th className="p-3.5 w-10 pr-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {project.sheetComponents.map((c, idx) => (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                            <td className="p-3 pl-5">
                              <input 
                                type="text" 
                                className="w-full p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800" 
                                value={c.name} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].name = e.target.value; updateProj({ sheetComponents: arr }); }} 
                                placeholder="e.g. Top Panel, Side" 
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input 
                                type="number" 
                                className="w-14 p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center font-mono" 
                                value={c.qty} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].qty = Number(e.target.value); updateProj({ sheetComponents: arr }); }} 
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <input 
                                  type="number" 
                                  className="w-18 p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center font-mono" 
                                  value={c.l || ''} 
                                  onChange={e => { const arr = [...project.sheetComponents]; arr[idx].l = Number(e.target.value); updateProj({ sheetComponents: arr }); }} 
                                  placeholder="L" 
                                />
                                <span className="text-slate-400">×</span>
                                <input 
                                  type="number" 
                                  className="w-18 p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center font-mono" 
                                  value={c.w || ''} 
                                  onChange={e => { const arr = [...project.sheetComponents]; arr[idx].w = Number(e.target.value); updateProj({ sheetComponents: arr }); }} 
                                  placeholder="W" 
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <select 
                                className="w-full p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800" 
                                value={c.rateId} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].rateId = e.target.value; updateProj({ sheetComponents: arr }); }}
                              >
                                {sheetRates.map(r => (
                                  <option key={r.id} value={r.id}>
                                    {r.name} (₹{r.rate}/{r.unit})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-center border-l border-slate-100" title="Top Edge">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
                                checked={c.edgeTop} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].edgeTop = e.target.checked; updateProj({ sheetComponents: arr }); }} 
                              />
                            </td>
                            <td className="p-3 text-center" title="Bottom Edge">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
                                checked={c.edgeBottom} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].edgeBottom = e.target.checked; updateProj({ sheetComponents: arr }); }} 
                              />
                            </td>
                            <td className="p-3 text-center" title="Left Edge">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
                                checked={c.edgeLeft} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].edgeLeft = e.target.checked; updateProj({ sheetComponents: arr }); }} 
                              />
                            </td>
                            <td className="p-3 text-center" title="Right Edge">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" 
                                checked={c.edgeRight} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].edgeRight = e.target.checked; updateProj({ sheetComponents: arr }); }} 
                              />
                            </td>
                            <td className="p-3 border-l border-slate-100">
                              <select 
                                className="w-full p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800" 
                                value={c.edgeRateId} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].edgeRateId = e.target.value; updateProj({ sheetComponents: arr }); }}
                              >
                                <option value="">No Edgeband</option>
                                {edgeRates.map(r => (
                                  <option key={r.id} value={r.id}>{r.name} (₹{r.rate}/{r.unit})</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900 pr-4">
                              ₹{( (results.breakdown.sheet[idx]?.cost || 0) + (results.breakdown.sheet[idx]?.edgeCost || 0) ).toFixed(0)}
                            </td>
                            <td className="p-3 text-center pr-5">
                              <button 
                                type="button"
                                onClick={() => updateProj({ sheetComponents: project.sheetComponents.filter((_, i) => i !== idx) })} 
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete component"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Card View (< 768px) */}
                  <div className="md:hidden divide-y divide-slate-200">
                    {project.sheetComponents.map((c, idx) => {
                      const cost = ( (results.breakdown.sheet[idx]?.cost || 0) + (results.breakdown.sheet[idx]?.edgeCost || 0) ).toFixed(0);
                      return (
                        <div key={c.id} className="p-4 space-y-3 bg-white">
                          {/* Part Name & Delete */}
                          <div className="flex items-center justify-between gap-2">
                            <input 
                              type="text" 
                              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800" 
                              value={c.name} 
                              onChange={e => { const arr = [...project.sheetComponents]; arr[idx].name = e.target.value; updateProj({ sheetComponents: arr }); }} 
                              placeholder={`Part #${idx + 1} (e.g. Top Panel)`} 
                            />
                            <button 
                              type="button"
                              onClick={() => updateProj({ sheetComponents: project.sheetComponents.filter((_, i) => i !== idx) })} 
                              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                              title="Delete component"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {/* Dimensions & Qty */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Length ({unit})</label>
                              <input 
                                type="number" 
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 text-center font-mono text-xs" 
                                value={c.l || ''} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].l = Number(e.target.value); updateProj({ sheetComponents: arr }); }} 
                                placeholder="0" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Width ({unit})</label>
                              <input 
                                type="number" 
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 text-center font-mono text-xs" 
                                value={c.w || ''} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].w = Number(e.target.value); updateProj({ sheetComponents: arr }); }} 
                                placeholder="0" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Qty</label>
                              <input 
                                type="number" 
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 text-center font-mono text-xs" 
                                value={c.qty} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].qty = Number(e.target.value); updateProj({ sheetComponents: arr }); }} 
                              />
                            </div>
                          </div>

                          {/* Material Rate Selector */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sheet Material</label>
                            <select 
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800" 
                              value={c.rateId} 
                              onChange={e => { const arr = [...project.sheetComponents]; arr[idx].rateId = e.target.value; updateProj({ sheetComponents: arr }); }}
                            >
                              {sheetRates.map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.name} (₹{r.rate}/{r.unit})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Edgeband Selection & 4 Edges Chips */}
                          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold uppercase text-slate-500">Edgeband Tapes (T B L R)</label>
                              <select 
                                className="p-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800 max-w-[170px]" 
                                value={c.edgeRateId} 
                                onChange={e => { const arr = [...project.sheetComponents]; arr[idx].edgeRateId = e.target.value; updateProj({ sheetComponents: arr }); }}
                              >
                                <option value="">No Edgeband</option>
                                {edgeRates.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-1.5 pt-1">
                              {[
                                { key: 'edgeTop', label: 'Top', val: c.edgeTop },
                                { key: 'edgeBottom', label: 'Bottom', val: c.edgeBottom },
                                { key: 'edgeLeft', label: 'Left', val: c.edgeLeft },
                                { key: 'edgeRight', label: 'Right', val: c.edgeRight },
                              ].map(edge => (
                                <button
                                  type="button"
                                  key={edge.key}
                                  onClick={() => {
                                    const arr = [...project.sheetComponents];
                                    (arr[idx] as any)[edge.key] = !edge.val;
                                    updateProj({ sheetComponents: arr });
                                  }}
                                  className={`py-1 px-1.5 rounded text-xs font-bold transition-colors ${
                                    edge.val 
                                      ? 'bg-indigo-600 text-white' 
                                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {edge.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Calculated Cost Row */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-xs text-slate-500 font-medium">Part Cost:</span>
                            <span className="text-sm font-mono font-bold text-slate-900">₹{cost}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
            </>
          )}

          {canAccessFeature('wood_rates') && (
            <>
              {/* 3. Solid Wood Parts Section */}
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-0">
              <div className="p-3.5 sm:p-4 md:px-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <TreePine className="text-emerald-600 shrink-0" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">Solid Wood Parts</h2>
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium shrink-0">
                    {project.solidWoodComponents.length} {project.solidWoodComponents.length === 1 ? 'part' : 'parts'}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => updateProj({ 
                    solidWoodComponents: [
                      ...project.solidWoodComponents, 
                      { 
                        id: uuidv4(), 
                        name: '', 
                        l: 0, 
                        w: 0, 
                        t: 0, 
                        qty: 1, 
                        woodTypeId: woodTypes[0]?.id || '' 
                      }
                    ] 
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors shrink-0"
                >
                  <Plus size={14} /> Add Wood Part
                </button>
              </div>

              {project.solidWoodComponents.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs text-slate-500 mb-3">No solid wood parts added yet (legs, framing, solid tops, lipping).</p>
                  <button
                    type="button"
                    onClick={() => updateProj({ 
                      solidWoodComponents: [
                        ...project.solidWoodComponents, 
                        { 
                          id: uuidv4(), 
                          name: '', 
                          l: 0, 
                          w: 0, 
                          t: 0, 
                          qty: 1, 
                          woodTypeId: woodTypes[0]?.id || '' 
                        }
                      ] 
                    })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add First Wood Part
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View (>= 768px) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          <th className="p-3.5 pl-5 w-48">Component Name</th>
                          <th className="p-3.5 w-16 text-center">Qty</th>
                          <th className="p-3.5 w-52 text-center">Size (L × W × T) in {unit}</th>
                          <th className="p-3.5">Wood Species (Auto-Slab)</th>
                          <th className="p-3.5 text-right w-28">CFT Rate</th>
                          <th className="p-3.5 text-right font-mono pr-4 w-28">Cost</th>
                          <th className="p-3.5 w-10 pr-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {project.solidWoodComponents.map((c, idx) => {
                          const brk = results.breakdown.solidWood[idx];
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                              <td className="p-3 pl-5">
                                <input 
                                  type="text" 
                                  className="w-full p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-800" 
                                  value={c.name} 
                                  onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].name = e.target.value; updateProj({ solidWoodComponents: arr }); }} 
                                  placeholder="e.g. Leg, Apron, Rail" 
                                />
                              </td>
                              <td className="p-3 text-center">
                                <input 
                                  type="number" 
                                  className="w-14 p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center font-mono" 
                                  value={c.qty} 
                                  onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].qty = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} 
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex items-center justify-center gap-1">
                                  <input 
                                    type="number" 
                                    className="w-14 p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center font-mono" 
                                    value={c.l || ''} 
                                    onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].l = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} 
                                    placeholder="L" 
                                  />
                                  <span className="text-slate-400">×</span>
                                  <input 
                                    type="number" 
                                    className="w-14 p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center font-mono" 
                                    value={c.w || ''} 
                                    onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].w = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} 
                                    placeholder="W" 
                                  />
                                  <span className="text-slate-400">×</span>
                                  <input 
                                    type="number" 
                                    className="w-14 p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-center font-mono" 
                                    value={c.t || ''} 
                                    onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].t = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} 
                                    placeholder="T" 
                                  />
                                </div>
                              </td>
                              <td className="p-3">
                                <select 
                                  className="w-full p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-800" 
                                  value={c.woodTypeId} 
                                  onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].woodTypeId = e.target.value; updateProj({ solidWoodComponents: arr }); }}
                                >
                                  {woodTypes.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3 text-right text-slate-600 font-mono text-[11px]">
                                ₹{brk?.rate ? brk.rate.toFixed(0) : '0'}/cft
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900 pr-4">
                                ₹{brk?.cost ? brk.cost.toFixed(0) : '0'}
                              </td>
                              <td className="p-3 text-center pr-5">
                                <button 
                                  type="button"
                                  onClick={() => updateProj({ solidWoodComponents: project.solidWoodComponents.filter((_, i) => i !== idx) })} 
                                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete wood component"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Card View (< 768px) */}
                  <div className="md:hidden divide-y divide-slate-200">
                    {project.solidWoodComponents.map((c, idx) => {
                      const brk = results.breakdown.solidWood[idx];
                      return (
                        <div key={c.id} className="p-4 space-y-3 bg-white">
                          <div className="flex items-center justify-between gap-2">
                            <input 
                              type="text" 
                              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-slate-800" 
                              value={c.name} 
                              onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].name = e.target.value; updateProj({ solidWoodComponents: arr }); }} 
                              placeholder={`Wood Part #${idx + 1} (e.g. Leg, Rail)`} 
                            />
                            <button 
                              type="button"
                              onClick={() => updateProj({ solidWoodComponents: project.solidWoodComponents.filter((_, i) => i !== idx) })} 
                              className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                              title="Delete wood component"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {/* Dimensions (L × W × T) & Qty */}
                          <div className="grid grid-cols-4 gap-1.5">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">L ({unit})</label>
                              <input 
                                type="number" 
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 text-center font-mono text-xs" 
                                value={c.l || ''} 
                                onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].l = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} 
                                placeholder="0" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">W ({unit})</label>
                              <input 
                                type="number" 
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 text-center font-mono text-xs" 
                                value={c.w || ''} 
                                onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].w = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} 
                                placeholder="0" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">T ({unit})</label>
                              <input 
                                type="number" 
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 text-center font-mono text-xs" 
                                value={c.t || ''} 
                                onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].t = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} 
                                placeholder="0" 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Qty</label>
                              <input 
                                type="number" 
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 text-center font-mono text-xs" 
                                value={c.qty} 
                                onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].qty = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} 
                              />
                            </div>
                          </div>

                          {/* Wood Species */}
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Wood Species (Auto-Slab Rate)</label>
                            <select 
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 text-xs text-slate-800" 
                              value={c.woodTypeId} 
                              onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].woodTypeId = e.target.value; updateProj({ solidWoodComponents: arr }); }}
                            >
                              {woodTypes.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Calculated Cost & Rate */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                            <span className="text-slate-500">CFT Rate: <span className="font-mono font-semibold text-slate-700">₹{brk?.rate ? brk.rate.toFixed(0) : '0'}</span></span>
                            <span className="font-mono font-bold text-slate-900">Cost: ₹{brk?.cost ? brk.cost.toFixed(0) : '0'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

                        </>
          )}

          {canAccessFeature('hardware_rates') && (
            <>
              {/* 4. Hardware Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-0">
              <div className="p-3.5 sm:p-4 md:px-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <Wrench className="text-amber-600 shrink-0" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">Hardware</h2>
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium shrink-0">
                    {project.hardware.length} {project.hardware.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => updateProj({ 
                    hardware: [
                      ...project.hardware, 
                      { id: uuidv4(), name: '', qty: 1, rateId: hwRates[0]?.id || '' }
                    ] 
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors shrink-0"
                >
                  <Plus size={14} /> Add Hardware
                </button>
              </div>

              {project.hardware.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs text-slate-500 mb-3">No hardware components added (hinges, channels, handles, screws, locks).</p>
                  <button
                    type="button"
                    onClick={() => updateProj({ 
                      hardware: [
                        ...project.hardware, 
                        { id: uuidv4(), name: '', qty: 1, rateId: hwRates[0]?.id || '' }
                      ] 
                    })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add First Hardware Item
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          <th className="p-3.5 pl-5">Hardware Description</th>
                          <th className="p-3.5 w-20 text-center">Qty</th>
                          <th className="p-3.5 w-72">Rate Master</th>
                          <th className="p-3.5 text-right font-mono pr-4 w-32">Total</th>
                          <th className="p-3.5 w-10 pr-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {project.hardware.map((c, idx) => (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                            <td className="p-3 pl-5">
                              <input 
                                type="text" 
                                className="w-full p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-800" 
                                value={c.name} 
                                onChange={e => { const arr = [...project.hardware]; arr[idx].name = e.target.value; updateProj({ hardware: arr }); }} 
                                placeholder="e.g. Soft-close Concealed Hinge, Handle" 
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input 
                                type="number" 
                                className="w-16 p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-center font-mono" 
                                value={c.qty} 
                                onChange={e => { const arr = [...project.hardware]; arr[idx].qty = Number(e.target.value); updateProj({ hardware: arr }); }} 
                              />
                            </td>
                            <td className="p-3">
                              <select 
                                className="w-full p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-800" 
                                value={c.rateId} 
                                onChange={e => { const arr = [...project.hardware]; arr[idx].rateId = e.target.value; updateProj({ hardware: arr }); }}
                              >
                                <option value="">Custom Item...</option>
                                {hwRates.map(r => (
                                  <option key={r.id} value={r.id}>{r.name} (₹{r.rate}/{r.unit})</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900 pr-4">
                              ₹{results.breakdown.hardware[idx]?.cost ? results.breakdown.hardware[idx].cost.toFixed(0) : '0'}
                            </td>
                            <td className="p-3 text-center pr-5">
                              <button 
                                type="button"
                                onClick={() => updateProj({ hardware: project.hardware.filter((_, i) => i !== idx) })} 
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete hardware"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Card View */}
                  <div className="md:hidden divide-y divide-slate-200">
                    {project.hardware.map((c, idx) => (
                      <div key={c.id} className="p-4 space-y-3 bg-white">
                        <div className="flex items-center justify-between gap-2">
                          <input 
                            type="text" 
                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 text-sm font-semibold text-slate-800" 
                            value={c.name} 
                            onChange={e => { const arr = [...project.hardware]; arr[idx].name = e.target.value; updateProj({ hardware: arr }); }} 
                            placeholder={`Hardware #${idx + 1} (e.g. Hinge)`} 
                          />
                          <button 
                            type="button"
                            onClick={() => updateProj({ hardware: project.hardware.filter((_, i) => i !== idx) })} 
                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                            title="Delete hardware"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Rate Master</label>
                            <select 
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 text-xs text-slate-800" 
                              value={c.rateId} 
                              onChange={e => { const arr = [...project.hardware]; arr[idx].rateId = e.target.value; updateProj({ hardware: arr }); }}
                            >
                              <option value="">Custom Item...</option>
                              {hwRates.map(r => (
                                <option key={r.id} value={r.id}>{r.name} (₹{r.rate}/{r.unit})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Qty</label>
                            <input 
                              type="number" 
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 text-center font-mono text-xs" 
                              value={c.qty} 
                              onChange={e => { const arr = [...project.hardware]; arr[idx].qty = Number(e.target.value); updateProj({ hardware: arr }); }} 
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          <span className="text-slate-500">Hardware Subtotal:</span>
                          <span className="font-mono font-bold text-slate-900">
                            ₹{results.breakdown.hardware[idx]?.cost ? results.breakdown.hardware[idx].cost.toFixed(0) : '0'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
            </>
          )}

          {canAccessFeature('other_rates') && (
            <>
              {/* 5. Finishing (Polish / Paint) Section */}
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-0">
              <div className="p-3.5 sm:p-4 md:px-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <Paintbrush className="text-purple-600 shrink-0" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">Finishing (Polish / Paint)</h2>
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium shrink-0">
                    {project.finishing.length} {project.finishing.length === 1 ? 'surface' : 'surfaces'}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => updateProj({ 
                    finishing: [
                      ...project.finishing, 
                      { id: uuidv4(), name: '', areaSqFt: 0, rateId: finishingRates[0]?.id || '' }
                    ] 
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors shrink-0"
                >
                  <Plus size={14} /> Add Finishing
                </button>
              </div>

              {project.finishing.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs text-slate-500 mb-3">No finishing items added (PU polish, melamine, duco paint, oil finish).</p>
                  <button
                    type="button"
                    onClick={() => updateProj({ 
                      finishing: [
                        ...project.finishing, 
                        { id: uuidv4(), name: '', areaSqFt: 0, rateId: finishingRates[0]?.id || '' }
                      ] 
                    })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add First Finishing Item
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          <th className="p-3.5 pl-5">Surface / Treatment Description</th>
                          <th className="p-3.5 w-28 text-center">Area (sq.ft)</th>
                          <th className="p-3.5 w-72">Rate Master</th>
                          <th className="p-3.5 text-right font-mono pr-4 w-32">Total</th>
                          <th className="p-3.5 w-10 pr-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {project.finishing.map((c, idx) => (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                            <td className="p-3 pl-5">
                              <input 
                                type="text" 
                                className="w-full p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-800" 
                                value={c.name} 
                                onChange={e => { const arr = [...project.finishing]; arr[idx].name = e.target.value; updateProj({ finishing: arr }); }} 
                                placeholder="e.g. PU Matt Polish - All Outer Surfaces" 
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input 
                                type="number" 
                                className="w-20 p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-center font-mono" 
                                value={c.areaSqFt} 
                                onChange={e => { const arr = [...project.finishing]; arr[idx].areaSqFt = Number(e.target.value); updateProj({ finishing: arr }); }} 
                              />
                            </td>
                            <td className="p-3">
                              <select 
                                className="w-full p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs text-slate-800" 
                                value={c.rateId} 
                                onChange={e => { const arr = [...project.finishing]; arr[idx].rateId = e.target.value; updateProj({ finishing: arr }); }}
                              >
                                <option value="">Select Rate...</option>
                                {finishingRates.map(r => (
                                  <option key={r.id} value={r.id}>{r.name} (₹{r.rate}/{r.unit})</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900 pr-4">
                              ₹{results.breakdown.finishing[idx]?.cost ? results.breakdown.finishing[idx].cost.toFixed(0) : '0'}
                            </td>
                            <td className="p-3 text-center pr-5">
                              <button 
                                type="button"
                                onClick={() => updateProj({ finishing: project.finishing.filter((_, i) => i !== idx) })} 
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete finishing item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Card View */}
                  <div className="md:hidden divide-y divide-slate-200">
                    {project.finishing.map((c, idx) => (
                      <div key={c.id} className="p-4 space-y-3 bg-white">
                        <div className="flex items-center justify-between gap-2">
                          <input 
                            type="text" 
                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 text-sm font-semibold text-slate-800" 
                            value={c.name} 
                            onChange={e => { const arr = [...project.finishing]; arr[idx].name = e.target.value; updateProj({ finishing: arr }); }} 
                            placeholder={`Surface #${idx + 1} (e.g. PU Polish)`} 
                          />
                          <button 
                            type="button"
                            onClick={() => updateProj({ finishing: project.finishing.filter((_, i) => i !== idx) })} 
                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                            title="Delete finishing"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Rate Master</label>
                            <select 
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 text-xs text-slate-800" 
                              value={c.rateId} 
                              onChange={e => { const arr = [...project.finishing]; arr[idx].rateId = e.target.value; updateProj({ finishing: arr }); }}
                            >
                              <option value="">Select Rate...</option>
                              {finishingRates.map(r => (
                                <option key={r.id} value={r.id}>{r.name} (₹{r.rate}/{r.unit})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Area (sq.ft)</label>
                            <input 
                              type="number" 
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 text-center font-mono text-xs" 
                              value={c.areaSqFt} 
                              onChange={e => { const arr = [...project.finishing]; arr[idx].areaSqFt = Number(e.target.value); updateProj({ finishing: arr }); }} 
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          <span className="text-slate-500">Finishing Subtotal:</span>
                          <span className="font-mono font-bold text-slate-900">
                            ₹{results.breakdown.finishing[idx]?.cost ? results.breakdown.finishing[idx].cost.toFixed(0) : '0'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
            </>
          )}

          {canAccessFeature('other_rates') && (
            <>
              {/* 6. Labour & Services Section */}
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-0">
              <div className="p-3.5 sm:p-4 md:px-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <HardHat className="text-blue-600 shrink-0" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">Labour & Services</h2>
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium shrink-0">
                    {project.labour.length} {project.labour.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => updateProj({ 
                    labour: [
                      ...project.labour, 
                      { id: uuidv4(), name: '', type: 'hour', qty: 1, rate: 0 }
                    ] 
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors shrink-0"
                >
                  <Plus size={14} /> Add Labour
                </button>
              </div>

              {project.labour.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-xs text-slate-500 mb-3">No direct labour tasks added (carpentry, assembly, carving, packing).</p>
                  <button
                    type="button"
                    onClick={() => updateProj({ 
                      labour: [
                        ...project.labour, 
                        { id: uuidv4(), name: '', type: 'hour', qty: 1, rate: 0 }
                      ] 
                    })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add First Labour Task
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          <th className="p-3.5 pl-5">Description</th>
                          <th className="p-3.5 w-36">Calculation Type</th>
                          <th className="p-3.5 w-20 text-center">Qty</th>
                          <th className="p-3.5 w-28 text-right">Rate (₹ / %)</th>
                          <th className="p-3.5 text-right font-mono pr-4 w-32">Total</th>
                          <th className="p-3.5 w-10 pr-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {project.labour.map((c, idx) => (
                          <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                            <td className="p-3 pl-5">
                              <input 
                                type="text" 
                                className="w-full p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800" 
                                value={c.name} 
                                onChange={e => { const arr = [...project.labour]; arr[idx].name = e.target.value; updateProj({ labour: arr }); }} 
                                placeholder="e.g. Master Carpenter Assembly" 
                              />
                            </td>
                            <td className="p-3">
                              <select 
                                className="w-full p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-800" 
                                value={c.type} 
                                onChange={e => { const arr = [...project.labour]; arr[idx].type = e.target.value as any; updateProj({ labour: arr }); }}
                              >
                                <option value="hour">Per Hour</option>
                                <option value="item">Per Item/Job</option>
                                <option value="percent_material">% of Material</option>
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              <input 
                                type="number" 
                                disabled={c.type === 'percent_material'} 
                                className="w-16 p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center font-mono disabled:bg-slate-100 disabled:text-slate-400" 
                                value={c.qty} 
                                onChange={e => { const arr = [...project.labour]; arr[idx].qty = Number(e.target.value); updateProj({ labour: arr }); }} 
                              />
                            </td>
                            <td className="p-3 text-right">
                              <input 
                                type="number" 
                                className="w-24 p-2 bg-slate-50/60 border border-slate-200 rounded-md outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-right font-mono" 
                                value={c.rate} 
                                onChange={e => { const arr = [...project.labour]; arr[idx].rate = Number(e.target.value); updateProj({ labour: arr }); }} 
                              />
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900 pr-4">
                              ₹{results.breakdown.labour[idx]?.cost ? results.breakdown.labour[idx].cost.toFixed(0) : '0'}
                            </td>
                            <td className="p-3 text-center pr-5">
                              <button 
                                type="button"
                                onClick={() => updateProj({ labour: project.labour.filter((_, i) => i !== idx) })} 
                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete labour task"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Stacked Card View */}
                  <div className="md:hidden divide-y divide-slate-200">
                    {project.labour.map((c, idx) => (
                      <div key={c.id} className="p-4 space-y-3 bg-white">
                        <div className="flex items-center justify-between gap-2">
                          <input 
                            type="text" 
                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-800" 
                            value={c.name} 
                            onChange={e => { const arr = [...project.labour]; arr[idx].name = e.target.value; updateProj({ labour: arr }); }} 
                            placeholder={`Labour Task #${idx + 1}`} 
                          />
                          <button 
                            type="button"
                            onClick={() => updateProj({ labour: project.labour.filter((_, i) => i !== idx) })} 
                            className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                            title="Delete labour"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Type</label>
                            <select 
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs text-slate-800" 
                              value={c.type} 
                              onChange={e => { const arr = [...project.labour]; arr[idx].type = e.target.value as any; updateProj({ labour: arr }); }}
                            >
                              <option value="hour">Per Hour</option>
                              <option value="item">Per Item/Job</option>
                              <option value="percent_material">% of Material</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Qty (Hrs/Nos)</label>
                              <input 
                                type="number" 
                                disabled={c.type === 'percent_material'} 
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-center font-mono text-xs disabled:bg-slate-100 disabled:text-slate-400" 
                                value={c.qty} 
                                onChange={e => { const arr = [...project.labour]; arr[idx].qty = Number(e.target.value); updateProj({ labour: arr }); }} 
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Rate (₹ / %)</label>
                              <input 
                                type="number" 
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 text-right font-mono text-xs" 
                                value={c.rate} 
                                onChange={e => { const arr = [...project.labour]; arr[idx].rate = Number(e.target.value); updateProj({ labour: arr }); }} 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          <span className="text-slate-500">Labour Total:</span>
                          <span className="font-mono font-bold text-slate-900">
                            ₹{results.breakdown.labour[idx]?.cost ? results.breakdown.labour[idx].cost.toFixed(0) : '0'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
            </>
          )}

          </div>
          <Footer className="mt-8 border-t-0 rounded-xl bg-white/70 border border-slate-200/80" />
        </main>
        
        {/* Right Pane (Desktop docked sidebar, on mobile stacked / collapsible bottom drawer) */}
        <aside className="w-full lg:w-[360px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex-shrink-0 flex flex-col z-10 lg:overflow-y-auto custom-scrollbar shadow-[-4px_0_24px_rgba(0,0,0,0.02)] min-w-0">
          
          {/* Main Price Headline */}
          <div className="bg-slate-900 text-white p-4 sm:p-6 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block mb-1">
                Selling Price (inc. GST)
              </span>
              <button 
                type="button"
                onClick={() => setShowMobileBreakdown(prev => !prev)}
                className="lg:hidden flex items-center gap-1 text-xs text-blue-300 bg-slate-800 px-2.5 py-1 rounded-md"
              >
                <span>Breakdown</span>
                {showMobileBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight">
              ₹{results.totals.grandTotal.toFixed(0)}
            </div>

            <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs font-medium flex-wrap">
              <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-slate-300">
                Cost: ₹{results.totals.totalCostPrice.toFixed(0)}
              </span>
              <span className="bg-emerald-950 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded">
                Profit: ₹{results.totals.profitAmount.toFixed(0)}
              </span>
            </div>
          </div>
          
          {/* Detailed Breakdown Container (always visible on desktop, toggleable on mobile) */}
          <div className={`p-4 sm:p-5 flex-1 space-y-4 ${showMobileBreakdown ? 'block' : 'hidden lg:block'}`}>
            {/* Rates Lock Status Card */}
            {!project.isTemplate && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock size={13} className="text-emerald-600" />
                    Material Rates Status
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {project.isPricingLocked || project.ratesSnapshot ? 'LOCKED' : 'DRAFT'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-normal">
                  {project.isPricingLocked || project.ratesSnapshot
                    ? `Frozen at rates from ${formattedLockedDate || 'saved date'}. Raw material price adjustments will not alter this costing.`
                    : 'Material rates will be locked automatically when you save this costing.'}
                </p>

                {!isNew && (
                  <button
                    type="button"
                    onClick={() => setShowUpdatePricingModal(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-blue-700 shadow-sm transition-all"
                  >
                    <Sparkles size={13} className="text-blue-600" />
                    Update on Today's Rates & Copy
                  </button>
                )}
              </div>
            )}

            {/* Cost Breakdown Trace */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <FileText size={14} className="text-slate-400" /> Cost Breakdown Trace
              </h3>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sheet Material</span>
                  <span className="text-slate-900">₹{results.totals.sheetCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Solid Wood</span>
                  <span className="text-slate-900">₹{results.totals.solidWoodCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Edge Banding</span>
                  <span className="text-slate-900">₹{results.totals.edgeBandCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hardware</span>
                  <span className="text-slate-900">₹{results.totals.hardwareCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Finishing</span>
                  <span className="text-slate-900">₹{results.totals.finishingCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-amber-700 border-b border-slate-200 pb-2.5">
                  <span>+ Wastage ({settings.pricing.wastagePercent}%)</span>
                  <span>₹{results.totals.wastageCost.toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between font-bold text-slate-900 pt-0.5">
                  <span>Total Material</span>
                  <span>₹{results.totals.totalMaterialCost.toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between pt-2.5 text-slate-600">
                  <span>Labour</span>
                  <span className="text-slate-900">₹{results.totals.labourCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-2.5">
                  <span>SUBTOTAL</span>
                  <span>₹{results.totals.subtotal.toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between pt-2.5 text-slate-600">
                  <span>Overhead ({settings.pricing.overheadPercent}%)</span>
                  <span className="text-slate-900">₹{results.totals.overheadCost.toFixed(0)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-b border-slate-300 pb-2.5">
                  <span>TOTAL COST PRICE</span>
                  <span>₹{results.totals.totalCostPrice.toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between pt-2.5 text-blue-700 font-medium">
                  <span>Profit Margin ({settings.pricing.profitPercent}%)</span>
                  <span>₹{results.totals.profitAmount.toFixed(0)}</span>
                </div>
                {results.totals.volumeDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Vol. Discount ({settings.pricing.volumeDiscountPercent}%)</span>
                    <span>-₹{results.totals.volumeDiscountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-2.5 text-xs">
                  <span>SELLING (EXCL. GST)</span>
                  <span>₹{results.totals.sellingPrice.toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between pt-2 text-slate-500">
                  <span>GST ({settings.pricing.gstPercent}%)</span>
                  <span>₹{results.totals.gstAmount.toFixed(0)}</span>
                </div>
                
                <div className="flex justify-between font-bold text-indigo-700 pt-2 text-sm mt-2 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100">
                  <span>GRAND TOTAL</span>
                  <span>₹{results.totals.grandTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
