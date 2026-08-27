import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { SubscriptionPlan } from '../contexts/TenantContext';
import { X, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { useTenant } from '../contexts/TenantContext';
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
  const { tenant, plan, subscription, loading: tenantLoading } = useTenant();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [updating, setUpdating] = useState(false);

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
        const fetchedPayments = snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
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
    return <div className="p-8">Loading billing information...</div>;
  }

  if (!tenant) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-8">Billing & Subscription</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 mb-1">Current Plan: {plan?.name || 'Free Tier'}</h2>
                <p className="text-sm text-neutral-500">
                  {subscription ? `Status: ${subscription.status}` : 'No active subscription'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">₹{plan?.price || 0}</div>
                <div className="text-sm text-neutral-500">/{plan?.billingInterval || 'month'}</div>
              </div>
            </div>
            <div className="p-6 bg-neutral-50 flex gap-4 items-center justify-between">
              <div className="text-sm text-neutral-700 flex items-center gap-2">
                <CreditCard size={16} className="text-neutral-400" />
                <span>Next renewal: {subscription?.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              
              <button 
                onClick={() => setShowPlanModal(true)}
                className="bg-white border border-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50"
              >
                Manage Subscription
              </button>

            </div>
          </section>

          <section className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-neutral-900">Usage & Limits</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-neutral-700">Users</span>
                  <span className="text-neutral-500">Limit: {plan?.limits?.users || 'Unlimited'}</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-neutral-700">Employees</span>
                  <span className="text-neutral-500">Limit: {plan?.limits?.employees || 'Unlimited'}</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <FileBox className="mx-auto h-8 w-8 text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-500">No payment history available.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map(p => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-neutral-900">{new Date(p.date).toLocaleDateString()}</div>
                      <div className="text-xs text-neutral-500">{p.invoiceId}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-neutral-900">₹{p.amount}</div>
                      <div className="text-xs text-emerald-600">{p.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex gap-3 items-start">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium mb-1">Need more capacity?</p>
              <p className="text-blue-600/80">Upgrade your plan to unlock higher limits and advanced features.</p>
            </div>
          </div>
        </div>
      
            </div>

      {showPlanModal && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-neutral-900">Change Subscription Plan</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(p => (
                  <div key={p.id} className={`border ${plan?.id === p.id ? 'border-blue-600 ring-1 ring-blue-600' : 'border-neutral-200'} rounded-xl p-6 relative flex flex-col`}>
                    {plan?.id === p.id && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wider">
                        Current
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">{p.name}</h3>
                    <p className="text-sm text-neutral-500 mb-4 flex-1">{p.description}</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-neutral-900">₹{p.price}</span>
                      <span className="text-sm text-neutral-500">/{p.billingInterval}</span>
                    </div>
                    
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Check size={16} className="text-emerald-500" />
                        <span>{p.limits?.users || 'Unlimited'} Users</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Check size={16} className="text-emerald-500" />
                        <span>{p.limits?.employees || 'Unlimited'} Employees</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Check size={16} className="text-emerald-500" />
                        <span>{p.limits?.storage || 'Unlimited'} GB Storage</span>
                      </div>
                      {(p.features || []).map(f => (
                        <div key={f} className="flex items-center gap-2 text-sm text-neutral-600">
                          <Check size={16} className="text-emerald-500" />
                          <span className="capitalize">{f.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSwitchPlan(p.id)}
                      disabled={plan?.id === p.id || updating}
                      className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        plan?.id === p.id 
                          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
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