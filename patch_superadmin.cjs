const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Building, CheckCircle, ShieldAlert, CreditCard, Search, X, ChevronRight, Terminal, UserSquare2, LogIn, Activity } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'organizations' | 'plan_requests' | 'audit_logs'>('organizations');
  
  // Data
  const [tenants, setTenants] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer State
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'subscription' | 'payments' | 'logins' | 'activity'>('overview');
  const [internalNote, setInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tenantsSnap, subsSnap, paymentsSnap, logsSnap] = await Promise.all([
        getDocs(collection(db, 'tenants')),
        getDocs(collection(db, 'subscriptions')),
        getDocs(collection(db, 'payments')),
        getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')))
      ]);

      setTenants(tenantsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSubscriptions(subsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPayments(paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAuditLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to fetch superadmin data:", err);
    }
    setLoading(false);
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

  const getTenantSubscription = (tenantId: string) => {
    return subscriptions.find(s => s.tenantId === tenantId) || null;
  };

  // Metrics
  const totalOrgs = tenants.length;
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE').length;
  const expiredSubs = subscriptions.filter(s => s.status === 'EXPIRED' || s.status === 'PAST_DUE').length;

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
          className={\`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all \${activeTab === 'organizations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
        >
          Organizations
        </button>
        <button 
          onClick={() => setActiveTab('plan_requests')}
          className={\`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all \${activeTab === 'plan_requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
        >
          Plan Requests
        </button>
        <button 
          onClick={() => setActiveTab('audit_logs')}
          className={\`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all \${activeTab === 'audit_logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
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
                              {sub?.planId || t.subscriptionPlan || 'PRO'}
                            </span>
                            <span className={\`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase \${isExpired ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}\`}>
                              {sub?.status || t.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <div className={\`w-2 h-2 rounded-full \${isExpired ? 'bg-rose-500' : 'bg-emerald-500'}\`}></div>
                            {sub?.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'N/A'}
                            {isExpired && <span className="ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold tracking-wider">EXPIRED</span>}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider">
                              Login
                            </button>
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
             <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500 font-medium">Audit logs viewing implemented in SuperAdminAudit view.</p>
            </div>
          </div>
        )}
      </div>

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
                  className={\`px-4 py-4 text-sm font-semibold tracking-wide border-b-2 transition-colors \${drawerTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
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
                             <div className="text-3xl font-bold text-indigo-700 uppercase">{sub?.planId || selectedTenant.subscriptionPlan || 'PRO'}</div>
                           </div>
                           <div>
                             <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold tracking-wider uppercase">
                               {sub?.status || selectedTenant.status}
                             </span>
                           </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Expiry Date</h3>
                          <div className="text-lg font-semibold text-slate-900">
                             {sub?.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Lifetime / N/A'}
                          </div>
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
                                 <td className="px-6 py-4 font-bold text-slate-700 uppercase">{sub?.planId || selectedTenant.subscriptionPlan || 'PRO'}</td>
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
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
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
                          <div className="font-bold text-slate-900">{log.userId}</div>
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
    </div>
  );
};
`
fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
