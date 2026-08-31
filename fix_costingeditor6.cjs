const fs = require('fs');
let code = fs.readFileSync('src/views/CostingEditor.tsx', 'utf8');

// Fix missing fragment tag before closing `)}` at line 1133
code = code.replace(
  /<\/section>\n\s*\)\}\n\n\s*\{canAccessFeature\('other_rates'\) && \(\n\s*<>\n\s*\{\/\* 5\. Finishing/g,
  "</section>\n            </>\n          )}\n\n          {canAccessFeature('other_rates') && (\n            <>\n              {/* 5. Finishing"
);

// Fix missing fragment tag before closing `</div>` at the end of middle column
code = code.replace(
  /<\/section>\n\s*<\/div>\n\n\s*\{\/\* Right Column: Costing Summary \& Output \*\/\}/g,
  "</section>\n            </>\n          )}\n        </div>\n\n        {/* Right Column: Costing Summary & Output */}"
);

fs.writeFileSync('src/views/CostingEditor.tsx', code);
