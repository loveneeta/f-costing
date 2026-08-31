const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');
code = code.replace(
  'export const Layout: React.FC = () => {',
  'import { Project } from \'../types\';\n\nexport const Layout: React.FC<{ onEdit?: (p: Project) => void }> = ({ onEdit }) => {'
);
code = code.replace('<Header />', '<Header onEdit={onEdit} />');
fs.writeFileSync('src/components/Layout.tsx', code);
