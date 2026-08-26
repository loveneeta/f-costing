const fs = require('fs');
let content = fs.readFileSync('src/views/SuperAdminDashboard.tsx', 'utf-8');

// I will just add a toggle for includeTest.

content = content.replace(
  'const [recentLogs, setRecentLogs] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);',
  'const [recentLogs, setRecentLogs] = useState<any[]>([]);\n  const [loading, setLoading] = useState(true);\n  const [includeTest, setIncludeTest] = useState(false);'
);

content = content.replace(
  'fetchDashboardData();\n  }, []);',
  'fetchDashboardData();\n  }, [includeTest]);'
);

content = content.replace(
  `getCountFromServer(collection(db, 'tenants')),
          getCountFromServer(query(collection(db, 'tenants'), where('status', '==', 'active'))),
          getCountFromServer(query(collection(db, 'tenants'), where('status', '==', 'trial'))),
          getCountFromServer(query(collection(db, 'tenants'), where('status', '==', 'suspended'))),`,
  `getCountFromServer(includeTest ? collection(db, 'tenants') : query(collection(db, 'tenants'), where('environment', '==', 'production'))),
          getCountFromServer(query(collection(db, 'tenants'), where('status', '==', 'active'), ...(includeTest ? [] : [where('environment', '==', 'production')]))),
          getCountFromServer(query(collection(db, 'tenants'), where('status', '==', 'trial'), ...(includeTest ? [] : [where('environment', '==', 'production')]))),
          getCountFromServer(query(collection(db, 'tenants'), where('status', '==', 'suspended'), ...(includeTest ? [] : [where('environment', '==', 'production')]))),`
);

content = content.replace(
  `<h1 className="text-2xl font-bold text-neutral-900">Platform Overview</h1>
        <p className="text-neutral-500">Super admin analytics and recent activity.</p>
      </div>`,
  `<h1 className="text-2xl font-bold text-neutral-900">Platform Overview</h1>
        <p className="text-neutral-500">Super admin analytics and recent activity.</p>
      </div>
      <div className="flex justify-end mb-4">
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input type="checkbox" checked={includeTest} onChange={(e) => setIncludeTest(e.target.checked)} className="rounded border-neutral-300" />
          Include Test / Sandbox Data
        </label>
      </div>`
);

fs.writeFileSync('src/views/SuperAdminDashboard.tsx', content);
