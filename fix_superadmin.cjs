const fs = require('fs');

let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

content = content.replace(
  /const \[tenantsSnap, subsSnap, paymentsSnap, logsSnap, plansSnap\] = await Promise\.all\(\[\s*getDocs\(collection\(db, 'subscription_plans'\)\),\s*getDocs\(collection\(db, 'tenants'\)\),\s*getDocs\(collection\(db, 'subscriptions'\)\),\s*getDocs\(collection\(db, 'payments'\)\),\s*getDocs\(query\(collection\(db, 'audit_logs'\), orderBy\('timestamp', 'desc'\)\)\)\s*\]\);/g,
  `const [tenantsSnap, subsSnap, paymentsSnap, logsSnap, plansSnap] = await Promise.all([
        getDocs(collection(db, 'tenants')),
        getDocs(collection(db, 'subscriptions')),
        getDocs(collection(db, 'payments')),
        getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'))),
        getDocs(collection(db, 'subscription_plans'))
      ]);`
);

fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
