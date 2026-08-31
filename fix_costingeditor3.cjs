const fs = require('fs');
let code = fs.readFileSync('src/views/CostingEditor.tsx', 'utf8');

// The issue: we have multiple copies of 
// </section>
// </>
// )}
// Or hanging </> )}

// Let's just fix it by replacing the whole middle column manually.
// Wait, I can just use regex to clean up multiple `</>\n)}`
code = code.replace(
  /<\/section>\s*<\/>\s*\)\}\s*<\/>\s*\)\}/g,
  "</section>\n            </>\n          )}"
);

code = code.replace(
  /<\/section>\s*\}\s*\)\s*<\/>\s*\)\}/g, // wait
  ""
);
code = code.replace(
  /<\/section>\n\s*<\/>\n\s*\)\}\n\s*<\/>\n\s*\)\}/g,
  "</section>\n            </>\n          )}"
);

fs.writeFileSync('src/views/CostingEditor.tsx', code);
