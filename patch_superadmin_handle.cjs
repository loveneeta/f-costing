const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

const hookStr = `  useEffect(() => {
    fetchData();
  }, []);`;
  
const handleStr = `  useEffect(() => {
    fetchData();
  }, []);
  
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantPlan) {
      alert("Please select a valid subscription plan.");
      return;
    }
    
    setIsCreatingTenant(true);
    try {
      // Check if a tenant with this email already exists
      const tenantsRef = collection(db, 'tenants');
      const q = query(tenantsRef, where('email', '==', newTenantEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert('A tenant with this company email address already exists.');
        setIsCreatingTenant(false);
        return;
      }

      const tenantId = uuidv4();
      const newTenant = {
        name: newTenantName,
        email: newTenantEmail.trim().toLowerCase(),
        phone: newTenantPhone,
        address: newTenantAddress,
        status: 'active',
        subscriptionPlan: newTenantPlan,
        environment: newTenantEnvironment,
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'tenants', tenantId), newTenant);
      
      // Create Subscription Record
      const subscriptionId = uuidv4();
      await setDoc(doc(db, 'subscriptions', subscriptionId), {
        tenantId,
        planId: newTenantPlan,
        status: 'ACTIVE',
        startDate: new Date().toISOString(),
        renewalDate: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString(); })(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Initialize settings for the tenant
      await setDoc(doc(db, 'settings', tenantId), {
        tenantId,
        company: { name: newTenantName, email: newTenantEmail, phone: newTenantPhone, address: newTenantAddress },
        pricing: { profitMargin: 20, installationFactor: 10, overheadCost: 5, hardwareContingency: 5 }
      });

      // Create Admin Invitation
      const inviteToken = uuidv4();
      const encoder = new TextEncoder();
      const data = encoder.encode(inviteToken);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      await setDoc(doc(collection(db, 'invitations')), {
        tenantId,
        email: newTenantAdminEmail.trim().toLowerCase(),
        name: newTenantAdminName.trim(),
        role: 'company_admin',
        tokenHash,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        createdAt: new Date().toISOString()
      });
      
      await logAuditEvent(null, appUser!.uid, {
        action: 'tenant.create',
        entityType: 'tenant',
        entityId: tenantId,
        humanReadableDescription: \`Created new \${newTenantEnvironment} tenant: \${newTenantName}\`,
        details: { name: newTenantName, plan: newTenantPlan, adminEmail: newTenantAdminEmail, environment: newTenantEnvironment }
      });
      
      await logAuditEvent(null, appUser!.uid, {
        action: 'tenant.invitation.create',
        entityType: 'invitation',
        entityId: newTenantAdminEmail.trim().toLowerCase(),
        humanReadableDescription: \`Created company_admin invitation for \${newTenantAdminEmail}\`
      });
      
      setShowAddTenantModal(false);
      setNewTenantName('');
      setNewTenantEmail('');
      setNewTenantPhone('');
      setNewTenantAddress(''); 
      setNewTenantEnvironment('production');
      setNewTenantAdminName('');
      setNewTenantAdminEmail('');
      if (plans.length > 0) setNewTenantPlan(plans[0].id);
      
      const origin = window.location.origin.replace("ais-dev-", "ais-pre-");
      setGeneratedLink(\`\${origin}/#/accept-invitation?token=\${inviteToken}&email=\${newTenantAdminEmail.trim().toLowerCase()}\`);
      
      fetchData();
    } catch (err) {
      console.error("Failed to create tenant:", err);
      alert("Failed to create tenant");
    }
    setIsCreatingTenant(false);
  };`;

content = content.replace(hookStr, handleStr);
fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
