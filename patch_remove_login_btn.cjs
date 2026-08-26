const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');
content = content.replace(
  '<button className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider">\n                              Login\n                            </button>',
  ''
);
fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
