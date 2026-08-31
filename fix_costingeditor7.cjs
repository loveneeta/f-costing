const fs = require('fs');
let code = fs.readFileSync('src/views/CostingEditor.tsx', 'utf8');

code = code.replace(
  /<\/section>\n\n\s*<\/div>\n\s*<Footer/g,
  "</section>\n            </>\n          )}\n\n          </div>\n          <Footer"
);

fs.writeFileSync('src/views/CostingEditor.tsx', code);
