import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where, documentId } from 'firebase/firestore';
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
      const rawLogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const tenantIds = [...new Set(rawLogs.map(l => l.tenantId).filter(id => id && id !== 'SYSTEM'))];
      const userIds = [...new Set(rawLogs.map(l => l.userId).filter(Boolean))];

      const tenantMap = new Map();
      const userMap = new Map();

      for (let i = 0; i < tenantIds.length; i += 30) {
        const chunk = tenantIds.slice(i, i + 30);
        const tSnap = await getDocs(query(collection(db, 'tenants'), where(documentId(), 'in', chunk)));
        tSnap.forEach(d => tenantMap.set(d.id, d.data().name));
      }

      for (let i = 0; i < userIds.length; i += 30) {
        const chunk = userIds.slice(i, i + 30);
        const uSnap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)));
        uSnap.forEach(d => {
           const uData = d.data();
           userMap.set(d.id, uData.name || uData.email);
        });
      }

      setLogs(rawLogs.map(l => ({
        ...l,
        tenantName: l.tenantId === 'SYSTEM' ? 'SYSTEM' : (tenantMap.get(l.tenantId) || l.tenantId),
        userName: userMap.get(l.userId) || l.userId
      })));
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="text-blue-600" /> Application Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Global platform-level audit and application events.</p>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No logs found.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-semibold">Timestamp</th>
                    <th className="p-4 font-semibold">Action</th>
                    <th className="p-4 font-semibold">Tenant</th>
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Entity Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-xs text-slate-500">
                        {l.timestamp?.toDate ? l.timestamp.toDate().toLocaleString() : new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-semibold text-slate-900">{l.action}</td>
                      <td className="p-4 font-mono text-xs text-slate-600">{l.tenantName || l.tenantId || 'SYSTEM'}</td>
                      <td className="p-4 font-mono text-xs text-slate-600">{l.userName || l.userId}</td>
                      <td className="p-4 text-xs font-medium text-slate-600">{l.entityType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="block md:hidden divide-y divide-slate-100">
              {logs.map(l => (
                <div key={l.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 text-sm">{l.action}</span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                      {l.entityType}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tenant</span>
                      <span className="font-medium text-slate-800 break-all">{l.tenantName || l.tenantId || 'SYSTEM'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">User</span>
                      <span className="font-medium text-slate-800 break-all">{l.userName || l.userId}</span>
                    </div>
                  </div>
                  <div className="pt-1 text-[11px] text-slate-400 font-mono">
                    {l.timestamp?.toDate ? l.timestamp.toDate().toLocaleString() : new Date(l.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
