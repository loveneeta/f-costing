const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(
  '<Route path="/superadmin/tenants" element={<TenantManagement />} />',
  ''
);
fs.writeFileSync('src/App.tsx', content);
