const fs = require('fs');
let code = fs.readFileSync('src/views/Dashboard.tsx', 'utf8');

code = code.replace(
  "import { Calculator, Tags, Activity, FileText } from 'lucide-react';",
  "import { Calculator, Tags, Activity, FileText, Plus } from 'lucide-react';\nimport { v4 as uuidv4 } from 'uuid';"
);

code = code.replace(
  /<h1 className="text-2xl font-bold text-neutral-800 mb-6">Dashboard<\/h1>/,
  `<div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
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

fs.writeFileSync('src/views/Dashboard.tsx', code);
console.log('Success Dashboard!');
