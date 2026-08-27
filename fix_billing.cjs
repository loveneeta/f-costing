const fs = require('fs');
let code = fs.readFileSync('src/views/CompanyBilling.tsx', 'utf8');

code = code.replace(
  "    </div>\n  );\n};\n    </div>\n  );\n};",
  "    </div>\n  );\n};"
);

fs.writeFileSync('src/views/CompanyBilling.tsx', code);
console.log('Success!');
