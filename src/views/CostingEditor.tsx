import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Project, SheetComponent, HardwareComponent, SolidWoodComponent, FinishingComponent, LabourComponent } from '../types';
import { calculateProjectCost } from '../engine';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, ArrowLeft, Save, FileText, Layers, TreePine, Wrench, Copy, HardHat, Paintbrush } from 'lucide-react';
import { SaveSuccessModal } from '../components/SaveSuccessModal';

interface Props {
  project: Project;
  onClose: () => void;
}

export function CostingEditor({ project: initialProject, onClose }: Props) {
  const { rates, woodTypes, settings, updateProject, addProject, projects } = useStore();
  
  const [project, setProject] = useState<Project>(initialProject);
  const [successModal, setSuccessModal] = useState<{show: boolean, title: string, sub?: string}>({show: false, title: ''});

  const isNew = !projects.find(p => p.id === project.id);

  const handleSave = () => {
    const updated = { ...project, dateModified: new Date().toISOString() };
    if (isNew) {
      addProject(updated);
    } else {
      updateProject(updated);
    }
    setSuccessModal({ 
      show: true, 
      title: project.isTemplate ? 'Template saved successfully' : 'Costing saved successfully',
      sub: project.isTemplate ? 'You can reuse this template anytime from the Item Templates menu.' : 'Your project costing has been updated and saved.'
    });
  };

  const handleSaveAsTemplate = () => {
    const template = {
      ...project,
      id: uuidv4(),
      isTemplate: true,
      name: `${project.name} (Template)`,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString()
    };
    addProject(template);
    setSuccessModal({ 
      show: true, 
      title: 'Saved as new Item Template!',
      sub: 'This costing is now saved as a reusable template. You can access it when creating a new item.'
    });
  };

  const results = useMemo(() => calculateProjectCost(project, rates, settings.pricing, woodTypes), [project, rates, settings.pricing, woodTypes]);

  const sheetRates = rates.filter(r => ['sheet', 'ply', 'board', 'veneer_sheet'].includes(r.category));
  const edgeRates = rates.filter(r => ['edgeband', 'veneer_edge'].includes(r.category));
  const hwRates = rates.filter(r => r.category === 'hardware');
  const finishingRates = rates.filter(r => r.category === 'finishing');
  
  const updateProj = (updates: Partial<Project>) => setProject(prev => ({ ...prev, ...updates }));

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden font-sans">
      {successModal.show && <SaveSuccessModal message={successModal.title} subMessage={successModal.sub} onClose={() => setSuccessModal({show: false, title: ''})} onSaveAsTemplate={successModal.title === 'Costing saved successfully' ? handleSaveAsTemplate : undefined} />}
      {/* Editor Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              {project.isTemplate ? <span className="text-indigo-600 mr-2">[TEMPLATE]</span> : null}
              {project.name || 'Untitled Item'}
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{project.category || 'No Category'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!project.isTemplate && (
            <button onClick={handleSaveAsTemplate} className="flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 text-sm font-semibold transition-all">
              <Copy size={16} /> Save as Template
            </button>
          )}
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-md text-sm font-semibold transition-all">
            <Save size={16} /> {project.isTemplate ? 'Save Template' : 'Save Costing'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Pane - Editor Workspace */}
        <main className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8 pb-12">
            
            {/* Primary Details */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                <FileText className="text-blue-500" size={18} />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Item Specifications</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Item Name</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all" value={project.name} onChange={e => updateProj({ name: e.target.value })} placeholder="e.g. Bedside Table" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Variation / Sub Name</label>
                  <input type="text" list="variation-suggestions" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all" value={project.subName || ''} onChange={e => updateProj({ subName: e.target.value })} placeholder="e.g. 1 tier, 2 door" />
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
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all" value={project.category} onChange={e => updateProj({ category: e.target.value })} placeholder="e.g. Cabinet" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unit</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all" value={project.dimensionUnit || 'mm'} onChange={e => updateProj({ dimensionUnit: e.target.value as any })}>
                    <option value="mm">mm</option>
                    <option value="cm">cm</option>
                    <option value="inch">inches</option>
                    <option value="ft">feet</option>
                    <option value="m">meters</option>
                  </select>
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Overall Dimensions ({project.dimensionUnit || 'mm'})</label>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder={`L (${project.dimensionUnit || 'mm'})`} className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-center transition-all" value={project.overallL || ''} onChange={e => updateProj({ overallL: Number(e.target.value) })} />
                    <span className="text-slate-400 font-medium">×</span>
                    <input type="number" placeholder={`W (${project.dimensionUnit || 'mm'})`} className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-center transition-all" value={project.overallW || ''} onChange={e => updateProj({ overallW: Number(e.target.value) })} />
                    <span className="text-slate-400 font-medium">×</span>
                    <input type="number" placeholder={`H (${project.dimensionUnit || 'mm'})`} className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-center transition-all" value={project.overallH || ''} onChange={e => updateProj({ overallH: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
            </section>

            {/* Sheet Components */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <Layers className="text-indigo-500" size={18} />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Sheet Material Parts</h2>
                </div>
                <button 
                  onClick={() => updateProj({ sheetComponents: [...project.sheetComponents, { id: uuidv4(), name: '', l: 0, w: 0, qty: 1, rateId: sheetRates[0]?.id || '', edgeTop: false, edgeBottom: false, edgeLeft: false, edgeRight: false, edgeRateId: edgeRates[0]?.id || '' }] })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  <Plus size={14} /> Add Part
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      <th className="p-4 w-40">Component</th>
                      <th className="p-4 w-16 text-center">Qty</th>
                      <th className="p-4 w-32 text-center">Size (L×W) in {project.dimensionUnit || 'mm'}</th>
                      <th className="p-4 w-40">Material Rate</th>
                      <th className="p-4 text-center border-l border-slate-200" colSpan={4}>Edgebanding (T B L R)</th>
                      <th className="p-4 w-32 border-l border-slate-200">Edge Rate</th>
                      <th className="p-4 text-right">Cost</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.sheetComponents.map((c, idx) => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="p-3"><input type="text" className="w-full p-2 border border-slate-200 rounded-md outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-sm" value={c.name} onChange={e => { const arr = [...project.sheetComponents]; arr[idx].name = e.target.value; updateProj({ sheetComponents: arr }); }} placeholder="Name" /></td>
                        <td className="p-3"><input type="number" className="w-full p-2 border border-slate-200 rounded-md outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-center shadow-sm" value={c.qty} onChange={e => { const arr = [...project.sheetComponents]; arr[idx].qty = Number(e.target.value); updateProj({ sheetComponents: arr }); }} /></td>
                        <td className="p-3 flex items-center justify-center gap-1">
                          <input type="number" className="w-20 p-2 border border-slate-200 rounded-md outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-center shadow-sm" value={c.l || ''} onChange={e => { const arr = [...project.sheetComponents]; arr[idx].l = Number(e.target.value); updateProj({ sheetComponents: arr }); }} placeholder={`L (${project.dimensionUnit || 'mm'})`} />
                          <span className="text-slate-400 text-xs">×</span>
                          <input type="number" className="w-20 p-2 border border-slate-200 rounded-md outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-center shadow-sm" value={c.w || ''} onChange={e => { const arr = [...project.sheetComponents]; arr[idx].w = Number(e.target.value); updateProj({ sheetComponents: arr }); }} placeholder={`W (${project.dimensionUnit || 'mm'})`} />
                        </td>
                        <td className="p-3">
                          <select className="w-full p-2 border border-slate-200 rounded-md outline-none text-xs focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-sm" value={c.rateId} onChange={e => { const arr = [...project.sheetComponents]; arr[idx].rateId = e.target.value; updateProj({ sheetComponents: arr }); }}>
                            {sheetRates.map(r => <option key={r.id} value={r.id}>{r.name} (₹{r.rate}/{r.unit})</option>)}
                          </select>
                        </td>
                        <td className="p-3 text-center border-l border-slate-100"><input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" checked={c.edgeTop} onChange={e => { const arr = [...project.sheetComponents]; arr[idx].edgeTop = e.target.checked; updateProj({ sheetComponents: arr }); }} /></td>
                        <td className="p-3 text-center"><input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" checked={c.edgeBottom} onChange={e => { const arr = [...project.sheetComponents]; arr[idx].edgeBottom = e.target.checked; updateProj({ sheetComponents: arr }); }} /></td>
                        <td className="p-3 text-center"><input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" checked={c.edgeLeft} onChange={e => { const arr = [...project.sheetComponents]; arr[idx].edgeLeft = e.target.checked; updateProj({ sheetComponents: arr }); }} /></td>
                        <td className="p-3 text-center"><input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" checked={c.edgeRight} onChange={e => { const arr = [...project.sheetComponents]; arr[idx].edgeRight = e.target.checked; updateProj({ sheetComponents: arr }); }} /></td>
                        <td className="p-3 border-l border-slate-100">
                           <select className="w-full p-2 border border-slate-200 rounded-md outline-none text-xs focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 shadow-sm" value={c.edgeRateId} onChange={e => { const arr = [...project.sheetComponents]; arr[idx].edgeRateId = e.target.value; updateProj({ sheetComponents: arr }); }}>
                            <option value="">No Edgeband</option>
                            {edgeRates.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          ₹{(results.breakdown.sheet[idx]?.cost + results.breakdown.sheet[idx]?.edgeCost).toFixed(0)}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => updateProj({ sheetComponents: project.sheetComponents.filter((_, i) => i !== idx) })} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                    {project.sheetComponents.length === 0 && (
                      <tr><td colSpan={11} className="p-10 text-center text-slate-400 text-sm font-medium">No sheet materials added.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Solid Wood Components */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <TreePine className="text-emerald-500" size={18} />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Solid Wood Parts</h2>
                </div>
                <button 
                  onClick={() => updateProj({ solidWoodComponents: [...project.solidWoodComponents, { id: uuidv4(), name: '', l: 0, w: 0, t: 0, qty: 1, woodTypeId: woodTypes[0]?.id || '' }] })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  <Plus size={14} /> Add Wood Part
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                      <th className="p-4 w-48">Component</th>
                      <th className="p-4 w-16 text-center">Qty</th>
                      <th className="p-4 w-48 text-center">Size (L×W×T) in {project.dimensionUnit || 'mm'}</th>
                      <th className="p-4">Wood Type (Auto-Slab)</th>
                      <th className="p-4 text-right w-24">Calc Rate</th>
                      <th className="p-4 text-right w-32">Cost</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.solidWoodComponents.map((c, idx) => {
                       const brk = results.breakdown.solidWood[idx];
                       return (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="p-3"><input type="text" className="w-full p-2 border border-slate-200 rounded-md outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 shadow-sm" value={c.name} onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].name = e.target.value; updateProj({ solidWoodComponents: arr }); }} placeholder="Name" /></td>
                        <td className="p-3"><input type="number" className="w-full p-2 border border-slate-200 rounded-md outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-center shadow-sm" value={c.qty} onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].qty = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} /></td>
                        <td className="p-3 flex items-center justify-center gap-1">
                          <input type="number" className="w-16 p-2 border border-slate-200 rounded-md outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-center shadow-sm" value={c.l || ''} onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].l = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} placeholder={`L (${project.dimensionUnit || 'mm'})`} />
                          <span className="text-slate-400 text-xs">×</span>
                          <input type="number" className="w-16 p-2 border border-slate-200 rounded-md outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-center shadow-sm" value={c.w || ''} onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].w = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} placeholder={`W (${project.dimensionUnit || 'mm'})`} />
                          <span className="text-slate-400 text-xs">×</span>
                          <input type="number" className="w-16 p-2 border border-slate-200 rounded-md outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 text-center shadow-sm" value={c.t || ''} onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].t = Number(e.target.value); updateProj({ solidWoodComponents: arr }); }} placeholder={`T (${project.dimensionUnit || 'mm'})`} />
                        </td>
                        <td className="p-3">
                          <select className="w-full p-2 border border-slate-200 rounded-md outline-none text-xs focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 shadow-sm" value={c.woodTypeId} onChange={e => { const arr = [...project.solidWoodComponents]; arr[idx].woodTypeId = e.target.value; updateProj({ solidWoodComponents: arr }); }}>
                            {woodTypes.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                        </td>
                        <td className="p-3 text-right text-[11px] text-slate-500 font-mono font-medium bg-slate-50 border-l border-slate-100">
                           ₹{brk?.rate.toFixed(0)}/cft
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                          ₹{brk?.cost.toFixed(0)}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => updateProj({ solidWoodComponents: project.solidWoodComponents.filter((_, i) => i !== idx) })} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    )})}
                    {project.solidWoodComponents.length === 0 && (
                      <tr><td colSpan={7} className="p-10 text-center text-slate-400 text-sm font-medium">No solid wood parts added.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Hardware */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <Wrench className="text-orange-500" size={18} />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Hardware</h2>
                </div>
                <button 
                  onClick={() => updateProj({ hardware: [...project.hardware, { id: uuidv4(), name: '', qty: 1, rateId: hwRates[0]?.id || '' }] })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors"
                >
                  <Plus size={14} /> Add Hardware
                </button>
              </div>
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    <tr>
                      <th className="p-4">Item</th>
                      <th className="p-4 w-24 text-center">Qty</th>
                      <th className="p-4">Rate Master</th>
                      <th className="p-4 text-right w-32">Total</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                 </thead>
                 <tbody>
                    {project.hardware.map((c, idx) => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                         <td className="p-3"><input type="text" className="w-full p-2 border border-slate-200 rounded-md outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 shadow-sm" value={c.name} onChange={e => { const arr = [...project.hardware]; arr[idx].name = e.target.value; updateProj({ hardware: arr }); }} placeholder="e.g. Hinge" /></td>
                         <td className="p-3"><input type="number" className="w-full p-2 border border-slate-200 rounded-md outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 text-center shadow-sm" value={c.qty} onChange={e => { const arr = [...project.hardware]; arr[idx].qty = Number(e.target.value); updateProj({ hardware: arr }); }} /></td>
                         <td className="p-3">
                            <select className="w-full p-2 border border-slate-200 rounded-md outline-none text-xs focus:border-orange-400 focus:ring-1 focus:ring-orange-400 shadow-sm" value={c.rateId} onChange={e => { const arr = [...project.hardware]; arr[idx].rateId = e.target.value; updateProj({ hardware: arr }); }}>
                              <option value="">Custom Item...</option>
                              {hwRates.map(r => <option key={r.id} value={r.id}>{r.name} (₹{r.rate})</option>)}
                            </select>
                         </td>
                         <td className="p-3 text-right font-mono font-bold text-slate-800">₹{results.breakdown.hardware[idx]?.cost.toFixed(0)}</td>
                         <td className="p-3 text-center"><button onClick={() => updateProj({ hardware: project.hardware.filter((_, i) => i !== idx) })} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button></td>
                      </tr>
                    ))}
                 </tbody>
              </table>
            </section>

            {/* Finishing */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <Paintbrush className="text-purple-500" size={18} />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Finishing (Polish / Paint)</h2>
                </div>
                <button 
                  onClick={() => updateProj({ finishing: [...project.finishing, { id: uuidv4(), name: '', areaSqFt: 0, rateId: '' }] })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors"
                >
                  <Plus size={14} /> Add Finishing
                </button>
              </div>
              
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    <tr>
                      <th className="p-4">Surface / Item</th>
                      <th className="p-4 w-28 text-center">Area (sq.ft)</th>
                      <th className="p-4">Rate Master</th>
                      <th className="p-4 text-right w-32">Total</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                 </thead>
                 <tbody>
                    {project.finishing.map((c, idx) => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                         <td className="p-3"><input type="text" className="w-full p-2 border border-slate-200 rounded-md outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 shadow-sm" value={c.name} onChange={e => { const arr = [...project.finishing]; arr[idx].name = e.target.value; updateProj({ finishing: arr }); }} placeholder="e.g. PU Polish - Top" /></td>
                         <td className="p-3"><input type="number" className="w-full p-2 border border-slate-200 rounded-md outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-center shadow-sm" value={c.areaSqFt} onChange={e => { const arr = [...project.finishing]; arr[idx].areaSqFt = Number(e.target.value); updateProj({ finishing: arr }); }} /></td>
                         <td className="p-3">
                            <select className="w-full p-2 border border-slate-200 rounded-md outline-none text-xs focus:border-purple-400 focus:ring-1 focus:ring-purple-400 shadow-sm" value={c.rateId} onChange={e => { const arr = [...project.finishing]; arr[idx].rateId = e.target.value; updateProj({ finishing: arr }); }}>
                              <option value="">Select Rate...</option>
                              {finishingRates.map(r => <option key={r.id} value={r.id}>{r.name} (₹{r.rate}/{r.unit})</option>)}
                            </select>
                         </td>
                         <td className="p-3 text-right font-mono font-bold text-slate-800">₹{results.breakdown.finishing[idx]?.cost.toFixed(0)}</td>
                         <td className="p-3 text-center"><button onClick={() => updateProj({ finishing: project.finishing.filter((_, i) => i !== idx) })} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button></td>
                      </tr>
                    ))}
                    {project.finishing.length === 0 && (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-400 text-sm font-medium">No finishing added.</td></tr>
                    )}
                 </tbody>
              </table>
            </section>

            {/* Labour */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                  <HardHat className="text-blue-500" size={18} />
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Labour & Services</h2>
                </div>
                <button 
                  onClick={() => updateProj({ labour: [...project.labour, { id: uuidv4(), name: '', type: 'hour', qty: 1, rate: 0 }] })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Plus size={14} /> Add Labour
                </button>
              </div>
              
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    <tr>
                      <th className="p-4">Description</th>
                      <th className="p-4 w-36">Type</th>
                      <th className="p-4 w-24 text-center">Qty</th>
                      <th className="p-4 w-32 text-right">Rate / %</th>
                      <th className="p-4 text-right w-32">Total</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                 </thead>
                 <tbody>
                    {project.labour.map((c, idx) => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                         <td className="p-3"><input type="text" className="w-full p-2 border border-slate-200 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-sm" value={c.name} onChange={e => { const arr = [...project.labour]; arr[idx].name = e.target.value; updateProj({ labour: arr }); }} placeholder="e.g. Assembly / Carpentry" /></td>
                         <td className="p-3">
                            <select className="w-full p-2 border border-slate-200 rounded-md outline-none text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-400 shadow-sm" value={c.type} onChange={e => { const arr = [...project.labour]; arr[idx].type = e.target.value as any; updateProj({ labour: arr }); }}>
                              <option value="hour">Per Hour</option>
                              <option value="item">Per Item/Job</option>
                              <option value="percent_material">% of Material</option>
                            </select>
                         </td>
                         <td className="p-3"><input type="number" disabled={c.type === 'percent_material'} className="w-full p-2 border border-slate-200 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-center shadow-sm disabled:bg-slate-100 disabled:text-slate-400" value={c.qty} onChange={e => { const arr = [...project.labour]; arr[idx].qty = Number(e.target.value); updateProj({ labour: arr }); }} /></td>
                         <td className="p-3"><input type="number" className="w-full p-2 border border-slate-200 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-right shadow-sm" value={c.rate} onChange={e => { const arr = [...project.labour]; arr[idx].rate = Number(e.target.value); updateProj({ labour: arr }); }} /></td>
                         <td className="p-3 text-right font-mono font-bold text-slate-800">₹{results.breakdown.labour[idx]?.cost.toFixed(0)}</td>
                         <td className="p-3 text-center"><button onClick={() => updateProj({ labour: project.labour.filter((_, i) => i !== idx) })} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button></td>
                      </tr>
                    ))}
                    {project.labour.length === 0 && (
                      <tr><td colSpan={6} className="p-10 text-center text-slate-400 text-sm font-medium">No labour costs added.</td></tr>
                    )}
                 </tbody>
              </table>
            </section>

          </div>
        </main>
        
        {/* Right Pane - Costing Summary */}
        <aside className="w-[380px] bg-white border-l border-slate-200 flex-shrink-0 flex flex-col z-10 overflow-y-auto custom-scrollbar shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
           <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
             <h2 className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-3 opacity-90">Final Selling Price</h2>
             <div className="text-5xl font-mono font-bold text-white tracking-tighter">
               ₹{results.totals.grandTotal.toFixed(0)}
             </div>
             <div className="mt-4 flex items-center gap-3 text-xs font-medium">
                <span className="bg-white/10 px-2.5 py-1 rounded-md text-slate-300">Cost: ₹{results.totals.totalCostPrice.toFixed(0)}</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-md">Profit: ₹{results.totals.profitAmount.toFixed(0)}</span>
             </div>
           </div>
           
           <div className="p-6 flex-1">
             <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                 <FileText size={14} /> Cost Breakdown Trace
               </h3>
               <div className="space-y-2.5 font-mono text-xs">
                 <div className="flex justify-between text-slate-600"><span>Sheet Material</span><span className="text-slate-900">₹{results.totals.sheetCost.toFixed(0)}</span></div>
                 <div className="flex justify-between text-slate-600"><span>Solid Wood</span><span className="text-slate-900">₹{results.totals.solidWoodCost.toFixed(0)}</span></div>
                 <div className="flex justify-between text-slate-600"><span>Edge Banding</span><span className="text-slate-900">₹{results.totals.edgeBandCost.toFixed(0)}</span></div>
                 <div className="flex justify-between text-slate-600"><span>Hardware</span><span className="text-slate-900">₹{results.totals.hardwareCost.toFixed(0)}</span></div>
                 <div className="flex justify-between text-slate-600"><span>Finishing</span><span className="text-slate-900">₹{results.totals.finishingCost.toFixed(0)}</span></div>
                 <div className="flex justify-between text-orange-600/80 border-b border-slate-200 pb-3"><span>+ Wastage ({settings.pricing.wastagePercent}%)</span><span>₹{results.totals.wastageCost.toFixed(0)}</span></div>
                 <div className="flex justify-between font-bold text-slate-900 pt-1"><span>Total Material</span><span>₹{results.totals.totalMaterialCost.toFixed(0)}</span></div>
                 
                 <div className="flex justify-between pt-3 text-slate-600"><span>Labour</span><span className="text-slate-900">₹{results.totals.labourCost.toFixed(0)}</span></div>
                 <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-3"><span>SUBTOTAL</span><span>₹{results.totals.subtotal.toFixed(0)}</span></div>
                 
                 <div className="flex justify-between pt-3 text-slate-600"><span>Overhead</span><span className="text-slate-900">₹{results.totals.overheadCost.toFixed(0)}</span></div>
                 <div className="flex justify-between font-bold text-slate-900 border-b border-slate-300 pb-3"><span>TOTAL COST</span><span>₹{results.totals.totalCostPrice.toFixed(0)}</span></div>
                 
                 <div className="flex justify-between pt-3 text-blue-600 font-medium"><span>Profit ({settings.pricing.profitPercent}%)</span><span>₹{results.totals.profitAmount.toFixed(0)}</span></div>
                 {results.totals.volumeDiscountAmount > 0 && (
                   <div className="flex justify-between text-emerald-600"><span>Vol. Discount ({settings.pricing.volumeDiscountPercent}%)</span><span>-₹{results.totals.volumeDiscountAmount.toFixed(0)}</span></div>
                 )}
                 <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-3 text-sm"><span>SELLING PRICE</span><span>₹{results.totals.sellingPrice.toFixed(0)}</span></div>
                 
                 <div className="flex justify-between pt-3 text-slate-500"><span>GST ({settings.pricing.gstPercent}%)</span><span>₹{results.totals.gstAmount.toFixed(0)}</span></div>
                 <div className="flex justify-between font-bold text-indigo-600 pt-2 text-base mt-2 bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
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
