const fs = require('fs');
let content = fs.readFileSync('src/views/TenantManagement.tsx', 'utf-8');

content = content.replace(
  '<div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg break-all text-sm font-mono text-neutral-800 mb-6">\n                {generatedLink}\n              </div>',
  `<div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg break-all text-sm font-mono text-neutral-800 mb-6">
                <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {generatedLink}
                </a>
              </div>`
);

fs.writeFileSync('src/views/TenantManagement.tsx', content);
