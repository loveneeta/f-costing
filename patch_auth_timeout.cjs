const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

const timeoutHelper = `
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = "Operation timed out"): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}
`;

if (!code.includes('withTimeout')) {
  // Inject withTimeout at the top
  code = code.replace(
    'export interface AppUser {',
    timeoutHelper + '\nexport interface AppUser {'
  );

  // Wrap fetchUserDoc call in login
  code = code.replace(
    'const userDoc = await fetchUserDoc(cred.user);',
    'const userDoc = await withTimeout(fetchUserDoc(cred.user), 8000, "User profile fetch timed out. The network might be blocking Firestore.");'
  );
  
  // Wrap sessionRef addDoc
  code = code.replace(
    /const sessionRef = await addDoc\([\s\S]*?\}\s*\);/m,
    (match) => {
      return match.replace('await addDoc', 'await withTimeout(addDoc').replace(');', '), 5000, "Session creation timed out.");');
    }
  );

  // Wrap signInWithEmailAndPassword
  // Wait, withAuthRetry already wraps it, let's wrap it inside withAuthRetry
  code = code.replace(
    'signInWithEmailAndPassword(auth, cleanEmail, pass)',
    'withTimeout(signInWithEmailAndPassword(auth, cleanEmail, pass), 10000, "Sign-in request timed out")'
  );
}

fs.writeFileSync('src/contexts/AuthContext.tsx', code);
console.log('Patched AuthContext.tsx');
