const fs = require('fs');
let code = fs.readFileSync('src/views/CompanyBilling.tsx', 'utf8');

code = code.replace(
  "import { useAuth } from '../contexts/AuthContext';",
  "import { useAuth } from '../contexts/AuthContext';\nimport { FEATURES_REGISTRY } from '../config/features';"
);

code = code.replace(
  /<span className="capitalize">{f.replace\('_', ' '\)}<\/span>/g,
  '<span className="capitalize">{FEATURES_REGISTRY[f]?.name || f}</span>'
);

fs.writeFileSync('src/views/CompanyBilling.tsx', code);
