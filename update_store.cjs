const fs = require('fs');
let code = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');

const target = "          setSettings(setSnap.docs[0].data() as AppSettings);";
const replacement = "          const data = setSnap.docs[0].data() as Partial<AppSettings>;\n          setSettings({\n            ...DEFAULT_SETTINGS,\n            ...data,\n            company: { ...DEFAULT_SETTINGS.company, ...(data.company || {}) },\n            pricing: { ...DEFAULT_SETTINGS.pricing, ...(data.pricing || {}) }\n          });";

code = code.replace(target, replacement);

fs.writeFileSync('src/context/StoreContext.tsx', code);
console.log('Success StoreContext!');
