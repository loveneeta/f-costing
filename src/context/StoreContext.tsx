import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
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
  const { appUser } = useAuth();
  const tenantId = appUser?.role === 'super_admin' ? null : appUser?.tenantId;
  const [projects, setProjects] = useState<Project[]>([]);
  const [rates, setRates] = useState<RateItem[]>([]);
  const [woodTypes, setWoodTypes] = useState<WoodType[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!tenantId) {
      setProjects([]);
      setRates(DEFAULT_RATES);
      setWoodTypes(DEFAULT_WOOD_TYPES);
      setSettings(DEFAULT_SETTINGS);
      setIsLoaded(true);
      return;
    }

    const loadData = async () => {
      try {
        const [projSnap, ratesSnap, woodSnap, setSnap] = await Promise.all([
          getDocs(query(collection(db, 'projects'), where('tenantId', '==', tenantId))),
          getDocs(query(collection(db, 'rates'), where('tenantId', '==', tenantId))),
          getDocs(query(collection(db, 'woodTypes'), where('tenantId', '==', tenantId))),
          getDocs(query(collection(db, 'settings'), where('tenantId', '==', tenantId)))
        ]);

        const loadedProjects = projSnap.docs.map(d => d.data() as Project);
        const loadedRates = ratesSnap.docs.map(d => d.data() as RateItem);
        const loadedWoodTypes = woodSnap.docs.map(d => d.data() as WoodType);
        
        setProjects(loadedProjects);
        setRates(loadedRates.length ? loadedRates : DEFAULT_RATES);
        setWoodTypes(loadedWoodTypes.length ? loadedWoodTypes : DEFAULT_WOOD_TYPES);
        
        if (!setSnap.empty) {
          const data = setSnap.docs[0].data() as Partial<AppSettings>;
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data,
            company: { ...DEFAULT_SETTINGS.company, ...(data.company || {}) },
            pricing: { ...DEFAULT_SETTINGS.pricing, ...(data.pricing || {}) }
          });
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (err) {
        console.error("Error loading store from Firestore", err);
        setRates(DEFAULT_RATES);
        setWoodTypes(DEFAULT_WOOD_TYPES);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoaded(true);
        initialLoadDone.current = true;
      }
    };

    loadData();
  }, [tenantId]);

  const addProject = async (p: Project) => {
    if (!tenantId) return;
    const data = { ...p, tenantId };
    setProjects(prev => [...prev, data]);
    await setDoc(doc(db, 'projects', p.id), data);
  };

  const updateProject = async (p: Project) => {
    if (!tenantId) return;
    const data = { ...p, tenantId };
    setProjects(prev => prev.map(proj => proj.id === p.id ? data : proj));
    await setDoc(doc(db, 'projects', p.id), data);
  };

  const deleteProject = async (id: string) => {
    if (!tenantId) return;
    setProjects(prev => prev.filter(proj => proj.id !== id));
    await deleteDoc(doc(db, 'projects', id));
  };

  const addRate = async (r: RateItem) => {
    if (!tenantId) return;
    const data = { ...r, tenantId };
    setRates(prev => [...prev, data]);
    await setDoc(doc(db, 'rates', r.id), data);
  };

  const updateRate = async (r: RateItem) => {
    if (!tenantId) return;
    const data = { ...r, tenantId };
    setRates(prev => prev.map(rate => rate.id === r.id ? data : rate));
    await setDoc(doc(db, 'rates', r.id), data);
  };

  const deleteRate = async (id: string) => {
    if (!tenantId) return;
    setRates(prev => prev.filter(rate => rate.id !== id));
    await deleteDoc(doc(db, 'rates', id));
  };
  
  const addWoodType = async (w: WoodType) => {
    if (!tenantId) return;
    const data = { ...w, tenantId };
    setWoodTypes(prev => [...prev, data]);
    await setDoc(doc(db, 'woodTypes', w.id), data);
  };

  const updateWoodType = async (w: WoodType) => {
    if (!tenantId) return;
    const data = { ...w, tenantId };
    setWoodTypes(prev => prev.map(wt => wt.id === w.id ? data : wt));
    await setDoc(doc(db, 'woodTypes', w.id), data);
  };

  const deleteWoodType = async (id: string) => {
    if (!tenantId) return;
    setWoodTypes(prev => prev.filter(wt => wt.id !== id));
    await deleteDoc(doc(db, 'woodTypes', id));
  };
  
  const updateSettings = async (s: AppSettings) => {
    if (!tenantId) return;
    setSettings(s);
    await setDoc(doc(db, 'settings', tenantId), { ...s, tenantId });
  };


  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-100 font-sans text-neutral-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Loading workspace data...</p>
        </div>
      </div>
    );
  }

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
