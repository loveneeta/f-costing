const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(
  "import { TenantManagement } from './views/TenantManagement';",
  ""
);
fs.writeFileSync('src/App.tsx', content);
