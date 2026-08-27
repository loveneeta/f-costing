import React from 'react';
import { useStore } from '../context/StoreContext';
import { Calculator, Tags, Activity, FileText, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '../types';

interface Props {
  onEdit: (p: Project) => void;
}

export function Dashboard({ onEdit }: Props) {
  const { projects, rates } = useStore();
  
  const regularProjects = projects.filter(p => !p.isTemplate);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
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
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> New Costing
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={24} /></div>
            <div>
              <p className="text-sm font-medium text-neutral-500 uppercase">Total Costings</p>
              <h3 className="text-2xl font-bold text-neutral-900">{regularProjects.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Tags size={24} /></div>
            <div>
              <p className="text-sm font-medium text-neutral-500 uppercase">Rate Master Items</p>
              <h3 className="text-2xl font-bold text-neutral-900">{rates.length}</h3>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-neutral-800 mb-4">Recent Costings</h2>
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {regularProjects.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No costings yet. Create one to get started.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase">Item Name</th>
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase">Category</th>
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase">Dimensions</th>
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {regularProjects.slice().reverse().slice(0, 5).map(p => (
                <tr key={p.id} onClick={() => onEdit(p)} className="border-b border-neutral-100 hover:bg-neutral-100 cursor-pointer transition-colors">
                  <td className="p-4 font-bold text-neutral-900">{p.name || 'Untitled Item'}</td>
                  <td className="p-4 text-neutral-600">{p.category || '-'}</td>
                  <td className="p-4 text-neutral-600">{p.overallL} × {p.overallW} × {p.overallH}</td>
                  <td className="p-4 text-neutral-500 text-right">{new Date(p.dateModified).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
