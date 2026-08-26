const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

// Add states
content = content.replace(
  "const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);",
  `const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);\n\n  // Expiry Date Edit State\n  const [isEditingExpiry, setIsEditingExpiry] = useState(false);\n  const [newExpiryDate, setNewExpiryDate] = useState('');\n  const [isSavingExpiry, setIsSavingExpiry] = useState(false);`
);

// Add handler function
content = content.replace(
  "const handleAddPayment = async (e: React.FormEvent) => {",
  `const handleSaveExpiryDate = async () => {
    if (!selectedTenant || !newExpiryDate) return;
    setIsSavingExpiry(true);
    try {
      const sub = getTenantSubscription(selectedTenant.id);
      if (sub && sub.id) {
        // Update existing subscription
        await updateDoc(doc(db, 'subscriptions', sub.id), {
          renewalDate: newExpiryDate
        });
        setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, renewalDate: newExpiryDate } : s));
      } else {
        // Create new subscription for the tenant
        const newSubData = {
          tenantId: selectedTenant.id,
          status: 'ACTIVE',
          renewalDate: newExpiryDate,
          startDate: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'subscriptions'), newSubData);
        setSubscriptions(prev => [...prev, { id: docRef.id, ...newSubData }]);
      }
      setIsEditingExpiry(false);
    } catch (err) {
      console.error('Failed to update expiry date', err);
      alert('Failed to update expiry date');
    }
    setIsSavingExpiry(false);
  };

  const handleAddPayment = async (e: React.FormEvent) => {`
);

// Update Expiry Date UI
const oldExpiryBlock = `<div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Expiry Date</h3>
                          <div className="text-lg font-semibold text-slate-900">
                             {sub?.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Lifetime / N/A'}
                          </div>
                        </div>`;

const newExpiryBlock = `<div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Expiry Date</h3>
                            {!isEditingExpiry ? (
                              <button 
                                onClick={() => {
                                  setNewExpiryDate(sub?.renewalDate || '');
                                  setIsEditingExpiry(true);
                                }}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                              >
                                Edit
                              </button>
                            ) : (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setIsEditingExpiry(false)}
                                  className="text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={handleSaveExpiryDate}
                                  disabled={isSavingExpiry}
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider disabled:opacity-50"
                                >
                                  {isSavingExpiry ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {!isEditingExpiry ? (
                            <div className="text-lg font-semibold text-slate-900">
                               {sub?.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Lifetime / N/A'}
                            </div>
                          ) : (
                            <input 
                              type="date"
                              value={newExpiryDate}
                              onChange={(e) => setNewExpiryDate(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          )}
                        </div>`;

content = content.replace(oldExpiryBlock, newExpiryBlock);
fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
