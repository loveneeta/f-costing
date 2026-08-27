import { Project, RateItem, SheetComponent, SolidWoodComponent, HardwareComponent, LabourComponent, FinishingComponent, PricingSettings, WoodType } from './types';

// Constants
const SQ_FT_DIVISOR = 92903.04; // 1 sq.ft = 92903.04 mm2
const CU_FT_DIVISOR = 28316846.592; // 1 cu.ft = 28,316,846.592 mm3

const UNIT_MULTIPLIERS = {
  mm: 1,
  cm: 10,
  inch: 25.4,
  ft: 304.8,
  m: 1000
};

export function calculateProjectCost(
  project: Project,
  rateMaster: RateItem[] = [],
  pricing: PricingSettings = {
    wastagePercent: 10,
    overheadPercent: 5,
    profitPercent: 23,
    gstPercent: 18,
    cashDiscountPercent: 2,
    validityDays: 7,
    volumeThreshold: 1000000,
    volumeDiscountPercent: 3
  },
  woodTypes: WoodType[] = [],
  options?: { forceLiveRates?: boolean }
) {
  // If the project is saved and has locked rates snapshot, use the snapshot unless forceLiveRates is requested
  const useSnapshot = !options?.forceLiveRates && (project?.isPricingLocked || (project?.ratesSnapshot && project.ratesSnapshot.length > 0));
  
  const effectiveRateMaster = (useSnapshot && project?.ratesSnapshot && project.ratesSnapshot.length > 0)
    ? project.ratesSnapshot
    : (rateMaster || []);

  const effectiveWoodTypes = (useSnapshot && project?.woodTypesSnapshot && project.woodTypesSnapshot.length > 0)
    ? project.woodTypesSnapshot
    : (woodTypes || []);

  const effectivePricing = (useSnapshot && project?.pricingSnapshot)
    ? project.pricingSnapshot
    : (pricing || {
        wastagePercent: 10,
        overheadPercent: 5,
        profitPercent: 23,
        gstPercent: 18,
        cashDiscountPercent: 2,
        validityDays: 7,
        volumeThreshold: 1000000,
        volumeDiscountPercent: 3
      });

  const getRate = (id: string) => (effectiveRateMaster || []).find(r => r.id === id)?.rate || 0;
  
  const mult = UNIT_MULTIPLIERS[project?.dimensionUnit || 'mm'] || 1;
  const safePricing = effectivePricing;
  const safeWoodTypes = effectiveWoodTypes || [];

  // 1. Sheet Materials & Edge Banding
  let totalSheetCost = 0;
  let totalEdgeBandCost = 0;
  const sheetBreakdown = (project?.sheetComponents || []).map(comp => {
    const l_mm = (comp.l || 0) * mult;
    const w_mm = (comp.w || 0) * mult;
    // Area in sq.ft
    const area = (l_mm * w_mm) / SQ_FT_DIVISOR;
    const rate = getRate(comp.rateId);
    const cost = area * (comp.qty || 0) * rate;
    
    // Edgebanding in rmt (running meter)
    let edgeLengthMm = 0;
    if (comp.edgeTop) edgeLengthMm += l_mm;
    if (comp.edgeBottom) edgeLengthMm += l_mm;
    if (comp.edgeLeft) edgeLengthMm += w_mm;
    if (comp.edgeRight) edgeLengthMm += w_mm;
    
    const edgeRmt = edgeLengthMm / 1000;
    const edgeRate = getRate(comp.edgeRateId);
    const edgeCost = edgeRmt * (comp.qty || 0) * edgeRate;

    totalSheetCost += cost;
    totalEdgeBandCost += edgeCost;

    return { ...comp, area, rate, cost, edgeRmt, edgeRate, edgeCost };
  });

  // 2. Solid Wood
  let totalSolidWoodCost = 0;
  const solidWoodBreakdown = (project?.solidWoodComponents || []).map(comp => {
    const l_mm = (comp.l || 0) * mult;
    const w_mm = (comp.w || 0) * mult;
    const t_mm = (comp.t || 0) * mult;
    
    const vol = (l_mm * w_mm * t_mm) / CU_FT_DIVISOR;
    
    // Find rate based on length in feet
    const lengthFt = l_mm / 304.8;
    const wood = safeWoodTypes.find(w => w.id === comp.woodTypeId);
    let rate = 0;
    
    if (wood && wood.ranges) {
      const sortedRanges = [...wood.ranges].sort((a, b) => a.minFt - b.minFt);
      for (const r of sortedRanges) {
        if (lengthFt >= r.minFt && lengthFt <= r.maxFt) {
          rate = r.rate;
          break;
        }
      }
      
      // Fallback if exactly matching range not found
      if (rate === 0 && sortedRanges.length > 0) {
        if (lengthFt > sortedRanges[sortedRanges.length - 1].maxFt) {
          rate = sortedRanges[sortedRanges.length - 1].rate;
        } else if (lengthFt < sortedRanges[0].minFt) {
          rate = sortedRanges[0].rate;
        }
      }
    }

    const cost = vol * (comp.qty || 0) * rate;
    totalSolidWoodCost += cost;
    return { ...comp, vol, rate, cost };
  });

  // 3. Hardware
  let totalHardwareCost = 0;
  const hardwareBreakdown = (project?.hardware || []).map(comp => {
    const rate = comp.rateId ? getRate(comp.rateId) : (comp.customRate || 0);
    const cost = (comp.qty || 0) * rate;
    totalHardwareCost += cost;
    return { ...comp, rate, cost };
  });

  // 4. Finishing
  let totalFinishingCost = 0;
  const finishingBreakdown = (project?.finishing || []).map(comp => {
    const rate = getRate(comp.rateId);
    const cost = (comp.areaSqFt || 0) * rate;
    totalFinishingCost += cost;
    return { ...comp, rate, cost };
  });

  // Base Material Cost = Sheet + Edgeband + Solid Wood + Hardware + Finishing
  const rawMaterialCost = totalSheetCost + totalEdgeBandCost + totalSolidWoodCost + totalHardwareCost + totalFinishingCost;
  
  // Wastage is applied to sheet materials, edge banding, solid wood, and finishing (typically not hardware)
  const materialSubjectToWastage = totalSheetCost + totalEdgeBandCost + totalSolidWoodCost + totalFinishingCost;
  const wastageCost = materialSubjectToWastage * ((safePricing.wastagePercent || 0) / 100);
  
  const totalMaterialCost = rawMaterialCost + wastageCost;

  // 5. Labour
  let totalLabourCost = 0;
  const labourBreakdown = (project?.labour || []).map(comp => {
    let cost = 0;
    if (comp.type === 'item' || comp.type === 'hour') {
      cost = (comp.qty || 0) * (comp.rate || 0);
    } else if (comp.type === 'percent_material') {
      cost = totalMaterialCost * ((comp.rate || 0) / 100);
    }
    totalLabourCost += cost;
    return { ...comp, cost };
  });

  // Subtotal
  const subtotal = totalMaterialCost + totalLabourCost;

  // Overhead
  const overheadCost = subtotal * ((safePricing.overheadPercent || 0) / 100);

  // Total Cost (Cost Price)
  const totalCostPrice = subtotal + overheadCost;

  // Profit
  const profitAmount = totalCostPrice * ((safePricing.profitPercent || 0) / 100);

  // Selling Price
  let sellingPrice = totalCostPrice + profitAmount;
  
  // Volume Discount
  let volumeDiscountAmount = 0;
  if (sellingPrice >= (safePricing.volumeThreshold || 0) && (safePricing.volumeThreshold || 0) > 0) {
    volumeDiscountAmount = sellingPrice * ((safePricing.volumeDiscountPercent || 0) / 100);
    sellingPrice -= volumeDiscountAmount;
  }

  // GST
  const gstAmount = sellingPrice * ((safePricing.gstPercent || 0) / 100);

  // Grand Total
  const grandTotal = sellingPrice + gstAmount;

  return {
    breakdown: {
      sheet: sheetBreakdown,
      solidWood: solidWoodBreakdown,
      hardware: hardwareBreakdown,
      finishing: finishingBreakdown,
      labour: labourBreakdown,
    },
    totals: {
      sheetCost: totalSheetCost,
      edgeBandCost: totalEdgeBandCost,
      solidWoodCost: totalSolidWoodCost,
      hardwareCost: totalHardwareCost,
      finishingCost: totalFinishingCost,
      rawMaterialCost,
      wastageCost,
      totalMaterialCost,
      labourCost: totalLabourCost,
      subtotal,
      overheadCost,
      totalCostPrice,
      profitAmount,
      volumeDiscountAmount,
      sellingPrice,
      gstAmount,
      grandTotal
    }
  };
}

