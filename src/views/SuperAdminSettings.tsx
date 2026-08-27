import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SettingsIcon, Save } from 'lucide-react';
import { logAuditEvent } from '../services/AuditService';
import { useAuth } from '../contexts/AuthContext';

export const SuperAdminSettings: React.FC = () => {
  const { appUser } = useAuth();
  const [settings, setSettings] = useState({
    platformName: 'AI Studio ERP',
    supportEmail: 'support@example.com',
    maintenanceMode: false,
    defaultTrialDays: 14,
    superAdmin2FARequired: true,
    version: '1.0.0'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'platform_settings', 'global');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSettings(snap.data() as any);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'global'), settings);
      if (appUser) {
        await logAuditEvent(null, appUser.uid, {
          action: 'update_platform_settings',
          entityType: 'platform_settings',
          entityId: 'global',
          humanReadableDescription: 'Super Admin updated global platform settings.'
        });
      }
      alert('Settings saved successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to save settings');
    }
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Platform Settings</h1>
          <p className="text-neutral-500">Global configuration for the entire platform.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-xl border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">General Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Platform Name</label>
                <input 
                  type="text" 
                  value={settings.platformName}
                  onChange={e => setSettings({...settings, platformName: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Support Email</label>
                <input 
                  type="email" 
                  value={settings.supportEmail}
                  onChange={e => setSettings({...settings, supportEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="maintenanceMode" className="text-sm font-medium text-neutral-700">Maintenance Mode (Block all non-admin access)</label>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Subscription Defaults</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Default Trial Duration (Days)</label>
                <input 
                  type="number" 
                  value={settings.defaultTrialDays}
                  onChange={e => setSettings({...settings, defaultTrialDays: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border border-neutral-200">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="superAdmin2FA"
                  checked={settings.superAdmin2FARequired}
                  onChange={e => setSettings({...settings, superAdmin2FARequired: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="superAdmin2FA" className="text-sm font-medium text-neutral-700">Require 2FA for Super Admins</label>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
