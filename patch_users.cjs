const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

// Add users state
content = content.replace(
  "const [plans, setPlans] = useState<any[]>([]);",
  "const [plans, setPlans] = useState<any[]>([]);\n  const [users, setUsers] = useState<any[]>([]);"
);

// Fetch users
content = content.replace(
  "const [tenantsSnap, subsSnap, paymentsSnap, logsSnap, plansSnap] = await Promise.all([",
  "const [tenantsSnap, subsSnap, paymentsSnap, logsSnap, plansSnap, usersSnap] = await Promise.all(["
);

content = content.replace(
  "getDocs(collection(db, 'subscription_plans'))\n      ]);",
  "getDocs(collection(db, 'subscription_plans')),\n        getDocs(collection(db, 'users'))\n      ]);"
);

content = content.replace(
  "setAuditLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));",
  "setAuditLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));\n      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));"
);

// Update logs rendering
content = content.replace(
  "const tenantName = tenants.find(t => t.id === log.tenantId)?.name || 'System';",
  "const tenantName = tenants.find(t => t.id === log.tenantId)?.name || 'System';\n                         const userEmail = users.find(u => u.id === log.userId)?.email || log.userId || log.adminEmail || 'loveneetarora.ai@gmail.com';"
);

// Fix email display
content = content.replace(
  "{log.userId || log.adminEmail || 'loveneetarora.ai@gmail.com'}",
  "{userEmail}"
);
content = content.replace(
  "{log.userId || log.adminEmail || 'Unknown'}",
  "{userEmail}"
);

// Technical details fix
const oldButton = `<button className="mt-5 text-[10px] font-bold text-slate-400 tracking-wider uppercase hover:text-indigo-600 transition-colors">
                                 View Technical Details
                               </button>`;
const newButton = `<button 
                                 onClick={() => {
                                   alert('Audit Log ID: ' + log.id + '\\nAction: ' + log.action + '\\nEntity: ' + log.entityType + '\\nEntity ID: ' + log.entityId + '\\nRaw Data:\\n' + JSON.stringify(log.details || {}, null, 2));
                                 }}
                                 className="mt-5 text-[10px] font-bold text-slate-400 tracking-wider uppercase hover:text-indigo-600 transition-colors"
                               >
                                 View Technical Details
                               </button>`;

content = content.replace(oldButton, newButton);

fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
