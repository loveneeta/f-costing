const fs = require('fs');
let content = fs.readFileSync('src/views/EmployeeManagement.tsx', 'utf-8');

content = content.replace(
  '<input\\n                  type="text"\\n                  readOnly\\n                  value={generatedLink}',
  `<a href={generatedLink} target="_blank" rel="noopener noreferrer" className="block w-full px-4 py-2 mb-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium rounded-lg hover:underline text-center">Open Link in New Tab</a>
                <input
                  type="text"
                  readOnly
                  value={generatedLink}`
);

fs.writeFileSync('src/views/EmployeeManagement.tsx', content);
