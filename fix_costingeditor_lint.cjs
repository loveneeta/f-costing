const fs = require('fs');
let code = fs.readFileSync('src/views/CostingEditor.tsx', 'utf8');

code = code.replace(
  /const { rates, woodTypes, settings, updateProject, addProject, projects } = useStore\(\);/g,
  "const { rates, woodTypes, settings, updateProject, addProject, projects } = useStore();\n  const { canAccessFeature } = useTenant();"
);

fs.writeFileSync('src/views/CostingEditor.tsx', code);
