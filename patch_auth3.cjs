const fs = require('fs');
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf-8');

content = content.replace(
  `      let tenantId = params.tenantId || null;
      let invitationId = null;
      if (params.invitationToken) {`,
  `      let tenantId = params.tenantId || null;
      let invitationId = null;
      let role: "super_admin" | "company_admin" | "manager" | "employee" = params.role || "super_admin";
      if (params.invitationToken) {`
);

content = content.replace(`      let role = params.role || "super_admin";`, ``);

fs.writeFileSync('src/contexts/AuthContext.tsx', content);
