import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface PlatformSettings {
  features: Record<string, boolean>;
  modules: Record<string, boolean>;
  beta: Record<string, 'Development' | 'Beta' | 'Stable' | 'Disabled'>;
}

interface PlatformSettingsContextType {
  settings: PlatformSettings;
  updateSettings: (type: 'features' | 'modules' | 'beta', data: any) => Promise<void>;
  loading: boolean;
}

const defaultSettings: PlatformSettings = {
  features: {},
  modules: {},
  beta: {}
};

const PlatformSettingsContext = createContext<PlatformSettingsContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
  loading: true
});

export const PlatformSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { appUser } = useAuth();

  useEffect(() => {
    // We only need to fetch this if there's a user, though technically settings could be public.
    // For now, let's just fetch it.
    if (!appUser) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'platform_settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          features: data.features || {},
          modules: data.modules || {},
          beta: data.beta || {}
        });
      }
      setLoading(false);
    }, (err) => {
      console.warn("Could not load platform settings:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [appUser]);

  const updateSettings = async (type: 'features' | 'modules' | 'beta', data: any) => {
    const ref = doc(db, 'platform_settings', 'global');
    const newSettings = { ...settings, [type]: data };
    await setDoc(ref, newSettings, { merge: true });
    setSettings(newSettings);
  };

  return (
    <PlatformSettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
};

export const usePlatformSettings = () => useContext(PlatformSettingsContext);
