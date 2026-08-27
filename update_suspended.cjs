const fs = require('fs');
let code = fs.readFileSync('src/views/SuspendedView.tsx', 'utf8');

code = code.replace(
  "import { useAuth } from '../contexts/AuthContext';",
  "import { useAuth } from '../contexts/AuthContext';\nimport { useNavigate } from 'react-router-dom';"
);

code = code.replace(
  "const { logout } = useAuth();",
  "const { logout } = useAuth();\n  const navigate = useNavigate();\n\n  const handleLogout = async () => {\n    await logout();\n    navigate('/login');\n  };"
);

code = code.replace(
  "onClick={logout}",
  "onClick={handleLogout}"
);

fs.writeFileSync('src/views/SuspendedView.tsx', code);
console.log('Success Suspended!');
