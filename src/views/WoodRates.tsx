import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { WoodType, WoodRange } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, TreePine } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export function WoodRates() {
  const { woodTypes, addWoodType, updateWoodType, deleteWoodType } = useStore();

  const handleAddWoodType = () => {
    addWoodType({
      id: uuidv4(),
      name: 'New Wood Type',
      ranges: [
        { id: uuidv4(), minFt: 0, maxFt: 2, rate: 0 }
      ]
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-24 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Solid Wood Rates</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage wood types and length-based pricing slabs.</p>
        </div>
        <button 
          onClick={handleAddWoodType} 
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs sm:text-sm font-bold shadow-sm transition-colors self-start sm:self-auto shrink-0"
        >
          <Plus size={16} /> Add Wood Type
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {woodTypes.map(wood => (
          <WoodTypeCard key={wood.id} wood={wood} />
        ))}
      </div>
    </div>
  );
}

function WoodTypeCard({ wood: initialWood }: { wood: WoodType; key?: string }) {
  const { updateWoodType, deleteWoodType } = useStore();
  const [wood, setWood] = useState<WoodType>(initialWood);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Track changes locally, save on blur/button
  const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWood({ ...wood, name: e.target.value });
  };

  const handleUpdateRange = (rangeId: string, field: keyof WoodRange, value: number) => {
    setWood({
      ...wood,
      ranges: wood.ranges.map(r => r.id === rangeId ? { ...r, [field]: value } : r)
    });
  };

  const handleAddRange = () => {
    // Auto-calculate next range start based on previous max
    let nextMin = 0;
    if (wood.ranges.length > 0) {
      const maxRange = [...wood.ranges].sort((a, b) => b.maxFt - a.maxFt)[0];
      nextMin = maxRange.maxFt + 0.01;
    }
    
    setWood({
      ...wood,
      ranges: [...wood.ranges, { id: uuidv4(), minFt: nextMin, maxFt: nextMin + 2, rate: 0 }]
    });
  };

  const handleDeleteRange = (id: string) => {
    setWood({
      ...wood,
      ranges: wood.ranges.filter(r => r.id !== id)
    });
  };

  const handleSave = () => {
    updateWoodType(wood);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="text-emerald-700 bg-emerald-100/80 p-2 rounded-lg shrink-0">
            <TreePine size={20} />
          </div>
          <input 
            type="text" 
            value={wood.name}
            onChange={handleChangeName}
            onBlur={handleSave}
            placeholder="Wood Type Name"
            className="font-bold text-base sm:text-lg text-slate-900 bg-transparent outline-none focus:border-b-2 focus:border-emerald-500 w-full truncate"
          />
        </div>
        <button 
          onClick={() => setShowConfirm(true)} 
          className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          title="Delete Wood Type"
          aria-label="Delete Wood Type"
        >
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="p-3 sm:p-4 flex-1 overflow-x-auto">
        <div className="min-w-[280px]">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-2 w-20 sm:w-24">Min (ft)</th>
                <th className="pb-2 w-20 sm:w-24">Max (ft)</th>
                <th className="pb-2 text-right">Rate (₹ / cu.ft)</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {wood.ranges.map(range => (
                <tr key={range.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 pr-2">
                    <input 
                      type="number" 
                      value={range.minFt} 
                      onChange={e => handleUpdateRange(range.id, 'minFt', parseFloat(e.target.value) || 0)} 
                      onBlur={handleSave}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs sm:text-sm text-center font-mono outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                      step="0.01"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input 
                      type="number" 
                      value={range.maxFt} 
                      onChange={e => handleUpdateRange(range.id, 'maxFt', parseFloat(e.target.value) || 0)} 
                      onBlur={handleSave}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs sm:text-sm text-center font-mono outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                      step="0.01"
                    />
                  </td>
                  <td className="py-2">
                    <input 
                      type="number" 
                      value={range.rate} 
                      onChange={e => handleUpdateRange(range.id, 'rate', parseFloat(e.target.value) || 0)} 
                      onBlur={handleSave}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs sm:text-sm text-right font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button 
                      onClick={() => { handleDeleteRange(range.id); setTimeout(handleSave, 10); }} 
                      className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Slab"
                      aria-label="Delete Slab"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="p-3 sm:p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
        <button 
          onClick={handleAddRange} 
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 p-1 rounded hover:bg-emerald-50 transition-colors"
        >
          <Plus size={15} /> Add Slab
        </button>
        <button 
          onClick={handleSave} 
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors"
        >
          Save Changes
        </button>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Delete Wood Type"
          message={`Are you sure you want to delete ${wood.name}? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => deleteWoodType(wood.id)}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
