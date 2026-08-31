const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  'await addDoc(collection(db, "failed_logins"), {',
  'await withTimeout(addDoc(collection(db, "failed_logins"), {'
);

code = code.replace(
  'reason: err.code || "unknown",\n        });\n      } catch (e) {}',
  'reason: err.code || "unknown",\n        }), 2000, "Failed login log timed out");\n      } catch (e) {}'
);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log('Patched failed_logins addDoc');
