const fs = require('fs');
let billingCode = fs.readFileSync('src/views/CompanyBilling.tsx', 'utf8');

const handleCompanyChange = `
  const handleCompanyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    let checked = false;
    if (type === "checkbox") {
      checked = (e.target as HTMLInputElement).checked;
    }
    const defaultCompany = {
      name: '',
      gst: '',
      address: '',
      phone: '',
      email: '',
      bankDetails: '',
      hideBankDetails: false,
      hideNotes: false,
      hideTerms: false,
    };
    updateSettings({
      ...settings,
      company: {
        ...defaultCompany,
        ...(settings.company || {}),
        [name]: type === "checkbox" ? checked : value,
      },
    });
  };
`;

if (!billingCode.includes('const handleCompanyChange')) {
  billingCode = billingCode.replace(
    'const handleSaveCompanyProfile = async () => {',
    handleCompanyChange + '\n  const handleSaveCompanyProfile = async () => {'
  );
}

const companyProfileJSX = `
      {/* Company Profile Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Company Profile
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              This information will appear at the top of your quotations.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Company Name
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">🏢</span>
                <input
                  type="text"
                  name="name"
                  value={(settings.company || {}).name || ''}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="e.g. ARORA EXITO"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                GST Number
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">📄</span>
                <input
                  type="text"
                  name="gst"
                  value={(settings.company || {}).gst || ''}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="e.g. 08AZHPM1603R1ZZ"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Address
            </label>
            <div className="flex items-start border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <span className="text-slate-400 mr-2.5 mt-0.5 text-sm">📍</span>
              <textarea
                name="address"
                value={(settings.company || {}).address || ''}
                onChange={handleCompanyChange}
                rows={2}
                className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm resize-none"
                placeholder="Full registered address..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">📞</span>
                <input
                  type="text"
                  name="phone"
                  value={(settings.company || {}).phone || ''}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="+91 9000000000"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                <span className="text-slate-400 mr-2.5 text-sm">✉️</span>
                <input
                  type="text"
                  name="email"
                  value={(settings.company || {}).email || ''}
                  onChange={handleCompanyChange}
                  className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm"
                  placeholder="mail@example.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
              Bank Details (Optional)
            </label>
            <div className="flex items-start border border-slate-200 rounded-xl p-2.5 sm:p-3 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white transition-colors">
              <span className="text-slate-400 mr-2.5 mt-0.5 text-sm">🏦</span>
              <textarea
                name="bankDetails"
                value={(settings.company || {}).bankDetails || ''}
                onChange={handleCompanyChange}
                rows={2}
                className="w-full bg-transparent outline-none font-medium text-slate-900 text-xs sm:text-sm resize-none"
                placeholder="Bank Name, Account Number, IFSC..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
              Print Settings
            </label>
            <div className="space-y-2.5 p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  name="hideBankDetails"
                  checked={(settings.company || {}).hideBankDetails || false}
                  onChange={handleCompanyChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Hide Bank Details on Prints
              </label>
              <label className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  name="hideNotes"
                  checked={(settings.company || {}).hideNotes || false}
                  onChange={handleCompanyChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Hide Notes on Prints
              </label>
              <label className="flex items-center gap-3 text-xs sm:text-sm text-slate-700 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  name="hideTerms"
                  checked={(settings.company || {}).hideTerms || false}
                  onChange={handleCompanyChange}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Hide Terms on Prints
              </label>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSaveCompanyProfile}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0f1423] text-white rounded-xl hover:bg-neutral-800 text-xs sm:text-sm font-bold shadow-md transition-all"
          >
            <Save size={15} /> Save Company Profile
          </button>
        </div>
      </section>
`;

if (!billingCode.includes('Company Profile Card')) {
  billingCode = billingCode.replace(
    '<div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-16">',
    '<div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-16">\n' + companyProfileJSX
  );
}

fs.writeFileSync('src/views/CompanyBilling.tsx', billingCode);
