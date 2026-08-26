const fs = require('fs');
let content = fs.readFileSync('src/views/EmployeeManagement.tsx', 'utf-8');

content = content.replace(
  '<div className="p-3 bg-neutral-100 rounded border border-neutral-200 text-sm break-all font-mono">\\n                      {generatedLink}\\n                    </div>',
  `<div className="p-3 bg-neutral-100 rounded border border-neutral-200 text-sm break-all font-mono">
                      <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {generatedLink}
                      </a>
                    </div>`
);

fs.writeFileSync('src/views/EmployeeManagement.tsx', content);
