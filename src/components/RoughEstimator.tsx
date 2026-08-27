import React, { useState, useMemo } from 'react';
import { Project, RateItem, WoodType, AppSettings } from '../types';
import { calculateProjectCost } from '../engine';
import { v4 as uuidv4 } from 'uuid';
import { 
  Hammer, 
  Search, 
  Copy, 
  Sparkles, 
  Ruler, 
  Layers, 
  CheckCircle, 
  ArrowRight, 
  FileText, 
  X, 
  Info,
  Sliders,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const UNIT_MULTIPLIERS: Record<string, number> = {
  mm: 1,
  cm: 10,
  inch: 25.4,
  ft: 304.8,
  m: 1000
};

interface Props {
  projects: Project[];
  rates: RateItem[];
  woodTypes: WoodType[];
  settings: AppSettings;
  onEdit: (p: Project) => void;
}

export function RoughEstimator({ projects, rates, woodTypes, settings, onEdit }: Props) {
  // Inputs
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [unit, setUnit] = useState<'mm' | 'cm' | 'inch' | 'ft' | 'm'>('mm');
  const [category, setCategory] = useState<string>('all');
  const [subName, setSubName] = useState<string>('');

  // Selected item for summary modal
  const [selectedItem, setSelectedItem] = useState<{
    project: Project;
    similarity: number;
    calc: ReturnType<typeof calculateProjectCost>;
    dimDiffText: string;
  } | null>(null);

  // Available unique categories from database + common defaults
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    projects.forEach(p => {
      if (p.category && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    // Add common defaults if not already present
    ['BEDSIDE', 'WARDROBE', 'TABLE', 'TV UNIT', 'CABINET', 'VANITY', 'CHAIR', 'SHOE RACK', 'DESK', 'CONSOLE'].forEach(c => cats.add(c));
    return Array.from(cats);
  }, [projects]);

  // Target dimensions in mm
  const targetDimsInMM = useMemo(() => {
    const numL = parseFloat(length);
    const numW = parseFloat(width);
    const numH = parseFloat(height);
    const mult = UNIT_MULTIPLIERS[unit] || 1;

    if (!numL || !numW || !numH || isNaN(numL) || isNaN(numW) || isNaN(numH) || numL <= 0 || numW <= 0 || numH <= 0) {
      return null;
    }

    return {
      lMM: numL * mult,
      wMM: numW * mult,
      hMM: numH * mult,
      rawL: numL,
      rawW: numW,
      rawH: numH,
      unit
    };
  }, [length, width, height, unit]);

  // Search & Match Engine: Finds closest items in database
  const searchResults = useMemo(() => {
    if (projects.length === 0) return [];

    const hasDims = Boolean(targetDimsInMM);
    const hasCategory = category !== 'all' && category.trim().length > 0;
    const hasSubName = subName.trim().length > 0;

    // If user hasn't entered anything yet, show empty prompt
    if (!hasDims && !hasCategory && !hasSubName) {
      return [];
    }

    const subNameWords = subName.toLowerCase().trim().split(/\s+/).filter(Boolean);

    const scored = projects.map(p => {
      const pUnitMult = UNIT_MULTIPLIERS[p.dimensionUnit || 'mm'] || 1;
      const pL_MM = (p.overallL || 0) * pUnitMult;
      const pW_MM = (p.overallW || 0) * pUnitMult;
      const pH_MM = (p.overallH || 0) * pUnitMult;

      // 1. Dimension Score (0 - 100)
      let dimScore = 50;
      let dimDiffText = '';

      if (targetDimsInMM) {
        const diffL = Math.abs(targetDimsInMM.lMM - pL_MM) / Math.max(targetDimsInMM.lMM, pL_MM, 1);
        const diffW = Math.abs(targetDimsInMM.wMM - pW_MM) / Math.max(targetDimsInMM.wMM, pW_MM, 1);
        const diffH = Math.abs(targetDimsInMM.hMM - pH_MM) / Math.max(targetDimsInMM.hMM, pH_MM, 1);
        const avgDiff = (diffL + diffW + diffH) / 3;
        dimScore = Math.max(0, Math.round((1 - Math.min(avgDiff, 1)) * 100));

        if (avgDiff < 0.05) {
          dimDiffText = 'Exact / Near-identical size';
        } else {
          const lDiff = (p.overallL || 0) - targetDimsInMM.rawL;
          dimDiffText = `Size: ${p.overallL || 0}×${p.overallW || 0}×${p.overallH || 0} ${p.dimensionUnit || 'mm'}`;
        }
      } else {
        dimDiffText = `${p.overallL || 0}×${p.overallW || 0}×${p.overallH || 0} ${p.dimensionUnit || 'mm'}`;
      }

      // 2. Category Score (0 - 100)
      let catScore = 70;
      if (hasCategory) {
        const pCat = (p.category || '').toLowerCase().trim();
        const targetCat = category.toLowerCase().trim();
        if (pCat === targetCat) {
          catScore = 100;
        } else if (pCat.includes(targetCat) || targetCat.includes(pCat)) {
          catScore = 75;
        } else {
          catScore = 15;
        }
      }

      // 3. Sub-name / Keyword Score (0 - 100)
      let nameScore = 70;
      if (hasSubName) {
        const pNameStr = `${p.name || ''} ${p.subName || ''} ${p.category || ''}`.toLowerCase();
        const matchCount = subNameWords.filter(word => pNameStr.includes(word)).length;
        if (matchCount === subNameWords.length) {
          nameScore = 100;
        } else if (matchCount > 0) {
          nameScore = 70;
        } else {
          nameScore = 20;
        }
      }

      // Total Weighted Similarity
      let totalSimilarity = 0;
      if (hasDims && (hasCategory || hasSubName)) {
        totalSimilarity = Math.round(dimScore * 0.50 + catScore * 0.30 + nameScore * 0.20);
      } else if (hasDims) {
        totalSimilarity = Math.round(dimScore * 0.70 + catScore * 0.20 + nameScore * 0.10);
      } else if (hasCategory && hasSubName) {
        totalSimilarity = Math.round(catScore * 0.60 + nameScore * 0.40);
      } else if (hasCategory) {
        totalSimilarity = Math.round(catScore);
      } else {
        totalSimilarity = Math.round(nameScore);
      }

      const calc = calculateProjectCost(p, rates, settings.pricing, woodTypes);

      return {
        project: p,
        similarity: totalSimilarity,
        calc,
        dimDiffText
      };
    });

    // Sort by highest similarity
    scored.sort((a, b) => b.similarity - a.similarity);

    return scored.slice(0, 4);
  }, [projects, targetDimsInMM, category, subName, rates, woodTypes, settings.pricing]);

  // Handle Duplicating the selected item
  const handleDuplicateItem = (itemToDuplicate: Project, applyEnteredDimensions: boolean = false) => {
    const baseName = itemToDuplicate.name || 'Costing';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let finalL = itemToDuplicate.overallL;
    let finalW = itemToDuplicate.overallW;
    let finalH = itemToDuplicate.overallH;
    let finalUnit = itemToDuplicate.dimensionUnit || 'mm';

    if (applyEnteredDimensions && targetDimsInMM) {
      finalL = targetDimsInMM.rawL;
      finalW = targetDimsInMM.rawW;
      finalH = targetDimsInMM.rawH;
      finalUnit = targetDimsInMM.unit;
    }

    const newProject: Project = {
      ...itemToDuplicate,
      id: uuidv4(),
      name: `${baseName} (Copy - ${dateStr})`,
      subName: subName.trim() || itemToDuplicate.subName || '',
      category: (category !== 'all' && category.trim()) ? category : itemToDuplicate.category,
      overallL: finalL,
      overallW: finalW,
      overallH: finalH,
      dimensionUnit: finalUnit,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      isTemplate: false,
      isPricingLocked: false,
      ratesSnapshot: rates,
      woodTypesSnapshot: woodTypes,
      pricingSnapshot: settings.pricing,
      ratesLockedAt: new Date().toISOString()
    };

    setSelectedItem(null);
    onEdit(newProject);
  };

  // Create brand new costing from entered specs directly
  const handleCreateNewFromSpecs = () => {
    const rawL = targetDimsInMM ? targetDimsInMM.rawL : 0;
    const rawW = targetDimsInMM ? targetDimsInMM.rawW : 0;
    const rawH = targetDimsInMM ? targetDimsInMM.rawH : 0;

    const chosenCat = category !== 'all' ? category : 'FURNITURE';
    const chosenName = subName.trim() ? `${chosenCat} - ${subName.trim()}` : chosenCat;

    const newProject: Project = {
      id: uuidv4(),
      name: chosenName,
      subName: subName.trim() || '',
      category: chosenCat,
      overallL: rawL,
      overallW: rawW,
      overallH: rawH,
      dimensionUnit: unit,
      sheetComponents: [],
      solidWoodComponents: [],
      hardware: [],
      finishing: [],
      labour: [],
      isTemplate: false,
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      isPricingLocked: false,
      ratesSnapshot: rates,
      woodTypesSnapshot: woodTypes,
      pricingSnapshot: settings.pricing,
      ratesLockedAt: new Date().toISOString()
    };

    onEdit(newProject);
  };

  const hasInputs = Boolean(length || width || height || (category !== 'all') || subName.trim());

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Hammer size={17} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Rough Estimator & Database Match</h3>
          </div>
        </div>
        <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          Smart Search
        </span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Enter size with unit, category, or sub name to search the closest matching item in your database and view instant market prices.
      </p>

      {/* Input Form */}
      <div className="space-y-3 pt-1">
        {/* Dimensions & Unit Row */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Ruler size={11} className="text-slate-400" />
              Dimensions (L × W × H)
            </label>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400">Unit:</span>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as any)}
                className="font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 text-xs outline-none cursor-pointer"
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="inch">inch</option>
                <option value="ft">ft</option>
                <option value="m">m</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <input
                type="number"
                value={length}
                onChange={e => setLength(e.target.value)}
                placeholder={`L (${unit})`}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <input
                type="number"
                value={width}
                onChange={e => setWidth(e.target.value)}
                placeholder={`W (${unit})`}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder={`H (${unit})`}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Category & Sub Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Sub Name / Keywords
            </label>
            <input
              type="text"
              value={subName}
              onChange={e => setSubName(e.target.value)}
              placeholder="e.g. 1-tier, 2-drawer"
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Results Area */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Search size={12} className="text-slate-400" />
              Closest Database Matches
            </span>
            {searchResults.length > 0 && (
              <span className="text-[11px] text-slate-400 font-medium">
                {searchResults.length} found
              </span>
            )}
          </div>

          {!hasInputs ? (
            <div className="bg-slate-50/80 p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
              <Search size={18} className="mx-auto text-slate-300 mb-1.5" />
              Enter size, category, or sub name above to search database items.
            </div>
          ) : searchResults.length === 0 ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-2.5">
              <p className="text-xs text-slate-500">
                No matching costing found in your database yet.
              </p>
              <button
                onClick={handleCreateNewFromSpecs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
              >
                <Sparkles size={13} />
                Create New Costing With These Specs
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((res, index) => {
                const isTopMatch = index === 0;
                const p = res.project;
                const price = Math.round(res.calc.totals.grandTotal);

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedItem(res)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md relative overflow-hidden group ${
                      isTopMatch 
                        ? 'bg-blue-50/40 border-blue-200 hover:border-blue-400' 
                        : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                            {p.name || 'Untitled Item'}
                          </span>
                          {p.subName && (
                            <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                              {p.subName}
                            </span>
                          )}
                          {isTopMatch && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <CheckCircle size={10} /> {res.similarity}% Match
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500">
                          {p.category || 'General'} • <span className="font-mono text-slate-700">{p.overallL}×{p.overallW}×{p.overallH} {p.dimensionUnit || 'mm'}</span>
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold font-mono text-emerald-700">
                          ₹{price.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          inc. GST
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-blue-600 font-semibold">
                      <span className="text-slate-500 font-normal">{res.dimDiffText}</span>
                      <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        View Summary & Use <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Item Summary & Duplicate Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl border border-white/20">
                  <FileText size={20} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    {selectedItem.project.name || 'Matched Costing Summary'}
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    {selectedItem.project.category || 'Furniture'} • {selectedItem.similarity}% Database Match
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {/* Dimensions comparison */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Database Item Size:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedItem.project.overallL} × {selectedItem.project.overallW} × {selectedItem.project.overallH} {selectedItem.project.dimensionUnit || 'mm'}
                  </span>
                </div>
                {targetDimsInMM && (
                  <div className="flex justify-between items-center text-xs border-t border-slate-200/70 pt-2">
                    <span className="font-semibold text-blue-600">Your Requested Size:</span>
                    <span className="font-mono font-bold text-blue-800">
                      {targetDimsInMM.rawL} × {targetDimsInMM.rawW} × {targetDimsInMM.rawH} {targetDimsInMM.unit}
                    </span>
                  </div>
                )}
                {selectedItem.project.subName && (
                  <div className="flex justify-between items-center text-xs border-t border-slate-200/70 pt-2">
                    <span className="font-semibold text-slate-500">Sub-Name / Variant:</span>
                    <span className="font-semibold text-slate-700">{selectedItem.project.subName}</span>
                  </div>
                )}
              </div>

              {/* Price Breakdown Summary */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 border-b border-slate-200 flex justify-between">
                  <span>Cost & Margin Breakdown</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="p-4 space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between text-slate-600 pt-1 first:pt-0">
                    <span>Raw Materials (Sheet, Wood, Hardware):</span>
                    <span className="font-mono font-semibold">₹{Math.round(selectedItem.calc.totals.rawMaterialCost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-2">
                    <span>Finishing & Polish:</span>
                    <span className="font-mono font-semibold">₹{Math.round(selectedItem.calc.totals.finishingCost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-2">
                    <span>Labour:</span>
                    <span className="font-mono font-semibold">₹{Math.round(selectedItem.calc.totals.labourCost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-2">
                    <span>Factory Overheads ({settings.pricing?.overheadPercent || 5}%):</span>
                    <span className="font-mono font-semibold">₹{Math.round(selectedItem.calc.totals.overheadCost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-2">
                    <span>Profit Margin ({settings.pricing?.profitPercent || 23}%):</span>
                    <span className="font-mono font-semibold text-blue-700">₹{Math.round(selectedItem.calc.totals.profitAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-2">
                    <span>GST ({settings.pricing?.gstPercent || 18}%):</span>
                    <span className="font-mono font-semibold">₹{Math.round(selectedItem.calc.totals.gstAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-3 border-t-2 border-slate-200">
                    <span>Selling Price (Inc. GST):</span>
                    <span className="text-xl font-mono text-emerald-700">
                      ₹{Math.round(selectedItem.calc.totals.grandTotal).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bill of Materials Quick Counts */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sheet Panels</div>
                  <div className="text-sm font-bold font-mono text-slate-800">
                    {selectedItem.project.sheetComponents?.length || 0}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Hardware Items</div>
                  <div className="text-sm font-bold font-mono text-slate-800">
                    {selectedItem.project.hardware?.length || 0}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Solid Wood</div>
                  <div className="text-sm font-bold font-mono text-slate-800">
                    {selectedItem.project.solidWoodComponents?.length || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Close
              </button>

              {targetDimsInMM && (
                <button
                  type="button"
                  onClick={() => handleDuplicateItem(selectedItem.project, true)}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  title="Duplicate with the size dimensions you just entered"
                >
                  <Sparkles size={14} />
                  Duplicate with My Size ({targetDimsInMM.rawL}×{targetDimsInMM.rawW}×{targetDimsInMM.rawH})
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDuplicateItem(selectedItem.project, false)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
              >
                <Copy size={14} />
                Duplicate & Use Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
