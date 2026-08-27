import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Project } from '../types';
import { calculateProjectCost } from '../engine';
import { Edit2, Trash2, Copy, Plus, Sparkles, Lock, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmModal } from '../components/ConfirmModal';
import { UpdatePricingModal } from '../components/UpdatePricingModal';

interface Props {
  onEdit: (p: Project) => void;
}

export function CostingsList({ onEdit }: Props) {
  const { projects, deleteProject, addProject, rates, settings, woodTypes } = useStore();
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projectToUpdatePricing, setProjectToUpdatePricing] = useState<Project | null>(null);
  
  const regularProjects = projects.filter(p => !p.isTemplate);

  const handleDuplicate = (p: Project) => {
    const dup = { 
      ...p, 
      id: uuidv4(), 
      name: `${p.name} (Copy)`, 
      dateCreated: new Date().toISOString(), 
      dateModified: new Date().toISOString() 
    };
    addProject(dup);
  };

  const handleConfirmUpdatePricing = (newCopyName: string) => {
    if (!projectToUpdatePricing) return;
    const newCopy: Project = {
      ...projectToUpdatePricing,
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
    setProjectToUpdatePricing(null);
    onEdit(newCopy);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">All Costings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Saved costings retain historical locked material prices</p>
        </div>
        <button 
          onClick={() => onEdit({
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
            isTemplate: false
          })}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus size={18} /> New Costing
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {regularProjects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText size={24} />
            </div>
            <p className="text-sm font-medium">No costings saved yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Name</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Selling Price</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Pricing Status</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Last Modified</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regularProjects.slice().reverse().map(p => {
                    const results = calculateProjectCost(p, rates, settings.pricing, woodTypes);
                    const isLocked = p.isPricingLocked || (p.ratesSnapshot && p.ratesSnapshot.length > 0);
                    const lockedDate = p.ratesLockedAt ? new Date(p.ratesLockedAt).toLocaleDateString() : new Date(p.dateModified).toLocaleDateString();

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 cursor-pointer group-hover:text-blue-600 transition-colors" onClick={() => onEdit(p)}>
                            {p.name || 'Untitled Item'}
                          </div>
                          {p.subName && <div className="text-xs text-slate-500 mt-0.5">{p.subName}</div>}
                        </td>
                        <td className="p-4 text-slate-600 text-sm">{p.category || '-'}</td>
                        <td className="p-4 text-slate-600 text-sm font-mono">{p.overallL} × {p.overallW} × {p.overallH} {p.dimensionUnit || 'mm'}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-700">₹{results.totals.grandTotal.toFixed(0)}</td>
                        <td className="p-4 text-center">
                          {isLocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200" title={`Locked at rates from ${lockedDate}`}>
                              <Lock size={10} /> Rates Locked
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Draft</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 text-sm text-center">{new Date(p.dateModified).toLocaleDateString()}</td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center gap-1">
                            <button 
                              onClick={() => setProjectToUpdatePricing(p)} 
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                              title="Update with Today's Rates & Make Copy"
                            >
                              <Sparkles size={16} />
                            </button>
                            <button onClick={() => onEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDuplicate(p)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Duplicate">
                              <Copy size={16} />
                            </button>
                            <button onClick={() => setProjectToDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (hidden on desktop) */}
            <div className="md:hidden divide-y divide-slate-200">
              {regularProjects.slice().reverse().map(p => {
                const results = calculateProjectCost(p, rates, settings.pricing, woodTypes);
                const isLocked = p.isPricingLocked || (p.ratesSnapshot && p.ratesSnapshot.length > 0);
                const lockedDate = p.ratesLockedAt ? new Date(p.ratesLockedAt).toLocaleDateString() : new Date(p.dateModified).toLocaleDateString();

                return (
                  <div key={p.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate" onClick={() => onEdit(p)}>
                          {p.name || 'Untitled Item'}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                          {p.subName && (
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {p.subName}
                            </span>
                          )}
                          <span>{p.category || 'General'}</span>
                          <span>•</span>
                          <span className="font-mono">{p.overallL}×{p.overallW}×{p.overallH} {p.dimensionUnit || 'mm'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-base text-emerald-700">
                          ₹{results.totals.grandTotal.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-slate-400">inc. GST</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Lock size={10} /> Locked ({lockedDate})
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Draft</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setProjectToUpdatePricing(p)} 
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                          title="Update on Today's Rates"
                        >
                          <Sparkles size={16} />
                        </button>
                        <button 
                          onClick={() => onEdit(p)} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDuplicate(p)} 
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" 
                          title="Duplicate"
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          onClick={() => setProjectToDelete(p.id)} 
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {projectToUpdatePricing && (
        <UpdatePricingModal
          project={projectToUpdatePricing}
          rates={rates}
          woodTypes={woodTypes}
          pricing={settings.pricing}
          onClose={() => setProjectToUpdatePricing(null)}
          onConfirm={handleConfirmUpdatePricing}
        />
      )}

      {projectToDelete && (
        <ConfirmModal
          title="Delete Costing"
          message="Are you sure you want to delete this costing project? This action cannot be undone."
          confirmText="Delete"
          onConfirm={() => {
            deleteProject(projectToDelete);
            setProjectToDelete(null);
          }}
          onCancel={() => setProjectToDelete(null)}
        />
      )}
    </div>
  );
}
