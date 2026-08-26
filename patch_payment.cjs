const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

// 1. Add addDoc import
content = content.replace(
  "import { collection, query, getDocs, doc, updateDoc, orderBy, where } from 'firebase/firestore';",
  "import { collection, query, getDocs, doc, updateDoc, orderBy, where, addDoc, serverTimestamp } from 'firebase/firestore';"
);

// 2. Add State
content = content.replace(
  "const [savingNote, setSavingNote] = useState(false);",
  `const [savingNote, setSavingNote] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);`
);

// 3. Add handleAddPayment
content = content.replace(
  "const handleSaveNote = async () => {",
  `const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !paymentAmount) return;
    setIsSubmittingPayment(true);
    try {
      const paymentData = {
        tenantId: selectedTenant.id,
        amount: parseFloat(paymentAmount),
        mode: paymentMode,
        status: paymentStatus,
        timestamp: new Date().getTime(),
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'payments'), paymentData);
      setPayments(prev => [{ id: docRef.id, ...paymentData }, ...prev]);
      
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMode('Bank Transfer');
      setPaymentStatus('PAID');
    } catch (err) {
      console.error('Failed to add payment', err);
      alert('Failed to add payment');
    }
    setIsSubmittingPayment(false);
  };

  const handleSaveNote = async () => {`
);

// 4. Update the Button to trigger modal
content = content.replace(
  `<button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
                      + Add Payment
                    </button>`,
  `<button 
                      onClick={() => setShowPaymentModal(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      + Add Payment
                    </button>`
);

// 5. Inject Modal HTML at the end of the return statement before the closing div
content = content.replace(
  `      {/* Slide-over Drawer */}`,
  `      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>

            <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Add Payment Record</h3>
                <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 5000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmittingPayment ? 'Saving...' : 'Save Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Drawer */}`
);

fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
