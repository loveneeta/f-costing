const fs = require('fs');
let code = fs.readFileSync('src/views/CompanyBilling.tsx', 'utf8');

code = code.replace(
  "const { tenant, plan, subscription, loading: tenantLoading } = useTenant();",
  "const { tenant, plan, subscription, loading: tenantLoading, updateTenant } = useTenant();"
);

fs.writeFileSync('src/views/CompanyBilling.tsx', code);
