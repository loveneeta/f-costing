const fs = require('fs');

let settingsCode = fs.readFileSync('src/views/Settings.tsx', 'utf8');
let billingCode = fs.readFileSync('src/views/CompanyBilling.tsx', 'utf8');

// 1. Extract and remove handleCompanyChange
const handleCompanyChangeRegex = /const handleCompanyChange = \([\s\S]*?\}\s*\}\);\n  \};\n/m;
const handleCompanyChangeMatch = settingsCode.match(handleCompanyChangeRegex);
let handleCompanyChangeStr = '';
if (handleCompanyChangeMatch) {
  handleCompanyChangeStr = handleCompanyChangeMatch[0];
  settingsCode = settingsCode.replace(handleCompanyChangeRegex, '');
}

// 2. Extract and remove handleSaveCompanyProfile
const handleSaveCompanyProfileRegex = /const handleSaveCompanyProfile = async \(\) => \{[\s\S]*?\}\s*\};\n/m;
const handleSaveCompanyProfileMatch = settingsCode.match(handleSaveCompanyProfileRegex);
let handleSaveCompanyProfileStr = '';
if (handleSaveCompanyProfileMatch) {
  handleSaveCompanyProfileStr = handleSaveCompanyProfileMatch[0];
  settingsCode = settingsCode.replace(handleSaveCompanyProfileRegex, '');
}

// 3. Extract and remove the JSX section
const jsxRegex = /\{\/\* Company Profile Card \*\/\}\n\s*<section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">[\s\S]*?<\/section>\n/m;
const jsxMatch = settingsCode.match(jsxRegex);
let jsxStr = '';
if (jsxMatch) {
  jsxStr = jsxMatch[0];
  settingsCode = settingsCode.replace(jsxRegex, '');
}

// 4. Update CompanyBilling.tsx
// Add imports if missing
if (!billingCode.includes('useStore')) {
  billingCode = billingCode.replace(
    "import { useTenant } from '../contexts/TenantContext';",
    "import { useTenant } from '../contexts/TenantContext';\nimport { useStore } from '../context/StoreContext';\nimport { CompanySettings } from '../types';\nimport { Save } from 'lucide-react';"
  );
}

// Inject functions inside component
const componentStartRegex = /const \[updating, setUpdating\] = useState\(false\);/;
billingCode = billingCode.replace(
  componentStartRegex,
  `const [updating, setUpdating] = useState(false);\n  const { settings, updateSettings } = useStore();\n\n  ${handleCompanyChangeStr}\n  ${handleSaveCompanyProfileStr}\n`
);

// Inject JSX inside the return statement
// Let's put it right before "Subscription Details" or at the very top of the page.
const returnStartRegex = /<div className="max-w-5xl mx-auto space-y-6">/;
billingCode = billingCode.replace(
  returnStartRegex,
  `<div className="max-w-5xl mx-auto space-y-6">\n      ${jsxStr}\n`
);

fs.writeFileSync('src/views/Settings.tsx', settingsCode);
fs.writeFileSync('src/views/CompanyBilling.tsx', billingCode);
