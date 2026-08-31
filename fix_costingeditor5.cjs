const fs = require('fs');
let code = fs.readFileSync('src/views/CostingEditor.tsx', 'utf8');

code = code.replace(
  /\{canAccessFeature\('other_rates'\) && \(\n\s*\{\/\* 5\. Finishing \(Polish \/ Paint\) Section \*\/\}\n\s*<section/g,
  "{canAccessFeature('other_rates') && (\n            <>\n              {/* 5. Finishing (Polish / Paint) Section */}\n              <section"
);

code = code.replace(
  /\{canAccessFeature\('other_rates'\) && \(\n\s*\{\/\* 6\. Labour \& Services Section \*\/\}\n\s*<section/g,
  "{canAccessFeature('other_rates') && (\n            <>\n              {/* 6. Labour & Services Section */}\n              <section"
);

fs.writeFileSync('src/views/CostingEditor.tsx', code);
