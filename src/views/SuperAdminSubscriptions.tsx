import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus } from 'lucide-react';
import { SubscriptionPlan } from '../contexts/TenantContext';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent } from '../services/AuditService';

const AVAILABLE_FEATURES = [
  "costing",
  "projects",
  "templates",
  "employees",
  "wood_rates",
  "hardware_rates",
  "reports"
];

export const SuperAdminSubscriptions: React.FC = () => {
  const { appUser } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const plansRef = collection(db, 'subscription_plans');
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

  const handleCreatePlan = () => {
    setEditingPlan({
      id: uuidv4(),
      name: '',
      description: '',
      price: 0,
      currency: 'INR',
      billingInterval: 'monthly',
      status: 'active',
      limits: {
        users: 10,
        employees: 10,
        storage: 1024
      },
      features: ['costing'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsCreating(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !appUser) return;
    
    try {
      const isNew = isCreating;
      const planRef = doc(db, 'subscription_plans', editingPlan.id);
      
      const payload: SubscriptionPlan = {
        ...editingPlan,
        updatedAt: new Date().toISOString()
      };
      
      if (isNew) {
        await setDoc(planRef, payload);
        await logAuditEvent(null, appUser.uid, {
          action: "subscription.plan_created",
          entityType: "subscription_plan",
          entityId: editingPlan.id,
          humanReadableDescription: `Created new subscription plan: ${editingPlan.name}`
        });
      } else {
        const existingPlan = plans.find(p => p.id === editingPlan.id);
        const updateData: Partial<SubscriptionPlan> = {
          name: editingPlan.name,
          description: editingPlan.description,
          price: editingPlan.price,
          currency: editingPlan.currency,
          billingInterval: editingPlan.billingInterval,
          status: editingPlan.status,
          limits: editingPlan.limits,
          features: editingPlan.features,
          updatedAt: new Date().toISOString()
        };
        await updateDoc(planRef, updateData);
        await logAuditEvent(null, appUser.uid, {
          action: "subscription.plan_updated",
          entityType: "subscription_plan",
          entityId: editingPlan.id,
          humanReadableDescription: `Updated subscription plan: ${editingPlan.name}`
        });
        
        if (existingPlan && existingPlan.status !== editingPlan.status) {
           await logAuditEvent(null, appUser.uid, {
            action: editingPlan.status === 'active' ? "subscription.plan_activated" : "subscription.plan_deactivated",
            entityType: "subscription_plan",
            entityId: editingPlan.id,
            humanReadableDescription: `${editingPlan.status === 'active' ? 'Activated' : 'Deactivated'} subscription plan: ${editingPlan.name}`
          });
        }
      }
      
      setEditingPlan(null);
      setIsCreating(false);
      fetchPlans();
    } catch (error) {
      console.error("Error updating plan:", error);
    }
  };
  
  const toggleFeature = (feature: string) => {
    if (!editingPlan) return;
    const features = editingPlan.features || [];
    if (features.includes(feature)) {
      setEditingPlan({ ...editingPlan, features: features.filter(f => f !== feature) });
    } else {
      setEditingPlan({ ...editingPlan, features: [...features, feature] });
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
            <div key={p.id} className={`bg-white rounded-xl border ${p.status === 'inactive' ? 'border-neutral-200 opacity-75' : 'border-neutral-200'} shadow-sm overflow-hidden flex flex-col`}>
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
                  <span className="text-3xl font-bold">{p.currency === 'INR' ? '₹' : p.currency}{p.price}</span>
                  <span className="text-neutral-500 text-sm">/{p.billingInterval}</span>
                </div>
                <p className="text-sm text-neutral-600 mb-6">{p.description}</p>
                <div className="space-y-2 text-sm text-neutral-600 mb-4">
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span>Users Limit:</span>
                    <span className="font-medium text-neutral-900">{p.limits?.users}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span>Employees Limit:</span>
                    <span className="font-medium text-neutral-900">{p.limits?.employees}</span>
                  </div>
                  <div className="flex justify-between border-b border-neutral-100 pb-2">
                    <span>Storage:</span>
                    <span className="font-medium text-neutral-900">{p.limits?.storage} MB</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Features</h4>
                  <div className="flex flex-wrap gap-1">
                    {(p.features || []).map(f => (
                      <span key={f} className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs">
                        {f.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-neutral-50 flex justify-end">
                <button 
                  onClick={() => {
                    setEditingPlan(p);
                    setIsCreating(false);
                  }}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-neutral-900">{isCreating ? 'Create New Plan' : `Edit Plan: ${editingPlan.name}`}</h2>
            </div>
            <form onSubmit={handleUpdatePlan} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
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
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Currency</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.currency}
                    onChange={(e) => setEditingPlan({...editingPlan, currency: e.target.value})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({...editingPlan, price: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div className="col-span-2">
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
                
                <div className="col-span-2 pt-4 border-t border-neutral-100">
                  <h3 className="text-sm font-bold text-neutral-900 mb-4">Resource Limits</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Max Users</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingPlan.limits?.users || 0}
                    onChange={(e) => setEditingPlan({...editingPlan, limits: { ...editingPlan.limits, users: Number(e.target.value) }})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Max Employees</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingPlan.limits?.employees || 0}
                    onChange={(e) => setEditingPlan({...editingPlan, limits: { ...editingPlan.limits, employees: Number(e.target.value) }})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Storage (MB)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingPlan.limits?.storage || 0}
                    onChange={(e) => setEditingPlan({...editingPlan, limits: { ...editingPlan.limits, storage: Number(e.target.value) }})}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                
                <div className="col-span-2 pt-4 border-t border-neutral-100">
                  <h3 className="text-sm font-bold text-neutral-900 mb-4">Included Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_FEATURES.map(feature => {
                      const isEnabled = (editingPlan.features || []).includes(feature);
                      return (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => toggleFeature(feature)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isEnabled ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'}`}
                        >
                          {feature.replace('_', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="pt-6 flex gap-3 border-t border-neutral-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingPlan(null);
                    setIsCreating(false);
                  }}
                  className="flex-1 bg-white border border-neutral-300 text-neutral-700 font-medium py-2 rounded-lg hover:bg-neutral-50 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  {isCreating ? 'Create Plan' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
