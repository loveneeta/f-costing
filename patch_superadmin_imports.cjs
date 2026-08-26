const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

// Add missing imports
if (!content.includes('import { useAuth }')) {
  content = content.replace("import { db } from '../lib/firebase';", "import { db } from '../lib/firebase';\nimport { useAuth } from '../contexts/AuthContext';\nimport { logAuditEvent } from '../services/AuditService';\nimport { v4 as uuidv4 } from 'uuid';");
}

if (!content.includes('setDoc')) {
  content = content.replace('addDoc, serverTimestamp } from \'firebase/firestore\';', 'addDoc, serverTimestamp, setDoc } from \'firebase/firestore\';');
}

if (!content.includes('const { appUser } = useAuth();')) {
  content = content.replace("const [activeTab, setActiveTab] = useState<'organizations' | 'plan_requests' | 'audit_logs'>('organizations');", "const { appUser } = useAuth();\n  const [activeTab, setActiveTab] = useState<'organizations' | 'plan_requests' | 'audit_logs'>('organizations');");
}

fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
