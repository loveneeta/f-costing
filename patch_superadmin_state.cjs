const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

const stateStr = `  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);`;
const newStateStr = `  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // New Tenant Modal State
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantAddress, setNewTenantAddress] = useState('');
  const [newTenantEnvironment, setNewTenantEnvironment] = useState<'production' | 'test'>('production');
  const [newTenantAdminName, setNewTenantAdminName] = useState('');
  const [newTenantAdminEmail, setNewTenantAdminEmail] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);`;

content = content.replace(stateStr, newStateStr);
fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
