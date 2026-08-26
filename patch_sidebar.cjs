const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');
content = content.replace(
  '<NavLink to="/superadmin/tenants" icon={Building} label="Companies" />',
  ''
);
fs.writeFileSync('src/components/Sidebar.tsx', content);
