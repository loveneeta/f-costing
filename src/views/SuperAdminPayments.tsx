import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileBox, Search } from 'lucide-react';

interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  date: string;
  invoiceId: string;
  planId: string;
}

export const SuperAdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'payments'), orderBy('date', 'desc'), limit(50));
        const snap = await getDocs(q);
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
      } catch (e) {
        console.error("No real payments yet:", e);
      }
      setLoading(false);
    };
    fetchPayments();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Payments & Invoices</h1>
          <p className="text-neutral-500">View platform revenue and payment statuses.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text" 
              placeholder="Search payments by invoice or tenant..." 
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4 text-neutral-400">
              <FileBox size={32} />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Payments Yet</h3>
            <p className="text-neutral-500 max-w-md mx-auto">
              The payment database architecture is ready, but no payments have been processed yet. 
              Integration with a payment provider is pending.
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Tenant ID</th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-neutral-900">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{p.invoiceId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">{p.tenantId}</td>
                  <td className="px-6 py-4 text-sm text-neutral-900 font-medium">₹{p.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
