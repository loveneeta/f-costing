import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface Props {
  message: string;
  subMessage?: string;
  onClose: () => void;
}

export function SaveSuccessModal({ message, subMessage, onClose }: Props) {
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
        <div className="mt-6 flex justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
