import React from 'react';
import { CheckCircle2, Copy } from 'lucide-react';

interface Props {
  message: string;
  subMessage?: string;
  onClose: () => void;
  onSaveAsTemplate?: () => void;
}

export function SaveSuccessModal({ message, subMessage, onClose, onSaveAsTemplate }: Props) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">{message}</h2>
          {subMessage && <p className="text-sm text-slate-500 mt-2">{subMessage}</p>}
        </div>
        
        {onSaveAsTemplate && (
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
            <p className="text-xs text-indigo-800 font-medium mb-3">Do you want to reuse this configuration for future items?</p>
            <button 
              onClick={() => {
                onSaveAsTemplate();
                onClose();
              }}
              className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Copy size={16} />
              Save as Template
            </button>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <button 
            onClick={onClose}
            className="w-full px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors"
          >
            {onSaveAsTemplate ? 'No thanks, just close' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
