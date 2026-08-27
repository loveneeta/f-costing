import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Project } from '../types';
import { calculateProjectCost, compareProjectRates, generateUpdatedCopyName } from '../engine';
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
  TrendingDown,
  RefreshCw,
  Info
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
  
  const [project, setProject] = useState<Project>(initialProject);
  const [successModal, setSuccessModal] = useState<{show: boolean, title: string, sub?: string}>({show: false, title: ''});
  const [showUpdatePricingModal, setShowUpdatePricingModal] = useState(false);

  const isNew = !projects.find(p => p.id === project.id);

  // Compare locked saved rates vs current live rates
  const rateComparison = useMemo(() => {
    return compareProjectRates(project, rates, settings.pricing, woodTypes);
  }, [project, rates, settings.pricing, woodTypes]);

  const handleSave = () => {
    // When saved, lock the rates snapshot so raw material price changes never affect this saved costing
    const updated: Project = { 
      ...project, 
      dateModified: new Date().toISOString(),
      isPricingLocked: true,
      // If no snapshot exists yet, capture the current store rates snapshot
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
    // Creates a new copy named {ITEM NAME + TODAY'S DATE} with today's live rates
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
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 truncate max-w-md">
                {project.name || 'Untitled Item'}
              </h1>
              {project.isTemplate && (
                <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded border border-indigo-200">
                  TEMPLATE
                </span>
              )}
              {!project.isTemplate && (project.isPricingLocked || project.ratesSnapshot) && (
                <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Lock size={11} /> Rates Locked ({formattedLockedDate || 'Saved'})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {project.category ? `${project.category} • ` : ''}
              {project.overallL || project.overallW || project.overallH ? `${project.overallL || 0} × ${project.overallW || 0} × ${project.overallH || 0} ${unit}` : 'Specifications & BOM'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!project.isTemplate && !isNew && (
            <button 
              onClick={() => setShowUpdatePricingModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-xs font-bold shadow-sm transition-all"
              title="Recalculate pricing with today's material rates and make an updated copy"
            >
              <Sparkles size={15} className="text-blue-600" /> Update on Today's Rates
            </button>
          )}

          {!project.isTemplate && (
            <button 
              onClick={handleSaveAsTemplate} 
              className="flex items-center gap-1.5 px-3.5 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all"
            >
              <Copy size={15} /> Save as Template
            </button>
          )}
          <button 
            onClick={handleSave} 
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold shadow-sm transition-all"
          >
            <Save size={15} /> {project.isTemplate ? 'Save Template' : 'Save Costing'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Main Workspace Pane */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-6 pb-12">
            
            {/* Historical Pricing Notice & Update Banner (if rates changed in master) */}
            {!project.isTemplate && (project.isPricingLocked || project.ratesSnapshot) && rateComparison.hasPriceChange && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg mt-0.5">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">
                      Raw Material Rates Updated in Rate Master
                    </h4>
                    <p className="text-xs text-amber-800/90 mt-0.5">
                      This saved costing is safely locked at <span className="font-bold">₹{rateComparison.lockedGrandTotal.toLocaleString('en-IN')}</span> ({formattedLockedDate}). 
                      Today's current material rates calculate to <span className="font-bold">₹{rateComparison.liveGrandTotal.toLocaleString('en-IN')}</span> ({rateComparison.difference > 0 ? `+₹${rateComparison.difference}` : `-₹${Math.abs(rateComparison.difference)}`}).
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowUpdatePricingModal(true)}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  <Sparkles size={14} />
                  Update & Create Copy
                </button>
              </div>
            )}
            
            {/* 1. Item Specifications Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 md:p-6">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-600" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Item Specifications</h2>
                </div>
                <span className="text-xs text-slate-400 font-medium">General Details & Dimensions</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Item Name */}
                <div className="md:col-span-4">
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
                <div className="md:col-span-4">
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
                <div className="md:col-span-4">
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
                <div className="md:col-span-3">
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
                <div className="md:col-span-9">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Overall Outer Dimensions ({unit})
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-400">L:</span>
                      <input
                        type="number"
                        placeholder="Length"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono text-slate-800 transition-all"
                        value={project.overallL || ''}
                        onChange={e => updateProj({ overallL: Number(e.target.value) })}
                      />
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-400">W:</span>
                      <input
                        type="number"
                        placeholder="Width"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono text-slate-800 transition-all"
                        value={project.overallW || ''}
                        onChange={e => updateProj({ overallW: Number(e.target.value) })}
                      />
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-400">H:</span>
                      <input
                        type="number"
                        placeholder="Height"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono text-slate-800 transition-all"
                        value={project.overallH || ''}
                        onChange={e => updateProj({ overallH: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Sheet Material Parts Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 md:px-6 md:py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <Layers className="text-indigo-600" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sheet Material Parts</h2>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {project.sheetComponents.length} {project.sheetComponents.length === 1 ? 'part' : 'parts'}
                  </span>
                </div>
                <button 
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  <Plus size={14} /> Add Part
                </button>
              </div>

              {project.sheetComponents.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <p className="text-xs text-slate-500 mb-3">No sheet materials added yet (plywood, MDF, boards, laminates).</p>
                  <button
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={13} /> Add First Sheet Part
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                              onClick={() => updateProj({ sheetComponents: project.sheetComponents.filter((_, i) => i !== idx) })} 
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors"
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
              )}
            </section>

            {/* 3. Solid Wood Parts Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 md:px-6 md:py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <TreePine className="text-emerald-600" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Solid Wood Parts</h2>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {project.solidWoodComponents.length} {project.solidWoodComponents.length === 1 ? 'part' : 'parts'}
                  </span>
                </div>
                <button 
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Plus size={14} /> Add Wood Part
                </button>
              </div>

              {project.solidWoodComponents.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <p className="text-xs text-slate-500 mb-3">No solid wood parts added yet (legs, framing, solid tops, lipping).</p>
                  <button
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={13} /> Add First Wood Part
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                                onClick={() => updateProj({ solidWoodComponents: project.solidWoodComponents.filter((_, i) => i !== idx) })} 
                                className="text-slate-400 hover:text-red-500 p-1 transition-colors"
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
              )}
            </section>

            {/* 4. Hardware Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 md:px-6 md:py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <Wrench className="text-amber-600" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Hardware</h2>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {project.hardware.length} {project.hardware.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <button 
                  onClick={() => updateProj({ 
                    hardware: [
                      ...project.hardware, 
                      { id: uuidv4(), name: '', qty: 1, rateId: hwRates[0]?.id || '' }
                    ] 
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
                >
                  <Plus size={14} /> Add Hardware
                </button>
              </div>

              {project.hardware.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <p className="text-xs text-slate-500 mb-3">No hardware components added (hinges, channels, handles, screws, locks).</p>
                  <button
                    onClick={() => updateProj({ 
                      hardware: [
                        ...project.hardware, 
                        { id: uuidv4(), name: '', qty: 1, rateId: hwRates[0]?.id || '' }
                      ] 
                    })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={13} /> Add First Hardware Item
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                              onClick={() => updateProj({ hardware: project.hardware.filter((_, i) => i !== idx) })} 
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors"
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
              )}
            </section>

            {/* 5. Finishing (Polish / Paint) Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 md:px-6 md:py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <Paintbrush className="text-purple-600" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Finishing (Polish / Paint)</h2>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {project.finishing.length} {project.finishing.length === 1 ? 'surface' : 'surfaces'}
                  </span>
                </div>
                <button 
                  onClick={() => updateProj({ 
                    finishing: [
                      ...project.finishing, 
                      { id: uuidv4(), name: '', areaSqFt: 0, rateId: finishingRates[0]?.id || '' }
                    ] 
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors"
                >
                  <Plus size={14} /> Add Finishing
                </button>
              </div>

              {project.finishing.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <p className="text-xs text-slate-500 mb-3">No finishing items added (PU polish, melamine, duco paint, oil finish).</p>
                  <button
                    onClick={() => updateProj({ 
                      finishing: [
                        ...project.finishing, 
                        { id: uuidv4(), name: '', areaSqFt: 0, rateId: finishingRates[0]?.id || '' }
                      ] 
                    })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={13} /> Add First Finishing Item
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                              onClick={() => updateProj({ finishing: project.finishing.filter((_, i) => i !== idx) })} 
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors"
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
              )}
            </section>

            {/* 6. Labour & Services Section */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 md:px-6 md:py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <HardHat className="text-blue-600" size={18} />
                  <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Labour & Services</h2>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                    {project.labour.length} {project.labour.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
                <button 
                  onClick={() => updateProj({ 
                    labour: [
                      ...project.labour, 
                      { id: uuidv4(), name: '', type: 'hour', qty: 1, rate: 0 }
                    ] 
                  })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Plus size={14} /> Add Labour
                </button>
              </div>

              {project.labour.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <p className="text-xs text-slate-500 mb-3">No direct labour tasks added (carpentry, assembly, carving, packing).</p>
                  <button
                    onClick={() => updateProj({ 
                      labour: [
                        ...project.labour, 
                        { id: uuidv4(), name: '', type: 'hour', qty: 1, rate: 0 }
                      ] 
                    })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={13} /> Add First Labour Task
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                              onClick={() => updateProj({ labour: project.labour.filter((_, i) => i !== idx) })} 
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors"
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
              )}
            </section>

          </div>
          <Footer className="mt-8 border-t-0 rounded-xl bg-white/70 border border-slate-200/80" />
        </main>
        
        {/* Right Pane - Real-Time Costing Summary */}
        <aside className="w-[360px] bg-white border-l border-slate-200 flex-shrink-0 flex flex-col z-10 overflow-y-auto custom-scrollbar shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block mb-1.5">
              Selling Price (inc. GST)
            </span>
            <div className="text-4xl font-mono font-bold text-white tracking-tight">
              ₹{results.totals.grandTotal.toFixed(0)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium">
              <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded text-slate-300">
                Cost: ₹{results.totals.totalCostPrice.toFixed(0)}
              </span>
              <span className="bg-emerald-950 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded">
                Profit: ₹{results.totals.profitAmount.toFixed(0)}
              </span>
            </div>
          </div>
          
          <div className="p-5 flex-1 space-y-4">
            {/* Rates Lock Status Card in Sidebar */}
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
                    onClick={() => setShowUpdatePricingModal(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-blue-700 shadow-sm transition-all"
                  >
                    <Sparkles size={13} className="text-blue-600" />
                    Update on Today's Rates & Copy
                  </button>
                )}
              </div>
            )}

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
