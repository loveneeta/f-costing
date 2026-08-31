import { FEATURES_REGISTRY } from '../config/features';
import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { SubscriptionPlan } from '../contexts/TenantContext';
import { X, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { useTenant } from '../contexts/TenantContext';
import { useStore } from '../context/StoreContext';
import { CompanySettings } from '../types';
import { Save } from 'lucide-react';
import { FileBox, CreditCard, AlertCircle } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  invoiceId: string;
}

export const CompanyBilling: React.FC = () => {
  const { tenant, plan, subscription, loading: tenantLoading, updateTenant } = useTenant();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [updating, setUpdating] = useState(false);
  const { settings, updateSettings } = useStore();

  
  
  const handleCompanyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    let checked = false;
    if (type === "checkbox") {
      checked = (e.target as HTMLInputElement).checked;
    }
    const defaultCompany = {
      name: '',
      gst: '',
      address: '',
      phone: '',
      email: '',
      bankDetails: '',
      hideBankDetails: false,
      hideNotes: false,
      hideTerms: false,
    };
    updateSettings({
      ...settings,
      company: {
        ...defaultCompany,
        ...(settings.company || {}),
        [name]: type === "checkbox" ? checked : value,
      },
    });
  };

  const handleSaveCompanyProfile = async () => {
    try {
      await updateTenant({
        name: (settings.company || {}).name,
        email: (settings.company || {}).email,
        phone: (settings.company || {}).phone,
        address: (settings.company || {}).address,
        updatedAt: new Date().toISOString()
      });
      alert("Company profile saved successfully.");
    } catch (err) {
      alert("Failed to save company profile.");
    }
  };



  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const snap = await getDocs(collection(db, 'subscription_plans'));
        setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPlan)).filter(p => p.status === 'active'));
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlans();
  }, []);

  const handleSwitchPlan = async (newPlanId: string) => {
    if (!tenant || !subscription || newPlanId === plan?.id) return;
    setUpdating(true);
    try {
      // Update tenant
      await updateDoc(doc(db, 'tenants', tenant.id), {
        subscriptionPlan: newPlanId
      });
      // Update subscription
      await updateDoc(doc(db, 'subscriptions', subscription.id), {
        planId: newPlanId,
        updatedAt: new Date().toISOString()
      });
      
      // Need to force reload window to refresh context, or let it fetch again. 
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Failed to update subscription.');
      setUpdating(false);
    }
  };


  useEffect(() => {
    const fetchPayments = async () => {
      if (!tenant) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'payments'), 
          where('tenantId', '==', tenant.id)
        );
        const snap = await getDocs(q);
        const fetchedPayments = snap.docs.map(d => {
          const data = d.data();
          const inv = data.invoiceNumber || data.invoiceId || (data.timestamp ? `PAY-${1001}` : 'PAY-1001');
          return {
            id: d.id,
            amount: data.amount || 0,
            currency: data.currency || 'INR',
            status: data.status || 'PAID',
            date: data.date || (data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString()),
            invoiceId: inv,
            ...data
          } as Payment;
        });
        fetchedPayments.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        setPayments(fetchedPayments.slice(0, 10));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchPayments();
  }, [tenant]);

  if (tenantLoading || loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
        Loading billing information...
      </div>
    );
  }

  if (!tenant) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-16">

      {/* Company Profile Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Company Profile
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              This information will appear at the top of your quotations.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Company Name
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">🏢</span>
                <input
                  type="text"
                  name="name"
                  value={(settings.company || {}).name || ''}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="e.g. ARORA EXITO"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                GST Number
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">📄</span>
                <input
                  type="text"
                  name="gst"
                  value={(settings.company || {}).gst || ''}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="e.g. 08AZHPM1603R1ZZ"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Address
            </label>
            <div className="flex items-start border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <span className="text-slate-400 mr-2.5 mt-0.5 text-sm">📍</span>
              <textarea
                name="address"
                value={(settings.company || {}).address || ''}
                onChange={handleCompanyChange}
                rows={2}
                className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm resize-none"
                placeholder="Full registered address..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">📞</span>
                <input
                  type="text"
                  name="phone"
                  value={(settings.company || {}).phone || ''}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="+91 9000000000"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">✉️</span>
                <input
                  type="text"
                  name="email"
                  value={(settings.company || {}).email || ''}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="mail@example.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Bank Details (Optional)
            </label>
            <div className="flex items-start border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <span className="text-slate-400 mr-2.5 mt-0.5 text-sm">🏦</span>
              <textarea
                name="bankDetails"
                value={(settings.company || {}).bankDetails || ''}
                onChange={handleCompanyChange}
                rows={2}
                className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm resize-none"
                placeholder="Bank Name, Account Number, IFSC..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Print Settings
            </label>
            <div className="space-y-2.5 p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  name="hideBankDetails"
                  checked={(settings.company || {}).hideBankDetails || false}
                  onChange={handleCompanyChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Hide Bank Details on Prints
              </label>
              <label className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  name="hideNotes"
                  checked={(settings.company || {}).hideNotes || false}
                  onChange={handleCompanyChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Hide Notes on Prints
              </label>
              <label className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  name="hideTerms"
                  checked={(settings.company || {}).hideTerms || false}
                  onChange={handleCompanyChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Hide Terms on Prints
              </label>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSaveCompanyProfile}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f1423] text-white rounded-xl hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-md transition-all"
          >
            <Save size={15} /> Save Company Profile
          </button>
        </div>
      </section>

      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Company Details</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage your plan, limits, and view payment history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-0.5">Current Plan: {plan?.name || 'Free Tier'}</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {subscription ? `Status: ${subscription.status}` : 'No active subscription'}
                </p>
              </div>
              <div className="sm:text-right">
                <div className="text-xl sm:text-2xl font-bold text-slate-900">₹{plan?.price || 0}</div>
                <div className="text-xs text-slate-500">/{plan?.billingInterval || 'month'}</div>
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div className="text-xs sm:text-sm text-slate-700 flex items-center gap-2">
                <CreditCard size={16} className="text-slate-400 shrink-0" />
                <span>Next renewal: {subscription?.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              
              <button 
                onClick={() => setShowPlanModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 shadow-sm transition-colors"
              >
                Manage Subscription
              </button>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-6 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Usage & Limits</h2>
            </div>
            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span className="font-medium text-slate-700">Users</span>
                  <span className="text-slate-500">Limit: {plan?.limits?.users || 'Unlimited'}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span className="font-medium text-slate-700">Employees</span>
                  <span className="text-slate-500">Limit: {plan?.limits?.employees || 'Unlimited'}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <div className="text-center py-6">
                <FileBox className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs sm:text-sm text-slate-500">No payment history available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-slate-900">{new Date(p.date).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-500">{p.invoiceId}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-bold text-slate-900">₹{p.amount}</div>
                      <div className="text-[11px] font-semibold text-emerald-600">{p.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          
          <div className="bg-blue-50 text-blue-900 p-4 rounded-2xl text-xs sm:text-sm flex gap-3 items-start border border-blue-100">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold mb-0.5">Need more capacity?</p>
              <p className="text-blue-700/80 leading-relaxed">Upgrade your plan to unlock higher limits and advanced features.</p>
            </div>
          </div>
        </div>
      </div>

      {showPlanModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Change Subscription Plan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select the plan that fits your organization.</p>
              </div>
              <button 
                onClick={() => setShowPlanModal(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {plans.map(p => (
                  <div key={p.id} className={`border ${plan?.id === p.id ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20' : 'border-slate-200 bg-white'} rounded-2xl p-5 sm:p-6 relative flex flex-col justify-between`}>
                    <div>
                      {plan?.id === p.id && (
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase tracking-wider">
                          Current
                        </div>
                      )}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">{p.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-500 mb-4">{p.description}</p>
                      <div className="mb-5 pb-4 border-b border-slate-100">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{p.price}</span>
                        <span className="text-xs text-slate-500 font-medium">/{p.billingInterval}</span>
                      </div>
                      
                      <div className="space-y-2.5 mb-6">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                          <Check size={15} className="text-emerald-600 shrink-0" />
                          <span>{p.limits?.users || 'Unlimited'} Users</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                          <Check size={15} className="text-emerald-600 shrink-0" />
                          <span>{p.limits?.employees || 'Unlimited'} Employees</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                          <Check size={15} className="text-emerald-600 shrink-0" />
                          <span>{p.limits?.storage || 'Unlimited'} GB Storage</span>
                        </div>
                        {(p.features || []).map(f => (
                          <div key={f} className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                            <Check size={15} className="text-emerald-600 shrink-0" />
                            <span className="capitalize">{FEATURES_REGISTRY[f]?.name || f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSwitchPlan(p.id)}
                      disabled={plan?.id === p.id || updating}
                      className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        plan?.id === p.id 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50'
                      }`}
                    >
                      {updating && plan?.id !== p.id ? 'Updating...' : plan?.id === p.id ? 'Current Plan' : 'Switch to ' + p.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};