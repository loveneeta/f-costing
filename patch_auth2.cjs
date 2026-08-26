const fs = require('fs');
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf-8');

// Fix types
content = content.replace(
  `role: "super_admin" | "admin" | "manager" | "employee";`,
  `role: "super_admin" | "company_admin" | "manager" | "employee";`
);
content = content.replace(
  `role?: "super_admin" | "admin" | "manager" | "employee";`,
  `role?: "super_admin" | "company_admin" | "manager" | "employee";`
);

// Remove isSuperAdmin from AppUser interface
content = content.replace(`  isSuperAdmin: boolean;\n`, ``);

// Remove isSuperAdmin references
content = content.replace(/let isSuperAdmin = .*;\n/g, '');
content = content.replace(/isSuperAdmin = .*;\n/g, '');
content = content.replace(/isSuperAdmin,\n/g, '');
content = content.replace(/isSuperAdmin: true,\n/g, '');

fs.writeFileSync('src/contexts/AuthContext.tsx', content);
