const fs = require('fs');

let content = fs.readFileSync('src/views/EmployeeManagement.tsx', 'utf-8');

// 1. Replace "Tenant Admin" with "Company Admin"
content = content.replace(
  '<option value="company_admin">Tenant Admin (Full Access)</option>',
  '<option value="company_admin">Company Admin (Full Access)</option>'
);

// 2. Add super_admin check early return
const superAdminCheck = `
  if (appUser?.role === "super_admin") {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
          <Shield size={20} />
          <p className="font-medium">Super Admins cannot manage tenant employees directly.</p>
        </div>
      </div>
    );
  }
`;

content = content.replace(
  'const canManage =',
  superAdminCheck + '\n  const canManage ='
);

fs.writeFileSync('src/views/EmployeeManagement.tsx', content);
