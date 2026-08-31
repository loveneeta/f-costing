const fs = require('fs');
let code = fs.readFileSync('src/views/CompanyBilling.tsx', 'utf8');

code = code.replace(
  '<h1 className="text-xl sm:text-2xl font-bold text-slate-900">Billing & Subscription</h1>',
  '<h1 className="text-xl sm:text-2xl font-bold text-slate-900">Company Details</h1>'
);

fs.writeFileSync('src/views/CompanyBilling.tsx', code);
