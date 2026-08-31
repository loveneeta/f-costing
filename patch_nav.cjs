const fs = require('fs');
let code = fs.readFileSync('src/navigationConfig.ts', 'utf8');

code = code.replace(
  /label: 'Billing \& Subscription',\s*shortLabel: 'Billing',/g,
  "label: 'Company Details',\n        shortLabel: 'Company',"
);

fs.writeFileSync('src/navigationConfig.ts', code);
