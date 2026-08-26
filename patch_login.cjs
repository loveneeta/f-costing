const fs = require('fs');
let content = fs.readFileSync('src/views/LoginView.tsx', 'utf-8');
content = content.replace('appUser.isSuperAdmin', "appUser.role === 'super_admin'");
fs.writeFileSync('src/views/LoginView.tsx', content);
