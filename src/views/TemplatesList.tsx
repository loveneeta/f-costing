import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Project } from '../types';
import { calculateProjectCost } from '../engine';
import { Edit2, Trash2, Copy, FilePlus2, Plus, CopyCheck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ConfirmModal } from '../components/ConfirmModal';

interface Props {
  onEdit: (p: Project) => void;
  onUseTemplate: (p: Project) => void;
}

export function TemplatesList({ onEdit, onUseTemplate }: Props) {
  const { projects, deleteProject, addProject, rates, settings, woodTypes } = useStore();
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  
  const templates = projects.filter(p => p.isTemplate);

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
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Item Templates</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage pre-filled costing templates for standard furniture items.</p>
        </div>
        <button 
          onClick={() => onEdit({
            id: uuidv4(),
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            name: 'New Template',
            category: '',
            overallL: 0,
            overallW: 0,
            overallH: 0,
            sheetComponents: [],
            solidWoodComponents: [],
            hardware: [],
            finishing: [],
            labour: [],
            isTemplate: true
          })}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus size={18} /> New Template
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <CopyCheck size={24} />
            </div>
            <p className="text-sm font-medium text-slate-800">No templates saved yet.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              To create one, open an existing costing and click "Save as Template" or click the button above.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Template Name</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Selling Price</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {templates.slice().reverse().map(p => {
                    const results = calculateProjectCost(p, rates, settings.pricing, woodTypes);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4">
                          <div className="font-bold text-indigo-700">{p.name || 'Untitled Template'}</div>
                          {p.subName && <div className="text-xs text-indigo-500 mt-0.5">{p.subName}</div>}
                        </td>
                        <td className="p-4 text-slate-600 text-sm">{p.category || '-'}</td>
                        <td className="p-4 text-slate-600 text-sm font-mono">{p.overallL} × {p.overallW} × {p.overallH} {p.dimensionUnit || 'mm'}</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-700">₹{results.totals.grandTotal.toFixed(0)}</td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <button 
                              onClick={() => onUseTemplate(p)} 
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" 
                              title="Create a new costing from this template"
                            >
                              <FilePlus2 size={14} /> Use
                            </button>
                            <button onClick={() => onEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Template">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDuplicate(p)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Duplicate">
                              <Copy size={16} />
                            </button>
                            <button onClick={() => setTemplateToDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

            {/* Mobile Stacked Card View */}
            <div className="md:hidden divide-y divide-slate-200">
              {templates.slice().reverse().map(p => {
                const results = calculateProjectCost(p, rates, settings.pricing, woodTypes);
                return (
                  <div key={p.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="font-bold text-sm text-indigo-800 truncate">{p.name || 'Untitled Template'}</div>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                          {p.subName && (
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
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
                      <button 
                        onClick={() => onUseTemplate(p)} 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                      >
                        <FilePlus2 size={14} /> Use Template
                      </button>

                      <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDuplicate(p)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Duplicate">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => setTemplateToDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

      {templateToDelete && (
        <ConfirmModal
          title="Delete Template"
          message="Are you sure you want to delete this template? This action cannot be undone."
          confirmText="Delete"
          onConfirm={() => {
            deleteProject(templateToDelete);
            setTemplateToDelete(null);
          }}
          onCancel={() => setTemplateToDelete(null)}
        />
      )}
    </div>
  );
}
