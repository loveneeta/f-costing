const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

code = code.replace(
  'function currentUser() {\n      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;\n    }',
  'function currentUser() {\n      return (isSignedIn() && exists(/databases/$(database)/documents/users/$(request.auth.uid))) ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data : null;\n    }'
);

fs.writeFileSync('firestore.rules', code);
console.log('Success!');
