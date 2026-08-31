const fs = require('fs');
let code = fs.readFileSync('src/views/CompanyBilling.tsx', 'utf8');

if (!code.includes('FEATURES_REGISTRY')) {
  code = code.replace(
    "import { useTenant } from '../contexts/TenantContext';",
    "import { useTenant } from '../contexts/TenantContext';\nimport { FEATURES_REGISTRY } from '../config/features';"
  );
  fs.writeFileSync('src/views/CompanyBilling.tsx', code);
}
