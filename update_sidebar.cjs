const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const target = `            <SectionHeader title="Rate Master" />
            <NavLink to="/rates/wood" icon={TreePine} label="Wood Rates" />
            <NavLink to="/rates/hardware" icon={Wrench} label="Hardware Rates" />`;

const replacement = `            <SectionHeader title="Rate Master" />
            <NavLink to="/rates/wood" icon={TreePine} label="Wood Rates" />
            <NavLink to="/rates/hardware" icon={Wrench} label="Hardware Rates" />
            <NavLink to="/rates/veneer" icon={Layers} label="Veneer Rates" />
            <NavLink to="/rates/ply" icon={FileBox} label="Ply Sheets" />
            <NavLink to="/rates/board" icon={FileBox} label="Board Sheets" />
            <NavLink to="/rates/other" icon={SettingsIcon} label="Other Rates" />`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log('Success Sidebar!');
