const fs = require('fs');
let code = fs.readFileSync('src/views/CostingEditor.tsx', 'utf8');

code = code.replace(
  "import { useStore } from '../context/StoreContext';",
  "import { useStore } from '../context/StoreContext';\nimport { useTenant } from '../contexts/TenantContext';"
);

code = code.replace(
  "const { projects, rates, woodTypes, settings, updateProject, addProject } = useStore();",
  "const { projects, rates, woodTypes, settings, updateProject, addProject } = useStore();\n  const { canAccessFeature } = useTenant();"
);

code = code.replace(
  /\{\s*\/\*\ 2\.\ Sheet\ Components\ \*\/\s*\}/,
  "{(canAccessFeature('ply_sheets') || canAccessFeature('board_sheets')) && (\n            <>\n              {/* 2. Sheet Components */}"
);

code = code.replace(
  /\{\s*\/\*\ 3\.\ Solid\ Wood\ Components\ \*\/\s*\}/,
  "            </>\n          )}\n\n          {canAccessFeature('wood_rates') && (\n            <>\n              {/* 3. Solid Wood Components */}"
);

code = code.replace(
  /\{\s*\/\*\ 4\.\ Hardware\ Section\ \*\/\s*\}/,
  "            </>\n          )}\n\n          {canAccessFeature('hardware_rates') && (\n            <>\n              {/* 4. Hardware Section */}"
);

code = code.replace(
  /\{\s*\/\*\ 5\.\ Other\ Operations\ \(Finishing\,\ Edgeband\,\ Labour\)\ \*\/\s*\}/,
  "            </>\n          )}\n\n          {canAccessFeature('other_rates') && (\n            <>\n              {/* 5. Other Operations (Finishing, Edgeband, Labour) */}"
);

code = code.replace(
  /<\/div>\s*\{\s*\/\*\ Right\ Column\:\ Costing\ Summary\ \&\ Output\ \*\/\s*\}/,
  "            </>\n          )}\n        </div>\n\n        {/* Right Column: Costing Summary & Output */}"
);

code = code.replace(
  /<div className="flex justify-between items-center text-sm">\s*<span>Sheet Materials<\/span>/g,
  "{ (canAccessFeature('ply_sheets') || canAccessFeature('board_sheets')) && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Sheet Materials</span>"
);
code = code.replace(
  /<div className="flex justify-between items-center text-sm">\s*<span>Solid Wood<\/span>/g,
  "                </div>\n              )}\n              {canAccessFeature('wood_rates') && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Solid Wood</span>"
);
code = code.replace(
  /<div className="flex justify-between items-center text-sm">\s*<span>Hardware<\/span>/g,
  "                </div>\n              )}\n              {canAccessFeature('hardware_rates') && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Hardware</span>"
);
code = code.replace(
  /<div className="flex justify-between items-center text-sm">\s*<span>Finishing<\/span>/g,
  "                </div>\n              )}\n              {canAccessFeature('other_rates') && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Finishing</span>"
);
code = code.replace(
  /<div className="flex justify-between items-center text-sm">\s*<span>Edgeband<\/span>/g,
  "                </div>\n              )}\n              {canAccessFeature('other_rates') && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Edgeband</span>"
);
code = code.replace(
  /<div className="flex justify-between items-center text-sm">\s*<span>Labour<\/span>/g,
  "                </div>\n              )}\n              {canAccessFeature('other_rates') && (\n                <div className=\"flex justify-between items-center text-sm\">\n                  <span>Labour</span>"
);

code = code.replace(
  /<span className="text-slate-900">₹\{results\.totals\.labourCost\.toFixed\(0\)\}<\/span>\s*<\/div>\s*<\/div>/,
  "<span className=\"text-slate-900\">₹{results.totals.labourCost.toFixed(0)}</span>\n                </div>\n              )}\n            </div>"
);

fs.writeFileSync('src/views/CostingEditor.tsx', code);
