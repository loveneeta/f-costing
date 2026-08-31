const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalSearch.tsx', 'utf8');
code = code.replace(
  'className="relative hidden md:flex items-center w-64 lg:w-80 ml-4"',
  'className="relative hidden sm:flex items-center flex-1 max-w-[200px] md:max-w-[240px] lg:max-w-xs ml-2 md:ml-4"'
);
fs.writeFileSync('src/components/GlobalSearch.tsx', code);
