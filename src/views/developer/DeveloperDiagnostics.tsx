import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlatformSettings } from '../../contexts/PlatformSettingsContext';
import { Activity, Server, Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const DeveloperDiagnostics: React.FC = () => {
  const { appUser } = useAuth();
  const { settings } = usePlatformSettings();
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [dbLatency, setDbLatency] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const checkDb = async () => {
    setDbStatus('checking');
    const start = performance.now();
    try {
      await getDoc(doc(db, 'platform_settings', 'health_check'));
      setDbStatus('ok');
    } catch (e) {
      setDbStatus('error');
    } finally {
      setDbLatency(Math.round(performance.now() - start));
    }
  };

  useEffect(() => {
    checkDb();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkDb();
    setRefreshing(false);
  };

  const DiagnosticCard = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <h3 className="font-semibold text-neutral-800 flex items-center gap-2 mb-4">
        <Icon size={18} className="text-neutral-500" /> {title}
      </h3>
      {children}
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Activity className="text-blue-600" /> Diagnostics
          </h1>
          <p className="text-neutral-500 mt-1">Real-time application health and state.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing || dbStatus === 'checking'}
          className="bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DiagnosticCard title="System Environment" icon={Server}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">User Agent</span>
              <span className="font-mono text-xs max-w-[200px] truncate text-right" title={navigator.userAgent}>{navigator.userAgent}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">React Version</span>
              <span className="font-mono">18.2.0</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-neutral-500">Active Modules</span>
              <span className="font-mono">{Object.values(settings.modules).filter(Boolean).length}</span>
            </div>
          </div>
        </DiagnosticCard>

        <DiagnosticCard title="Database Connectivity" icon={Activity}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-neutral-100 pb-2 items-center">
              <span className="text-neutral-500">Firestore Connection</span>
              {dbStatus === 'checking' ? (
                <span className="text-neutral-400 animate-pulse">Checking...</span>
              ) : dbStatus === 'ok' ? (
                <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={14}/> Connected</span>
              ) : (
                <span className="text-red-600 font-medium flex items-center gap-1"><XCircle size={14}/> Error</span>
              )}
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-neutral-500">Read Latency</span>
              <span className="font-mono">{dbLatency} ms</span>
            </div>
          </div>
        </DiagnosticCard>

        <DiagnosticCard title="Authentication Context" icon={Shield}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">User UID</span>
              <span className="font-mono text-xs">{appUser?.uid || 'Not Authenticated'}</span>
            </div>
            <div className="flex justify-between border-b border-neutral-100 pb-2">
              <span className="text-neutral-500">Role</span>
              <span className="font-mono bg-blue-50 text-blue-700 px-2 rounded">{appUser?.role}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-neutral-500">Tenant ID</span>
              <span className="font-mono text-xs">{appUser?.tenantId || 'null (Super Admin)'}</span>
            </div>
          </div>
        </DiagnosticCard>
      </div>
    </div>
  );
};
