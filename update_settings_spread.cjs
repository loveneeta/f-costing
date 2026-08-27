const fs = require('fs');
let code = fs.readFileSync('src/views/Settings.tsx', 'utf8');

code = code.replace(/\.\.\.settings\.company/g, '...(settings.company || {})');
code = code.replace(/\.\.\.settings\.pricing/g, '...(settings.pricing || {})');

fs.writeFileSync('src/views/Settings.tsx', code);
console.log('Success Settings Spread!');
