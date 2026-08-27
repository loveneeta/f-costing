const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  "!incoming().diff(existing()).affectedKeys().hasAny(['status', 'subscriptionPlan', 'createdBy', 'adminUserId', 'environment'])",
  "!incoming().diff(existing()).affectedKeys().hasAny(['status', 'createdBy', 'adminUserId', 'environment'])"
);

code = code.replace(
  "allow write: if isSuperAdmin();",
  "allow create: if isSuperAdmin();\n      allow update: if isSuperAdmin() || (isCompanyAdmin(resource.data.tenantId) && incoming().diff(existing()).affectedKeys().hasOnly(['planId', 'updatedAt']) && incoming().tenantId == resource.data.tenantId);\n      allow delete: if isSuperAdmin();"
);

fs.writeFileSync('firestore.rules', code);
console.log('Success!');
