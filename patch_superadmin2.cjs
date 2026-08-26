const fs = require('fs');

let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

// Add plans state
content = content.replace(
  "const [loading, setLoading] = useState(true);",
  "const [loading, setLoading] = useState(true);\n  const [plans, setPlans] = useState<any[]>([]);"
);

// Fetch plans
content = content.replace(
  "const [tenantsSnap, subsSnap, paymentsSnap, logsSnap] = await Promise.all([",
  "const [tenantsSnap, subsSnap, paymentsSnap, logsSnap, plansSnap] = await Promise.all([\n        getDocs(collection(db, 'subscription_plans')),"
);

content = content.replace(
  "setTenants(tenantsSnap.docs.map(d => ({ id: d.id, ...d.data() })));",
  "setTenants(tenantsSnap.docs.map(d => ({ id: d.id, ...d.data() })));\n      setPlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() })));"
);

// Add getPlanName helper
content = content.replace(
  "const getTenantSubscription = (tenantId: string) => {",
  "const getPlanName = (planId: string) => {\n    if (!planId) return 'PRO';\n    const plan = plans.find(p => p.id === planId);\n    return plan ? plan.name : planId;\n  };\n\n  const getTenantSubscription = (tenantId: string) => {"
);

// Replace sub?.planId with getPlanName(sub?.planId || t.subscriptionPlan)
content = content.replace(
  "{sub?.planId || t.subscriptionPlan || 'PRO'}",
  "{getPlanName(sub?.planId || t.subscriptionPlan)}"
);

content = content.replace(
  "{sub?.planId || selectedTenant.subscriptionPlan || 'PRO'}",
  "{getPlanName(sub?.planId || selectedTenant.subscriptionPlan)}"
);

content = content.replace(
  "{sub?.planId || selectedTenant.subscriptionPlan || 'PRO'}",
  "{getPlanName(sub?.planId || selectedTenant.subscriptionPlan)}"
);

fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
