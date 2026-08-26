const fs = require('fs');
let content = fs.readFileSync('src/views/TenantManagement.tsx', 'utf-8');

// 1. Add generatedLink state
content = content.replace(
  "const [availablePlans, setAvailablePlans] = useState<any[]>([]);",
  "const [availablePlans, setAvailablePlans] = useState<any[]>([]);\n  const [generatedLink, setGeneratedLink] = useState('');"
);

// 2. Replace alert with setGeneratedLink
content = content.replace(
  /alert\(`Company created! An invitation token.*?`\);/,
  "setGeneratedLink(`${window.location.origin}/accept-invitation?token=${inviteToken}&email=${adminEmail.trim().toLowerCase()}`);"
);

// 3. Render the generatedLink modal
const modalUI = `
      {/* Generated Link Modal */}
      {generatedLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-emerald-50 text-emerald-800">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-emerald-600" />
                <h3 className="text-lg font-bold">Company Created Successfully!</h3>
              </div>
              <button onClick={() => setGeneratedLink('')} className="text-emerald-600 hover:text-emerald-800">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-600 mb-4">
                The organization has been provisioned. Please share the following invitation link securely with the assigned Company Admin. They must use this link to set their password and activate their account.
              </p>
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg break-all text-sm font-mono text-neutral-800 mb-6">
                {generatedLink}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    alert("Link copied to clipboard!");
                  }}
                  className="flex-1 bg-white border border-neutral-300 text-neutral-700 font-medium py-2 rounded-lg hover:bg-neutral-50 text-sm"
                >
                  Copy to Clipboard
                </button>
                <button 
                  onClick={() => setGeneratedLink('')}
                  className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  "{/* Edit Plan Modal */}",
  modalUI + "\n      {/* Edit Plan Modal */}"
);

fs.writeFileSync('src/views/TenantManagement.tsx', content);
