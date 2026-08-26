const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

// Also update the drawerTab logins to use userEmail
content = content.replace(
  `<div className="font-bold text-slate-900">{log.userId}</div>`,
  `<div className="font-bold text-slate-900">{users.find(u => u.id === log.userId)?.email || log.userId}</div>`
);

// Better technical details modal
content = content.replace(
  `  const [paymentStatus, setPaymentStatus] = useState('PAID');`,
  `  const [paymentStatus, setPaymentStatus] = useState('PAID');\n  const [techDetailsLog, setTechDetailsLog] = useState<any | null>(null);`
);

content = content.replace(
  `onClick={() => {
                                   alert('Audit Log ID: ' + log.id + '\\nAction: ' + log.action + '\\nEntity: ' + log.entityType + '\\nEntity ID: ' + log.entityId + '\\nRaw Data:\\n' + JSON.stringify(log.details || {}, null, 2));
                                 }}`,
  `onClick={() => setTechDetailsLog(log)}`
);

// Add the tech details modal JSX right before the end
content = content.replace(
  `{/* Add Payment Modal */}`,
  `{/* Technical Details Modal */}
      {techDetailsLog && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-900/40 backdrop-blur-sm" onClick={() => setTechDetailsLog(null)}></div>
            <div className="relative w-full max-w-2xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Terminal size={18} className="text-slate-400" />
                    Log Technical Details
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">ID: {techDetailsLog.id}</p>
                </div>
                <button onClick={() => setTechDetailsLog(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Action</div>
                    <div className="text-sm font-mono text-slate-800">{techDetailsLog.action}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Entity</div>
                    <div className="text-sm font-mono text-slate-800">{techDetailsLog.entityType} ({techDetailsLog.entityId})</div>
                  </div>
                </div>
                
                {techDetailsLog.before && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Previous State</div>
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                      {JSON.stringify(techDetailsLog.before, null, 2)}
                    </pre>
                  </div>
                )}
                
                {techDetailsLog.after && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">New State</div>
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                      {JSON.stringify(techDetailsLog.after, null, 2)}
                    </pre>
                  </div>
                )}
                
                {techDetailsLog.details && Object.keys(techDetailsLog.details).length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Additional Metadata</div>
                    <pre className="bg-slate-900 text-blue-400 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                      {JSON.stringify(techDetailsLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}`
);

fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
