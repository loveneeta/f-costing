const fs = require('fs');
let content = `import { TenantStats } from "../components/TenantStats";
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Tenant } from '../contexts/TenantContext';
import { logAuditEvent } from '../services/AuditService';
import { Building, Plus, Search, CheckCircle, XCircle, Shield } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const TenantManagement: React.FC = () => {
  const { appUser } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTenantPlan, setEditingTenantPlan] = useState<Tenant | null>(null);
  const [editingPlanId, setEditingPlanId] = useState('');
  
  // New Tenant Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'test'>('production');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [plan, setPlan] = useState('');
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const q = query(collection(db, 'subscription_plans'), where('status', '==', 'active'));
        const plansSnap = await getDocs(q);
        const plansData = plansSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAvailablePlans(plansData);
        if (plansData.length > 0) {
          setPlan(plansData[0].id);
        }
      } catch (e) {}
    };
    if (appUser?.role === 'super_admin' && appUser?.tenantId === null) {
      fetchPlans();
    }
  }, [appUser]);

  useEffect(() => {
    if (appUser?.role === 'super_admin' && appUser?.tenantId === null) {
      fetchTenants();
    }
  }, [appUser]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'tenants'));
      const snapshot = await getDocs(q);
      const data: Tenant[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as Tenant);
      });
      setTenants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) {
      alert("Please select a valid subscription plan.");
      return;
    }
    
    try {
      // Check if a tenant with this email already exists
      const tenantsRef = collection(db, 'tenants');
      const q = query(tenantsRef, where('email', '==', email.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('A tenant with this company email address already exists.');
        return;
      }

      const tenantId = uuidv4();
      const newTenant = {
        name,
        email: email.trim().toLowerCase(),
        phone,
        address,
        status: 'active',
        subscriptionPlan: plan,
        environment,
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'tenants', tenantId), newTenant);
      
      // Create Subscription Record
      const subscriptionId = uuidv4();
      await setDoc(doc(db, 'subscriptions', subscriptionId), {
        tenantId,
        planId: plan,
        status: 'ACTIVE',
        startDate: new Date().toISOString(),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Initialize settings for the tenant
      await setDoc(doc(db, 'settings', tenantId), {
        tenantId,
        company: { name, email, phone, address },
        pricing: { profitMargin: 20, installationFactor: 10, overheadCost: 5, hardwareContingency: 5 }
      });

      // Create Admin Invitation
      const inviteToken = uuidv4();
      const encoder = new TextEncoder();
      const data = encoder.encode(inviteToken);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      await setDoc(doc(collection(db, 'invitations')), {
        tenantId,
        email: adminEmail.trim().toLowerCase(),
        name: adminName.trim(),
        role: 'company_admin',
        tokenHash,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        createdAt: new Date().toISOString()
      });
      
      await logAuditEvent(null, appUser!.uid, {
        action: 'tenant.create',
        entityType: 'tenant',
        entityId: tenantId,
        humanReadableDescription: \`Created new \${environment} tenant: \${name}\`,
        details: { name, plan, adminEmail, environment }
      });
      
      await logAuditEvent(null, appUser!.uid, {
        action: 'tenant.invitation.create',
        entityType: 'invitation',
        entityId: adminEmail.trim().toLowerCase(),
        humanReadableDescription: \`Created company_admin invitation for \${adminEmail}\`
      });
      
      setShowModal(false);
      setName('');
      setEmail('');
      setPhone('');
      setAddress(''); 
      setEnvironment('production');
      setAdminName('');
      setAdminEmail('');
      if (availablePlans.length > 0) setPlan(availablePlans[0].id);
      
      alert(\`Company created! An invitation token for the admin has been generated. Ask them to visit: /accept-invitation?token=\${inviteToken}&email=\${adminEmail.trim().toLowerCase()}\`);
      
      fetchTenants();
    } catch (err) {
      console.error("Failed to create tenant", err);
      alert('Failed to create tenant');
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'tenants', tenant.id), { status: newStatus });
      
      await logAuditEvent(null, appUser!.uid, {
        action: 'tenant.status_change',
        entityType: 'tenant',
        entityId: tenant.id,
        beforeValue: tenant.status,
        afterValue: newStatus,
        humanReadableDescription: \`Changed tenant status to \${newStatus}\`
      });
      
      fetchTenants();
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  const handleChangePlan = async () => {
    if (!editingTenantPlan || !editingPlanId) return;
    try {
      const oldPlan = editingTenantPlan.subscriptionPlan;
      
      // Update tenant
      await updateDoc(doc(db, 'tenants', editingTenantPlan.id), { 
        subscriptionPlan: editingPlanId,
        updatedAt: new Date().toISOString()
      });
      
      // Update authoritative subscription
      const subQ = query(collection(db, 'subscriptions'), where('tenantId', '==', editingTenantPlan.id), where('status', 'in', ['ACTIVE', 'TRIAL', 'PAST_DUE']));
      const subSnap = await getDocs(subQ);
      if (!subSnap.empty) {
        const subDoc = subSnap.docs[0];
        await updateDoc(subDoc.ref, {
          planId: editingPlanId,
          updatedAt: new Date().toISOString()
        });
      }
      
      await logAuditEvent(null, appUser!.uid, {
        action: 'tenant.plan_change',
        entityType: 'tenant',
        entityId: editingTenantPlan.id,
        beforeValue: oldPlan,
        afterValue: editingPlanId,
        humanReadableDescription: \`Super Admin changed plan from \${oldPlan} to \${editingPlanId}\`
      });
      
      setEditingTenantPlan(null);
      fetchTenants();
    } catch (err) {
      console.error("Error updating plan", err);
    }
  };

  if (appUser?.role !== "super_admin" || appUser?.tenantId !== null) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
          <Shield size={20} />
          <p className="font-medium">Access Denied. Only Super Admins can manage tenants.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tenant Management</h1>
          <p className="text-neutral-500">Manage organizations and their subscriptions.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> New Tenant
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tenants..." 
              className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Building size={16} /> {tenants.length} Organizations
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading tenants...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Stats</th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => {
                const planName = availablePlans.find(p => p.id === t.subscriptionPlan)?.name || t.subscriptionPlan || 'Unknown';
                return (
                <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900 flex items-center gap-2">
                      {t.name}
                      {t.environment === 'test' ? (
                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">TEST / SANDBOX</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">PRODUCTION</span>
                      )}
                    </div>
                    <div className="text-sm text-neutral-500">{t.email}</div>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 capitalize border border-neutral-200">
                        {planName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <TenantStats tenantId={t.id} />
                  </td>
                  <td className="px-6 py-4">
                    {t.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                        <CheckCircle size={14} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 capitalize">
                        <XCircle size={14} /> {t.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-600">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-3">
                    <button 
                      onClick={() => { 
                        setEditingTenantPlan(t);
                        setEditingPlanId(t.subscriptionPlan || (availablePlans.length > 0 ? availablePlans[0].id : ''));
                      }}
                      className="text-sm font-medium text-purple-600 hover:text-purple-800"
                    >
                      Plan
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(t)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {t.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm(\`Are you sure you want to deactivate \${t.name}?\`)) {
                          await updateDoc(doc(db, 'tenants', t.id), { status: 'inactive' });
                          await logAuditEvent(null, appUser!.uid, {
                            action: 'tenant.status_change',
                            entityType: 'tenant',
                            entityId: t.id,
                            beforeValue: t.status,
                            afterValue: 'inactive',
                            humanReadableDescription: 'Deactivated tenant'
                          });
                          fetchTenants();
                        }
                      }}
                      className="text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              )})}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No tenants found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-neutral-100 flex-shrink-0">
              <h3 className="text-xl font-bold text-neutral-900">Create New Tenant</h3>
            </div>
            <form onSubmit={handleCreateTenant} className="p-6 space-y-4 overflow-y-auto flex-1">
              <h4 className="font-semibold text-neutral-800 text-sm border-b pb-1">Company Details</h4>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Environment</label>
                <select 
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as 'production' | 'test')}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="production">Production</option>
                  <option value="test">Test / Sandbox</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Company Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Acme Corp"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Company Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="contact@acmecorp.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Company Phone</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Company Address</label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="123 Main St, City, Country"
                  rows={2}
                />
              </div>

              <h4 className="font-semibold text-neutral-800 text-sm border-b pb-1 pt-2">Initial Admin Setup</h4>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Admin Name</label>
                <input 
                  type="text" 
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Admin Email</label>
                <input 
                  type="email" 
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="jane.doe@acmecorp.com"
                />
              </div>

              <h4 className="font-semibold text-neutral-800 text-sm border-b pb-1 pt-2">Subscription</h4>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Plan</label>
                {availablePlans.length > 0 ? (
                  <select 
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                  >
                    {availablePlans.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-2 border border-red-300 bg-red-50 text-red-700 rounded-lg text-sm">
                    Unable to load subscription plans.
                  </div>
                )}
              </div>
              <div className="pt-4 flex gap-3 flex-shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-white border border-neutral-300 text-neutral-700 font-medium py-2 rounded-lg hover:bg-neutral-50 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={availablePlans.length === 0}
                  className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingTenantPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-neutral-900">Update Subscription</h3>
              <button onClick={() => setEditingTenantPlan(null)} className="text-neutral-400 hover:text-neutral-600">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-600 mb-4">
                Select a new subscription plan for <strong>{editingTenantPlan.name}</strong>.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Plan</label>
                {availablePlans.length > 0 ? (
                  <select 
                    value={editingPlanId}
                    onChange={(e) => setEditingPlanId(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                  >
                    {availablePlans.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-2 border border-red-300 bg-red-50 text-red-700 rounded-lg text-sm">
                    Unable to load subscription plans.
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingTenantPlan(null)}
                  className="flex-1 bg-white border border-neutral-300 text-neutral-700 font-medium py-2 rounded-lg hover:bg-neutral-50 text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleChangePlan}
                  disabled={availablePlans.length === 0}
                  className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`
fs.writeFileSync('src/views/TenantManagement.tsx', content);
