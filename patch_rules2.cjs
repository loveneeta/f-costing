const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  "allow create: if isSuperAdmin();\n      allow update: if isSuperAdmin() || (isCompanyAdmin(resource.data.tenantId) && incoming().diff(existing()).affectedKeys().hasOnly(['planId', 'updatedAt']) && incoming().tenantId == resource.data.tenantId);\n      allow delete: if isSuperAdmin();",
  "allow write: if isSuperAdmin();"
);

code = code.replace(
  "match /subscriptions/{subId} {\n      allow read: if isSuperAdmin() || (resource != null && isTenantMember(resource.data.tenantId));\n      allow write: if isSuperAdmin();\n    }",
  "match /subscriptions/{subId} {\n      allow read: if isSuperAdmin() || (resource != null && isTenantMember(resource.data.tenantId));\n      allow create: if isSuperAdmin();\n      allow update: if isSuperAdmin() || (isCompanyAdmin(resource.data.tenantId) && incoming().diff(existing()).affectedKeys().hasOnly(['planId', 'updatedAt']) && incoming().tenantId == resource.data.tenantId);\n      allow delete: if isSuperAdmin();\n    }"
);

fs.writeFileSync('firestore.rules', code);
console.log('Success!');
