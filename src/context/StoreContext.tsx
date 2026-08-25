import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, RateItem, AppSettings, WoodType, WoodRange } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StoreState {
  projects: Project[];
  rates: RateItem[];
  woodTypes: WoodType[];
  settings: AppSettings;
  addProject: (p: Project) => void;
  updateProject: (p: Project) => void;
  deleteProject: (id: string) => void;
  addRate: (r: RateItem) => void;
  updateRate: (r: RateItem) => void;
  deleteRate: (id: string) => void;
  addWoodType: (w: WoodType) => void;
  updateWoodType: (w: WoodType) => void;
  deleteWoodType: (id: string) => void;
  updateSettings: (s: AppSettings) => void;
}

const StoreContext = createContext<StoreState | undefined>(undefined);

// Initial Sample Rates
const DEFAULT_RATES: RateItem[] = [
  { id: uuidv4(), category: 'board', name: 'MDF 18mm', thickness: 18, unit: 'sq.ft', rate: 220 },
  { id: uuidv4(), category: 'board', name: 'MDF 12mm', thickness: 12, unit: 'sq.ft', rate: 160 },
  { id: uuidv4(), category: 'ply', name: 'Plywood 18mm', thickness: 18, unit: 'sq.ft', rate: 250 },
  { id: uuidv4(), category: 'edgeband', name: 'PVC Edgeband 2mm', unit: 'rmt', rate: 15 },
  { id: uuidv4(), category: 'hardware', name: 'Soft Close Hinge', unit: 'piece', rate: 150 },
  { id: uuidv4(), category: 'hardware', name: 'Telescopic Channel 20"', unit: 'piece', rate: 350 },
  { id: uuidv4(), category: 'finishing', name: 'PU Polish', unit: 'sq.ft', rate: 180 },
];

const DEFAULT_WOOD_TYPES: WoodType[] = [
  {
    id: uuidv4(),
    name: 'Mango Wood',
    ranges: [
      { id: uuidv4(), minFt: 0, maxFt: 1.5, rate: 550 },
      { id: uuidv4(), minFt: 1.51, maxFt: 4.5, rate: 650 },
      { id: uuidv4(), minFt: 4.51, maxFt: 10.0, rate: 750 },
    ]
  },
  {
    id: uuidv4(),
    name: 'Sheesham',
    ranges: [
      { id: uuidv4(), minFt: 0, maxFt: 2.0, rate: 1200 },
      { id: uuidv4(), minFt: 2.01, maxFt: 5.0, rate: 1500 },
      { id: uuidv4(), minFt: 5.01, maxFt: 10.0, rate: 1800 },
    ]
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  company: {
    name: 'Corryco Packaging Solutions',
    gst: '08AZHPM1603R1ZZ',
    address: 'C-442 to B-458, Noble Art & Craft House,\nUnit 2nd MIA IInd Phase Basni,\nJodhpur (Raj)',
    phone: '+91 9521745114',
    email: 'mail@corryco.com',
    bankDetails: 'Bank : SBI BANK (Basni Krishi Mandi)\nAcc No. : 45320198402\nIFCS Code : SBIN0031975',
    hideBankDetails: false,
    hideNotes: false,
    hideTerms: false
  },
  pricing: {
    wastagePercent: 10,
    overheadPercent: 5,
    profitPercent: 23,
    gstPercent: 18,
    cashDiscountPercent: 2,
    validityDays: 7,
    volumeThreshold: 1000000,
    volumeDiscountPercent: 3
  }
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [rates, setRates] = useState<RateItem[]>([]);
  const [woodTypes, setWoodTypes] = useState<WoodType[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedProjects = localStorage.getItem('furniture_projects');
    const savedRates = localStorage.getItem('furniture_rates');
    const savedWoodTypes = localStorage.getItem('furniture_wood_types');
    const savedSettings = localStorage.getItem('furniture_settings');
    
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    
    if (savedRates) {
      setRates(JSON.parse(savedRates));
    } else {
      setRates(DEFAULT_RATES);
    }

    if (savedWoodTypes) {
      setWoodTypes(JSON.parse(savedWoodTypes));
    } else {
      setWoodTypes(DEFAULT_WOOD_TYPES);
    }

    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('furniture_projects', JSON.stringify(projects));
      localStorage.setItem('furniture_rates', JSON.stringify(rates));
      localStorage.setItem('furniture_wood_types', JSON.stringify(woodTypes));
      localStorage.setItem('furniture_settings', JSON.stringify(settings));
    }
  }, [projects, rates, woodTypes, settings, isLoaded]);

  const addProject = (p: Project) => setProjects(prev => [...prev, p]);
  const updateProject = (p: Project) => setProjects(prev => prev.map(proj => proj.id === p.id ? p : proj));
  const deleteProject = (id: string) => setProjects(prev => prev.filter(proj => proj.id !== id));

  const addRate = (r: RateItem) => setRates(prev => [...prev, r]);
  const updateRate = (r: RateItem) => setRates(prev => prev.map(rate => rate.id === r.id ? r : rate));
  const deleteRate = (id: string) => setRates(prev => prev.filter(rate => rate.id !== id));
  
  const addWoodType = (w: WoodType) => setWoodTypes(prev => [...prev, w]);
  const updateWoodType = (w: WoodType) => setWoodTypes(prev => prev.map(wt => wt.id === w.id ? w : wt));
  const deleteWoodType = (id: string) => setWoodTypes(prev => prev.filter(wt => wt.id !== id));
  
  const updateSettings = (s: AppSettings) => setSettings(s);

  if (!isLoaded) return null;

  return (
    <StoreContext.Provider value={{ projects, rates, woodTypes, settings, addProject, updateProject, deleteProject, addRate, updateRate, deleteRate, addWoodType, updateWoodType, deleteWoodType, updateSettings }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
