const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

const handleRenew = `  const handleRenewSubscription = async (months: number) => {
    if (!selectedTenant) return;
    setIsSavingExpiry(true);
    try {
      const sub = getTenantSubscription(selectedTenant.id);
      
      let baseDate = new Date();
      if (sub?.renewalDate) {
         const currentRenewal = new Date(sub.renewalDate);
         if (currentRenewal > baseDate) {
            baseDate = currentRenewal;
         }
      }
      
      baseDate.setMonth(baseDate.getMonth() + months);
      // Keep only the date part YYYY-MM-DD
      const newDateStr = baseDate.toISOString().split('T')[0];

      if (sub && sub.id) {
        await updateDoc(doc(db, 'subscriptions', sub.id), {
          renewalDate: newDateStr,
          status: 'ACTIVE'
        });
        setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, renewalDate: newDateStr, status: 'ACTIVE' } : s));
      } else {
        const newSubData = {
          tenantId: selectedTenant.id,
          status: 'ACTIVE',
          renewalDate: newDateStr,
          startDate: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, 'subscriptions'), newSubData);
        setSubscriptions(prev => [...prev, { id: docRef.id, ...newSubData }]);
      }
    } catch (err) {
      console.error('Failed to renew subscription', err);
      alert('Failed to renew subscription');
    }
    setIsSavingExpiry(false);
  };

  const handleAddPayment`;

content = content.replace("  const handleAddPayment", handleRenew);

const oldEditButton = `                            {!isEditingExpiry ? (
                              <button 
                                onClick={() => {
                                  setNewExpiryDate(sub?.renewalDate || '');
                                  setIsEditingExpiry(true);
                                }}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                              >
                                Edit
                              </button>
                            ) : (`;

const newEditButton = `                            {!isEditingExpiry ? (
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => handleRenewSubscription(1)}
                                  disabled={isSavingExpiry}
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider disabled:opacity-50"
                                >
                                  +1 Month
                                </button>
                                <button 
                                  onClick={() => handleRenewSubscription(12)}
                                  disabled={isSavingExpiry}
                                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider disabled:opacity-50"
                                >
                                  +1 Year
                                </button>
                                <div className="w-px h-3 bg-slate-300 mx-1"></div>
                                <button 
                                  onClick={() => {
                                    setNewExpiryDate(sub?.renewalDate || '');
                                    setIsEditingExpiry(true);
                                  }}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (`;

content = content.replace(oldEditButton, newEditButton);

fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
