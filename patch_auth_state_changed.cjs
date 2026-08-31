const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  'await fetchUserDoc(firebaseUser);',
  'await withTimeout(fetchUserDoc(firebaseUser), 10000, "Auth state fetch timed out.").catch(e => console.warn(e));'
);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log('Patched AuthContext.tsx for onAuthStateChanged');
