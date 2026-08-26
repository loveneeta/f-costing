const fs = require('fs');

// Patch TenantManagement
let tenant = fs.readFileSync('src/views/TenantManagement.tsx', 'utf-8');
tenant = tenant.replace(
  'setGeneratedLink(`${window.location.origin}/accept-invitation',
  'const origin = window.location.origin.replace("ais-dev-", "ais-pre-");\n      setGeneratedLink(`${origin}/accept-invitation'
);
fs.writeFileSync('src/views/TenantManagement.tsx', tenant);

// Patch EmployeeManagement
let emp = fs.readFileSync('src/views/EmployeeManagement.tsx', 'utf-8');
emp = emp.replace(
  'const link = `${window.location.origin}/accept-invitation',
  'const origin = window.location.origin.replace("ais-dev-", "ais-pre-");\n      const link = `${origin}/accept-invitation'
);
fs.writeFileSync('src/views/EmployeeManagement.tsx', emp);
