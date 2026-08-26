import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { RateItem, RateCategory, Unit } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, Edit2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface TabConfig {
  id: string;
  label: string;
}

interface Props {
  title: string;
  tabs: TabConfig[];
}

export function RateMaster({ title, tabs }: Props) {
  const { rates, addRate, updateRate, deleteRate } = useStore();
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RateItem>>({});
  const [rateToDelete, setRateToDelete] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(tabs[0].id);
    setEditingId(null);
  }, [title, tabs]);

  const handleEdit = (rate: RateItem) => {
    setEditingId(rate.id);
    setEditForm({ ...rate });
  };

  const handleSave = () => {
    if (editingId && editForm.name) {
      if (editingId === 'new') {
        addRate({ ...editForm, id: uuidv4() } as RateItem);
      } else {
        updateRate(editForm as RateItem);
      }
      setEditingId(null);
    }
  };

  const startNew = () => {
    setEditingId('new');
    setEditForm({ category: activeTab as RateCategory, unit: 'sq.ft', name: '', rate: 0, thickness: 18 });
  };

  const displayRates = rates.filter(r => r.category === activeTab);
  const showThickness = ['ply', 'board', 'veneer_sheet'].includes(activeTab);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">{title}</h1>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
          <Plus size={16} /> Add Rate
        </button>
      </div>

      {tabs.length > 1 && (
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-neutral-200 shadow-sm self-start">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-neutral-800 text-white shadow' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider w-1/3">Name</th>
                {showThickness && <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Thickness (mm)</th>}
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Unit</th>
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-right">Rate (₹)</th>
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider text-center w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {editingId === 'new' && (
                <tr className="border-b border-blue-100 bg-blue-50/50">
                  <td className="p-3">
                    <input type="text" placeholder="Item Name" className="w-full p-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} autoFocus />
                  </td>
                  {showThickness && (
                    <td className="p-3">
                      <input type="number" placeholder="18" className="w-full p-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.thickness || ''} onChange={e => setEditForm({...editForm, thickness: parseFloat(e.target.value) || undefined})} />
                    </td>
                  )}
                  <td className="p-3">
                    <select className="w-full p-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value as Unit})}>
                      <option value="sq.ft">sq.ft</option>
                      <option value="cu.ft">cu.ft</option>
                      <option value="rmt">rmt</option>
                      <option value="piece">piece</option>
                      <option value="hour">hour</option>
                      <option value="item">item</option>
                      <option value="lumpsum">lumpsum</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <input type="number" placeholder="0.00" className="w-full p-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-right" value={editForm.rate} onChange={e => setEditForm({...editForm, rate: parseFloat(e.target.value) || 0})} />
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={handleSave} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Save size={18} /></button>
                  </td>
                </tr>
              )}
              {displayRates.map(rate => (
                <tr key={rate.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                  {editingId === rate.id ? (
                    <>
                      <td className="p-3"><input type="text" className="w-full p-2 border rounded" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                      {showThickness && (
                        <td className="p-3"><input type="number" className="w-full p-2 border rounded" value={editForm.thickness || ''} onChange={e => setEditForm({...editForm, thickness: parseFloat(e.target.value) || undefined})} /></td>
                      )}
                      <td className="p-3">
                        <select className="w-full p-2 border rounded" value={editForm.unit} onChange={e => setEditForm({...editForm, unit: e.target.value as Unit})}>
                          <option value="sq.ft">sq.ft</option>
                          <option value="cu.ft">cu.ft</option>
                          <option value="rmt">rmt</option>
                          <option value="piece">piece</option>
                          <option value="hour">hour</option>
                          <option value="item">item</option>
                          <option value="lumpsum">lumpsum</option>
                        </select>
                      </td>
                      <td className="p-3"><input type="number" className="w-full p-2 border rounded text-right" value={editForm.rate} onChange={e => setEditForm({...editForm, rate: parseFloat(e.target.value) || 0})} /></td>
                      <td className="p-3 flex justify-center gap-2">
                        <button onClick={handleSave} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Save size={18} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 font-medium text-neutral-900">{rate.name}</td>
                      {showThickness && <td className="p-4 text-neutral-600">{rate.thickness || '-'}</td>}
                      <td className="p-4 text-neutral-500">{rate.unit}</td>
                      <td className="p-4 text-right font-mono font-medium text-neutral-800">₹{rate.rate.toFixed(2)}</td>
                      <td className="p-4 flex justify-center gap-2">
                        <button onClick={() => handleEdit(rate)} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => setRateToDelete(rate.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {displayRates.length === 0 && editingId !== 'new' && (
                <tr>
                  <td colSpan={showThickness ? 5 : 4} className="p-8 text-center text-neutral-400">
                    No rates configured in this category. Click "Add Rate" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rateToDelete && (
        <ConfirmModal
          title="Delete Rate"
          message="Are you sure you want to delete this rate? This action cannot be undone."
          confirmText="Delete"
          onConfirm={() => {
            deleteRate(rateToDelete);
            setRateToDelete(null);
          }}
          onCancel={() => setRateToDelete(null)}
        />
      )}
    </div>
  );
}
