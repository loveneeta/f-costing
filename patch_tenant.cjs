const fs = require('fs');
let content = fs.readFileSync('src/views/TenantManagement.tsx', 'utf-8');

content = content.replace(
  "renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),",
  "renewalDate: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString(); })(),"
);

fs.writeFileSync('src/views/TenantManagement.tsx', content);
