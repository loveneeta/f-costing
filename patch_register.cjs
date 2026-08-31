const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

code = code.replace(
  'const invSnap = await getDocs(q);',
  'const invSnap = await withTimeout(getDocs(q), 8000, "Invitation check timed out");'
);

code = code.replace(
  'await updateDoc(invitation.ref, { status: "accepted" });',
  'await withTimeout(updateDoc(invitation.ref, { status: "accepted" }), 5000, "Update invite timed out");'
);

code = code.replace(
  'await setDoc(doc(db, "tenants", tenantId), newTenant);',
  'await withTimeout(setDoc(doc(db, "tenants", tenantId), newTenant), 8000, "Tenant creation timed out");'
);

code = code.replace(
  'await setDoc(userDocRef, userDocData, { merge: true });',
  'await withTimeout(setDoc(userDocRef, userDocData, { merge: true }), 8000, "User doc creation timed out");'
);

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log('Patched register Firestore calls');
