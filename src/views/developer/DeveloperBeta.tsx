import React, { useState } from 'react';
import { usePlatformSettings } from '../../contexts/PlatformSettingsContext';
import { TestTube, Save } from 'lucide-react';

export const DeveloperBeta: React.FC = () => {
  const { settings, updateSettings, loading } = usePlatformSettings();
  const [localBeta, setLocalBeta] = useState<Record<string, 'Development' | 'Beta' | 'Stable' | 'Disabled'>>(settings.beta || {});
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setLocalBeta(settings.beta || {});
  }, [settings.beta]);

  const handleChange = (key: string, val: 'Development' | 'Beta' | 'Stable' | 'Disabled') => {
    setLocalBeta(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings('beta', localBeta);
      alert('Beta settings saved successfully.');
    } catch (e: any) {
      alert('Error saving: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const betaList = [
    { key: 'new_dashboard', label: 'Dashboard v2 (Analytics)', desc: 'Next-gen analytics dashboard.' },
    { key: 'cloud_sync', label: 'Offline Cloud Sync', desc: 'Background syncing for offline mode.' },
  ];

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <TestTube className="text-blue-600" /> Beta Features
          </h1>
          <p className="text-neutral-500 mt-1">Control rollout phases of beta features.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="p-4 font-medium w-48">Phase</th>
                <th className="p-4 font-medium">Feature</th>
                <th className="p-4 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {betaList.map(b => (
                <tr key={b.key} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="p-4">
                    <select 
                      value={localBeta[b.key] || 'Disabled'}
                      onChange={(e) => handleChange(b.key, e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-neutral-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    >
                      <option value="Disabled">Disabled</option>
                      <option value="Development">Development (Super Admin Only)</option>
                      <option value="Beta">Beta (Opt-in Tenants)</option>
                      <option value="Stable">Stable (All Tenants)</option>
                    </select>
                  </td>
                  <td className="p-4 font-medium text-neutral-900">{b.label}</td>
                  <td className="p-4 text-neutral-500">{b.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
