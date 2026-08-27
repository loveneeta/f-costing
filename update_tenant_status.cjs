const fs = require('fs');
let code = fs.readFileSync('src/contexts/TenantContext.tsx', 'utf8');

code = code.replace(
  /const isTenantActive = tenant\?\.status === 'active' \|\| tenant\?\.status === 'trial';/,
  "const isTenantActive = tenant?.status?.toLowerCase() === 'active' || tenant?.status?.toLowerCase() === 'trial';"
);

fs.writeFileSync('src/contexts/TenantContext.tsx', code);
console.log('Success TenantContext Status!');
