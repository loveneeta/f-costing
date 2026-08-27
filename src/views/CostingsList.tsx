import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Project } from '../types';
import { calculateProjectCost } from '../engine';
import { Edit2, Trash2, Copy, Plus, Sparkles, Lock } from 'lucide-react';
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">All Costings</h1>
          <p className="text-xs text-neutral-500 mt-1">Saved costings retain historical locked material prices</p>
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
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} /> New Costing
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {regularProjects.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No costings saved yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Item Name</th>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Category</th>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Size</th>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Selling Price</th>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Pricing Status</th>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Last Modified</th>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {regularProjects.slice().reverse().map(p => {
                  const results = calculateProjectCost(p, rates, settings.pricing, woodTypes);
                  const isLocked = p.isPricingLocked || (p.ratesSnapshot && p.ratesSnapshot.length > 0);
                  const lockedDate = p.ratesLockedAt ? new Date(p.ratesLockedAt).toLocaleDateString() : new Date(p.dateModified).toLocaleDateString();

                  return (
                    <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-neutral-900">{p.name || 'Untitled Item'}</div>
                        {p.subName && <div className="text-xs text-neutral-500 mt-0.5">{p.subName}</div>}
                      </td>
                      <td className="p-4 text-neutral-600 text-sm">{p.category || '-'}</td>
                      <td className="p-4 text-neutral-600 text-sm">{p.overallL} × {p.overallW} × {p.overallH} {p.dimensionUnit || 'mm'}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-600">₹{results.totals.grandTotal.toFixed(0)}</td>
                      <td className="p-4 text-center">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200" title={`Locked at rates from ${lockedDate}`}>
                            <Lock size={10} /> Rates Locked
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-400 font-medium">Draft</span>
                        )}
                      </td>
                      <td className="p-4 text-neutral-500 text-sm text-center">{new Date(p.dateModified).toLocaleDateString()}</td>
                      <td className="p-4 flex justify-center gap-1.5">
                        <button 
                          onClick={() => setProjectToUpdatePricing(p)} 
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                          title="Update with Today's Rates & Make Copy ({ITEM NAME + TODAY'S DATE})"
                        >
                          <Sparkles size={16} />
                        </button>
                        <button onClick={() => onEdit(p)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDuplicate(p)} className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors" title="Duplicate">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => setProjectToDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
