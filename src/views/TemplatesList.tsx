import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Project } from '../types';
import { calculateProjectCost } from '../engine';
import { Edit2, Trash2, Copy, FilePlus2, Plus } from 'lucide-react';
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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Item Templates</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage pre-filled costings templates.</p>
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
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={18} /> New Template
        </button>
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            No templates saved yet. To create one, open an existing costing and click "Save as Template".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Template Name</th>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Category</th>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Size</th>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Selling Price</th>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.slice().reverse().map(p => {
                  const results = calculateProjectCost(p, rates, settings.pricing, woodTypes);
                  return (
                    <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-indigo-700">{p.name || 'Untitled Template'}</div>
                        {p.subName && <div className="text-xs text-indigo-500 mt-0.5">{p.subName}</div>}
                      </td>
                      <td className="p-4 text-neutral-600 text-sm">{p.category || '-'}</td>
                      <td className="p-4 text-neutral-600 text-sm">{p.overallL} × {p.overallW} × {p.overallH} {p.dimensionUnit || 'mm'}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-600">₹{results.totals.grandTotal.toFixed(0)}</td>
                      <td className="p-4 flex justify-center gap-2">
                        <button onClick={() => onUseTemplate(p)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Create a new costing from this template">
                          <FilePlus2 size={14} /> Use
                        </button>
                        <button onClick={() => onEdit(p)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit Template">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDuplicate(p)} className="p-2 text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors" title="Duplicate">
                          <Copy size={16} />
                        </button>
                        <button onClick={() => setTemplateToDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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
