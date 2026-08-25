export type Unit = 'sq.ft' | 'cu.ft' | 'kg' | 'piece' | 'hour' | 'item' | 'rmt' | 'lumpsum';

export type RateCategory = 'sheet' | 'solid_wood' | 'metal' | 'glass' | 'hardware' | 'finishing' | 'labour' | 'edgeband' | 'other' | 'ply' | 'veneer_sheet' | 'veneer_edge' | 'veneer_other' | 'board';

export interface RateItem {
  id: string;
  category: RateCategory;
  name: string;
  thickness?: number; // mainly for sheets/glass
  unit: Unit;
  rate: number;
}

export interface SheetComponent {
  id: string;
  name: string;
  l: number; // mm
  w: number; // mm
  qty: number;
  rateId: string; // references a sheet rate
  edgeTop: boolean; // length side 1
  edgeBottom: boolean; // length side 2
  edgeLeft: boolean; // width side 1
  edgeRight: boolean; // width side 2
  edgeRateId: string; // references edgeband rate
}

export interface SolidWoodComponent {
  id: string;
  name: string;
  l: number; // mm
  w: number; // mm
  t: number; // mm
  qty: number;
  woodTypeId: string;
}

export interface HardwareComponent {
  id: string;
  name: string;
  qty: number;
  rateId: string; // can be an existing rate or ad-hoc if rateId is empty
  customRate?: number; // if not using rate master
}

export interface FinishingComponent {
  id: string;
  name: string;
  areaSqFt: number; // sq.ft
  rateId: string;
}

export interface LabourComponent {
  id: string;
  name: string;
  type: 'item' | 'hour' | 'percent_material';
  qty: number; // hours, items, or percent
  rate: number; // manual rate or percent
}

export interface WoodRange {
  id: string;
  minFt: number;
  maxFt: number;
  rate: number;
}

export interface WoodType {
  id: string;
  name: string;
  ranges: WoodRange[];
}

export interface CompanySettings {
  name: string;
  gst: string;
  address: string;
  phone: string;
  email: string;
  bankDetails: string;
  hideBankDetails: boolean;
  hideNotes: boolean;
  hideTerms: boolean;
}

export interface PricingSettings {
  wastagePercent: number;
  overheadPercent: number;
  profitPercent: number;
  gstPercent: number;
  cashDiscountPercent: number;
  validityDays: number;
  volumeThreshold: number;
  volumeDiscountPercent: number;
}

export interface AppSettings {
  company: CompanySettings;
  pricing: PricingSettings;
}

export interface Project {
  id: string;
  dateCreated: string;
  dateModified: string;
  name: string;
  subName?: string;
  category: string;
  overallL: number;
  overallW: number;
  overallH: number;
  isTemplate?: boolean;
  
  sheetComponents: SheetComponent[];
  solidWoodComponents: SolidWoodComponent[];
  hardware: HardwareComponent[];
  finishing: FinishingComponent[];
  labour: LabourComponent[];
}

