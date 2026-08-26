const fs = require('fs');
let content = fs.readFileSync('src/components/ProtectedRoute.tsx', 'utf-8');

content = content.replace(/!appUser.role === 'super_admin'/g, "appUser.role !== 'super_admin'");

fs.writeFileSync('src/components/ProtectedRoute.tsx', content);
