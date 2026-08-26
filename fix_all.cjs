const fs = require('fs');

// Fix AcceptInvitation
let accept = fs.readFileSync('src/views/AcceptInvitation.tsx', 'utf-8');
accept = accept.replace(
  'name,\n        role: invData.role,\n        name: invData.name || name,',
  'name: invData.name || name,\n        role: invData.role,'
);
fs.writeFileSync('src/views/AcceptInvitation.tsx', accept);

// Fix TenantManagement
let tenant = fs.readFileSync('src/views/TenantManagement.tsx', 'utf-8');
tenant = tenant.replace(/beforeValue: (.*?),/g, 'before: { value: $1 },');
tenant = tenant.replace(/afterValue: (.*?),/g, 'after: { value: $1 },');
fs.writeFileSync('src/views/TenantManagement.tsx', tenant);
