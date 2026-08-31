const fs = require('fs');
let code = fs.readFileSync('src/views/SuperAdminSubscriptions.tsx', 'utf8');

// Replace the hardcoded AVAILABLE_FEATURES with the import
code = code.replace(
  /const AVAILABLE_FEATURES = \[[^\]]+\];/,
  "import { AVAILABLE_FEATURES, FEATURES_REGISTRY } from '../config/features';"
);

// We also need to change how the feature is rendered in the UI
// From `{feature.replace('_', ' ')}` to `{FEATURES_REGISTRY[feature]?.name || feature}`
code = code.replace(
  /{feature\.replace\('_', ' '\)}/g,
  "{FEATURES_REGISTRY[feature]?.name || feature}"
);

fs.writeFileSync('src/views/SuperAdminSubscriptions.tsx', code);
