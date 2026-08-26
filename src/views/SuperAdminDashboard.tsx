import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, orderBy, where, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent } from '../services/AuditService';
import { v4 as uuidv4 } from 'uuid';
import { Building, CheckCircle, ShieldAlert, CreditCard, Search, X, ChevronRight, Terminal, UserSquare2, LogIn, Activity } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'organizations' | 'plan_requests' | 'audit_logs'>('organizations');
  
  // Data
  const [tenants, setTenants] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Drawer State
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'subscription' | 'payments' | 'logins' | 'activity'>('overview');
  const [internalNote, setInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [techDetailsLog, setTechDetailsLog] = useState<any | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // New Tenant Modal State
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantAddress, setNewTenantAddress] = useState('');
  const [newTenantEnvironment, setNewTenantEnvironment] = useState<'production' | 'test'>('production');
  const [newTenantAdminName, setNewTenantAdminName] = useState('');
  const [newTenantAdminEmail, setNewTenantAdminEmail] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);

  // Expiry Date Edit State
  const [isEditingExpiry, setIsEditingExpiry] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [isSavingExpiry, setIsSavingExpiry] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantPlan) {
      alert("Please select a valid subscription plan.");
      return;
    }
    
    setIsCreatingTenant(true);
    try {
      // Check if a tenant with this email already exists
      const tenantsRef = collection(db, 'tenants');
      const q = query(tenantsRef, where('email', '==', newTenantEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('A tenant with this company email address already exists.');
        setIsCreatingTenant(false);
        return;
      }

      const tenantId = uuidv4();
      const newTenant = {
        name: newTenantName,
        email: newTenantEmail.trim().toLowerCase(),
        phone: newTenantPhone,
        address: newTenantAddress,
        status: 'active',
        subscriptionPlan: newTenantPlan,
        environment: newTenantEnvironment,
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'tenants', tenantId), newTenant);
      
      // Create Subscription Record
      const subscriptionId = uuidv4();
      await setDoc(doc(db, 'subscriptions', subscriptionId), {
        tenantId,
        planId: newTenantPlan,
        status: 'ACTIVE',
        startDate: new Date().toISOString(),
        renewalDate: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString(); })(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Initialize settings for the tenant
      await setDoc(doc(db, 'settings', tenantId), {
        tenantId,
        company: { name: newTenantName, email: newTenantEmail, phone: newTenantPhone, address: newTenantAddress },
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
        email: newTenantAdminEmail.trim().toLowerCase(),
        name: newTenantAdminName.trim(),
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
        humanReadableDescription: `Created new ${newTenantEnvironment} tenant: ${newTenantName}`,
        details: { name: newTenantName, plan: newTenantPlan, adminEmail: newTenantAdminEmail, environment: newTenantEnvironment }
      });
      
      await logAuditEvent(null, appUser!.uid, {
        action: 'tenant.invitation.create',
        entityType: 'invitation',
        entityId: newTenantAdminEmail.trim().toLowerCase(),
        humanReadableDescription: `Created company_admin invitation for ${newTenantAdminEmail}`
      });
      
      setShowAddTenantModal(false);
      setNewTenantName('');
      setNewTenantEmail('');
      setNewTenantPhone('');
      setNewTenantAddress(''); 
      setNewTenantEnvironment('production');
      setNewTenantAdminName('');
      setNewTenantAdminEmail('');
      if (plans.length > 0) setNewTenantPlan(plans[0].id);
      
      const origin = window.location.origin;
      setGeneratedLink(`${origin}/#/accept-invitation?token=${inviteToken}&email=${newTenantAdminEmail.trim().toLowerCase()}`);
      
      fetchData();
    } catch (err) {
      console.error("Failed to create tenant:", err);
      alert("Failed to create tenant");
    }
    setIsCreatingTenant(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tenantsSnap, subsSnap, paymentsSnap, logsSnap, plansSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'tenants')),
        getDocs(collection(db, 'subscriptions')),
        getDocs(collection(db, 'payments')),
        getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'))),
        getDocs(collection(db, 'subscription_plans')),
        getDocs(collection(db, 'users'))
      ]);

      setTenants(tenantsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSubscriptions(subsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPayments(paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAuditLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch superadmin data:", err);
    }
    setLoading(false);
  };

  const handleSaveExpiryDate = async () => {
    if (!selectedTenant || !newExpiryDate) return;
    setIsSavingExpiry(true);
    try {
      const sub = getTenantSubscription(selectedTenant.id);
      if (sub && sub.id) {
        // Update existing subscription
        await updateDoc(doc(db, 'subscriptions', sub.id), {
          renewalDate: newExpiryDate
        });
        setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, renewalDate: newExpiryDate } : s));
      } else {
        // Create new subscription for the tenant
        const newSubData = {
          tenantId: selectedTenant.id,
          status: 'ACTIVE',
          renewalDate: newExpiryDate,
          startDate: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'subscriptions'), newSubData);
        setSubscriptions(prev => [...prev, { id: docRef.id, ...newSubData }]);
      }
      setIsEditingExpiry(false);
    } catch (err) {
      console.error('Failed to update expiry date', err);
      alert('Failed to update expiry date');
    }
    setIsSavingExpiry(false);
  };

  const handleRenewSubscription = async (months: number) => {
    if (!selectedTenant) return;
    setIsSavingExpiry(true);
    try {
      const sub = getTenantSubscription(selectedTenant.id);
      
      let baseDate = new Date();
      if (sub?.renewalDate) {
         const currentRenewal = new Date(sub.renewalDate);
         if (currentRenewal > baseDate) {
            baseDate = currentRenewal;
         }
      }
      
      baseDate.setMonth(baseDate.getMonth() + months);
      // Keep only the date part YYYY-MM-DD
      const newDateStr = baseDate.toISOString().split('T')[0];

      if (sub && sub.id) {
        await updateDoc(doc(db, 'subscriptions', sub.id), {
          renewalDate: newDateStr,
          status: 'ACTIVE'
        });
        setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, renewalDate: newDateStr, status: 'ACTIVE' } : s));
      } else {
        const newSubData = {
          tenantId: selectedTenant.id,
          status: 'ACTIVE',
          renewalDate: newDateStr,
          startDate: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'subscriptions'), newSubData);
        setSubscriptions(prev => [...prev, { id: docRef.id, ...newSubData }]);
      }
    } catch (err) {
      console.error('Failed to renew subscription', err);
      alert('Failed to renew subscription');
    }
    setIsSavingExpiry(false);
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !paymentAmount) return;
    setIsSubmittingPayment(true);
    try {
      const paymentData = {
        tenantId: selectedTenant.id,
        amount: parseFloat(paymentAmount),
        mode: paymentMode,
        status: paymentStatus,
        timestamp: new Date().getTime(),
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'payments'), paymentData);
      setPayments(prev => [{ id: docRef.id, ...paymentData }, ...prev]);
      
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMode('Bank Transfer');
      setPaymentStatus('PAID');
    } catch (err) {
      console.error('Failed to add payment', err);
      alert('Failed to add payment');
    }
    setIsSubmittingPayment(false);
  };

  const handleSaveNote = async () => {
    if (!selectedTenant) return;
    setSavingNote(true);
    try {
      await updateDoc(doc(db, 'tenants', selectedTenant.id), {
        adminNotes: internalNote
      });
      setTenants(prev => prev.map(t => t.id === selectedTenant.id ? { ...t, adminNotes: internalNote } : t));
      alert("Note saved successfully.");
    } catch (err) {
      console.error("Error saving note", err);
      alert("Failed to save note.");
    }
    setSavingNote(false);
  };

  const openDrawer = (tenant: any) => {
    setSelectedTenant(tenant);
    setInternalNote(tenant.adminNotes || '');
    setDrawerTab('overview');
  };

  const getPlanName = (planId: string) => {
    if (!planId) return 'PRO';
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : planId;
  };

  const getTenantSubscription = (tenantId: string) => {
    return subscriptions.find(s => s.tenantId === tenantId) || null;
  };

  // Metrics
  const totalOrgs = tenants.length;
  const activeSubs = tenants.filter(t => {
    const sub = getTenantSubscription(t.id);
    return (sub?.status || t.status) === 'ACTIVE';
  }).length;
  const expiredSubs = tenants.filter(t => {
    const sub = getTenantSubscription(t.id);
    return (sub?.status || t.status) === 'EXPIRED' || (sub?.status || t.status) === 'PAST_DUE';
  }).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 font-sans relative overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Superadmin</h1>
        <p className="text-slate-500 mt-1">Manage your business operations</p>
      </div>

      {/* Terminal Banner */}
      <div className="bg-[#0f172a] rounded-2xl p-6 mb-8 flex justify-between items-center text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex items-center gap-4 relative z-10">
          <Terminal size={32} className="text-emerald-400" />
          <div>
            <h2 className="text-xl font-bold tracking-wide">Super Admin Terminal</h2>
            <p className="text-slate-400 text-sm">Enterprise Subscription Management</p>
          </div>
        </div>
        <button className="bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-lg text-sm font-medium relative z-10">
          Reset Session
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
            <Building size={20} />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Organizations</div>
          <div className="text-3xl font-bold text-slate-900">{totalOrgs}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle size={20} />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Subscriptions</div>
          <div className="text-3xl font-bold text-slate-900">{activeSubs}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mb-4">
            <ShieldAlert size={20} />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expired / Pending</div>
          <div className="text-3xl font-bold text-slate-900">{expiredSubs}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-4">
            <CreditCard size={20} />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Plan Requests</div>
          <div className="text-3xl font-bold text-slate-900">0</div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-6 bg-slate-200/50 p-1 w-max rounded-xl">
        <button 
          onClick={() => setActiveTab('organizations')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'organizations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Organizations
        </button>
        <button 
          onClick={() => setActiveTab('plan_requests')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'plan_requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Plan Requests
        </button>
        <button 
          onClick={() => setActiveTab('audit_logs')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'audit_logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Audit Logs
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {activeTab === 'organizations' && (
          <>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search organizations by name or ID..." 
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddTenantModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                >
                  + New Tenant
                </button>
                <select className="border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none">
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Expired</option>
                </select>
                <select className="border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none">
                  <option>Sort by Name</option>
                  <option>Sort by Date</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading organizations...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Organization ID / Name</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Plan</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Expiry Date</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map(t => {
                    const sub = getTenantSubscription(t.id);
                    const isExpired = sub?.status === 'EXPIRED';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-900">{t.name}</div>
                          <div className="text-xs font-mono text-slate-400 mt-1 uppercase">{t.id}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-start gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-600">
                              {getPlanName(sub?.planId || t.subscriptionPlan)}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${isExpired ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {sub?.status || t.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                            {sub?.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'N/A'}
                            {isExpired && <span className="ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold tracking-wider">EXPIRED</span>}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            
                            <button 
                              onClick={() => openDrawer(t)}
                              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider"
                            >
                              Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === 'plan_requests' && (
          <div className="p-8">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500 font-medium">No plan upgrade requests pending.</p>
            </div>
          </div>
        )}

        {activeTab === 'audit_logs' && (
          <div className="p-8">
             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 bg-slate-50/50 flex items-center gap-3">
                   <ShieldAlert className="text-slate-500" size={20} />
                   <h2 className="text-lg font-bold text-slate-900">System Audit Log</h2>
                </div>
                <div className="w-full overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-y border-slate-100 bg-white">
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-48">Date & Time</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-64">Admin</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-48">Target Org</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {auditLogs.length === 0 ? (
                         <tr>
                           <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No logs found.</td>
                         </tr>
                       ) : auditLogs.map((log, idx) => {
                         const tenantName = tenants.find(t => t.id === log.tenantId)?.name || 'System';
                         const userEmail = users.find(u => u.id === log.userId)?.email || log.userId || log.adminEmail || 'loveneetarora.ai@gmail.com';
                         const dateStr = new Date(log.timestamp?.toMillis ? log.timestamp.toMillis() : log.timestamp || Date.now());
                         const timeFormatted = dateStr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase();
                         const dateFormatted = dateStr.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                         
                         return (
                           <tr key={log.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                             <td className="px-6 py-6 align-top">
                               <div className="text-xs text-slate-500 font-medium">
                                 {dateFormatted}, {timeFormatted}
                               </div>
                             </td>
                             <td className="px-6 py-6 align-top">
                               <div className="text-sm font-bold text-slate-900">
                                 {userEmail}
                               </div>
                             </td>
                             <td className="px-6 py-6 align-top">
                               <div className="text-sm font-bold text-slate-900 mb-3">
                                 {log.action === 'auth.login' || log.action === 'Login' ? 'Admin Login' : (log.humanReadableDescription || log.action)}
                               </div>
                               <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                                 <div className="flex gap-2">
                                   <span className="text-slate-400 w-16">User:</span>
                                   <span className="text-slate-700 font-bold">{userEmail}</span>
                                 </div>
                                 <div className="flex gap-2">
                                   <span className="text-slate-400 w-16">Login:</span>
                                   <span className="text-slate-700 font-bold">{log.status || 'Successful'}</span>
                                 </div>
                                 <div className="flex gap-2">
                                   <span className="text-slate-400 w-16">Browser:</span>
                                   <span className="text-slate-700 font-bold">{log.details?.browser || 'Chrome'}</span>
                                 </div>
                                 <div className="flex gap-2">
                                   <span className="text-slate-400 w-16">Device:</span>
                                   <span className="text-slate-700 font-bold">{log.details?.os || 'Windows'}</span>
                                 </div>
                               </div>
                               <button 
                                 onClick={() => setTechDetailsLog(log)}
                                 className="mt-5 text-[10px] font-bold text-slate-400 tracking-wider uppercase hover:text-indigo-600 transition-colors"
                               >
                                 View Technical Details
                               </button>
                             </td>
                             <td className="px-6 py-6 align-top">
                               <div className="text-sm font-bold text-slate-700">
                                 {tenantName}
                               </div>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Technical Details Modal */}
      {techDetailsLog && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-900/40 backdrop-blur-sm" onClick={() => setTechDetailsLog(null)}></div>
            <div className="relative w-full max-w-2xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Terminal size={18} className="text-slate-400" />
                    Log Technical Details
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">ID: {techDetailsLog.id}</p>
                </div>
                <button onClick={() => setTechDetailsLog(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action</div>
                    <div className="text-sm font-mono text-slate-800">{techDetailsLog.action}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Entity</div>
                    <div className="text-sm font-mono text-slate-800">{techDetailsLog.entityType} ({techDetailsLog.entityId})</div>
                  </div>
                </div>
                
                {techDetailsLog.before && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Previous State</div>
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                      {JSON.stringify(techDetailsLog.before, null, 2)}
                    </pre>
                  </div>
                )}
                
                {techDetailsLog.after && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">New State</div>
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                      {JSON.stringify(techDetailsLog.after, null, 2)}
                    </pre>
                  </div>
                )}
                
                {techDetailsLog.details && Object.keys(techDetailsLog.details).length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Additional Metadata</div>
                    <pre className="bg-slate-900 text-blue-400 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                      {JSON.stringify(techDetailsLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>

            <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Add Payment Record</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 5000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmittingPayment ? 'Saving...' : 'Save Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Drawer */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTenant(null)}
          ></div>
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedTenant.name}</h2>
                  <p className="text-sm font-mono text-slate-500 mt-0.5">{selectedTenant.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTenant(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex px-6 border-b border-slate-100">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'subscription', label: 'Subscription' },
                { id: 'payments', label: 'Payments' },
                { id: 'logins', label: 'Logins' },
                { id: 'activity', label: 'Activity' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDrawerTab(tab.id as any)}
                  className={`px-4 py-4 text-sm font-semibold tracking-wide border-b-2 transition-colors ${drawerTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              {drawerTab === 'overview' && (
                <div className="space-y-6">
                  {/* Company Details */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Company Details</h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Company Name</div>
                        <div className="font-semibold text-slate-900">{selectedTenant.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Created At</div>
                        <div className="font-semibold text-slate-900">
                          {selectedTenant.createdAt ? new Date(selectedTenant.createdAt).toLocaleDateString('en-GB') : 'Unknown'}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-slate-500 mb-1">Master User Email</div>
                        <div className="font-mono text-sm bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 inline-block">
                          {selectedTenant.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">Internal Admin Notes</h3>
                      <button 
                        onClick={handleSaveNote}
                        disabled={savingNote}
                        className="px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {savingNote ? 'Saving...' : '+ Save Note'}
                      </button>
                    </div>
                    <textarea 
                      value={internalNote}
                      onChange={e => setInternalNote(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:border-amber-400 min-h-[100px] resize-y shadow-inner"
                      placeholder="Add secure notes about this client here. These are only visible to super admins."
                    />
                    <div className="mt-2 text-[10px] text-amber-600/70 uppercase tracking-widest font-bold flex justify-between">
                      <span>Super Admin Use Only</span>
                      <span>{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'subscription' && (
                <div className="space-y-6">
                  {(() => {
                    const sub = getTenantSubscription(selectedTenant.id);
                    return (
                      <>
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex justify-between items-center">
                           <div>
                             <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Plan</h3>
                             <div className="text-3xl font-bold text-indigo-700 uppercase">{getPlanName(sub?.planId || selectedTenant.subscriptionPlan)}</div>
                           </div>
                           <div>
                             <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold tracking-wider uppercase">
                               {sub?.status || selectedTenant.status}
                             </span>
                           </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Expiry Date</h3>
                            {!isEditingExpiry ? (
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => handleRenewSubscription(1)}
                                  disabled={isSavingExpiry}
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider disabled:opacity-50"
                                >
                                  +1 Month
                                </button>
                                <button 
                                  onClick={() => handleRenewSubscription(12)}
                                  disabled={isSavingExpiry}
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider disabled:opacity-50"
                                >
                                  +1 Year
                                </button>
                                <div className="w-px h-3 bg-slate-300 mx-1"></div>
                                <button 
                                  onClick={() => {
                                    setNewExpiryDate(sub?.renewalDate || '');
                                    setIsEditingExpiry(true);
                                  }}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setIsEditingExpiry(false)}
                                  className="text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={handleSaveExpiryDate}
                                  disabled={isSavingExpiry}
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider disabled:opacity-50"
                                >
                                  {isSavingExpiry ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {!isEditingExpiry ? (
                            <div className="text-lg font-semibold text-slate-900">
                               {sub?.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Lifetime / N/A'}
                            </div>
                          ) : (
                            <input 
                              type="date"
                              value={newExpiryDate}
                              onChange={(e) => setNewExpiryDate(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          )}
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Subscription History</h3>
                          </div>
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 text-slate-400">
                                <th className="px-6 py-3 font-medium uppercase text-[10px] tracking-wider">Plan</th>
                                <th className="px-6 py-3 font-medium uppercase text-[10px] tracking-wider">Start Date</th>
                                <th className="px-6 py-3 font-medium uppercase text-[10px] tracking-wider">End Date</th>
                                <th className="px-6 py-3 font-medium uppercase text-[10px] tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                               <tr>
                                 <td className="px-6 py-4 font-bold text-slate-700 uppercase">{getPlanName(sub?.planId || selectedTenant.subscriptionPlan)}</td>
                                 <td className="px-6 py-4 text-slate-600">{sub?.startDate ? new Date(sub.startDate).toLocaleDateString('en-GB') : '-'}</td>
                                 <td className="px-6 py-4 text-slate-600">{sub?.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('en-GB') : '-'}</td>
                                 <td className="px-6 py-4">
                                   <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold tracking-wider uppercase">ACTIVE</span>
                                 </td>
                               </tr>
                            </tbody>
                          </table>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              {drawerTab === 'payments' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-800">Payment History</h3>
                    <button 
                      onClick={() => setShowPaymentModal(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      + Add Payment
                    </button>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex gap-4">
                      <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none">
                        <option>All Modes</option>
                      </select>
                      <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none">
                        <option>Date ↓</option>
                      </select>
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                          <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-wider">Invoice</th>
                          <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-wider">Date</th>
                          <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-wider">Amount</th>
                          <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-wider">Mode</th>
                          <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {payments.filter(p => p.tenantId === selectedTenant.id).length === 0 ? (
                          <tr><td colSpan={5} className="p-6 text-center text-slate-400">No payment records found.</td></tr>
                        ) : (
                          payments.filter(p => p.tenantId === selectedTenant.id).map(p => (
                            <tr key={p.id}>
                              <td className="px-6 py-4 font-mono text-slate-500">{p.id.slice(0,8)}</td>
                              <td className="px-6 py-4 text-slate-600">{new Date(p.timestamp || Date.now()).toLocaleDateString('en-GB')}</td>
                              <td className="px-6 py-4 font-bold text-slate-900">₹{p.amount?.toLocaleString() || 0}</td>
                              <td className="px-6 py-4 text-slate-600">{p.mode || 'Bank Transfer'}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold tracking-wider uppercase">{p.status}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {drawerTab === 'logins' && (
                <div className="space-y-4">
                  {auditLogs.filter(l => l.tenantId === selectedTenant.id && l.action === 'auth.login').length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                       <UserSquare2 className="mx-auto text-slate-300 mb-3" size={32} />
                       <p className="text-slate-500 font-medium">No recent login activity found.</p>
                    </div>
                  ) : (
                    auditLogs.filter(l => l.tenantId === selectedTenant.id && l.action === 'auth.login').map(log => (
                      <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900">{users.find(u => u.id === log.userId)?.email || log.userId}</div>
                          <div className="text-xs text-slate-500 mt-1">{new Date(log.timestamp?.toMillis() || Date.now()).toLocaleString('en-GB')}</div>
                        </div>
                        <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase">
                          {log.details?.os || 'WINDOWS'} • {log.details?.browser || 'CHROME'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {drawerTab === 'activity' && (
                <div className="space-y-4">
                  {auditLogs.filter(l => l.tenantId === selectedTenant.id).map(log => (
                     <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-start gap-4">
                       <div className="mt-1 bg-slate-100 text-slate-400 p-2 rounded-lg"><Activity size={16} /></div>
                       <div>
                         <div className="font-medium text-slate-800 text-sm">{log.humanReadableDescription || log.action}</div>
                         <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                           <span>{new Date(log.timestamp?.toMillis() || Date.now()).toLocaleString()}</span>
                           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                           <span className="uppercase text-[10px] font-bold tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">{log.entityType}</span>
                         </div>
                       </div>
                     </div>
                  ))}
                  {auditLogs.filter(l => l.tenantId === selectedTenant.id).length === 0 && (
                    <div className="text-center p-8 text-slate-400">No activity logs found for this organization.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Add Tenant Modal */}
      {showAddTenantModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Add New Organization</h3>
                <p className="text-sm text-slate-500 mt-1">Create a new tenant workspace and generate an admin invite.</p>
              </div>
              <button onClick={() => setShowAddTenantModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTenant} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Company Details</h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Environment</label>
                    <select 
                      value={newTenantEnvironment}
                      onChange={(e) => setNewTenantEnvironment(e.target.value as 'production' | 'test')}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                    >
                      <option value="production">Production</option>
                      <option value="test">Test / Sandbox</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Company Name</label>
                    <input 
                      type="text" 
                      required
                      value={newTenantName}
                      onChange={(e) => setNewTenantName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="Acme Corp"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Company Email</label>
                    <input 
                      type="email" 
                      required
                      value={newTenantEmail}
                      onChange={(e) => setNewTenantEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="contact@acmecorp.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Company Phone</label>
                    <input 
                      type="tel" 
                      value={newTenantPhone}
                      onChange={(e) => setNewTenantPhone(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Company Address</label>
                    <textarea 
                      value={newTenantAddress}
                      onChange={(e) => setNewTenantAddress(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="123 Business St..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Admin Setup & Plan</h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Admin Name</label>
                    <input 
                      type="text" 
                      required
                      value={newTenantAdminName}
                      onChange={(e) => setNewTenantAdminName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Admin Email (For Login)</label>
                    <input 
                      type="email" 
                      required
                      value={newTenantAdminEmail}
                      onChange={(e) => setNewTenantAdminEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="admin@acmecorp.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Subscription Plan</label>
                    {plans.length > 0 ? (
                      <select 
                        value={newTenantPlan}
                        onChange={(e) => setNewTenantPlan(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-4 py-3 border border-rose-200 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium flex items-center gap-2">
                        <ShieldAlert size={16} />
                        Unable to load subscription plans.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddTenantModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold tracking-wider uppercase text-xs py-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={plans.length === 0 || isCreatingTenant}
                  className="flex-1 bg-indigo-600 text-white font-bold tracking-wider uppercase text-xs py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isCreatingTenant ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Link Modal */}
      {generatedLink && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100 bg-emerald-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Organization Created!</h3>
                  <p className="text-sm text-emerald-700 mt-0.5">Workspace and admin invite generated successfully.</p>
                </div>
              </div>
              <button onClick={() => setGeneratedLink('')} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Send this secure invitation link to the company administrator. They will use it to set up their password and access their new workspace.
              </p>
              
              <div className="relative group">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedLink}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-600 pr-24 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert("Link copied to clipboard!");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Copy
                </button>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setGeneratedLink('')}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
