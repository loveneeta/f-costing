import { readFileSync } from 'fs';
const dbCode = readFileSync('src/lib/firebase.ts', 'utf8');
console.log(dbCode);
