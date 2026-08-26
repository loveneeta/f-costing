const fs = require('fs');
let content = fs.readFileSync('src/views/EmployeeManagement.tsx', 'utf-8');

// Add super_admin restriction to handleSendInvite
content = content.replace(
  'if (!appUser?.tenantId || !canManage) return;',
  'if (!appUser?.tenantId || !canManage) return;\n    if (inviteRole === "super_admin" as any) {\n      alert("Cannot invite super_admin from tenant management");\n      return;\n    }'
);

fs.writeFileSync('src/views/EmployeeManagement.tsx', content);
