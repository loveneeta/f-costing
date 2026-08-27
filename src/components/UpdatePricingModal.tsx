import React, { useState } from 'react';
import { Project, RateItem, WoodType, PricingSettings } from '../types';
import { compareProjectRates, generateUpdatedCopyName } from '../engine';
import { Sparkles, Calendar, ArrowRight, TrendingUp, TrendingDown, Minus, CheckCircle, X, ShieldCheck } from 'lucide-react';

interface Props {
  project: Project;
  rates: RateItem[];
  woodTypes: WoodType[];
  pricing: PricingSettings;
  onClose: () => void;
  onConfirm: (newCopyName: string) => void;
}

export function UpdatePricingModal({ project, rates, woodTypes, pricing, onClose, onConfirm }: Props) {
  const [copyName, setCopyName] = useState(() => generateUpdatedCopyName(project.name));

  const comparison = compareProjectRates(project, rates, pricing, woodTypes);

  const formattedLockedDate = project.ratesLockedAt 
    ? new Date(project.ratesLockedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : (project.dateModified ? new Date(project.dateModified).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Previous Save');

  const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyName.trim()) return;
    onConfirm(copyName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
              <Sparkles size={22} className="text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Update with Today's Material Rates</h3>
              <p className="text-xs text-blue-100 mt-0.5">Recalculate pricing on today's raw material master & create a new copy</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Information box */}
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-4 flex gap-3 text-xs text-blue-900">
            <ShieldCheck size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Historical Pricing Protected</p>
              <p className="text-blue-800/90 leading-relaxed">
                Your original costing <span className="font-bold">"{project.name || 'Untitled'}"</span> will remain safely locked at its original rates ({formattedLockedDate}). A new version will be created with today's live material prices.
              </p>
            </div>
          </div>

          {/* New Item Name input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              New Costing Name <span className="text-slate-400 font-normal normal-case">(Item Name + Today's Date)</span>
            </label>
            <input
              type="text"
              required
              value={copyName}
              onChange={e => setCopyName(e.target.value)}
              placeholder="e.g. Bedside Table - 27 Aug 2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Defaulted to item name with today's date: <span className="font-mono text-slate-600">{todayFormatted}</span>
            </p>
          </div>

          {/* Price Comparison Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Price Comparison</span>
              <span className="text-[11px] font-normal lowercase">inclusive of GST</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Locked Price */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  Saved Price ({formattedLockedDate})
                </div>
                <div className="text-2xl font-mono font-bold text-slate-800">
                  ₹{comparison.lockedGrandTotal.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-medium">Historical snapshot</div>
              </div>

              {/* Today's Live Price */}
              <div className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="text-[11px] font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-blue-600" />
                  Today's Price ({todayFormatted})
                </div>
                <div className="text-2xl font-mono font-bold text-blue-900 flex items-baseline gap-2">
                  ₹{comparison.liveGrandTotal.toLocaleString('en-IN')}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
                  {comparison.difference > 0 ? (
                    <span className="text-amber-700 flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                      <TrendingUp size={12} /> +₹{comparison.difference.toLocaleString('en-IN')} (+{comparison.percentageChange.toFixed(1)}%)
                    </span>
                  ) : comparison.difference < 0 ? (
                    <span className="text-emerald-700 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                      <TrendingDown size={12} /> -₹{Math.abs(comparison.difference).toLocaleString('en-IN')} ({comparison.percentageChange.toFixed(1)}%)
                    </span>
                  ) : (
                    <span className="text-slate-600 flex items-center gap-0.5 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      <Minus size={12} /> Same as saved (₹0 change)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Changed Material Items List if any */}
          {comparison.changedItems.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 border-b border-slate-200 flex justify-between items-center">
                <span>Material Rate Changes ({comparison.changedItems.length})</span>
                <span className="text-[10px] text-slate-500 font-normal">Old Rate ➔ Today's Rate</span>
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 bg-white">
                {comparison.changedItems.map((item, idx) => (
                  <div key={idx} className="px-4 py-2 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="ml-2 text-[10px] text-slate-400 uppercase">({item.category})</span>
                    </div>
                    <div className="font-mono text-xs flex items-center gap-2">
                      <span className="text-slate-500 line-through">₹{item.oldRate}/{item.unit}</span>
                      <ArrowRight size={12} className="text-slate-400" />
                      <span className="font-bold text-blue-700">₹{item.newRate}/{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!copyName.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
            >
              <CheckCircle size={16} />
              Create Copy & Update to Today's Rates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
