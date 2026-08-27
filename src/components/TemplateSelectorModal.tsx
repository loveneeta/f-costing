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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Create New Costing</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Start from scratch or use a pre-filled template</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            
            <button 
              onClick={() => onSelectTemplate(null)}
              className="flex flex-col items-center justify-center gap-3 p-6 sm:p-8 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50/50 transition-colors group min-h-[140px] text-center"
            >
              <div className="p-3 bg-slate-100 text-slate-500 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <FilePlus2 size={24} />
              </div>
              <span className="font-bold text-sm text-slate-800 group-hover:text-blue-700">Start Blank Costing</span>
            </button>

            {templates.map(t => (
              <button 
                key={t.id}
                onClick={() => onSelectTemplate(t)}
                className="flex flex-col items-start justify-center p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group min-h-[140px] text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:bg-indigo-100 transition-colors"></div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg mb-2.5 relative z-10">
                  <Copy size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate w-full relative z-10">{t.name.replace(' (Template)', '')}</h3>
                {t.subName && <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded-md relative z-10">{t.subName}</span>}
                <p className="text-xs text-slate-500 mt-1 relative z-10 truncate w-full">{t.category || 'No Category'}</p>
                <p className="text-[11px] font-mono text-slate-400 mt-1.5 relative z-10">{t.overallL}x{t.overallW}x{t.overallH} mm</p>
              </button>
            ))}

          </div>
          
          {templates.length === 0 && (
            <div className="mt-8 text-center text-slate-500 text-xs sm:text-sm">
              <p>You don't have any templates saved yet.</p>
              <p className="mt-1 text-slate-400">To create one, open an existing costing and click "Save as Template".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
