const fs = require('fs');
let code = fs.readFileSync('src/views/CostingEditor.tsx', 'utf8');

code = code.replace(
  /\{\s*\/\*\ 2\.\ Sheet\ Material\ Parts\ Section\ \*\/\s*\}/g,
  "<> {/* 2. Sheet Material Parts Section */}"
);

code = code.replace(
  /\{\s*\/\*\ 3\.\ Solid\ Wood\ Parts\ Section\ \*\/\s*\}/g,
  "<> {/* 3. Solid Wood Parts Section */}"
);

code = code.replace(
  /\{\s*\/\*\ 4\.\ Hardware\ Section\ \*\/\s*\}/g,
  "<> {/* 4. Hardware Section */}"
);

code = code.replace(
  /\{\s*\/\*\ 5\.\ Finishing\ \(Polish\ \/\ Paint\)\ Section\ \*\/\s*\}/g,
  "<> {/* 5. Finishing (Polish / Paint) Section */}"
);

code = code.replace(
  /\{\s*\/\*\ 6\.\ Labour\ \&\ Services\ Section\ \*\/\s*\}/g,
  "<> {/* 6. Labour & Services Section */}"
);

// We also missed wrapping Labour! 
// Let's wrap Labour in other_rates as well.
code = code.replace(
  /<\/section>\n\n\s*<> \{\/\* 6\. Labour \& Services Section \*\/\}\n\s*<section/g,
  "</section>\n            </>\n          )}\n\n          {canAccessFeature('other_rates') && (\n            <>\n              {/* 6. Labour & Services Section */}\n              <section"
);

fs.writeFileSync('src/views/CostingEditor.tsx', code);
