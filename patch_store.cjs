const fs = require('fs');
let content = fs.readFileSync('src/context/StoreContext.tsx', 'utf-8');
content = content.replace(
  `const tenantId = appUser?.isSuperAdmin ? 'SUPER_ADMIN_WORKSPACE' : appUser?.tenantId;`,
  `const tenantId = appUser?.role === 'super_admin' ? null : appUser?.tenantId;`
);
fs.writeFileSync('src/context/StoreContext.tsx', content);
