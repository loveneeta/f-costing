const fs = require('fs');
let code = fs.readFileSync('src/views/CostingEditor.tsx', 'utf8');

// The issue was:
// {(canAccessFeature('ply_sheets') || canAccessFeature('board_sheets')) && (
// {/* 2. Sheet Material Parts Section */}
// <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-0">

// And also the missing ones from the failed multi-edit. Let me just replace the sections properly.
code = code.replace(
  /\{\(canAccessFeature\('ply_sheets'\) \|\| canAccessFeature\('board_sheets'\)\) && \(\n\s*\{\/\* 2\. Sheet Material Parts Section \*\/\}\n\s*<section/g,
  "{(canAccessFeature('ply_sheets') || canAccessFeature('board_sheets')) && (\n            <>\n              {/* 2. Sheet Material Parts Section */}\n              <section"
);

// Wood rates
code = code.replace(
  /<\/section>\n\s*\)\}\n\n\s*\{canAccessFeature\('wood_rates'\) && \(\n\s*\{\/\* 3\. Solid Wood Parts Section \*\/\}\n\s*<section/g,
  "</section>\n            </>\n          )}\n\n          {canAccessFeature('wood_rates') && (\n            <>\n              {/* 3. Solid Wood Parts Section */}\n              <section"
);

// We still need to do 4. Hardware Section
code = code.replace(
  /<\/section>\n\n\s*\{\/\* 4\. Hardware Section \*\/\}\n\s*<section/g,
  "</section>\n            </>\n          )}\n\n          {canAccessFeature('hardware_rates') && (\n            <>\n              {/* 4. Hardware Section */}\n              <section"
);

// And 5. Finishing
code = code.replace(
  /<\/section>\n\n\s*\{canAccessFeature\('other_rates'\) && \(\n\s*\{\/\* 5\. Finishing \(Polish \/ Paint\) Section \*\/\}\n\s*<section/g,
  "</section>\n            </>\n          )}\n\n          {canAccessFeature('other_rates') && (\n            <>\n              {/* 5. Finishing (Polish / Paint) Section */}\n              <section"
);

// And close the other_rates section before Right Column
code = code.replace(
  /<\/section>\n\n\s*<\/div>\n\n\s*\{\/\* Right Column: Costing Summary \& Output \*\/\}/g,
  "</section>\n            </>\n          )}\n        </div>\n\n        {/* Right Column: Costing Summary & Output */}"
);

// And for the summary section:
code = code.replace(
  /<div className="flex justify-between items-center text-sm">\s*<span>Sheet Materials<\/span>/g,
  "{ (canAccessFeature('ply_sheets') || canAccessFeature('board_sheets')) && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Sheet Materials</span>"
);

code = code.replace(
  /<\/div>\s*<div className="flex justify-between items-center text-sm">\s*<span>Solid Wood<\/span>/g,
  "</div>\n              )}\n              {canAccessFeature('wood_rates') && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Solid Wood</span>"
);

code = code.replace(
  /<\/div>\s*<div className="flex justify-between items-center text-sm">\s*<span>Hardware<\/span>/g,
  "</div>\n              )}\n              {canAccessFeature('hardware_rates') && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Hardware</span>"
);

code = code.replace(
  /<\/div>\s*<div className="flex justify-between items-center text-sm">\s*<span>Finishing<\/span>/g,
  "</div>\n              )}\n              {canAccessFeature('other_rates') && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Finishing</span>"
);

code = code.replace(
  /<\/div>\s*<div className="flex justify-between items-center text-sm">\s*<span>Edgeband<\/span>/g,
  "</div>\n              )}\n              {canAccessFeature('other_rates') && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Edgeband</span>"
);

code = code.replace(
  /<\/div>\s*<div className="flex justify-between items-center text-sm">\s*<span>Labour<\/span>/g,
  "</div>\n              )}\n              {canAccessFeature('other_rates') && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Labour</span>"
);

code = code.replace(
  /<span className="text-slate-900">₹\{results\.totals\.labourCost\.toFixed\(0\)\}<\/span>\s*<\/div>\s*<\/div>/,
  "<span className=\"text-slate-900\">₹{results.totals.labourCost.toFixed(0)}</span>\n                </div>\n              )}\n            </div>"
);

fs.writeFileSync('src/views/CostingEditor.tsx', code);
