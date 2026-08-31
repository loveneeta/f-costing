import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useTenant } from '../contexts/TenantContext';
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
  Zap, 
  FolderOpen,
  Sparkles,
  Lock
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { UpdatePricingModal } from '../components/UpdatePricingModal';
import { RoughEstimator } from '../components/RoughEstimator';

interface Props {
  onEdit: (p: Project) => void;
}

export function Dashboard({ onEdit }: Props) {
  const { projects, rates, woodTypes, settings, addProject, deleteProject } = useStore();
  const { canAccessFeature } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const allowedRates = rates.filter(r => {
    if (r.category === 'solid_wood') return canAccessFeature('wood_rates');
    if (r.category === 'hardware') return canAccessFeature('hardware_rates');
    if (r.category === 'veneer_sheet' || r.category === 'veneer_edge' || r.category === 'veneer_other') return canAccessFeature('veneer_rates');
    if (r.category === 'ply') return canAccessFeature('ply_sheets');
    if (r.category === 'board') return canAccessFeature('board_sheets');
    return canAccessFeature('other_rates');
  });
  const [projectToUpdatePricing, setProjectToUpdatePricing] = useState<Project | null>(null);

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* 1. Header & Primary Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Costing & Manufacturing Dashboard
            </h1>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              Active Workspace
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time material costing, bill of materials, profit margins & quote generation
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={createBlankCosting}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors"
          >
            <Plus size={18} />
            New Costing
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Costings */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Costings</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{regularProjects.length}</div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
              <span className="font-semibold text-blue-600">{templates.length} templates</span>
              <span>•</span>
              <span>{categories.length} categories</span>
            </div>
          </div>
        </div>

        {/* Portfolio Valuation */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Portfolio Value</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
              ₹{portfolioStats.totalSellingValue > 0 ? portfolioStats.totalSellingValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500 flex-wrap">
              <span>Avg. item:</span>
              <span className="font-semibold text-slate-700">
                {regularProjects.length > 0 ? `₹${portfolioStats.avgProjectPrice.toLocaleString('en-IN')}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Rate Master Inventory */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Material Master</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Tags size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{rates.length}</div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 flex-wrap">
              <span>{woodTypes.length} Wood Species</span>
              <span>•</span>
              <span className="text-purple-600 font-medium">Configured</span>
            </div>
          </div>
        </div>

        {/* Target Margins */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Profit Margin</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Zap size={20} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">
              {settings?.pricing?.profitPercent ?? 0}%
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
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
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-slate-600" />
              Recent Costings
            </h2>

            {/* Search & Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:flex-initial">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search costings..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-48"
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
              <div className="p-8 sm:p-12 text-center space-y-4">
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
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-colors"
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
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
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

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-200">
                  {filteredProjects.map(p => {
                    const res = calculateProjectCost(p, rates, settings?.pricing, woodTypes);
                    return (
                      <div key={p.id} className="p-4 space-y-2.5 bg-white">
                        <div className="flex items-start justify-between gap-2" onClick={() => onEdit(p)}>
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-sm text-slate-900 truncate">
                              {p.name || 'Untitled Item'}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500">
                              {p.subName && (
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-medium">
                                  {p.subName}
                                </span>
                              )}
                              <span>{p.category || 'General'}</span>
                              <span>•</span>
                              <span className="font-mono">{p.overallL || 0}×{p.overallW || 0}×{p.overallH || 0}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-sm text-emerald-700">
                              ₹{res.totals.grandTotal.toFixed(0)}
                            </div>
                            <div className="text-[10px] text-slate-400">inc. GST</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-slate-100">
                          <button
                            onClick={() => setProjectToUpdatePricing(p)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Update Rates"
                          >
                            <Sparkles size={15} />
                          </button>
                          <button
                            onClick={() => onEdit(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit"
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
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right 1 Col: Rough Estimator & Database Match + Material Rates Preview */}
        <div className="space-y-6">
          {/* Rough Estimator & Database Match */}
          <RoughEstimator
            projects={projects}
            rates={rates}
            woodTypes={woodTypes}
            settings={settings}
            onEdit={onEdit}
          />

          {/* Rate Master Quick Glance */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Tags size={16} className="text-purple-600" />
                Active Material Rates
              </h3>
              <span className="text-[11px] text-purple-600 font-bold">{allowedRates.length} configured</span>
            </div>

            {allowedRates.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No material rates configured
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100">
                {allowedRates.slice(0, 5).map(r => (
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
    </div>
  );
}
