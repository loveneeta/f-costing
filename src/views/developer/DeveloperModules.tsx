import React, { useState } from 'react';
import { usePlatformSettings } from '../../contexts/PlatformSettingsContext';
import { Code, Save } from 'lucide-react';

export const DeveloperModules: React.FC = () => {
  const { settings, updateSettings, loading } = usePlatformSettings();
  const [localModules, setLocalModules] = useState<Record<string, boolean>>(settings.modules || {});
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setLocalModules(settings.modules || {});
  }, [settings.modules]);

  const handleToggle = (key: string) => {
    setLocalModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings('modules', localModules);
      alert('Modules saved successfully.');
    } catch (e: any) {
      alert('Error saving: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const moduleList = [
    { key: 'mod_inventory', label: 'Inventory Management', desc: 'Stock tracking and low-stock alerts.' },
    { key: 'mod_hr', label: 'HR Module', desc: 'Advanced employee onboarding and payroll exports.' },
    { key: 'mod_crm', label: 'CRM / Lead Tracking', desc: 'Track prospective clients and conversions.' },
  ];

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Code className="text-blue-600" /> Modules
          </h1>
          <p className="text-neutral-500 mt-1">Enable or disable high-level application modules.</p>
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
                <th className="p-4 font-medium">Module</th>
                <th className="p-4 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {moduleList.map(m => (
                <tr key={m.key} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="p-4">
                    <button 
                      onClick={() => handleToggle(m.key)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localModules[m.key] ? 'bg-blue-600' : 'bg-neutral-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${localModules[m.key] ? 'translate-x-2' : '-translate-x-2'}`} />
                    </button>
                  </td>
                  <td className="p-4 font-medium text-neutral-900">{m.label}</td>
                  <td className="p-4 text-neutral-500">{m.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
