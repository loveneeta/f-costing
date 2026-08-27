const fs = require('fs');
let code = fs.readFileSync('src/views/TemplatesList.tsx', 'utf8');

code = code.replace(
  "import { Edit2, Trash2, Copy, FilePlus2 } from 'lucide-react';",
  "import { Edit2, Trash2, Copy, FilePlus2, Plus } from 'lucide-react';"
);

code = code.replace(
  /      <div className="flex justify-between items-center mb-6">\s*<div>\s*<h1 className="text-2xl font-bold text-neutral-800">Item Templates<\/h1>\s*<p className="text-sm text-neutral-500 mt-1">Manage pre-filled costings templates\.<\/p>\s*<\/div>\s*<\/div>/,
  `      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Item Templates</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage pre-filled costings templates.</p>
        </div>
        <button 
          onClick={() => onEdit({
            id: uuidv4(),
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            name: 'New Template',
            category: '',
            overallL: 0,
            overallW: 0,
            overallH: 0,
            sheetComponents: [],
            solidWoodComponents: [],
            hardware: [],
            finishing: [],
            labour: [],
            isTemplate: true
          })}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={18} /> New Template
        </button>
      </div>`
);

fs.writeFileSync('src/views/TemplatesList.tsx', code);
console.log('Success TemplatesList!');
