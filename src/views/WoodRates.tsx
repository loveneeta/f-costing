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
    <div className="p-8 max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Solid Wood Rates</h1>
          <p className="text-sm text-neutral-500">Manage wood types and length-based pricing slabs.</p>
        </div>
        <button onClick={handleAddWoodType} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium shadow-sm">
          <Plus size={16} /> Add Wood Type
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
        <div className="flex items-center gap-3 w-full">
          <div className="text-emerald-600 bg-emerald-100 p-2 rounded-lg"><TreePine size={20} /></div>
          <input 
            type="text" 
            value={wood.name}
            onChange={handleChangeName}
            onBlur={handleSave}
            className="font-bold text-lg text-neutral-900 bg-transparent outline-none focus:border-b-2 focus:border-emerald-500 w-full"
          />
        </div>
        <button onClick={() => setShowConfirm(true)} className="text-neutral-400 hover:text-red-500 ml-4 p-2">
          <Trash2 size={18} />
        </button>
      </div>
      
      <div className="p-4 flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-100">
              <th className="pb-2 w-24">Min (ft)</th>
              <th className="pb-2 w-24">Max (ft)</th>
              <th className="pb-2 text-right">Rate (₹ / cu.ft)</th>
              <th className="pb-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {wood.ranges.map(range => (
              <tr key={range.id} className="border-b border-neutral-50 last:border-0">
                <td className="py-2 pr-2">
                  <input 
                    type="number" 
                    value={range.minFt} 
                    onChange={e => handleUpdateRange(range.id, 'minFt', parseFloat(e.target.value) || 0)} 
                    onBlur={handleSave}
                    className="w-full p-2 border border-neutral-200 rounded text-sm text-center outline-none focus:border-emerald-500" 
                    step="0.01"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input 
                    type="number" 
                    value={range.maxFt} 
                    onChange={e => handleUpdateRange(range.id, 'maxFt', parseFloat(e.target.value) || 0)} 
                    onBlur={handleSave}
                    className="w-full p-2 border border-neutral-200 rounded text-sm text-center outline-none focus:border-emerald-500" 
                    step="0.01"
                  />
                </td>
                <td className="py-2">
                  <input 
                    type="number" 
                    value={range.rate} 
                    onChange={e => handleUpdateRange(range.id, 'rate', parseFloat(e.target.value) || 0)} 
                    onBlur={handleSave}
                    className="w-full p-2 border border-neutral-200 rounded text-sm text-right font-mono font-medium outline-none focus:border-emerald-500" 
                  />
                </td>
                <td className="py-2 text-right">
                  <button onClick={() => { handleDeleteRange(range.id); setTimeout(handleSave, 10); }} className="text-neutral-400 hover:text-red-500 p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center">
        <button onClick={handleAddRange} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-widest flex items-center gap-1">
          <Plus size={14} /> Add Slab
        </button>
        <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-md text-xs font-bold shadow-sm hover:bg-emerald-700">
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
