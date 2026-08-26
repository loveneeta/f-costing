const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

content = content.replace(
  "const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE').length;\n  const expiredSubs = subscriptions.filter(s => s.status === 'EXPIRED' || s.status === 'PAST_DUE').length;",
  `const activeSubs = tenants.filter(t => {
    const sub = getTenantSubscription(t.id);
    return (sub?.status || t.status) === 'ACTIVE';
  }).length;
  const expiredSubs = tenants.filter(t => {
    const sub = getTenantSubscription(t.id);
    return (sub?.status || t.status) === 'EXPIRED' || (sub?.status || t.status) === 'PAST_DUE';
  }).length;`
);

fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
