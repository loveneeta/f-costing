import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended' | 'trial' | 'cancelled' | 'inactive';
  subscriptionPlan: string;
  address?: string;
  logo?: string;
  updatedAt?: string;
  settings: Record<string, any>;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: 'monthly' | 'yearly';
  status: 'active' | 'inactive';
  limits: {
    users: number;
    employees: number;
    storage: number;
  };
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  startDate: string;
  renewalDate: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  plan: SubscriptionPlan | null;
  subscription: TenantSubscription | null;
  loading: boolean;
  isTenantActive: boolean;
  canAccessFeature: (feature: string) => boolean;
  checkLimit: (resource: 'users' | 'employees' | 'storage', currentUsage: number) => boolean;
  updateTenant: (updates: Partial<Tenant>) => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({} as TenantContextType);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { appUser } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const updateTenant = async (updates: Partial<Tenant>) => {
    if (!tenant) return;
    try {
      const tenantRef = doc(db, 'tenants', tenant.id);
      await updateDoc(tenantRef, updates);
      setTenant(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error("Failed to update tenant:", err);
      throw err;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchTenantData = async () => {
      if (!appUser?.tenantId) {
        if (isMounted) {
          setTenant(null);
          setPlan(null);
          setSubscription(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const tenantRef = doc(db, 'tenants', appUser.tenantId);
        const tenantSnap = await getDoc(tenantRef);
        
        if (tenantSnap.exists() && isMounted) {
          const tenantData = { id: tenantSnap.id, ...tenantSnap.data() } as Tenant;
          setTenant(tenantData);

          // Fetch Active Subscription for Tenant
          const subQuery = query(collection(db, 'subscriptions'), where('tenantId', '==', tenantData.id), where('status', 'in', ['ACTIVE', 'TRIAL', 'PAST_DUE', 'EXPIRED']));
          const subSnap = await getDocs(subQuery);
          
          let activeSub: TenantSubscription | null = null;
          if (!subSnap.empty) {
            // Sort to get the most recent or active one if multiple exist, but normally there's one active
            const subs = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as TenantSubscription));
            activeSub = subs.find(s => s.status === 'ACTIVE' || s.status === 'TRIAL') || subs[0];
            setSubscription(activeSub);
          } else {
             setSubscription(null);
          }

          // Determine Plan ID: Try subscription first, fallback to tenant.subscriptionPlan
          const activePlanId = activeSub?.planId || tenantData.subscriptionPlan;

          // Fetch plan details
          if (activePlanId) {
            const planRef = doc(db, 'subscription_plans', activePlanId);
            const planSnap = await getDoc(planRef);
            if (planSnap.exists() && isMounted) {
              setPlan({ id: planSnap.id, ...planSnap.data() } as SubscriptionPlan);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching tenant details:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTenantData();

    return () => {
      isMounted = false;
    };
  }, [appUser?.tenantId]);

  const isTenantActive = tenant?.status?.toLowerCase() === 'active' || tenant?.status?.toLowerCase() === 'trial';

  const canAccessFeature = (feature: string) => {
    if (!plan) return false;
    if (subscription && (subscription.status === 'EXPIRED' || subscription.status === 'CANCELLED' || subscription.status === 'SUSPENDED')) return false;
    return plan.features?.includes(feature) || false;
  };

  const checkLimit = (resource: 'users' | 'employees' | 'storage', currentUsage: number) => {
    if (!plan) return false;
    if (subscription && (subscription.status === 'EXPIRED' || subscription.status === 'CANCELLED' || subscription.status === 'SUSPENDED')) return false;
    
    if (resource === 'users') return currentUsage < (plan.limits?.users || 0);
    if (resource === 'employees') return currentUsage < (plan.limits?.employees || 0);
    if (resource === 'storage') return currentUsage < (plan.limits?.storage || 0);
    return false;
  };

  return (
    <TenantContext.Provider value={{ tenant, plan, subscription, loading, isTenantActive, canAccessFeature, checkLimit, updateTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
