const fs = require('fs');
let code = fs.readFileSync('src/views/CostingEditor.tsx', 'utf8');

code = code.replace(/<>\ \{\/\* 2\. Sheet Material Parts Section \*\/\}/g, "{/* 2. Sheet Material Parts Section */}");
code = code.replace(/<>\ \{\/\* 3\. Solid Wood Parts Section \*\/\}/g, "{/* 3. Solid Wood Parts Section */}");
code = code.replace(/<>\ \{\/\* 4\. Hardware Section \*\/\}/g, "{/* 4. Hardware Section */}");
code = code.replace(/<>\ \{\/\* 5\. Finishing \(Polish \/ Paint\) Section \*\/\}/g, "{/* 5. Finishing (Polish / Paint) Section */}");
code = code.replace(/<>\ \{\/\* 6\. Labour \& Services Section \*\/\}/g, "{/* 6. Labour & Services Section */}");

fs.writeFileSync('src/views/CostingEditor.tsx', code);
