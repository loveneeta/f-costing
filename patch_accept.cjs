const fs = require('fs');
let content = fs.readFileSync('src/views/AcceptInvitation.tsx', 'utf-8');

content = content.replace(
  `where("token", "==", token),`,
  `where("tokenHash", "==", await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token!)).then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''))),`
);

fs.writeFileSync('src/views/AcceptInvitation.tsx', content);
