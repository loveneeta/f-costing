const fs = require('fs');
let code = fs.readFileSync('src/views/CompanyBilling.tsx', 'utf8');

// Add imports
code = code.replace(
  "import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';",
  "import { collection, query, getDocs, where, orderBy, limit, updateDoc, doc } from 'firebase/firestore';\nimport { SubscriptionPlan } from '../contexts/TenantContext';\nimport { X, Check } from 'lucide-react';"
);

const stateCode = `
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const snap = await getDocs(collection(db, 'subscription_plans'));
        setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPlan)).filter(p => p.status === 'active'));
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlans();
  }, []);

  const handleSwitchPlan = async (newPlanId: string) => {
    if (!tenant || !subscription || newPlanId === plan?.id) return;
    setUpdating(true);
    try {
      // Update tenant
      await updateDoc(doc(db, 'tenants', tenant.id), {
        subscriptionPlan: newPlanId
      });
      // Update subscription
      await updateDoc(doc(db, 'subscriptions', subscription.id), {
        planId: newPlanId,
        updatedAt: new Date().toISOString()
      });
      
      // Need to force reload window to refresh context, or let it fetch again. 
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Failed to update subscription.');
      setUpdating(false);
    }
  };
`;

code = code.replace(
  "const [loading, setLoading] = useState(true);",
  "const [loading, setLoading] = useState(true);\n" + stateCode
);

const buttonCode = `
              <button 
                onClick={() => setShowPlanModal(true)}
                className="bg-white border border-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50"
              >
                Manage Subscription
              </button>
`;

code = code.replace(
  /<button className="bg-white border border-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50">\s*Manage Subscription\s*<\/button>/g,
  buttonCode
);

const modalCode = `
      {showPlanModal && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-neutral-900">Change Subscription Plan</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(p => (
                  <div key={p.id} className={\`border \${plan?.id === p.id ? 'border-blue-600 ring-1 ring-blue-600' : 'border-neutral-200'} rounded-xl p-6 relative flex flex-col\`}>
                    {plan?.id === p.id && (
                      <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-wider">
                        Current
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">{p.name}</h3>
                    <p className="text-sm text-neutral-500 mb-4 flex-1">{p.description}</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-neutral-900">₹{p.price}</span>
                      <span className="text-sm text-neutral-500">/{p.billingInterval}</span>
                    </div>
                    
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Check size={16} className="text-emerald-500" />
                        <span>{p.limits.users} Users</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Check size={16} className="text-emerald-500" />
                        <span>{p.limits.employees} Employees</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Check size={16} className="text-emerald-500" />
                        <span>{p.limits.storage} GB Storage</span>
                      </div>
                      {p.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-sm text-neutral-600">
                          <Check size={16} className="text-emerald-500" />
                          <span className="capitalize">{f.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSwitchPlan(p.id)}
                      disabled={plan?.id === p.id || updating}
                      className={\`w-full py-2.5 rounded-lg text-sm font-medium transition-colors \${
                        plan?.id === p.id 
                          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      }\`}
                    >
                      {updating && plan?.id !== p.id ? 'Updating...' : plan?.id === p.id ? 'Current Plan' : 'Switch to ' + p.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "</div>\n    </div>\n  );\n};",
  modalCode + "\n    </div>\n  );\n};"
);

fs.writeFileSync('src/views/CompanyBilling.tsx', code);
console.log('Success!');
