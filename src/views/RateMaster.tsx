import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { RateItem, RateCategory, Unit } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, Edit2, X, Tags } from 'lucide-react';
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
    if (editingId && editForm.name?.trim()) {
      if (editingId === 'new') {
        addRate({ ...editForm, id: uuidv4() } as RateItem);
      } else {
        updateRate(editForm as RateItem);
      }
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const startNew = () => {
    setEditingId('new');
    setEditForm({ category: activeTab as RateCategory, unit: 'sq.ft', name: '', rate: 0, thickness: 18 });
  };

  const displayRates = rates.filter(r => r.category === activeTab);
  const showThickness = ['ply', 'board', 'veneer_sheet'].includes(activeTab);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage live benchmark rates. Saved historical costings will remain locked at their original prices.
          </p>
        </div>
        <button 
          onClick={startNew} 
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-bold transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          <Plus size={16} /> Add Rate
        </button>
      </div>

      {/* Category Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar self-start max-w-full">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setEditingId(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 overflow-hidden">
        
        {/* Mobile New Rate Inline Form */}
        {editingId === 'new' && (
          <div className="md:hidden p-4 bg-blue-50/70 border-b border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">New Rate Item</span>
              <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Item Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Commercial Ply 18mm" 
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium" 
                  value={editForm.name || ''} 
                  onChange={e => setEditForm({...editForm, name: e.target.value})} 
                  autoFocus 
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {showThickness && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Thickness (mm)</label>
                    <input 
                      type="number" 
                      placeholder="18" 
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                      value={editForm.thickness || ''} 
                      onChange={e => setEditForm({...editForm, thickness: parseFloat(e.target.value) || undefined})} 
                    />
                  </div>
                )}
                <div className={showThickness ? '' : 'col-span-2'}>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Unit</label>
                  <select 
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={editForm.unit} 
                    onChange={e => setEditForm({...editForm, unit: e.target.value as Unit})}
                  >
                    <option value="sq.ft">sq.ft</option>
                    <option value="cu.ft">cu.ft</option>
                    <option value="rmt">rmt</option>
                    <option value="piece">piece</option>
                    <option value="hour">hour</option>
                    <option value="item">item</option>
                    <option value="lumpsum">lumpsum</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Rate (₹)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-slate-900" 
                  value={editForm.rate ?? ''} 
                  onChange={e => setEditForm({...editForm, rate: parseFloat(e.target.value) || 0})} 
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={handleCancel}
                  className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!editForm.name?.trim()}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Save size={14} /> Save Rate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto h-full">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/3">Name</th>
                {showThickness && <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Thickness (mm)</th>}
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Unit</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Rate (₹)</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {editingId === 'new' && (
                <tr className="border-b border-blue-100 bg-blue-50/50">
                  <td className="p-3">
                    <input 
                      type="text" 
                      placeholder="Item Name" 
                      className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={editForm.name || ''} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})} 
                      autoFocus 
                    />
                  </td>
                  {showThickness && (
                    <td className="p-3">
                      <input 
                        type="number" 
                        placeholder="18" 
                        className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                        value={editForm.thickness || ''} 
                        onChange={e => setEditForm({...editForm, thickness: parseFloat(e.target.value) || undefined})} 
                      />
                    </td>
                  )}
                  <td className="p-3">
                    <select 
                      className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={editForm.unit} 
                      onChange={e => setEditForm({...editForm, unit: e.target.value as Unit})}
                    >
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
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono font-bold" 
                      value={editForm.rate ?? ''} 
                      onChange={e => setEditForm({...editForm, rate: parseFloat(e.target.value) || 0})} 
                    />
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={handleSave} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Save">
                        <Save size={16} />
                      </button>
                      <button onClick={handleCancel} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Cancel">
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {displayRates.map(rate => (
                <tr key={rate.id} className="hover:bg-slate-50/80 transition-colors">
                  {editingId === rate.id ? (
                    <>
                      <td className="p-3">
                        <input 
                          type="text" 
                          className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                          value={editForm.name || ''} 
                          onChange={e => setEditForm({...editForm, name: e.target.value})} 
                        />
                      </td>
                      {showThickness && (
                        <td className="p-3">
                          <input 
                            type="number" 
                            className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                            value={editForm.thickness || ''} 
                            onChange={e => setEditForm({...editForm, thickness: parseFloat(e.target.value) || undefined})} 
                          />
                        </td>
                      )}
                      <td className="p-3">
                        <select 
                          className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                          value={editForm.unit} 
                          onChange={e => setEditForm({...editForm, unit: e.target.value as Unit})}
                        >
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
                        <input 
                          type="number" 
                          className="w-full p-2 border border-blue-200 rounded-lg text-sm text-right font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                          value={editForm.rate ?? ''} 
                          onChange={e => setEditForm({...editForm, rate: parseFloat(e.target.value) || 0})} 
                        />
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button onClick={handleSave} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Save">
                            <Save size={16} />
                          </button>
                          <button onClick={handleCancel} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Cancel">
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 font-semibold text-slate-900 text-sm">{rate.name}</td>
                      {showThickness && <td className="p-4 text-slate-600 text-sm font-mono">{rate.thickness ? `${rate.thickness} mm` : '-'}</td>}
                      <td className="p-4 text-slate-500 text-sm">{rate.unit}</td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900 text-sm">₹{rate.rate.toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button onClick={() => handleEdit(rate)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setRateToDelete(rate.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {displayRates.length === 0 && editingId !== 'new' && (
                <tr>
                  <td colSpan={showThickness ? 5 : 4} className="p-12 text-center text-slate-400 text-sm">
                    No rates configured in this category. Click "Add Rate" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View */}
        <div className="md:hidden divide-y divide-slate-200">
          {displayRates.map(rate => {
            const isEditing = editingId === rate.id;

            if (isEditing) {
              return (
                <div key={rate.id} className="p-4 bg-blue-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Edit Rate</span>
                    <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 p-1">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Item Name</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium" 
                        value={editForm.name || ''} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})} 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {showThickness && (
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Thickness (mm)</label>
                          <input 
                            type="number" 
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono" 
                            value={editForm.thickness || ''} 
                            onChange={e => setEditForm({...editForm, thickness: parseFloat(e.target.value) || undefined})} 
                          />
                        </div>
                      )}
                      <div className={showThickness ? '' : 'col-span-2'}>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Unit</label>
                        <select 
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
                          value={editForm.unit} 
                          onChange={e => setEditForm({...editForm, unit: e.target.value as Unit})}
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="cu.ft">cu.ft</option>
                          <option value="rmt">rmt</option>
                          <option value="piece">piece</option>
                          <option value="hour">hour</option>
                          <option value="item">item</option>
                          <option value="lumpsum">lumpsum</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Rate (₹)</label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-slate-900" 
                        value={editForm.rate ?? ''} 
                        onChange={e => setEditForm({...editForm, rate: parseFloat(e.target.value) || 0})} 
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={handleCancel}
                        className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={!editForm.name?.trim()}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Save size={14} /> Save Rate
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={rate.id} className="p-4 space-y-2.5 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{rate.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                      {showThickness && rate.thickness && (
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold">
                          {rate.thickness} mm
                        </span>
                      )}
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {rate.unit}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-base text-slate-900">
                      ₹{rate.rate.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">per {rate.unit}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => handleEdit(rate)} 
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                    title="Edit Rate"
                    aria-label="Edit Rate"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setRateToDelete(rate.id)} 
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                    title="Delete Rate"
                    aria-label="Delete Rate"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {displayRates.length === 0 && editingId !== 'new' && (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <Tags size={24} className="mx-auto text-slate-300 mb-1" />
              <p>No rates configured in this category.</p>
              <button 
                onClick={startNew}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 font-semibold rounded-lg text-xs hover:bg-blue-100 transition-colors"
              >
                <Plus size={14} /> Add First Rate
              </button>
            </div>
          )}
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

