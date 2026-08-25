import React from 'react';
import { Project } from '../types';
import { useStore } from '../context/StoreContext';
import { FilePlus2, Copy, X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSelectTemplate: (template: Project | null) => void;
}

export function TemplateSelectorModal({ onClose, onSelectTemplate }: Props) {
  const { projects } = useStore();
  const templates = projects.filter(p => p.isTemplate);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create New Costing</h2>
            <p className="text-sm text-slate-500 mt-1">Start from scratch or use a pre-filled template</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <button 
              onClick={() => onSelectTemplate(null)}
              className="flex flex-col items-center justify-center gap-3 p-8 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group h-40 text-center"
            >
              <div className="p-3 bg-slate-100 text-slate-500 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <FilePlus2 size={24} />
              </div>
              <span className="font-bold text-slate-700 group-hover:text-blue-700">Start Blank Costing</span>
            </button>

            {templates.map(t => (
              <button 
                key={t.id}
                onClick={() => onSelectTemplate(t)}
                className="flex flex-col items-start justify-center p-6 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group h-40 text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:bg-indigo-100 transition-colors"></div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mb-3 relative z-10">
                  <Copy size={20} />
                </div>
                <h3 className="font-bold text-slate-800 text-base truncate w-full relative z-10">{t.name.replace(' (Template)', '')}</h3>
                {t.subName && <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded-md relative z-10">{t.subName}</span>}
                <p className="text-xs text-slate-500 mt-1 relative z-10 truncate w-full">{t.category || 'No Category'}</p>
                <p className="text-xs text-slate-400 mt-2 relative z-10">{t.overallL}x{t.overallW}x{t.overallH} mm</p>
              </button>
            ))}

          </div>
          
          {templates.length === 0 && (
            <div className="mt-8 text-center text-slate-500 text-sm">
              <p>You don't have any templates saved yet.</p>
              <p className="mt-1">To create one, open an existing costing and click "Save as Template".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
