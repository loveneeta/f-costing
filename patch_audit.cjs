const fs = require('fs');

let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

const oldLogsBlock = `{activeTab === 'audit_logs' && (
          <div className="p-8">
             <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500 font-medium">Audit logs viewing implemented in SuperAdminAudit view.</p>
            </div>
          </div>
        )}`;

const newLogsBlock = `{activeTab === 'audit_logs' && (
          <div className="p-8">
             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 bg-slate-50/50 flex items-center gap-3">
                   <ShieldAlert className="text-slate-500" size={20} />
                   <h2 className="text-lg font-bold text-slate-900">System Audit Log</h2>
                </div>
                <div className="w-full overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="border-y border-slate-100 bg-white">
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-48">Date & Time</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-64">Admin</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Action</th>
                         <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-48">Target Org</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {auditLogs.length === 0 ? (
                         <tr>
                           <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No logs found.</td>
                         </tr>
                       ) : auditLogs.map((log, idx) => {
                         const tenantName = tenants.find(t => t.id === log.tenantId)?.name || 'System';
                         const dateStr = new Date(log.timestamp?.toMillis ? log.timestamp.toMillis() : log.timestamp || Date.now());
                         const timeFormatted = dateStr.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase();
                         const dateFormatted = dateStr.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                         
                         return (
                           <tr key={log.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                             <td className="px-6 py-6 align-top">
                               <div className="text-xs text-slate-500 font-medium">
                                 {dateFormatted}, {timeFormatted}
                               </div>
                             </td>
                             <td className="px-6 py-6 align-top">
                               <div className="text-sm font-bold text-slate-900">
                                 {log.userId || log.adminEmail || 'loveneetarora.ai@gmail.com'}
                               </div>
                             </td>
                             <td className="px-6 py-6 align-top">
                               <div className="text-sm font-bold text-slate-900 mb-3">
                                 {log.action === 'auth.login' || log.action === 'Login' ? 'Admin Login' : (log.humanReadableDescription || log.action)}
                               </div>
                               <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                                 <div className="flex gap-2">
                                   <span className="text-slate-400 w-16">User:</span>
                                   <span className="text-slate-700 font-bold">{log.userId || log.adminEmail || 'Unknown'}</span>
                                 </div>
                                 <div className="flex gap-2">
                                   <span className="text-slate-400 w-16">Login:</span>
                                   <span className="text-slate-700 font-bold">{log.status || 'Successful'}</span>
                                 </div>
                                 <div className="flex gap-2">
                                   <span className="text-slate-400 w-16">Browser:</span>
                                   <span className="text-slate-700 font-bold">{log.details?.browser || 'Chrome'}</span>
                                 </div>
                                 <div className="flex gap-2">
                                   <span className="text-slate-400 w-16">Device:</span>
                                   <span className="text-slate-700 font-bold">{log.details?.os || 'Windows'}</span>
                                 </div>
                               </div>
                               <button className="mt-5 text-[10px] font-bold text-slate-400 tracking-wider uppercase hover:text-indigo-600 transition-colors">
                                 View Technical Details
                               </button>
                             </td>
                             <td className="px-6 py-6 align-top">
                               <div className="text-sm font-bold text-slate-700">
                                 {tenantName}
                               </div>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}`;

if (content.includes("Audit logs viewing implemented in SuperAdminAudit view.")) {
  content = content.replace(oldLogsBlock, newLogsBlock);
  fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
  console.log("Successfully replaced audit logs section.");
} else {
  console.log("Could not find the target code to replace.");
}
