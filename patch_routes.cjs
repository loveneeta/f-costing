const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<Route path="/projects" element={<CostingsList onEdit={handleEditProject} />} />',
  '<Route path="/projects" element={<ProtectedRoute requiredFeature="projects"><CostingsList onEdit={handleEditProject} /></ProtectedRoute>} />'
);

code = code.replace(
  '<Route path="/rates/wood" element={<WoodRates />} />',
  '<Route path="/rates/wood" element={<ProtectedRoute requiredFeature="wood_rates"><WoodRates /></ProtectedRoute>} />'
);

code = code.replace(
  '<Route path="/rates/hardware" element={<RateMaster title="Hardware Rates" tabs={[{ id: \'hardware\', label: \'Hardware\' }]} />} />',
  '<Route path="/rates/hardware" element={<ProtectedRoute requiredFeature="hardware_rates"><RateMaster title="Hardware Rates" tabs={[{ id: \'hardware\', label: \'Hardware\' }]} /></ProtectedRoute>} />'
);

code = code.replace(
  '<Route path="/rates/ply" element={<RateMaster title="Ply Rates" tabs={[{ id: \'ply\', label: \'Ply Sheets\' }]} />} />',
  '<Route path="/rates/ply" element={<ProtectedRoute requiredFeature="ply_sheets"><RateMaster title="Ply Rates" tabs={[{ id: \'ply\', label: \'Ply Sheets\' }]} /></ProtectedRoute>} />'
);

code = code.replace(
  '<Route path="/rates/veneer" element={<RateMaster title="Veneer Rates" tabs={[{ id: \'veneer_sheet\', label: \'Veneer Sheet\' }, { id: \'veneer_edge\', label: \'Edge Strip\' }, { id: \'veneer_other\', label: \'Others\' }]} />} />',
  '<Route path="/rates/veneer" element={<ProtectedRoute requiredFeature="veneer_rates"><RateMaster title="Veneer Rates" tabs={[{ id: \'veneer_sheet\', label: \'Veneer Sheet\' }, { id: \'veneer_edge\', label: \'Edge Strip\' }, { id: \'veneer_other\', label: \'Others\' }]} /></ProtectedRoute>} />'
);

code = code.replace(
  '<Route path="/rates/board" element={<RateMaster title="Board Rates" tabs={[{ id: \'board\', label: \'Board Sheets\' }]} />} />',
  '<Route path="/rates/board" element={<ProtectedRoute requiredFeature="board_sheets"><RateMaster title="Board Rates" tabs={[{ id: \'board\', label: \'Board Sheets\' }]} /></ProtectedRoute>} />'
);

code = code.replace(
  '<Route path="/rates/other" element={<RateMaster title="Other Rates" tabs={[{ id: \'edgeband\', label: \'PVC Edgeband\' }, { id: \'labour\', label: \'Labour\' }, { id: \'finishing\', label: \'Finishing\' }, { id: \'other\', label: \'General Others\' }]} />} />',
  '<Route path="/rates/other" element={<ProtectedRoute requiredFeature="other_rates"><RateMaster title="Other Rates" tabs={[{ id: \'edgeband\', label: \'PVC Edgeband\' }, { id: \'labour\', label: \'Labour\' }, { id: \'finishing\', label: \'Finishing\' }, { id: \'other\', label: \'General Others\' }]} /></ProtectedRoute>} />'
);

code = code.replace(
  '<ProtectedRoute requiredPermission="employees.view">',
  '<ProtectedRoute requiredPermission="employees.view" requiredFeature="employees">'
);

fs.writeFileSync('src/App.tsx', code);
