const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

const oldStr = `    </div>
  );
};`;

const modalStr = `      {/* Add Tenant Modal */}
      {showAddTenantModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Add New Organization</h3>
                <p className="text-sm text-slate-500 mt-1">Create a new tenant workspace and generate an admin invite.</p>
              </div>
              <button onClick={() => setShowAddTenantModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTenant} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Company Details</h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Environment</label>
                    <select 
                      value={newTenantEnvironment}
                      onChange={(e) => setNewTenantEnvironment(e.target.value as 'production' | 'test')}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                    >
                      <option value="production">Production</option>
                      <option value="test">Test / Sandbox</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Company Name</label>
                    <input 
                      type="text" 
                      required
                      value={newTenantName}
                      onChange={(e) => setNewTenantName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="Acme Corp"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Company Email</label>
                    <input 
                      type="email" 
                      required
                      value={newTenantEmail}
                      onChange={(e) => setNewTenantEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="contact@acmecorp.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Company Phone</label>
                    <input 
                      type="tel" 
                      value={newTenantPhone}
                      onChange={(e) => setNewTenantPhone(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Company Address</label>
                    <textarea 
                      value={newTenantAddress}
                      onChange={(e) => setNewTenantAddress(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="123 Business St..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Admin Setup & Plan</h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Admin Name</label>
                    <input 
                      type="text" 
                      required
                      value={newTenantAdminName}
                      onChange={(e) => setNewTenantAdminName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Admin Email (For Login)</label>
                    <input 
                      type="email" 
                      required
                      value={newTenantAdminEmail}
                      onChange={(e) => setNewTenantAdminEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      placeholder="admin@acmecorp.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Subscription Plan</label>
                    {plans.length > 0 ? (
                      <select 
                        value={newTenantPlan}
                        onChange={(e) => setNewTenantPlan(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-4 py-3 border border-rose-200 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium flex items-center gap-2">
                        <ShieldAlert size={16} />
                        Unable to load subscription plans.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-6 mt-6 border-t border-slate-100 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddTenantModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold tracking-wider uppercase text-xs py-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={plans.length === 0 || isCreatingTenant}
                  className="flex-1 bg-indigo-600 text-white font-bold tracking-wider uppercase text-xs py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isCreatingTenant ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Link Modal */}
      {generatedLink && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100 bg-emerald-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Organization Created!</h3>
                  <p className="text-sm text-emerald-700 mt-0.5">Workspace and admin invite generated successfully.</p>
                </div>
              </div>
              <button onClick={() => setGeneratedLink('')} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Send this secure invitation link to the company administrator. They will use it to set up their password and access their new workspace.
              </p>
              
              <div className="relative group">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedLink}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-600 pr-24 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert("Link copied to clipboard!");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Copy
                </button>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setGeneratedLink('')}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};`;

content = content.replace(oldStr, modalStr);
fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
