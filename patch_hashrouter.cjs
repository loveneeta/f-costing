const fs = require('fs');

// Patch App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace(
  "import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';",
  "import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';"
);
app = app.replace(
  "<BrowserRouter>",
  "<HashRouter>"
);
app = app.replace(
  "</BrowserRouter>",
  "</HashRouter>"
);
fs.writeFileSync('src/App.tsx', app);

// Patch TenantManagement
let tenant = fs.readFileSync('src/views/TenantManagement.tsx', 'utf-8');
tenant = tenant.replace(
  'setGeneratedLink(`${origin}/accept-invitation',
  'setGeneratedLink(`${origin}/#/accept-invitation'
);
fs.writeFileSync('src/views/TenantManagement.tsx', tenant);

// Patch EmployeeManagement
let emp = fs.readFileSync('src/views/EmployeeManagement.tsx', 'utf-8');
emp = emp.replace(
  'const link = `${origin}/accept-invitation',
  'const link = `${origin}/#/accept-invitation'
);
fs.writeFileSync('src/views/EmployeeManagement.tsx', emp);
