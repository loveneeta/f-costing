const fs = require('fs');

let settingsCode = fs.readFileSync('src/views/Settings.tsx', 'utf8');
console.log('Company Profile Card in Settings:', settingsCode.includes('Company Profile Card'));
console.log('handleCompanyChange in Settings:', settingsCode.includes('const handleCompanyChange'));
