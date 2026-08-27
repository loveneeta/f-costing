import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { calculateProjectCost } from '../engine';
import { 
  FileText, 
  Tags, 
  Plus, 
  TrendingUp, 
  Search, 
  Copy, 
  Edit2, 
  Trash2, 
  Hammer, 
  Zap, 
  FolderOpen,
  Sparkles,
  Lock
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { UpdatePricingModal } from '../components/UpdatePricingModal';

interface Props {
  onEdit: (p: Project) => void;
}

export function Dashboard({ onEdit }: Props) {
  const { projects, rates, woodTypes, settings, addProject, deleteProject } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [projectToUpdatePricing, setProjectToUpdatePricing] = useState<Project | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Quick Estimator Scratchpad State - Starts completely blank with no dummy pre-fills
  const [quickL, setQuickL] = useState<string>('');
  const [quickW, setQuickW] = useState<string>('');
  const [quickH, setQuickH] = useState<string>('');
  const [quickRateId, setQuickRateId] = useState<string>(rates[0]?.id || '');
  const [quickFinishArea, setQuickFinishArea] = useState<string>('');

  const regularProjects = useMemo(() => projects.filter(p => !p.isTemplate), [projects]);
  const templates = useMemo(() => projects.filter(p => p.isTemplate), [projects]);

  // Calculated Portfolio Metrics from actual projects
  const portfolioStats = useMemo(() => {
    let totalSellingValue = 0;
    let totalCostPrice = 0;
    let totalRawMaterialCost = 0;
    let totalLabourCost = 0;

    regularProjects.forEach(p => {
      const res = calculateProjectCost(p, rates, settings?.pricing, woodTypes);
      totalSellingValue += res.totals.grandTotal;
      totalCostPrice += res.totals.totalCostPrice;
      totalRawMaterialCost += res.totals.rawMaterialCost;
      totalLabourCost += res.totals.labourCost;
    });

    const avgMargin = totalSellingValue > 0 
      ? Math.round(((totalSellingValue - totalCostPrice) / totalSellingValue) * 100) 
      : (settings?.pricing?.profitPercent || 0);

    return {
      totalSellingValue,
      totalCostPrice,
      totalRawMaterialCost,
      totalLabourCost,
      avgMargin,
      avgProjectPrice: regularProjects.length > 0 ? Math.round(totalSellingValue / regularProjects.length) : 0
    };
  }, [regularProjects, rates, settings, woodTypes]);

  // Categories list for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    regularProjects.forEach(p => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [regularProjects]);

  const filteredProjects = useMemo(() => {
    return regularProjects.filter(p => {
      const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.subName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [regularProjects, searchTerm, categoryFilter]);

  const handleDuplicate = (p: Project) => {
    const dup = {
      ...p,
      id: uuidv4(),
      name: `${p.name} (Copy)`,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString()
    };
    addProject(dup);
  };

  const handleConfirmUpdatePricing = (newCopyName: string) => {
    if (!projectToUpdatePricing) return;
    const newCopy: Project = {
      ...projectToUpdatePricing,
      id: uuidv4(),
      name: newCopyName,
      ratesSnapshot: rates,
      woodTypesSnapshot: woodTypes,
      pricingSnapshot: settings.pricing,
      ratesLockedAt: new Date().toISOString(),
      isPricingLocked: true,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
    };
    addProject(newCopy);
    setProjectToUpdatePricing(null);
    onEdit(newCopy);
  };

  const handleClearAllCostings = () => {
    regularProjects.forEach(p => {
      deleteProject(p.id);
    });
    setConfirmClearAll(false);
  };

  // Scratchpad calculator - only computes when user provides valid numbers
  const scratchpadEstimate = useMemo(() => {
    const numL = parseFloat(quickL);
    const numW = parseFloat(quickW);
    const numH = parseFloat(quickH);
    const numFinish = parseFloat(quickFinishArea) || 0;

    if (!numL || !numW || !numH || isNaN(numL) || isNaN(numW) || isNaN(numH) || numL <= 0 || numW <= 0 || numH <= 0) {
      return null;
    }

    const selectedRate = rates.find(r => r.id === quickRateId)?.rate || 0;
    // Box surface area: 2*(L*W + W*H + L*H) mm2 / 92903.04 sqft
    const surfaceSqFt = (2 * (numL * numW + numW * numH + numL * numH)) / 92903.04;
    const materialCost = surfaceSqFt * selectedRate * 1.15; // 15% hardware & wastage
    const finishRate = rates.find(r => r.category === 'finishing')?.rate || 0;
    const finishCost = numFinish * finishRate;
    const labourCost = materialCost * 0.25;
    const subtotal = materialCost + finishCost + labourCost;
    const overhead = subtotal * ((settings?.pricing?.overheadPercent || 0) / 100);
    const profit = (subtotal + overhead) * ((settings?.pricing?.profitPercent || 0) / 100);
    const total = subtotal + overhead + profit;
    const gst = total * ((settings?.pricing?.gstPercent || 0) / 100);

    return {
      surfaceSqFt: Math.round(surfaceSqFt * 10) / 10,
      materialCost: Math.round(materialCost),
      finishCost: Math.round(finishCost),
      labourCost: Math.round(labourCost),
      estimatedTotal: Math.round(total + gst)
    };
  }, [quickL, quickW, quickH, quickRateId, quickFinishArea, rates, settings]);

  const createBlankCosting = () => {
    onEdit({
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
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header & Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Costing & Manufacturing Dashboard
            </h1>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              Active Workspace
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Real-time material costing, bill of materials, profit margins & quote generation
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {regularProjects.length > 0 && (
            <button
              onClick={() => setConfirmClearAll(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
              title="Clear all costings in workspace"
            >
              <Trash2 size={15} />
              Clear All Costings
            </button>
          )}

          <button
            onClick={createBlankCosting}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            <Plus size={18} />
            New Costing
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Costings */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Costings</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{regularProjects.length}</div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
              <span className="font-semibold text-blue-600">{templates.length} templates</span>
              <span>•</span>
              <span>{categories.length} categories</span>
            </div>
          </div>
        </div>

        {/* Portfolio Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Portfolio Value</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-700 font-mono">
              ₹{portfolioStats.totalSellingValue > 0 ? portfolioStats.totalSellingValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
              <span>Avg. item:</span>
              <span className="font-semibold text-slate-700">
                {regularProjects.length > 0 ? `₹${portfolioStats.avgProjectPrice.toLocaleString('en-IN')}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Rate Master Inventory */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Material Master</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Tags size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{rates.length}</div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <span>{woodTypes.length} Wood Species</span>
              <span>•</span>
              <span className="text-purple-600 font-medium">Configured</span>
            </div>
          </div>
        </div>

        {/* Target Margins */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Profit Margin</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Zap size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-amber-700">
              {settings?.pricing?.profitPercent ?? 0}%
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
              <span>Overhead: {settings?.pricing?.overheadPercent ?? 0}%</span>
              <span>•</span>
              <span>GST: {settings?.pricing?.gstPercent ?? 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Body: Costings Directory & Instant Scratchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Costings List & Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-slate-600" />
              Recent Costings
            </h2>

            {/* Search & Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search costings..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none w-36 sm:w-48"
                />
              </div>

              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {regularProjects.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                  <FolderOpen size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">No costings yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Your workspace is empty. Create your first furniture costing to get started.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={createBlankCosting}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
                  >
                    <Plus size={16} />
                    Create First Costing
                  </button>
                </div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No costings found matching "{searchTerm}".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-slate-50/80 border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Item Details</th>
                      <th className="p-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                      <th className="p-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Dimensions (mm)</th>
                      <th className="p-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Selling Price</th>
                      <th className="p-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProjects.map(p => {
                      const res = calculateProjectCost(p, rates, settings?.pricing, woodTypes);
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => onEdit(p)}
                        >
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                              {p.name || 'Untitled Item'}
                            </div>
                            {p.subName && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{p.subName}</div>
                            )}
                          </td>
                          <td className="p-3.5 text-xs text-slate-600">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                              {p.category || 'General'}
                            </span>
                          </td>
                          <td className="p-3.5 text-xs font-mono text-slate-600">
                            {p.overallL || 0} × {p.overallW || 0} × {p.overallH || 0}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-700 text-sm">
                            ₹{res.totals.grandTotal.toFixed(0)}
                          </td>
                          <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setProjectToUpdatePricing(p)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                title="Update on Today's Pricing & Make Copy"
                              >
                                <Sparkles size={15} />
                              </button>
                              <button
                                onClick={() => onEdit(p)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit Costing"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDuplicate(p)}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                                title="Duplicate"
                              >
                                <Copy size={15} />
                              </button>
                              <button
                                onClick={() => setProjectToDelete(p.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Estimator Scratchpad + Material Rates Preview */}
        <div className="space-y-6">
          {/* Quick Scratchpad Estimator */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Hammer size={16} className="text-blue-600" />
                Rough Estimator Scratchpad
              </h3>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Interactive</span>
            </div>
            <p className="text-xs text-slate-500">
              Enter dimensions below to calculate an instant material & selling cost estimate.
            </p>

            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">L (mm)</label>
                  <input
                    type="number"
                    value={quickL}
                    onChange={e => setQuickL(e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-center font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">W (mm)</label>
                  <input
                    type="number"
                    value={quickW}
                    onChange={e => setQuickW(e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-center font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">H (mm)</label>
                  <input
                    type="number"
                    value={quickH}
                    onChange={e => setQuickH(e.target.value)}
                    placeholder="0"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-center font-mono focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Primary Board Material</label>
                <select
                  value={quickRateId}
                  onChange={e => setQuickRateId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {rates.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} (₹{r.rate}/{r.unit})
                    </option>
                  ))}
                </select>
              </div>

              {scratchpadEstimate ? (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Surface Area:</span>
                    <span className="font-mono font-medium">{scratchpadEstimate.surfaceSqFt} sq.ft</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Est. Material & Labour:</span>
                    <span className="font-mono">₹{(scratchpadEstimate.materialCost + scratchpadEstimate.labourCost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
                    <span>Est. Selling (inc. GST):</span>
                    <span className="font-mono text-emerald-700">₹{scratchpadEstimate.estimatedTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50/70 p-3.5 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  Enter dimensions (L, W, H) above to view cost estimate
                </div>
              )}
            </div>
          </div>

          {/* Rate Master Quick Glance */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Tags size={16} className="text-purple-600" />
                Active Material Rates
              </h3>
              <span className="text-[11px] text-purple-600 font-bold">{rates.length} configured</span>
            </div>

            {rates.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No material rates configured
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100">
                {rates.slice(0, 5).map(r => (
                  <div key={r.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <p className="font-medium text-slate-800 truncate">{r.name}</p>
                      <span className="text-[10px] text-slate-400 uppercase">{r.category}</span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 whitespace-nowrap">
                      ₹{r.rate} <span className="text-[10px] font-normal text-slate-500">/{r.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Pricing Modal */}
      {projectToUpdatePricing && (
        <UpdatePricingModal
          project={projectToUpdatePricing}
          rates={rates}
          woodTypes={woodTypes}
          pricing={settings.pricing}
          onClose={() => setProjectToUpdatePricing(null)}
          onConfirm={handleConfirmUpdatePricing}
        />
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <ConfirmModal
          title="Delete Costing"
          message="Are you sure you want to delete this costing project? This action cannot be undone."
          confirmText="Delete"
          onConfirm={() => {
            deleteProject(projectToDelete);
            setProjectToDelete(null);
          }}
          onCancel={() => setProjectToDelete(null)}
        />
      )}

      {/* Clear All Confirmation Modal */}
      {confirmClearAll && (
        <ConfirmModal
          title="Clear All Costings"
          message="Are you sure you want to delete all costing records in your workspace? This cannot be undone."
          confirmText="Clear All"
          onConfirm={handleClearAllCostings}
          onCancel={() => setConfirmClearAll(false)}
        />
      )}
    </div>
  );
}
