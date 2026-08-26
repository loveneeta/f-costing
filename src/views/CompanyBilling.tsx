import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
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

  useEffect(() => {
    const fetchPayments = async () => {
      if (!tenant) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'payments'), 
          where('tenantId', '==', tenant.id), 
          orderBy('date', 'desc'), 
          limit(10)
        );
        const snap = await getDocs(q);
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
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
              <button className="bg-white border border-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50">
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
    </div>
  );
};
