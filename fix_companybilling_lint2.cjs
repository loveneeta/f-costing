const fs = require('fs');
let code = fs.readFileSync('src/views/CompanyBilling.tsx', 'utf8');

if (!code.includes('import { FEATURES_REGISTRY }')) {
  code = "import { FEATURES_REGISTRY } from '../config/features';\n" + code;
  fs.writeFileSync('src/views/CompanyBilling.tsx', code);
}
