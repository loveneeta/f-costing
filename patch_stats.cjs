const fs = require('fs');
let content = fs.readFileSync('src/components/TenantStats.tsx', 'utf-8');
content = content.replace(
  `where('role', '==', 'admin')`,
  `where('role', '==', 'company_admin')`
);
fs.writeFileSync('src/components/TenantStats.tsx', content);
