const fs = require('fs');
let code = fs.readFileSync('src/views/developer/DeveloperLogs.tsx', 'utf8');

code = code.replace(
  "import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';",
  "import { collection, query, orderBy, limit, getDocs, where, documentId } from 'firebase/firestore';"
);

code = code.replace(
  "      const snap = await getDocs(q);\n      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));",
  `      const snap = await getDocs(q);
      const rawLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const tenantIds = [...new Set(rawLogs.map(l => l.tenantId).filter(id => id && id !== 'SYSTEM'))];
      const userIds = [...new Set(rawLogs.map(l => l.userId).filter(Boolean))];

      const tenantMap = new Map();
      const userMap = new Map();

      for (let i = 0; i < tenantIds.length; i += 30) {
        const chunk = tenantIds.slice(i, i + 30);
        const tSnap = await getDocs(query(collection(db, 'tenants'), where(documentId(), 'in', chunk)));
        tSnap.forEach(d => tenantMap.set(d.id, d.data().name));
      }

      for (let i = 0; i < userIds.length; i += 30) {
        const chunk = userIds.slice(i, i + 30);
        const uSnap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)));
        uSnap.forEach(d => {
           const uData = d.data();
           userMap.set(d.id, uData.name || uData.email);
        });
      }

      setLogs(rawLogs.map(l => ({
        ...l,
        tenantName: l.tenantId === 'SYSTEM' ? 'SYSTEM' : (tenantMap.get(l.tenantId) || l.tenantId),
        userName: userMap.get(l.userId) || l.userId
      })));`
);

code = code.replace(
  "{new Date(l.timestamp).toLocaleString()}",
  "{l.timestamp?.toDate ? l.timestamp.toDate().toLocaleString() : new Date(l.timestamp).toLocaleString()}"
);

code = code.replace(
  "{l.tenantId || 'SYSTEM'}",
  "{l.tenantName || l.tenantId || 'SYSTEM'}"
);

code = code.replace(
  "{l.userId}",
  "{l.userName || l.userId}"
);

fs.writeFileSync('src/views/developer/DeveloperLogs.tsx', code);
console.log('Success Dev Logs!');
