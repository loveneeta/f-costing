#!/bin/bash
cat << 'INNER_EOF' > src/views/SuperAdminSubscriptions.tsx
import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layers, Plus, CheckCircle, XCircle } from 'lucide-react';
import { SubscriptionPlan } from '../contexts/TenantContext';
import { v4 as uuidv4 } from 'uuid';

export const SuperAdminSubscriptions: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const plansRef = collection(db, 'plans');
      const snap = await getDocs(plansRef);
      setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPlan)));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async () => {
    const id = uuidv4();
    const newPlan: SubscriptionPlan = {
      id,
      name: 'New Plan',
      description: 'Description here',
      price: 0,
      currency: 'INR',
      billingInterval: 'monthly',
      status: 'active',
      maxEmployees: 10,
      maxUsers: 10,
      maxStorageMB: 1024,
      features: ['core'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'plans', id), newPlan);
    fetchPlans();
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    
    try {
      await updateDoc(doc(db, 'plans', editingPlan.id), {
        ...editingPlan,
        updatedAt: new Date().toISOString()
      });
      setEditingPlan(null);
      fetchPlans();
    } catch (error) {
      console.error("Error updating plan:", error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Subscription Plans</h1>
          <p className="text-neutral-500">Manage platform subscription tiers and limits.</p>
        </div>
        <button 
          onClick={handleCreatePlan}
          className="bg-blue-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={18} /> New Plan
        </button>
      </div>
      
      {loading ? (
        <div>Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-neutral-100 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-neutral-900">{p.name}</h3>
                  {p.status === 'active' ? (
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold uppercase">Active</span>
                  ) : (
                    <span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs font-bold uppercase">Inactive</span>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">₹{p.price}</span>
                  <span className="text-neutral-500 text-sm">/{p.billingInterval}</span>
                </div>
                <p className="text-sm text-neutral-600 mb-6">{p.description}</p>
                <div className="space-y-2 text-sm text-neutral-600">
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span>Users Limit:</span>
                    <span className="font-medium text-neutral-900">{p.maxUsers}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span>Employees Limit:</span>
                    <span className="font-medium text-neutral-900">{p.maxEmployees}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span>Storage:</span>
                    <span className="font-medium text-neutral-900">{p.maxStorageMB} MB</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-neutral-50 flex justify-end">
                <button 
                  onClick={() => setEditingPlan(p)}
                  className="text-sm text-blue-600 font-medium hover:text-blue-800"
                >
                  Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-neutral-900">Edit Plan: {editingPlan.name}</h2>
            </div>
            <form onSubmit={handleUpdatePlan} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({...editingPlan, price: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Billing Interval</label>
                  <select
                    value={editingPlan.billingInterval}
                    onChange={(e) => setEditingPlan({...editingPlan, billingInterval: e.target.value as 'monthly' | 'yearly'})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Max Users</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingPlan.maxUsers}
                    onChange={(e) => setEditingPlan({...editingPlan, maxUsers: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Max Employees</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingPlan.maxEmployees}
                    onChange={(e) => setEditingPlan({...editingPlan, maxEmployees: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Storage (MB)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingPlan.maxStorageMB}
                    onChange={(e) => setEditingPlan({...editingPlan, maxStorageMB: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                  <select
                    value={editingPlan.status}
                    onChange={(e) => setEditingPlan({...editingPlan, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 bg-white border border-neutral-300 text-neutral-700 font-medium py-2 rounded-lg hover:bg-neutral-50 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
INNER_EOF
