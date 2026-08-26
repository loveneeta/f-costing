const fs = require('fs');
let lines = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf-8').split('\n');
lines.splice(359, 0, '      let role: "super_admin" | "company_admin" | "manager" | "employee" = params.role || "super_admin";');
fs.writeFileSync('src/contexts/AuthContext.tsx', lines.join('\n'));