export interface RateChangeComparison {
  hasPriceChange: boolean;
  lockedGrandTotal: number;
  liveGrandTotal: number;
  difference: number;
  percentageChange: number;
  lockedDate?: string;
  isPricingLocked: boolean;
  changedItems: Array<{
    name: string;
    category: string;
    oldRate: number;
    newRate: number;
    unit: string;
  }>;
}

export function compareProjectRates(
  project: Project,
  liveRateMaster: RateItem[] = [],
  livePricing: PricingSettings,
  liveWoodTypes: WoodType[] = []
): RateChangeComparison {
  const isLocked = Boolean(project?.isPricingLocked || (project?.ratesSnapshot && project.ratesSnapshot.length > 0));
  
  const lockedCalc = calculateProjectCost(project, liveRateMaster, livePricing, liveWoodTypes, { forceLiveRates: false });
  const liveCalc = calculateProjectCost(project, liveRateMaster, livePricing, liveWoodTypes, { forceLiveRates: true });
  
  const lockedGrandTotal = Math.round(lockedCalc.totals.grandTotal);
  const liveGrandTotal = Math.round(liveCalc.totals.grandTotal);
  const difference = liveGrandTotal - lockedGrandTotal;
  const percentageChange = lockedGrandTotal > 0 ? ((difference / lockedGrandTotal) * 100) : 0;
  const hasPriceChange = Math.abs(difference) >= 1;

  const changedItems: Array<{
    name: string;
    category: string;
    oldRate: number;
    newRate: number;
    unit: string;
  }> = [];

  const getLockedRate = (id: string) => (project.ratesSnapshot || []).find(r => r.id === id);
  const getLiveRate = (id: string) => (liveRateMaster || []).find(r => r.id === id);

  // Check sheet rates
  (project.sheetComponents || []).forEach(comp => {
    if (comp.rateId) {
      const locked = getLockedRate(comp.rateId);
      const live = getLiveRate(comp.rateId);
      if (locked && live && locked.rate !== live.rate) {
        if (!changedItems.some(i => i.name === locked.name)) {
          changedItems.push({
            name: locked.name,
            category: 'Sheet Material',
            oldRate: locked.rate,
            newRate: live.rate,
            unit: locked.unit
          });
        }
      }
    }
    if (comp.edgeRateId) {
      const lockedEdge = getLockedRate(comp.edgeRateId);
      const liveEdge = getLiveRate(comp.edgeRateId);
      if (lockedEdge && liveEdge && lockedEdge.rate !== liveEdge.rate) {
        if (!changedItems.some(i => i.name === lockedEdge.name)) {
          changedItems.push({
            name: lockedEdge.name,
            category: 'Edgeband',
            oldRate: lockedEdge.rate,
            newRate: liveEdge.rate,
            unit: lockedEdge.unit
          });
        }
      }
    }
  });

  // Check hardware rates
  (project.hardware || []).forEach(comp => {
    if (comp.rateId) {
      const locked = getLockedRate(comp.rateId);
      const live = getLiveRate(comp.rateId);
      if (locked && live && locked.rate !== live.rate) {
        if (!changedItems.some(i => i.name === locked.name)) {
          changedItems.push({
            name: locked.name,
            category: 'Hardware',
            oldRate: locked.rate,
            newRate: live.rate,
            unit: locked.unit
          });
        }
      }
    }
  });

  // Check finishing rates
  (project.finishing || []).forEach(comp => {
    if (comp.rateId) {
      const locked = getLockedRate(comp.rateId);
      const live = getLiveRate(comp.rateId);
      if (locked && live && locked.rate !== live.rate) {
        if (!changedItems.some(i => i.name === locked.name)) {
          changedItems.push({
            name: locked.name,
            category: 'Finishing',
            oldRate: locked.rate,
            newRate: live.rate,
            unit: locked.unit
          });
        }
      }
    }
  });

  return {
    hasPriceChange,
    lockedGrandTotal,
    liveGrandTotal,
    difference,
    percentageChange,
    lockedDate: project.ratesLockedAt || project.dateModified || project.dateCreated,
    isPricingLocked: isLocked,
    changedItems
  };
}

export function generateUpdatedCopyName(currentName: string): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  const dateStr = `${day} ${month} ${year}`;

  const rawName = (currentName || 'Costing Item').trim();
  // Remove existing date suffixes if matching pattern like " - 24 Aug 2026" or " (Copy)"
  const cleanName = rawName
    .replace(/\s*-\s*\d{2}\s+[A-Za-z]{3}\s+\d{4}$/, '')
    .replace(/\s*-\s*\d{2}[-/.]\d{2}[-/.]\d{4}$/, '')
    .replace(/\s*\(Copy\)$/, '')
    .trim();

  return `${cleanName || 'Costing'} - ${dateStr}`;
}

