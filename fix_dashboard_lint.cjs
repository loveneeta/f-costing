const fs = require('fs');
let code = fs.readFileSync('src/views/Dashboard.tsx', 'utf8');

code = code.replace(
  /if \(r\.category === 'wood'\)/g,
  "if (r.category === 'solid_wood')"
);

code = code.replace(
  /if \(r\.category === 'veneer'\)/g,
  "if (r.category === 'veneer_sheet' || r.category === 'veneer_edge' || r.category === 'veneer_other')"
);

fs.writeFileSync('src/views/Dashboard.tsx', code);
