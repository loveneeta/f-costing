const fs = require('fs');
let code = fs.readFileSync('src/views/Dashboard.tsx', 'utf8');

code = code.replace(
  "import { useStore } from '../context/StoreContext';",
  "import { useStore } from '../context/StoreContext';\nimport { useTenant } from '../contexts/TenantContext';"
);

code = code.replace(
  "const { projects, rates, woodTypes, settings, addProject, deleteProject } = useStore();",
  "const { projects, rates, woodTypes, settings, addProject, deleteProject } = useStore();\n  const { canAccessFeature } = useTenant();"
);

// In Dashboard: "Active Material Rates" section should probably only show rates that the user has features for.
// Wait, we can just filter the rates based on features.
code = code.replace(
  "const [projectToDelete, setProjectToDelete] = useState<string | null>(null);",
  "const [projectToDelete, setProjectToDelete] = useState<string | null>(null);\n  const allowedRates = rates.filter(r => {\n    if (r.category === 'wood') return canAccessFeature('wood_rates');\n    if (r.category === 'hardware') return canAccessFeature('hardware_rates');\n    if (r.category === 'veneer') return canAccessFeature('veneer_rates');\n    if (r.category === 'ply') return canAccessFeature('ply_sheets');\n    if (r.category === 'board') return canAccessFeature('board_sheets');\n    return canAccessFeature('other_rates');\n  });"
);

// We should replace `rates.length` in Dashboard to `allowedRates.length` for the Active Material Rates count
// Actually let's just find and replace `rates.slice(0, 5)` with `allowedRates.slice(0, 5)`
code = code.replace(
  /rates\.length === 0/g,
  "allowedRates.length === 0"
);
code = code.replace(
  /{rates\.length} configured/g,
  "{allowedRates.length} configured"
);
code = code.replace(
  /rates\.slice\(0, 5\)/g,
  "allowedRates.slice(0, 5)"
);

fs.writeFileSync('src/views/Dashboard.tsx', code);
