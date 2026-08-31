const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  'const subsSnap = await getDocs(subsQuery);',
  'const subsSnap = await withTimeout(getDocs(subsQuery), 5000, "Subscription fetch timed out.");'
);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log('Patched AuthContext.tsx for subsQuery');
