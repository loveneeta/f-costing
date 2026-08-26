import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, limit, getCountFromServer, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Building, Users, Activity, AlertCircle, FileBox, Layers } from 'lucide-react';
import { logAuditEvent } from '../services/AuditService';

export const SuperAdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    trialCompanies: 0,
    suspendedCompanies: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0
  });
  
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          totalT, activeT, trialT, suspT,
          usersSnap, subsSnap,
          logsSnap
        ] = await Promise.all([
          getCountFromServer(collection(db, 'tenants')),
          getCountFromServer(query(collection(db, 'tenants'), where('status', '==', 'active'))),
          getCountFromServer(query(collection(db, 'tenants'), where('status', '==', 'trial'))),
          getCountFromServer(query(collection(db, 'tenants'), where('status', '==', 'suspended'))),
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(query(collection(db, 'subscriptions'), where('status', '==', 'ACTIVE'))),
          getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(10)))
        ]);

        // Aggregate revenue (for real this would be calculated serverside, but we aggregate locally for now)
        let rev = 0;
        try {
           const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('status', '==', 'PAID')));
           rev = paymentsSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
        } catch (e) {
           console.log("No payments collection or data yet");
        }

        setMetrics({
          totalCompanies: totalT.data().count,
          activeCompanies: activeT.data().count,
          trialCompanies: trialT.data().count,
          suspendedCompanies: suspT.data().count,
          totalUsers: usersSnap.data().count,
          activeSubscriptions: subsSnap.data().count,
          totalRevenue: rev
        });

        setRecentLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      }
      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Platform Overview</h1>
        <p className="text-neutral-500">Super admin analytics and recent activity.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900 mb-1">{metrics.totalCompanies}</div>
          <div className="text-sm text-neutral-500">Total Companies</div>
          <div className="mt-4 pt-4 border-t border-neutral-100 flex gap-4 text-xs">
             <div className="text-emerald-600 font-medium">{metrics.activeCompanies} Active</div>
             <div className="text-blue-600 font-medium">{metrics.trialCompanies} Trial</div>
             <div className="text-rose-600 font-medium">{metrics.suspendedCompanies} Suspended</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Layers size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900 mb-1">{metrics.activeSubscriptions}</div>
          <div className="text-sm text-neutral-500">Active Subscriptions</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileBox size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900 mb-1">₹{metrics.totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-neutral-500">Total Revenue</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900 mb-1">{metrics.totalUsers}</div>
          <div className="text-sm text-neutral-500">Total Platform Users</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-900">Recent Platform Activity</h2>
        </div>
        <div className="divide-y divide-neutral-100">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">No recent activity.</div>
          ) : (
            recentLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-neutral-50 flex items-start gap-4">
                <div className="mt-1">
                  <Activity size={16} className="text-neutral-400" />
                </div>
                <div>
                  <div className="text-sm text-neutral-900 font-medium">
                    {log.humanReadableDescription || log.action}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 flex items-center gap-3">
                    <span>{new Date(log.timestamp?.toMillis() || Date.now()).toLocaleString()}</span>
                    <span>•</span>
                    <span className="bg-neutral-100 px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-neutral-600">{log.entityType}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
