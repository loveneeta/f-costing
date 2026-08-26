import React, { useState } from 'react';
import { usePlatformSettings } from '../../contexts/PlatformSettingsContext';
import { Flag, Save } from 'lucide-react';

export const DeveloperFeatures: React.FC = () => {
  const { settings, updateSettings, loading } = usePlatformSettings();
  const [localFeatures, setLocalFeatures] = useState<Record<string, boolean>>(settings.features || {});
  const [isSaving, setIsSaving] = useState(false);

  // Sync when settings load
  React.useEffect(() => {
    setLocalFeatures(settings.features || {});
  }, [settings.features]);

  const handleToggle = (key: string) => {
    setLocalFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings('features', localFeatures);
      alert('Feature flags saved successfully.');
    } catch (e: any) {
      alert('Error saving: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const featureList = [
    { key: 'enable_ai_costing', label: 'AI Costing Engine', desc: 'Enables Gemini-powered auto-costing suggestions.' },
    { key: 'enable_sso', label: 'Enterprise SSO', desc: 'Allows companies to use SAML/SSO.' },
    { key: 'enable_advanced_exports', label: 'Advanced Exports', desc: 'Export to PDF/Excel with custom branding.' },
    { key: 'enable_multi_currency', label: 'Multi-Currency Support', desc: 'Allow items to be priced in different currencies.' }
  ];

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Flag className="text-blue-600" /> Feature Flags
          </h1>
          <p className="text-neutral-500 mt-1">Control global feature availability across all tenants.</p>
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
                <th className="p-4 font-medium w-16">Status</th>
                <th className="p-4 font-medium">Feature</th>
                <th className="p-4 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {featureList.map(f => (
                <tr key={f.key} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="p-4">
                    <button 
                      onClick={() => handleToggle(f.key)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localFeatures[f.key] ? 'bg-blue-600' : 'bg-neutral-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localFeatures[f.key] ? 'translate-x-2' : '-translate-x-2'}`} />
                    </button>
                  </td>
                  <td className="p-4 font-medium text-neutral-900">{f.label} <span className="text-xs text-neutral-400 font-mono ml-2">({f.key})</span></td>
                  <td className="p-4 text-neutral-500">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
