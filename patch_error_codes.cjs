const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  '"auth/invalid-credential",',
  '"auth/invalid-credential",\n    "auth/invalid-login-credentials",'
);

code = code.replace(
  'code === "auth/invalid-credential" ||',
  'code === "auth/invalid-credential" ||\n    code === "auth/invalid-login-credentials" ||'
);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log('Patched handleAuthError');
