const fs = require('fs');
let content = fs.readFileSync('src/views/EmployeeManagement.tsx', 'utf-8');
content = content.replace(
  `"admin" | "manager" | "employee"`,
  `"company_admin" | "manager" | "employee"`
);
fs.writeFileSync('src/views/EmployeeManagement.tsx', content);
