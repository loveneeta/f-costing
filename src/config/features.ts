export interface AppFeature {
  id: string;
  name: string;
  description?: string;
}

export const FEATURES_REGISTRY: Record<string, AppFeature> = {
  costing: { id: 'costing', name: 'Costing Engine', description: 'Core costing features' },
  projects: { id: 'projects', name: 'Projects', description: 'Saved Costings' },
  templates: { id: 'templates', name: 'Item Templates', description: 'Reusable item templates' },
  employees: { id: 'employees', name: 'Employees', description: 'Team management' },
  wood_rates: { id: 'wood_rates', name: 'Wood Rates', description: 'Wood material rates' },
  hardware_rates: { id: 'hardware_rates', name: 'Hardware Rates', description: 'Hardware material rates' },
  veneer_rates: { id: 'veneer_rates', name: 'Veneer Rates', description: 'Veneer material rates' },
  ply_sheets: { id: 'ply_sheets', name: 'Ply Sheets', description: 'Ply material rates' },
  board_sheets: { id: 'board_sheets', name: 'Board Sheets', description: 'Board material rates' },
  other_rates: { id: 'other_rates', name: 'Other Rates', description: 'Other material rates' },
  reports: { id: 'reports', name: 'Reports', description: 'Advanced reporting' },
};

export const AVAILABLE_FEATURES = Object.keys(FEATURES_REGISTRY);
