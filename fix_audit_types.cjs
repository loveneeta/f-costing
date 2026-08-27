const fs = require('fs');
['src/views/SuperAdminAudit.tsx', 'src/views/developer/DeveloperLogs.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(
    "const rawLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));",
    "const rawLogs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));"
  );
  fs.writeFileSync(file, code);
});
console.log('Success fixing types!');
