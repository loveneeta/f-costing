import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Building, Trash2, ShieldAlert } from 'lucide-react';

export const DeveloperTesting: React.FC = () => {
  const { appUser } = useAuth();
  const [testTenants, setTestTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTestTenants = async () => {
    try {
      const q = query(collection(db, 'tenants'), where('environment', '==', 'test'));
      const snap = await getDocs(q);
      setTestTenants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appUser?.role === 'super_admin') {
      fetchTestTenants();
    }
  }, [appUser]);

  const handleDeleteTestTenant = async (tenantId: string) => {
    if (appUser?.role !== 'super_admin') return;
    
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this test company and all associated metadata? This cannot be undone.");
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      // Security rule prevents deleting unless tenant.environment === 'test' 
      // but we do it manually here.
      const tenantDoc = await getDocs(query(collection(db, 'tenants'))); // Let's just double check
      const theDoc = tenantDoc.docs.find(d => d.id === tenantId);
      if (theDoc && theDoc.data().environment === 'test') {
         await deleteDoc(doc(db, 'tenants', tenantId));
         await fetchTestTenants();
      } else {
         alert("Cannot delete production company.");
      }
    } catch (e: any) {
      alert("Error deleting tenant: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!appUser || appUser.role !== 'super_admin') {
    return <div className="p-8">Unauthorized</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Test Environment</h1>
          <p className="text-neutral-500 mt-1">Manage isolated test companies and dummy data.</p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-800 flex items-center gap-2">
            <Building size={18} className="text-purple-600" />
            Test Companies
          </h2>
          <p className="text-sm text-neutral-500 mt-1">These companies exist in isolation and do not affect production statistics.</p>
        </div>
        
        <div className="p-0">
          {loading ? (
            <div className="p-6 text-center text-sm text-neutral-500">Loading test companies...</div>
          ) : testTenants.length === 0 ? (
            <div className="p-6 text-center text-sm text-neutral-500">No test companies found. Create one from the Companies tab.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="p-4 font-medium">Company Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Created At</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testTenants.map(t => (
                  <tr key={t.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="p-4 font-medium text-neutral-900">{t.name}</td>
                    <td className="p-4 text-neutral-600">{t.email}</td>
                    <td className="p-4 text-neutral-600">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteTestTenant(t.id)}
                        disabled={actionLoading}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 flex gap-4 items-start">
        <ShieldAlert className="text-orange-600 shrink-0 mt-0.5" size={24} />
        <div>
          <h3 className="font-bold text-orange-900">Test vs Production Isolation</h3>
          <p className="text-sm text-orange-800 mt-1">
            Test companies strictly use the <code>environment: 'test'</code> flag. Production metrics, billing logic, and dashboards must exclude these companies. Ensure Firestore rules properly enforce these boundaries.
          </p>
        </div>
      </div>
    </div>
  );
};
