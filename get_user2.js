import { readFileSync } from 'fs';
const firebase = readFileSync('src/lib/firebase.ts', 'utf8');
const match = firebase.match(/apiKey: "(.*?)"/);
if (match) console.log("Found apiKey");
