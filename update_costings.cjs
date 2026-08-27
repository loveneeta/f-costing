const fs = require('fs');
let code = fs.readFileSync('src/views/CostingsList.tsx', 'utf8');

code = code.replace(
  "import { Edit2, Trash2, Copy } from 'lucide-react';",
  "import { Edit2, Trash2, Copy, Plus } from 'lucide-react';"
);

code = code.replace(
  /<div className="flex justify-between items-center mb-6">\s*<h1 className="text-2xl font-bold text-neutral-800">All Costings<\/h1>\s*<\/div>/,
  `<div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">All Costings</h1>
        <button 
          onClick={() => onEdit({
            id: uuidv4(),
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            name: '',
            category: '',
            overallL: 0,
            overallW: 0,
            overallH: 0,
            sheetComponents: [],
            solidWoodComponents: [],
            hardware: [],
            finishing: [],
            labour: [],
            isTemplate: false
          })}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> New Costing
        </button>
      </div>`
);

fs.writeFileSync('src/views/CostingsList.tsx', code);
console.log('Success CostingsList!');
