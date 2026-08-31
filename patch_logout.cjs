const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  'await updateDoc(\n            doc(db, "users", auth.currentUser.uid, "sessions", sessionId),\n            { status: "revoked" },\n          );',
  'await withTimeout(updateDoc(\n            doc(db, "users", auth.currentUser.uid, "sessions", sessionId),\n            { status: "revoked" },\n          ), 5000, "Logout session update timed out");'
);

code = code.replace(
  'await updateDoc(\n          doc(db, "users", auth.currentUser!.uid, "sessions", sessionDoc.id),\n          { status: "revoked" },\n        )',
  'await withTimeout(updateDoc(\n          doc(db, "users", auth.currentUser!.uid, "sessions", sessionDoc.id),\n          { status: "revoked" },\n        ), 5000, "Revoke session timed out")'
);

code = code.replace(
  'const snapshot = await getDocs(q);',
  'const snapshot = await withTimeout(getDocs(q), 5000, "Get sessions timed out");'
);

code = code.replace(
  'await deleteDoc(doc(db, "users", uid));',
  'await withTimeout(deleteDoc(doc(db, "users", uid)), 5000, "Delete user doc timed out");'
);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log('Patched logout');
