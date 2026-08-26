const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf-8');
content = content.replace(
  `currentUserRole() == 'admin'`,
  `currentUserRole() == 'company_admin'`
);
fs.writeFileSync('firestore.rules', content);
