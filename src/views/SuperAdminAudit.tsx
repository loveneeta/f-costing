import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileText, RefreshCw } from 'lucide-react';

export const SuperAdminAudit: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <FileText className="text-blue-600" /> Application Logs
          </h1>
          <p className="text-neutral-500 mt-1">Global platform-level audit and application events.</p>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="p-4 font-medium">Timestamp</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">Tenant ID</th>
                <th className="p-4 font-medium">User ID</th>
                <th className="p-4 font-medium">Entity Type</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-500">Loading logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-500">No logs found.</td>
                </tr>
              ) : logs.map(l => (
                <tr key={l.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="p-4 font-mono text-xs text-neutral-500">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="p-4 font-medium text-neutral-900">{l.action}</td>
                  <td className="p-4 font-mono text-xs text-neutral-500">{l.tenantId || 'SYSTEM'}</td>
                  <td className="p-4 font-mono text-xs text-neutral-500">{l.userId}</td>
                  <td className="p-4 text-neutral-600">{l.entityType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
