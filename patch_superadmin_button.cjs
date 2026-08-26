const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

const oldToolbar = `              <div className="flex gap-3">
                <select className="border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none">`;

const newToolbar = `              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddTenantModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                >
                  + New Tenant
                </button>
                <select className="border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 outline-none">`;

content = content.replace(oldToolbar, newToolbar);
fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
