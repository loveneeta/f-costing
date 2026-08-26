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

export function calculateProjectCost(project: Project, rateMaster: RateItem[], pricing: PricingSettings, woodTypes: WoodType[]) {
  const getRate = (id: string) => rateMaster.find(r => r.id === id)?.rate || 0;
  
  const mult = UNIT_MULTIPLIERS[project.dimensionUnit || 'mm'];

  // 1. Sheet Materials & Edge Banding
  let totalSheetCost = 0;
  let totalEdgeBandCost = 0;
  const sheetBreakdown = project.sheetComponents.map(comp => {
    const l_mm = comp.l * mult;
    const w_mm = comp.w * mult;
    // Area in sq.ft
    const area = (l_mm * w_mm) / SQ_FT_DIVISOR;
    const rate = getRate(comp.rateId);
    const cost = area * comp.qty * rate;
    
    // Edgebanding in rmt (running meter)
    let edgeLengthMm = 0;
    if (comp.edgeTop) edgeLengthMm += l_mm;
    if (comp.edgeBottom) edgeLengthMm += l_mm;
    if (comp.edgeLeft) edgeLengthMm += w_mm;
    if (comp.edgeRight) edgeLengthMm += w_mm;
    
    const edgeRmt = edgeLengthMm / 1000;
    const edgeRate = getRate(comp.edgeRateId);
    const edgeCost = edgeRmt * comp.qty * edgeRate;

    totalSheetCost += cost;
    totalEdgeBandCost += edgeCost;

    return { ...comp, area, rate, cost, edgeRmt, edgeRate, edgeCost };
  });

  // 2. Solid Wood
  let totalSolidWoodCost = 0;
  const solidWoodBreakdown = project.solidWoodComponents.map(comp => {
    const l_mm = comp.l * mult;
    const w_mm = comp.w * mult;
    const t_mm = comp.t * mult;
    
    const vol = (l_mm * w_mm * t_mm) / CU_FT_DIVISOR;
    
    // Find rate based on length in feet
    const lengthFt = l_mm / 304.8;
    const wood = woodTypes.find(w => w.id === comp.woodTypeId);
    let rate = 0;
    
    if (wood) {
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

    const cost = vol * comp.qty * rate;
    totalSolidWoodCost += cost;
    return { ...comp, vol, rate, cost };
  });

  // 3. Hardware
  let totalHardwareCost = 0;
  const hardwareBreakdown = project.hardware.map(comp => {
    const rate = comp.rateId ? getRate(comp.rateId) : (comp.customRate || 0);
    const cost = comp.qty * rate;
    totalHardwareCost += cost;
    return { ...comp, rate, cost };
  });

  // 4. Finishing
  let totalFinishingCost = 0;
  const finishingBreakdown = project.finishing.map(comp => {
    const rate = getRate(comp.rateId);
    const cost = comp.areaSqFt * rate;
    totalFinishingCost += cost;
    return { ...comp, rate, cost };
  });

  // Base Material Cost = Sheet + Edgeband + Solid Wood + Hardware + Finishing
  const rawMaterialCost = totalSheetCost + totalEdgeBandCost + totalSolidWoodCost + totalHardwareCost + totalFinishingCost;
  
  // Wastage is applied to sheet materials, edge banding, solid wood, and finishing (typically not hardware)
  const materialSubjectToWastage = totalSheetCost + totalEdgeBandCost + totalSolidWoodCost + totalFinishingCost;
  const wastageCost = materialSubjectToWastage * (pricing.wastagePercent / 100);
  
  const totalMaterialCost = rawMaterialCost + wastageCost;

  // 5. Labour
  let totalLabourCost = 0;
  const labourBreakdown = project.labour.map(comp => {
    let cost = 0;
    if (comp.type === 'item' || comp.type === 'hour') {
      cost = comp.qty * comp.rate;
    } else if (comp.type === 'percent_material') {
      cost = totalMaterialCost * (comp.rate / 100);
    }
    totalLabourCost += cost;
    return { ...comp, cost };
  });

  // Subtotal
  const subtotal = totalMaterialCost + totalLabourCost;

  // Overhead
  const overheadCost = subtotal * (pricing.overheadPercent / 100);

  // Total Cost (Cost Price)
  const totalCostPrice = subtotal + overheadCost;

  // Profit
  const profitAmount = totalCostPrice * (pricing.profitPercent / 100);

  // Selling Price
  let sellingPrice = totalCostPrice + profitAmount;
  
  // Volume Discount
  let volumeDiscountAmount = 0;
  if (sellingPrice >= pricing.volumeThreshold && pricing.volumeThreshold > 0) {
    volumeDiscountAmount = sellingPrice * (pricing.volumeDiscountPercent / 100);
    sellingPrice -= volumeDiscountAmount;
  }

  // GST
  const gstAmount = sellingPrice * (pricing.gstPercent / 100);

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
